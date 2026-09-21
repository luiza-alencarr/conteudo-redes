import { formatCompactNumber } from "@/lib/format";

export function StatTile({
  label,
  value,
  formatValue = formatCompactNumber,
}: {
  label: string;
  value: number;
  formatValue?: (value: number) => string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-neutral-900">{formatValue(value)}</p>
    </div>
  );
}
