import { createClient } from "@/lib/supabase/server";
import * as instagram from "@/lib/instagram/client";
import type { Database } from "@/lib/supabase/database.types";

type ContentType = Database["public"]["Tables"]["posts"]["Row"]["content_type"];

function mapContentType(media: instagram.InstagramMedia): ContentType {
  if (media.media_product_type === "STORY") return "story";
  if (media.media_product_type === "REELS") return "reel";
  if (media.media_type === "CAROUSEL_ALBUM") return "carousel";
  if (media.media_type === "VIDEO") return "video";
  return "image";
}

// media_url de um VIDEO é o arquivo de vídeo em si (não renderizável em <img>);
// nesse caso só thumbnail_url serve como miniatura.
function pickThumbnailUrl(media: instagram.InstagramMedia): string | null {
  if (media.thumbnail_url) return media.thumbnail_url;
  if (media.media_type !== "VIDEO" && media.media_url) return media.media_url;
  return null;
}

export interface SyncSummary {
  postsSynced: number;
  metricsSynced: number;
  commentsSynced: number;
  demographicsSynced: number;
  warnings: string[];
}

export async function syncInstagram(): Promise<SyncSummary> {
  const appAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!appAccessToken || !igUserId) {
    throw new Error(
      "INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_BUSINESS_ACCOUNT_ID precisam estar configurados no ambiente.",
    );
  }

  const warnings: string[] = [];
  const supabase = await createClient();

  const profile = await instagram.getAccountProfile(igUserId, appAccessToken);

  const { data: socialProfile, error: profileError } = await supabase
    .from("social_profiles")
    .upsert(
      {
        network: "instagram",
        username: profile.username,
        platform_account_id: profile.id,
        display_name: profile.name ?? null,
        profile_url: `https://instagram.com/${profile.username}`,
      },
      { onConflict: "network,username" },
    )
    .select("id")
    .single();

  if (profileError || !socialProfile) {
    throw new Error(`Falha ao salvar o perfil do Instagram: ${profileError?.message}`);
  }

  const mediaItems = await instagram.getAllMedia(igUserId, appAccessToken, 50);

  let postsSynced = 0;
  let metricsSynced = 0;
  let commentsSynced = 0;

  for (const media of mediaItems) {
    const contentType = mapContentType(media);

    const { data: post, error: postError } = await supabase
      .from("posts")
      .upsert(
        {
          social_profile_id: socialProfile.id,
          network: "instagram",
          external_id: media.id,
          content_type: contentType,
          caption: media.caption ?? null,
          published_at: media.timestamp,
          url: media.permalink ?? null,
          thumbnail_url: pickThumbnailUrl(media),
        },
        { onConflict: "network,external_id" },
      )
      .select("id")
      .single();

    if (postError || !post) {
      warnings.push(`Post ${media.id}: ${postError?.message ?? "erro desconhecido"}`);
      continue;
    }
    postsSynced++;

    const insights = await instagram.getMediaInsights(media, appAccessToken);

    const { error: metricsError } = await supabase.from("post_metrics").insert({
      post_id: post.id,
      likes: media.like_count ?? 0,
      comments_count: media.comments_count ?? 0,
      views: insights.plays ?? 0,
      saves: insights.saved ?? 0,
      shares: insights.shares ?? 0,
      reach: insights.reach ?? 0,
    });

    if (metricsError) {
      warnings.push(`Métricas do post ${media.id}: ${metricsError.message}`);
    } else {
      metricsSynced++;
    }

    try {
      const comments = await instagram.getMediaComments(media.id, appAccessToken);
      if (comments.length > 0) {
        const { error: commentsError } = await supabase.from("comments").upsert(
          comments.map((comment) => ({
            post_id: post.id,
            external_id: comment.id,
            author: comment.username ?? null,
            text: comment.text,
            commented_at: comment.timestamp,
          })),
          { onConflict: "post_id,external_id" },
        );

        if (commentsError) {
          warnings.push(`Comentários do post ${media.id}: ${commentsError.message}`);
        } else {
          commentsSynced += comments.length;
        }
      }
    } catch (error) {
      warnings.push(
        `Comentários do post ${media.id}: ${error instanceof Error ? error.message : "erro desconhecido"}`,
      );
    }
  }

  let demographicsSynced = 0;
  const today = new Date().toISOString().slice(0, 10);

  await supabase
    .from("audience_demographics")
    .delete()
    .eq("network", "instagram")
    .eq("snapshot_date", today);

  for (const breakdown of ["age", "gender", "country"] as const) {
    try {
      const results = await instagram.getAudienceDemographics(igUserId, breakdown, appAccessToken);
      const total = results.reduce((sum, result) => sum + result.value, 0);
      if (total === 0) continue;

      const rows = results.map((result) => ({
        network: "instagram" as const,
        snapshot_date: today,
        age_range: breakdown === "age" ? result.dimension_values[0] : null,
        gender: breakdown === "gender" ? result.dimension_values[0] : null,
        location: breakdown === "country" ? result.dimension_values[0] : null,
        percentage: Math.round((result.value / total) * 10000) / 100,
      }));

      const { error } = await supabase.from("audience_demographics").insert(rows);
      if (error) {
        warnings.push(`Demografia (${breakdown}): ${error.message}`);
      } else {
        demographicsSynced += rows.length;
      }
    } catch (error) {
      warnings.push(
        `Demografia (${breakdown}) indisponível: ${error instanceof Error ? error.message : "erro desconhecido"}`,
      );
    }
  }

  return { postsSynced, metricsSynced, commentsSynced, demographicsSynced, warnings };
}
