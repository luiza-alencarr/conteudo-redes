"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

interface SyncSummary {
  postsSynced: number;
  metricsSynced: number;
  commentsSynced: number;
  demographicsSynced: number;
  warnings: string[];
}

type SyncState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; summary: SyncSummary }
  | { status: "error"; message: string };

export function SyncInstagramButton() {
  const [state, setState] = useState<SyncState>({ status: "idle" });

  async function handleSync() {
    setState({ status: "loading" });
    try {
      const response = await fetch("/api/instagram/sync", { method: "POST" });
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

  return (
    <div className="flex flex-col items-end gap-3">
      <button
        onClick={handleSync}
        disabled={state.status === "loading"}
        className="flex w-fit items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${state.status === "loading" ? "animate-spin" : ""}`} />
        {state.status === "loading" ? "Sincronizando..." : "Sincronizar Instagram"}
      </button>

      {state.status === "success" && (
        <div className="max-w-sm rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
          <p>
            {state.summary.postsSynced} posts, {state.summary.metricsSynced} métricas,{" "}
            {state.summary.commentsSynced} comentários e {state.summary.demographicsSynced} dados
            demográficos sincronizados.
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

      {state.status === "error" && (
        <p className="max-w-sm text-sm text-red-600">{state.message}</p>
      )}
    </div>
  );
}
