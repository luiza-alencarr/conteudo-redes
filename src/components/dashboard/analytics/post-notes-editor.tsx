"use client";

import { useState, useTransition } from "react";
import { updatePostNotes } from "@/app/dashboard/analytics/actions";

export function PostNotesEditor({
  postId,
  initialNotes,
}: {
  postId: string;
  initialNotes: string | null;
}) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSave() {
    startTransition(async () => {
      const result = await updatePostNotes(postId, notes);
      if (result.error) {
        setStatus("error");
        setErrorMessage(result.error);
      } else {
        setStatus("saved");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-neutral-500" htmlFor={`notes-${postId}`}>
        Roteiro / Notas
      </label>
      <textarea
        id={`notes-${postId}`}
        value={notes}
        onChange={(event) => {
          setNotes(event.target.value);
          setStatus("idle");
        }}
        rows={4}
        placeholder="Documente o roteiro real do vídeo, ou anotações sobre o porquê funcionou..."
        className="w-full rounded-lg border border-neutral-300 p-2 text-sm text-neutral-700"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-fit rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
        >
          {isPending ? "Salvando..." : "Salvar"}
        </button>
        {status === "saved" && <span className="text-xs text-green-600">Salvo.</span>}
        {status === "error" && (
          <span className="text-xs text-red-600">Erro ao salvar: {errorMessage}</span>
        )}
      </div>
    </div>
  );
}
