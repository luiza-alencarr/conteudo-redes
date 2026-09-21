import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncInstagram } from "@/lib/instagram/sync";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const summary = await syncInstagram();
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro desconhecido ao sincronizar." },
      { status: 500 },
    );
  }
}
