import { BarChart3 } from "lucide-react";
import { SyncInstagramButton } from "@/components/dashboard/analytics/sync-instagram-button";
import { StatTile } from "@/components/dashboard/analytics/stat-tile";
import { PostsTable } from "@/components/dashboard/analytics/posts-table";
import { formatPercentage } from "@/lib/format";
import { getAnalyticsData } from "./queries";

export default async function AnalyticsPage() {
  const { posts, totals } = await getAnalyticsData();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 text-white">
            <BarChart3 className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">Analytics</h1>
        </div>

        <SyncInstagramButton />
      </div>

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
