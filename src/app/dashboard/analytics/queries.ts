import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type PostMetricsRow = Database["public"]["Tables"]["post_metrics"]["Row"];

export interface PostWithMetrics extends PostRow {
  metrics: Pick<
    PostMetricsRow,
    "likes" | "comments_count" | "views" | "saves" | "reach" | "collected_at"
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

function getEngagementScore(post: PostWithMetrics): number {
  return (post.metrics?.likes ?? 0) + (post.metrics?.comments_count ?? 0);
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
        .select("post_id, likes, comments_count, views, saves, reach, collected_at")
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

  const postsWithMetrics: PostWithMetrics[] = (posts ?? [])
    .map((post) => ({
      ...post,
      metrics: latestMetricsByPost.get(post.id) ?? null,
    }))
    .sort((a, b) => getEngagementScore(b) - getEngagementScore(a));

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

  totals.engagementRate =
    followersCount && followersCount > 0
      ? ((totals.likes + totals.comments) / followersCount) * 100
      : null;

  return { posts: postsWithMetrics, totals };
}
