import { createClient } from "@/lib/supabase/server";
import * as tiktok from "@/lib/tiktok/client";
import { getValidAccessToken } from "@/lib/tiktok/connection";

export interface TikTokSyncSummary {
  postsSynced: number;
  metricsSynced: number;
  warnings: string[];
}

export async function syncTikTok(): Promise<TikTokSyncSummary> {
  const warnings: string[] = [];
  const accessToken = await getValidAccessToken();
  const supabase = await createClient();

  const profile = await tiktok.getUserInfo(accessToken);
  const username = profile.display_name?.trim() || profile.open_id;

  const { data: socialProfile, error: profileError } = await supabase
    .from("social_profiles")
    .upsert(
      {
        network: "tiktok",
        username,
        platform_account_id: profile.open_id,
        display_name: profile.display_name ?? null,
      },
      { onConflict: "network,username" },
    )
    .select("id")
    .single();

  if (profileError || !socialProfile) {
    throw new Error(`Falha ao salvar o perfil do TikTok: ${profileError?.message}`);
  }

  const videos = await tiktok.getVideoList(accessToken, 50);

  let postsSynced = 0;
  let metricsSynced = 0;

  for (const video of videos) {
    const { data: post, error: postError } = await supabase
      .from("posts")
      .upsert(
        {
          social_profile_id: socialProfile.id,
          network: "tiktok",
          external_id: video.id,
          content_type: "short",
          caption: video.video_description ?? null,
          published_at: new Date(video.create_time * 1000).toISOString(),
          url: video.share_url ?? null,
          thumbnail_url: video.cover_image_url ?? null,
        },
        { onConflict: "network,external_id" },
      )
      .select("id")
      .single();

    if (postError || !post) {
      warnings.push(`Vídeo ${video.id}: ${postError?.message ?? "erro desconhecido"}`);
      continue;
    }
    postsSynced++;

    // A Display API do TikTok não expõe salvamentos nem alcance no escopo
    // básico de vídeo — só likes/comentários/compartilhamentos/views vêm
    // direto no objeto do vídeo, sem precisar de uma chamada de insights à
    // parte (diferente do Instagram).
    const { error: metricsError } = await supabase.from("post_metrics").insert({
      post_id: post.id,
      likes: video.like_count ?? 0,
      comments_count: video.comment_count ?? 0,
      views: video.view_count ?? 0,
      shares: video.share_count ?? 0,
      saves: 0,
      reach: 0,
    });

    if (metricsError) {
      warnings.push(`Métricas do vídeo ${video.id}: ${metricsError.message}`);
    } else {
      metricsSynced++;
    }
  }

  return { postsSynced, metricsSynced, warnings };
}
