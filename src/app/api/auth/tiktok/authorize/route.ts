import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePkcePair, generateState } from "@/lib/tiktok/oauth";

const TIKTOK_AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/";
const SCOPES = "user.info.basic,video.list";

const OAUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  maxAge: 600,
  path: "/",
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;

  if (!clientKey || !redirectUri) {
    return NextResponse.json(
      { error: "TikTok não configurado (TIKTOK_CLIENT_KEY/TIKTOK_REDIRECT_URI)." },
      { status: 500 },
    );
  }

  const { verifier, challenge } = generatePkcePair();
  const state = generateState();

  const authorizeUrl = new URL(TIKTOK_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_key", clientKey);
  authorizeUrl.searchParams.set("scope", SCOPES);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("tiktok_oauth_state", state, OAUTH_COOKIE_OPTIONS);
  response.cookies.set("tiktok_oauth_verifier", verifier, OAUTH_COOKIE_OPTIONS);
  return response;
}
