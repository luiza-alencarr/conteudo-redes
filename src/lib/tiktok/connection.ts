import { createClient } from "@/lib/supabase/server";
import { refreshAccessToken } from "@/lib/tiktok/oauth";

const REFRESH_BUFFER_MS = 5 * 60 * 1000;

export async function getValidAccessToken(): Promise<string> {
  const supabase = await createClient();
  const { data: connection, error } = await supabase
    .from("oauth_connections")
    .select("*")
    .eq("network", "tiktok")
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao carregar a conexão do TikTok: ${error.message}`);
  }
  if (!connection) {
    throw new Error('TikTok não está conectado. Clique em "Conectar TikTok" primeiro.');
  }

  const expiresAt = connection.access_token_expires_at
    ? new Date(connection.access_token_expires_at).getTime()
    : 0;

  if (Date.now() < expiresAt - REFRESH_BUFFER_MS) {
    return connection.access_token;
  }

  if (!connection.refresh_token) {
    throw new Error("Token do TikTok expirado e sem refresh token salvo. Conecte de novo.");
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (!clientKey || !clientSecret) {
    throw new Error("TIKTOK_CLIENT_KEY/TIKTOK_CLIENT_SECRET não configurados.");
  }

  const refreshed = await refreshAccessToken({
    clientKey,
    clientSecret,
    refreshToken: connection.refresh_token,
  });

  const { error: updateError } = await supabase
    .from("oauth_connections")
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token ?? connection.refresh_token,
      access_token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      refresh_token_expires_at: refreshed.refresh_expires_in
        ? new Date(Date.now() + refreshed.refresh_expires_in * 1000).toISOString()
        : connection.refresh_token_expires_at,
      scope: refreshed.scope ?? connection.scope,
    })
    .eq("network", "tiktok");

  if (updateError) {
    throw new Error(`Falha ao salvar o token renovado: ${updateError.message}`);
  }

  return refreshed.access_token;
}

export interface TikTokConnectionStatus {
  connected: boolean;
  username: string | null;
}

export async function getTikTokConnectionStatus(): Promise<TikTokConnectionStatus> {
  const supabase = await createClient();

  const { data: connection } = await supabase
    .from("oauth_connections")
    .select("network")
    .eq("network", "tiktok")
    .maybeSingle();

  if (!connection) {
    return { connected: false, username: null };
  }

  const { data: profile } = await supabase
    .from("social_profiles")
    .select("username")
    .eq("network", "tiktok")
    .maybeSingle();

  return { connected: true, username: profile?.username ?? null };
}
