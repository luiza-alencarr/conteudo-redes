"use server";

import { createClient } from "@/lib/supabase/server";

export async function updatePostNotes(
  postId: string,
  notes: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autenticado." };
  }

  const { error } = await supabase
    .from("posts")
    .update({ notes: notes.trim() || null })
    .eq("id", postId);

  if (error) {
    return { error: error.message };
  }

  return {};
}
