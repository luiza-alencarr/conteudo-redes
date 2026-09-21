"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

interface SyncSummary {
  postsSynced: number;
  metricsSynced: number;
  warnings: string[];
}

type SyncState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; summary: SyncSummary }
  | { status: "error"; message: string };

export function TikTokPanel({
  connected,
  username,
}: {
  connected: boolean;
  username: string | null;
}) {
  const [state, setState] = useState<SyncState>({ status: "idle" });

  async function handleSync() {
    setState({ status: "loading" });
    try {
      const response = await fetch("/api/tiktok/sync", { method: "POST" });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Falha ao sincronizar.");
      }
      setState({ status: "success", summary: body });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Erro desconhecido.",
      });
    }
  }

  if (!connected) {
    return (
      <a
        href="/api/auth/tiktok/authorize"
        className="flex w-fit items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
      >
        Conectar TikTok
      </a>
    );
  }

  return (
    <div className="flex flex-col items-end gap-3">
      <div className="flex items-center gap-3">
        <span className="text-xs text-neutral-500">
          TikTok conectado{username ? ` (@${username})` : ""}
        </span>
        <button
          onClick={handleSync}
          disabled={state.status === "loading"}
          className="flex w-fit items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${state.status === "loading" ? "animate-spin" : ""}`} />
          {state.status === "loading" ? "Sincronizando..." : "Sincronizar TikTok"}
        </button>
      </div>

      {state.status === "success" && (
        <div className="max-w-sm rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
          <p>
            {state.summary.postsSynced} vídeos e {state.summary.metricsSynced} métricas
            sincronizados.
          </p>
          {state.summary.warnings.length > 0 && (
            <ul className="mt-2 list-disc pl-4 text-amber-600">
              {state.summary.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {state.status === "error" && <p className="max-w-sm text-sm text-red-600">{state.message}</p>}
    </div>
  );
}
