const compactNumberFormatter = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCompactNumber(value: number): string {
  return compactNumberFormatter.format(value);
}

const percentageFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

export function formatPercentage(value: number): string {
  return `${percentageFormatter.format(value)}%`;
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatDate(value: string | null): string {
  if (!value) return "—";
  return dateFormatter.format(new Date(value));
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null || Number.isNaN(seconds)) return "—";
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

// Extrai o "gancho" de uma legenda: a primeira frase ou primeira linha,
// o que vier primeiro (até a primeira quebra de linha ou ponto final).
// Puramente textual, sem IA — é uma heurística, não uma frase "certa".
export function extractHook(caption: string | null): string | null {
  if (!caption) return null;
  const trimmed = caption.trim();
  if (!trimmed) return null;

  const newlineIndex = trimmed.indexOf("\n");
  const periodIndex = trimmed.indexOf(".");
  const cutoffCandidates = [newlineIndex, periodIndex].filter((index) => index !== -1);

  if (cutoffCandidates.length === 0) return trimmed;

  const cutoff = Math.min(...cutoffCandidates);
  const hook = trimmed.slice(0, cutoff).trim();
  return hook || trimmed;
}
