import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForToken } from "@/lib/tiktok/oauth";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  const redirectUrl = new URL("/dashboard/analytics", url.origin);

  function fail(message: string) {
    redirectUrl.searchParams.set("tiktok_error", message);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete("tiktok_oauth_state");
    response.cookies.delete("tiktok_oauth_verifier");
    return response;
  }

  if (errorParam) {
    return fail(errorDescription ?? errorParam);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Sessão expirou antes de concluir a conexão. Tente de novo.");
  }

  const expectedState = request.cookies.get("tiktok_oauth_state")?.value;
  const verifier = request.cookies.get("tiktok_oauth_verifier")?.value;

  if (!code || !state || !expectedState || !verifier || state !== expectedState) {
    return fail("Falha na verificação da autorização (state ou verifier ausente/inválido).");
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;

  if (!clientKey || !clientSecret || !redirectUri) {
    return fail("TikTok não configurado no servidor.");
  }

  try {
    const tokens = await exchangeCodeForToken({
      clientKey,
      clientSecret,
      code,
      redirectUri,
      codeVerifier: verifier,
    });

    const { error } = await supabase.from("oauth_connections").upsert(
      {
        network: "tiktok",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        access_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        refresh_token_expires_at: tokens.refresh_expires_in
          ? new Date(Date.now() + tokens.refresh_expires_in * 1000).toISOString()
          : null,
        scope: tokens.scope ?? null,
        open_id: tokens.open_id ?? null,
      },
      { onConflict: "network" },
    );

    if (error) {
      return fail(`Falha ao salvar a conexão: ${error.message}`);
    }

    redirectUrl.searchParams.set("tiktok_connected", "1");
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete("tiktok_oauth_state");
    response.cookies.delete("tiktok_oauth_verifier");
    return response;
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Erro desconhecido ao conectar TikTok.");
  }
}
