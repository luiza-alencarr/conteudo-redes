import { BarChart3, FileDown } from "lucide-react";
import { SyncInstagramButton } from "@/components/dashboard/analytics/sync-instagram-button";
import { TikTokPanel } from "@/components/dashboard/analytics/tiktok-panel";
import { StatTile } from "@/components/dashboard/analytics/stat-tile";
import { PostsTable } from "@/components/dashboard/analytics/posts-table";
import { formatPercentage } from "@/lib/format";
import { getAnalyticsData } from "./queries";
import { getTikTokConnectionStatus } from "@/lib/tiktok/connection";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ tiktok_connected?: string; tiktok_error?: string }>;
}) {
  const [{ posts, totals }, tiktokStatus, params] = await Promise.all([
    getAnalyticsData(),
    getTikTokConnectionStatus(),
    searchParams,
  ]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 text-white">
            <BarChart3 className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">Analytics</h1>
        </div>

        <div className="flex items-start gap-3">
          <SyncInstagramButton />
          <TikTokPanel connected={tiktokStatus.connected} username={tiktokStatus.username} />
          <a
            href="/api/analytics/export-pdf"
            className="flex w-fit items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            <FileDown className="h-4 w-4" />
            Exportar PDF
          </a>
        </div>
      </div>

      {params.tiktok_connected && (
        <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          TikTok conectado com sucesso.
        </p>
      )}
      {params.tiktok_error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          Falha ao conectar o TikTok: {params.tiktok_error}
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Posts (60 dias)" value={totals.postsLast60Days} />
        <StatTile label="Curtidas" value={totals.likes} />
        <StatTile label="Comentários" value={totals.comments} />
        <StatTile label="Views" value={totals.views} />
        <StatTile label="Alcance" value={totals.reach} />
        {totals.engagementRate !== null ? (
          <StatTile
            label="Taxa de engajamento"
            value={totals.engagementRate}
            formatValue={formatPercentage}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-4">
            <p className="text-sm text-neutral-500">Taxa de engajamento</p>
            <p className="mt-1 text-xs text-neutral-400">
              Sincronize de novo para obter o número de seguidores.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-1 flex-col">
        <PostsTable posts={posts} />
      </div>
    </div>
  );
}
