import type { LucideIcon } from "lucide-react";

export function PlaceholderSection({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 text-white">
          <Icon className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
      </div>

      <div className="mt-8 flex flex-1 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white p-12">
        <div className="max-w-md text-center">
          <p className="text-sm text-neutral-500">{description}</p>
          <p className="mt-2 text-xs text-neutral-400">
            Em construção — chegando em uma próxima etapa.
          </p>
        </div>
      </div>
    </div>
  );
}
