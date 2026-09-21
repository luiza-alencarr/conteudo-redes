import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncTikTok } from "@/lib/tiktok/sync";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const summary = await syncTikTok();
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro desconhecido ao sincronizar." },
      { status: 500 },
    );
  }
}
