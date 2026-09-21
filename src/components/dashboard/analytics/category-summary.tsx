import type { CategorySummary } from "@/app/dashboard/analytics/queries";
import { formatCompactNumber } from "@/lib/format";

export function CategorySummaryCard({ summaries }: { summaries: CategorySummary[] }) {
  if (summaries.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-4">
        <p className="text-sm text-neutral-500">
          Nenhum post categorizado ainda. Termine a legenda com uma hashtag de categoria (ex.:{" "}
          <span className="font-medium text-neutral-700">#bastidores</span>) pra ver o
          desempenho por categoria aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-xs text-neutral-500">
            <th className="px-4 py-3 font-medium">Categoria</th>
            <th className="px-4 py-3 text-right font-medium">Posts</th>
            <th className="px-4 py-3 text-right font-medium">Curtidas médias</th>
            <th className="px-4 py-3 text-right font-medium">Comentários médios</th>
            <th className="px-4 py-3 text-right font-medium">Views médias</th>
            <th className="px-4 py-3 text-right font-medium">Engajamento médio</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {summaries.map((summary) => (
            <tr key={summary.category}>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full border border-neutral-200 px-2 py-0.5 text-xs text-neutral-600">
                  #{summary.category}
                </span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-neutral-700">
                {summary.postsCount}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-neutral-700">
                {formatCompactNumber(summary.avgLikes)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-neutral-700">
                {formatCompactNumber(summary.avgComments)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-neutral-700">
                {formatCompactNumber(summary.avgViews)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums font-medium text-neutral-900">
                {formatCompactNumber(summary.avgEngagement)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
