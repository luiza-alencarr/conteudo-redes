const GRAPH_API_VERSION = process.env.INSTAGRAM_GRAPH_API_VERSION ?? "v21.0";
const GRAPH_API_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export class InstagramApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown,
  ) {
    super(message);
    this.name = "InstagramApiError";
  }
}

async function graphGet<T>(
  path: string,
  params: Record<string, string>,
  accessToken: string,
): Promise<T> {
  const url = new URL(`${GRAPH_API_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url.toString());
  const body = await response.json();

  if (!response.ok) {
    throw new InstagramApiError(
      body?.error?.message ?? "Erro na Instagram Graph API",
      response.status,
      body,
    );
  }

  return body as T;
}

export async function exchangeForLongLivedToken({
  appId,
  appSecret,
  shortLivedToken,
}: {
  appId: string;
  appSecret: string;
  shortLivedToken: string;
}): Promise<{ accessToken: string; expiresInSeconds: number }> {
  const url = new URL(`${GRAPH_API_BASE_URL}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("fb_exchange_token", shortLivedToken);

  const response = await fetch(url.toString());
  const body = await response.json();

  if (!response.ok) {
    throw new InstagramApiError(
      body?.error?.message ?? "Falha ao trocar o token de acesso",
      response.status,
      body,
    );
  }

  return { accessToken: body.access_token, expiresInSeconds: body.expires_in };
}

export interface InstagramProfile {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
  followers_count?: number;
}

export function getAccountProfile(igUserId: string, accessToken: string) {
  return graphGet<InstagramProfile>(
    `/${igUserId}`,
    { fields: "id,username,name,profile_picture_url,followers_count" },
    accessToken,
  );
}

export type InstagramMediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
export type InstagramMediaProductType = "FEED" | "REELS" | "STORY" | "AD";

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: InstagramMediaType;
  media_product_type?: InstagramMediaProductType;
  permalink?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  media_url?: string;
  thumbnail_url?: string;
  // Nem toda versão/tipo de mídia da Graph API expõe esse campo — ver o
  // fallback em getAllMedia.
  duration?: number;
}

interface GraphPage<T> {
  data: T[];
  paging?: { cursors?: { after?: string }; next?: string };
}

const MEDIA_FIELDS =
  "id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count,media_url,thumbnail_url";
const MEDIA_FIELDS_WITH_DURATION = `${MEDIA_FIELDS},duration`;

export async function getAllMedia(
  igUserId: string,
  accessToken: string,
  maxItems = 50,
): Promise<InstagramMedia[]> {
  let fields = MEDIA_FIELDS_WITH_DURATION;
  const items: InstagramMedia[] = [];
  let after: string | undefined;
  let fellBackToBaseFields = false;

  do {
    const params: Record<string, string> = { fields, limit: "25" };
    if (after) params.after = after;

    let page: GraphPage<InstagramMedia>;
    try {
      page = await graphGet<GraphPage<InstagramMedia>>(`/${igUserId}/media`, params, accessToken);
    } catch (error) {
      // "duration" pode não ser um field válido pra mídia comum nessa versão
      // da API — tenta de novo sem ele em vez de derrubar a sincronização
      // inteira. Só tenta esse fallback uma vez.
      if (fields === MEDIA_FIELDS_WITH_DURATION) {
        console.warn(
          "Falha ao buscar mídia com o field 'duration', tentando sem ele:",
          error instanceof Error ? error.message : error,
        );
        fields = MEDIA_FIELDS;
        fellBackToBaseFields = true;
        params.fields = fields;
        page = await graphGet<GraphPage<InstagramMedia>>(`/${igUserId}/media`, params, accessToken);
      } else {
        throw error;
      }
    }

    items.push(...page.data);
    after = page.paging?.next ? page.paging.cursors?.after : undefined;
  } while (after && items.length < maxItems);

  if (fellBackToBaseFields) {
    console.warn("Sincronização do Instagram seguiu sem dados de duração dos posts.");
  }

  return items.slice(0, maxItems);
}

function metricsForMedia(
  media: Pick<InstagramMedia, "media_type" | "media_product_type">,
): string[] {
  if (media.media_product_type === "STORY") {
    return ["reach", "replies", "exits", "taps_forward", "taps_back"];
  }
  const base = ["reach", "saved", "shares", "total_interactions"];
  // "views" é o metric de visualizações de vídeo na Graph API atual — "plays"
  // (nome usado numa versão anterior) é rejeitado com "must be one of the
  // following values: ..." e "video_views" também já foi descontinuado antes
  // dele. Vale tanto pra Reels quanto pra vídeo comum publicado no feed.
  return media.media_type === "VIDEO" ? [...base, "views"] : base;
}

export interface InstagramMediaInsights {
  reach?: number;
  saved?: number;
  shares?: number;
  views?: number;
}

export interface MediaInsightsResult {
  insights: InstagramMediaInsights;
  // Presente quando a chamada falhou (métrica inválida/depreciada, permissão
  // insuficiente, etc.) — o chamador decide como expor isso ao usuário em vez
  // de a falha ficar só no log do servidor.
  error?: string;
}

interface RawInsightMetric {
  name: string;
  // A Graph API usa duas formas pro valor conforme o metric: séries temporais
  // vêm em "values[0].value", metrics agregados (o mesmo formato que
  // follower_demographics já usa) vêm em "total_value.value". Sem checar as
  // duas, um metric que só existe no segundo formato lia como 0 em silêncio.
  values?: { value: number }[];
  total_value?: { value: number };
}

function extractMetricValue(metric: RawInsightMetric): number {
  return metric.total_value?.value ?? metric.values?.[0]?.value ?? 0;
}

export async function getMediaInsights(
  media: Pick<InstagramMedia, "id" | "media_type" | "media_product_type">,
  accessToken: string,
): Promise<MediaInsightsResult> {
  try {
    const result = await graphGet<{ data: RawInsightMetric[] }>(
      `/${media.id}/insights`,
      { metric: metricsForMedia(media).join(",") },
      accessToken,
    );
    console.log(`[instagram] insights brutos do post ${media.id}:`, JSON.stringify(result.data));
    const insights = Object.fromEntries(
      result.data.map((metric) => [metric.name, extractMetricValue(metric)]),
    );
    return { insights };
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    console.warn(`Falha ao buscar insights do post ${media.id}:`, message);
    return { insights: {}, error: message };
  }
}

export interface InstagramComment {
  id: string;
  // Ausente para comentários sem texto (ex.: só figurinha/GIF).
  text?: string;
  username?: string;
  timestamp: string;
  like_count?: number;
}

export async function getMediaComments(
  mediaId: string,
  accessToken: string,
): Promise<InstagramComment[]> {
  const result = await graphGet<GraphPage<InstagramComment>>(
    `/${mediaId}/comments`,
    { fields: "id,text,username,timestamp,like_count", limit: "50" },
    accessToken,
  );
  return result.data;
}

export type DemographicBreakdown = "age" | "gender" | "country";

export interface DemographicResult {
  dimension_values: string[];
  value: number;
}

export async function getAudienceDemographics(
  igUserId: string,
  breakdown: DemographicBreakdown,
  accessToken: string,
): Promise<DemographicResult[]> {
  const result = await graphGet<{
    data: { total_value?: { breakdowns?: { results: DemographicResult[] }[] } }[];
  }>(
    `/${igUserId}/insights`,
    {
      metric: "follower_demographics",
      period: "lifetime",
      metric_type: "total_value",
      breakdown,
    },
    accessToken,
  );

  return result.data[0]?.total_value?.breakdowns?.[0]?.results ?? [];
}
