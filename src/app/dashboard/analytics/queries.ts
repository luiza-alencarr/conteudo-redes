import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type PostMetricsRow = Database["public"]["Tables"]["post_metrics"]["Row"];

export interface PostWithMetrics extends PostRow {
  metrics: Pick<
    PostMetricsRow,
    "likes" | "comments_count" | "views" | "saves" | "shares" | "reach" | "collected_at"
  > | null;
}

export interface AnalyticsTotals {
  postsCount: number;
  likes: number;
  comments: number;
  views: number;
  reach: number;
  followersCount: number | null;
  // null quando não temos followers_count ainda (perfil não ressincronizado
  // desde que passamos a buscar esse campo).
  engagementRate: number | null;
}

export interface AnalyticsData {
  posts: PostWithMetrics[];
  totals: AnalyticsTotals;
}

// Interações totais de um post: curtidas + comentários + compartilhamentos +
// salvamentos. Usado tanto pra ordenar por engajamento quanto pra taxa de
// engajamento — mantém as duas noções de "engajamento" consistentes.
function getTotalInteractions(post: PostWithMetrics): number {
  return (
    (post.metrics?.likes ?? 0) +
    (post.metrics?.comments_count ?? 0) +
    (post.metrics?.shares ?? 0) +
    (post.metrics?.saves ?? 0)
  );
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function isWithinLast30Days(post: PostWithMetrics, now: number): boolean {
  if (!post.published_at) return false;
  return now - new Date(post.published_at).getTime() <= THIRTY_DAYS_MS;
}

function byPublishedAtDesc(a: PostWithMetrics, b: PostWithMetrics): number {
  if (!a.published_at) return 1;
  if (!b.published_at) return -1;
  return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const supabase = await createClient();

  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("*")
    .eq("network", "instagram")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (postsError) {
    throw new Error(`Falha ao carregar posts: ${postsError.message}`);
  }

  const { data: profile, error: profileError } = await supabase
    .from("social_profiles")
    .select("followers_count")
    .eq("network", "instagram")
    .maybeSingle();

  if (profileError) {
    throw new Error(`Falha ao carregar o perfil: ${profileError.message}`);
  }

  const followersCount = profile?.followers_count ?? null;

  const postIds = (posts ?? []).map((post) => post.id);

  const { data: metrics, error: metricsError } = postIds.length
    ? await supabase
        .from("post_metrics")
        .select("post_id, likes, comments_count, views, saves, shares, reach, collected_at")
        .in("post_id", postIds)
        .order("collected_at", { ascending: false })
    : { data: [], error: null };

  if (metricsError) {
    throw new Error(`Falha ao carregar métricas: ${metricsError.message}`);
  }

  // post_metrics guarda um histórico (uma linha por sincronização); como a
  // consulta já vem ordenada por collected_at desc, a primeira ocorrência de
  // cada post_id é a mais recente.
  const latestMetricsByPost = new Map<string, PostWithMetrics["metrics"]>();
  for (const metric of metrics ?? []) {
    if (!latestMetricsByPost.has(metric.post_id)) {
      latestMetricsByPost.set(metric.post_id, metric);
    }
  }

  const postsWithMetrics: PostWithMetrics[] = (posts ?? []).map((post) => ({
    ...post,
    metrics: latestMetricsByPost.get(post.id) ?? null,
  }));

  // Ordena por engajamento só dentro dos últimos 30 dias — post antigo não
  // "compete" com post recente por ter tido mais tempo pra acumular
  // interações. Fora da janela, mantém a ordem cronológica normal.
  const now = Date.now();
  const recentPosts = postsWithMetrics
    .filter((post) => isWithinLast30Days(post, now))
    .sort((a, b) => getTotalInteractions(b) - getTotalInteractions(a));
  const olderPosts = postsWithMetrics
    .filter((post) => !isWithinLast30Days(post, now))
    .sort(byPublishedAtDesc);

  const sortedPosts = [...recentPosts, ...olderPosts];

  const totals = postsWithMetrics.reduce<AnalyticsTotals>(
    (acc, post) => {
      acc.likes += post.metrics?.likes ?? 0;
      acc.comments += post.metrics?.comments_count ?? 0;
      acc.views += post.metrics?.views ?? 0;
      acc.reach += post.metrics?.reach ?? 0;
      return acc;
    },
    {
      postsCount: postsWithMetrics.length,
      likes: 0,
      comments: 0,
      views: 0,
      reach: 0,
      followersCount,
      engagementRate: null,
    },
  );

  // Taxa de engajamento do perfil = média da taxa de engajamento de cada
  // post, não a soma de todas as interações dividida pelos seguidores uma
  // única vez (isso infla o número conforme o número de posts cresce, e não
  // é uma taxa "por post" de verdade).
  if (followersCount && followersCount > 0 && postsWithMetrics.length > 0) {
    const perPostRates = postsWithMetrics.map(
      (post) => (getTotalInteractions(post) / followersCount) * 100,
    );
    totals.engagementRate =
      perPostRates.reduce((sum, rate) => sum + rate, 0) / perPostRates.length;
  }

  return { posts: sortedPosts, totals };
}
