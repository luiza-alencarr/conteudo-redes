import { randomBytes, createHash } from "node:crypto";

function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generatePkcePair(): { verifier: string; challenge: string } {
  const verifier = base64UrlEncode(randomBytes(32));
  const challenge = base64UrlEncode(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

export function generateState(): string {
  return base64UrlEncode(randomBytes(16));
}

const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";

export interface TikTokTokenResponse {
  access_token: string;
  expires_in: number;
  open_id: string;
  refresh_token?: string;
  refresh_expires_in?: number;
  scope?: string;
  token_type?: string;
}

async function postForm(body: Record<string, string>): Promise<TikTokTokenResponse> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: new URLSearchParams(body).toString(),
  });
  const json = await response.json();

  if (!response.ok || json.error) {
    throw new Error(
      json.error_description ?? json.error ?? "Falha na autenticação com o TikTok",
    );
  }

  return json as TikTokTokenResponse;
}

export function exchangeCodeForToken(params: {
  clientKey: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<TikTokTokenResponse> {
  return postForm({
    client_key: params.clientKey,
    client_secret: params.clientSecret,
    code: params.code,
    grant_type: "authorization_code",
    redirect_uri: params.redirectUri,
    code_verifier: params.codeVerifier,
  });
}

export function refreshAccessToken(params: {
  clientKey: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<TikTokTokenResponse> {
  return postForm({
    client_key: params.clientKey,
    client_secret: params.clientSecret,
    grant_type: "refresh_token",
    refresh_token: params.refreshToken,
  });
}
