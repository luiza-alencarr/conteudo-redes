import { BarChart3 } from "lucide-react";
import { SyncInstagramButton } from "@/components/dashboard/analytics/sync-instagram-button";

export default function AnalyticsPage() {
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

      <div className="mt-8 flex flex-1 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white p-12">
        <div className="max-w-md text-center">
          <p className="text-sm text-neutral-500">
            Métricas consolidadas de posts (curtidas, comentários, views, alcance) por rede e
            período.
          </p>
          <p className="mt-2 text-xs text-neutral-400">
            Gráficos chegam em uma próxima etapa — por enquanto, use o botão acima para popular o
            banco com os dados do Instagram.
          </p>
        </div>
      </div>
    </div>
  );
}
