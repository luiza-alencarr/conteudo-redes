#!/usr/bin/env node
// Troca um token de acesso de curta duração (Graph API Explorer) por um de
// longa duração (~60 dias) e atualiza INSTAGRAM_ACCESS_TOKEN em .env.local.
//
// Uso:
//   npm run instagram:exchange-token -- <token-de-curta-duracao>
// ou, se INSTAGRAM_ACCESS_TOKEN em .env.local já for o token de curta duração:
//   npm run instagram:exchange-token

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const ENV_PATH = ".env.local";
const GRAPH_API_VERSION = "v21.0";

function loadEnvLocal() {
  if (!existsSync(ENV_PATH)) return {};
  const content = readFileSync(ENV_PATH, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const match = line.match(/^([\w.]+)=(.*)$/);
    if (match) env[match[1]] = match[2];
  }
  return env;
}

function upsertEnvVar(content, key, value) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  return pattern.test(content) ? content.replace(pattern, line) : `${content.trimEnd()}\n${line}\n`;
}

const envLocal = loadEnvLocal();
const appId = process.env.INSTAGRAM_APP_ID ?? envLocal.INSTAGRAM_APP_ID;
const appSecret = process.env.INSTAGRAM_APP_SECRET ?? envLocal.INSTAGRAM_APP_SECRET;
const shortLivedToken = process.argv[2] ?? process.env.INSTAGRAM_ACCESS_TOKEN ?? envLocal.INSTAGRAM_ACCESS_TOKEN;

if (!appId || !appSecret || !shortLivedToken) {
  console.error(
    "Faltam credenciais. Defina INSTAGRAM_APP_ID e INSTAGRAM_APP_SECRET em .env.local, " +
      "e informe o token de curta duração como argumento ou via INSTAGRAM_ACCESS_TOKEN.",
  );
  process.exit(1);
}

const url = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token`);
url.searchParams.set("grant_type", "fb_exchange_token");
url.searchParams.set("client_id", appId);
url.searchParams.set("client_secret", appSecret);
url.searchParams.set("fb_exchange_token", shortLivedToken);

const response = await fetch(url);
const body = await response.json();

if (!response.ok) {
  console.error("Falha ao trocar o token:", JSON.stringify(body, null, 2));
  process.exit(1);
}

const expiresInDays = Math.round(body.expires_in / 86400);
console.log(`Token de longa duração obtido (expira em ~${expiresInDays} dias).`);

const currentContent = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : "";
writeFileSync(ENV_PATH, upsertEnvVar(currentContent, "INSTAGRAM_ACCESS_TOKEN", body.access_token));

console.log(`INSTAGRAM_ACCESS_TOKEN atualizado em ${ENV_PATH}.`);
