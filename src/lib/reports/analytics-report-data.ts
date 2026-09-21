import { createClient } from "@/lib/supabase/server";
import {
  getAnalyticsData,
  getTotalInteractions,
  isWithinLastDays,
  type PostWithMetrics,
} from "@/app/dashboard/analytics/queries";

const PERIOD_DAYS = 30;
const TOP_POSTS_COUNT = 5;
const COMMENTS_PER_POST = 5;

export interface NetworkSummary {
  network: string;
  postsCount: number;
  likes: number;
  comments: number;
  views: number;
  reach: number;
  followersCount: number | null;
  // null quando não há followers_count pra essa rede (ex.: TikTok, que ainda
  // não busca seguidores) — não dá pra calcular uma taxa sem esse número.
  engagementRate: number | null;
}

export interface ReportComment {
  author: string | null;
  text: string;
  likeCount: number;
  commentedAt: string | null;
}

export interface ReportPost extends PostWithMetrics {
  comments: ReportComment[];
}

export interface AnalyticsReportData {
  generatedAt: string;
  periodDays: number;
  overall: NetworkSummary;
  byNetwork: NetworkSummary[];
  periodPosts: PostWithMetrics[];
  topPosts: ReportPost[];
}

function summarizeNetwork(
  network: string,
  posts: PostWithMetrics[],
  followersCount: number | null,
): NetworkSummary {
  const base = posts.reduce(
    (acc, post) => {
      acc.likes += post.metrics?.likes ?? 0;
      acc.comments += post.metrics?.comments_count ?? 0;
      acc.views += post.metrics?.views ?? 0;
      acc.reach += post.metrics?.reach ?? 0;
      return acc;
    },
    { likes: 0, comments: 0, views: 0, reach: 0 },
  );

  let engagementRate: number | null = null;
  if (followersCount && followersCount > 0 && posts.length > 0) {
    const perPostRates = posts.map((post) => (getTotalInteractions(post) / followersCount) * 100);
    engagementRate = perPostRates.reduce((sum, rate) => sum + rate, 0) / perPostRates.length;
  }

  return { network, postsCount: posts.length, ...base, followersCount, engagementRate };
}

export async function getAnalyticsReportData(): Promise<AnalyticsReportData> {
  const supabase = await createClient();
  const { posts } = await getAnalyticsData();

  const now = Date.now();
  const periodPosts = posts
    .filter((post) => isWithinLastDays(post, now, PERIOD_DAYS))
    .sort((a, b) => getTotalInteractions(b) - getTotalInteractions(a));

  const { data: profiles, error: profilesError } = await supabase
    .from("social_profiles")
    .select("network, followers_count");

  if (profilesError) {
    throw new Error(`Falha ao carregar perfis: ${profilesError.message}`);
  }

  const followersByNetwork = new Map<string, number | null>();
  for (const profile of profiles ?? []) {
    followersByNetwork.set(profile.network, profile.followers_count);
  }

  const networks = Array.from(new Set(periodPosts.map((post) => post.network)));
  const byNetwork = networks.map((network) =>
    summarizeNetwork(
      network,
      periodPosts.filter((post) => post.network === network),
      followersByNetwork.get(network) ?? null,
    ),
  );
  const overall = summarizeNetwork("total", periodPosts, null);

  const topPostsBase = periodPosts.slice(0, TOP_POSTS_COUNT);
  const topPostIds = topPostsBase.map((post) => post.id);

  const { data: commentsData, error: commentsError } = topPostIds.length
    ? await supabase
        .from("comments")
        .select("post_id, author, text, like_count, commented_at")
        .in("post_id", topPostIds)
        .order("like_count", { ascending: false })
        .order("commented_at", { ascending: false })
    : { data: [], error: null };

  if (commentsError) {
    throw new Error(`Falha ao carregar comentários: ${commentsError.message}`);
  }

  const commentsByPost = new Map<string, ReportComment[]>();
  for (const comment of commentsData ?? []) {
    const list = commentsByPost.get(comment.post_id) ?? [];
    if (list.length < COMMENTS_PER_POST) {
      list.push({
        author: comment.author,
        text: comment.text,
        likeCount: comment.like_count,
        commentedAt: comment.commented_at,
      });
      commentsByPost.set(comment.post_id, list);
    }
  }

  const topPosts: ReportPost[] = topPostsBase.map((post) => ({
    ...post,
    comments: commentsByPost.get(post.id) ?? [],
  }));

  return {
    generatedAt: new Date().toISOString(),
    periodDays: PERIOD_DAYS,
    overall,
    byNetwork,
    periodPosts,
    topPosts,
  };
}
