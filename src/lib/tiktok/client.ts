const API_BASE_URL = "https://open.tiktokapis.com/v2";

export class TikTokApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown,
  ) {
    super(message);
    this.name = "TikTokApiError";
  }
}

async function apiFetch<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const body = await response.json();
  // A API do TikTok pode responder 200 com um "error" no corpo em vez de um
  // status HTTP de falha, então checamos os dois.
  const errorCode = body?.error?.code;
  if (!response.ok || (errorCode && errorCode !== "ok")) {
    throw new TikTokApiError(
      body?.error?.message ?? "Erro na API do TikTok",
      response.status,
      body,
    );
  }

  return body as T;
}

export interface TikTokUserInfo {
  open_id: string;
  union_id?: string;
  avatar_url?: string;
  display_name?: string;
}

export async function getUserInfo(accessToken: string): Promise<TikTokUserInfo> {
  const fields = "open_id,union_id,avatar_url,display_name";
  const result = await apiFetch<{ data: { user: TikTokUserInfo } }>(
    `/user/info/?fields=${fields}`,
    accessToken,
  );
  return result.data.user;
}

export interface TikTokVideo {
  id: string;
  create_time: number;
  cover_image_url?: string;
  share_url?: string;
  video_description?: string;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  view_count?: number;
  // Nem toda conta/escopo garante esse field — ver o fallback em getVideoList.
  duration?: number;
}

interface VideoListPage {
  data: { videos: TikTokVideo[]; cursor: number; has_more: boolean };
}

const VIDEO_FIELDS =
  "id,create_time,cover_image_url,share_url,video_description,like_count,comment_count,share_count,view_count";
const VIDEO_FIELDS_WITH_DURATION = `${VIDEO_FIELDS},duration`;

export async function getVideoList(
  accessToken: string,
  maxItems = 50,
): Promise<TikTokVideo[]> {
  let fields = VIDEO_FIELDS_WITH_DURATION;
  const videos: TikTokVideo[] = [];
  let cursor: number | undefined;
  let hasMore = true;
  let fellBackToBaseFields = false;

  while (hasMore && videos.length < maxItems) {
    const body = JSON.stringify({ max_count: 20, ...(cursor ? { cursor } : {}) });

    let result: VideoListPage;
    try {
      result = await apiFetch<VideoListPage>(`/video/list/?fields=${fields}`, accessToken, {
        method: "POST",
        body,
      });
    } catch (error) {
      // "duration" pode não ser um field aceito nessa conta/escopo — tenta de
      // novo sem ele em vez de derrubar a sincronização inteira.
      if (fields === VIDEO_FIELDS_WITH_DURATION) {
        console.warn(
          "Falha ao buscar vídeos com o field 'duration', tentando sem ele:",
          error instanceof Error ? error.message : error,
        );
        fields = VIDEO_FIELDS;
        fellBackToBaseFields = true;
        result = await apiFetch<VideoListPage>(`/video/list/?fields=${fields}`, accessToken, {
          method: "POST",
          body,
        });
      } else {
        throw error;
      }
    }

    videos.push(...result.data.videos);
    hasMore = result.data.has_more;
    cursor = result.data.cursor;
  }

  if (fellBackToBaseFields) {
    console.warn("Sincronização do TikTok seguiu sem dados de duração dos vídeos.");
  }

  return videos.slice(0, maxItems);
}
