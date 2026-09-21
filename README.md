# Conteúdo Redes

App pessoal de gestão de conteúdo e analytics de redes sociais (Instagram, TikTok e, no futuro, YouTube e LinkedIn).

Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase.

## Setup

```bash
npm install
cp .env.example .env.local
```

Preencha `.env.local` com as credenciais do seu projeto Supabase (Project Settings > API):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (apenas para uso server-side, nunca expor no client)

## Rodando o app

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Banco de dados (Supabase)

O schema fica versionado em `supabase/migrations`. Requer [Docker](https://docs.docker.com/get-docker/) para rodar o Supabase localmente e a [Supabase CLI](https://supabase.com/docs/guides/cli) (já incluída como devDependency, acessível via `npx supabase` ou pelos scripts abaixo).

### Ambiente local

```bash
npm run supabase:start   # sobe Postgres, Auth, Studio etc. localmente via Docker
npm run supabase:status  # mostra URLs e chaves locais (anon key, service role key)
```

Copie a `anon key` e a `URL` retornadas para o seu `.env.local` durante o desenvolvimento local.

As migrations em `supabase/migrations` são aplicadas automaticamente ao rodar `supabase start` pela primeira vez. Para reaplicar do zero:

```bash
npm run supabase:db:reset
```

### Criando uma nova migration

```bash
npm run supabase:migration:new nome_da_migration
```

Edite o arquivo SQL gerado em `supabase/migrations/`.

### Aplicando migrations em um projeto remoto (produção)

```bash
npx supabase login
npx supabase link --project-ref <seu-project-ref>
npm run supabase:db:push
```

### Gerando os tipos TypeScript a partir do schema

```bash
npm run supabase:types
```

Isso regenera `src/lib/supabase/database.types.ts` a partir do banco local. Rode depois de qualquer alteração de schema.

### Autenticação

O app usa Supabase Auth com um único usuário. `enable_signup` está desabilitado em `supabase/config.toml`; crie o usuário manualmente pelo Supabase Studio (local: http://localhost:54323, ou no dashboard do projeto remoto) em Authentication > Users.

## Integração com Instagram

Usa a Instagram Graph API (conta comercial/criador conectada a uma Página do Facebook) para importar posts, métricas, comentários e demografia da audiência.

### Configuração

Preencha em `.env.local` (veja `.env.example`):

- `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET` — do app em [developers.facebook.com](https://developers.facebook.com)
- `INSTAGRAM_ACCESS_TOKEN` — token de acesso
- `INSTAGRAM_BUSINESS_ACCOUNT_ID` — ID da conta comercial/criador do Instagram

### Trocando o token por um de longa duração (~60 dias)

Tokens gerados no Graph API Explorer são de curta duração (~1h-2h). Troque por um de longa duração com:

```bash
npm run instagram:exchange-token -- <token-de-curta-duracao>
```

Isso chama o endpoint oficial da Meta (`oauth/access_token` com `grant_type=fb_exchange_token`) e já atualiza `INSTAGRAM_ACCESS_TOKEN` em `.env.local`. Um token de longa duração ainda expira (~60 dias) — por enquanto repita esse comando quando ele vencer; automatizar a renovação fica para uma próxima etapa.

### Sincronizando dados

Na tela **Analytics** do dashboard, o botão "Sincronizar Instagram" chama `POST /api/instagram/sync`, que:

1. Busca o perfil da conta (incluindo `followers_count`) e faz upsert em `social_profiles`.
2. Busca os últimos posts (`/media`) e faz upsert em `posts`.
3. Busca insights por post (`reach`, `saved`, `shares`, `views`/`total_interactions`) e insere uma nova linha em `post_metrics` a cada sincronização (histórico ao longo do tempo).
4. Busca comentários de cada post e faz upsert em `comments`.
5. Busca demografia da audiência (idade, gênero, país) e substitui o snapshot do dia em `audience_demographics`.

Avisos não fatais (ex.: insights indisponíveis para um post específico) aparecem no resultado do botão sem interromper o restante da sincronização. A resposta bruta de cada chamada de insights também é logada no servidor (`console.log`, visível nos logs de função da Vercel) — útil pra conferir o nome/formato exato de um metric quando a Graph API mudar de novo.

### Visualizando os dados

A tela **Analytics** lê direto do Supabase (sem cache): totais no topo (posts nos últimos 60 dias, curtidas, comentários, views, alcance, taxa de engajamento) e uma tabela com cada post (miniatura, legenda, tipo, data, curtidas, comentários, views, alcance e link pro post original). Os totais e os números por post usam sempre a métrica mais recente coletada para aquele post — cada sincronização soma uma nova linha em `post_metrics`, então o histórico fica no banco mesmo a tela só mostrando o valor atual.

O card "Posts (60 dias)" conta quantos posts foram **publicados** nos últimos 60 dias (a partir de `published_at`), não quantos posts o banco tem no total — esse total depende de quantos a última sincronização trouxe (limitado a 50 por padrão) e não representa um período real.

**Ordenação da tabela**: posts dos últimos 30 dias vêm primeiro, ordenados por engajamento (curtidas + comentários + compartilhamentos + salvamentos) do maior pro menor; posts mais antigos que isso vêm depois, ordenados por data de publicação — um post de meses atrás não "compete" por ter tido mais tempo pra acumular interações.

**Taxa de engajamento**: é a média, entre todos os posts, de `(curtidas + comentários + compartilhamentos + salvamentos) / seguidores × 100` calculado post a post — não a soma de todas as interações do perfil dividida pelos seguidores uma única vez (isso infla o número conforme mais posts são sincronizados). Se `followers_count` ainda não tiver sido sincronizado, o card mostra um aviso pra sincronizar de novo em vez de um número errado.

**Detalhes por post**: clicando em qualquer linha da tabela, ela expande e mostra:

- **Gancho** — a primeira frase ou primeira linha da legenda (até a primeira quebra de linha ou ponto final, o que vier primeiro). É uma heurística de texto simples, sem IA — não tenta "entender" a legenda, só corta ela.
- **Legenda completa** e **duração** (formato `m:ss`, quando a rede de origem expõe esse dado).
- **Roteiro / Notas** — campo de texto livre, editável ali mesmo, salvo no banco (`posts.notes`) via Server Action. É o único campo dessa tela que não vem de nenhuma API — é seu, pra documentar o roteiro real do vídeo ou por que ele funcionou.

**Duração**: buscada na sincronização (`duration` da Instagram Graph API e da TikTok API). Como não é possível confirmar sem testar contra as APIs reais se o campo `duration` está disponível pra mídia comum do Instagram, a sincronização tenta com esse campo e, se a API rejeitar, tenta de novo sem ele automaticamente (sem quebrar o resto do sync) — nesse caso a coluna "Duração" fica vazia (`—`) até isso ser resolvido.

## Integração com TikTok

Usa o login OAuth 2.0 do TikTok for Developers (com PKCE) pra conectar a própria conta e importar vídeos e métricas básicas (views, curtidas, comentários, compartilhamentos).

### Configuração

Preencha em `.env.local` (veja `.env.example`):

- `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` — do app em [developers.tiktok.com](https://developers.tiktok.com)
- `TIKTOK_REDIRECT_URI` — precisa ser **exatamente** a URL de redirect cadastrada no app (ex.: `https://seu-dominio.vercel.app/api/auth/tiktok/callback`)

**Modo Sandbox**: enquanto o app não for submetido pra revisão da TikTok, o login só funciona pras contas cadastradas como "target user" no painel do app.

### Conectando a conta

Na tela **Analytics**, o botão "Conectar TikTok":

1. Redireciona pra tela de autorização do TikTok (`/v2/auth/authorize/`), com PKCE (`code_challenge`/`code_verifier`) e um `state` aleatório guardados em cookies httpOnly de curta duração pra proteção contra CSRF.
2. O TikTok redireciona de volta pra `TIKTOK_REDIRECT_URI` (`GET /api/auth/tiktok/callback`) com um `code`.
3. O callback confere o `state`, troca o `code` por `access_token` + `refresh_token` (`POST /v2/oauth/token/`) e salva na tabela `oauth_connections` (upsert por `network`).

O access token dura pouco (o TikTok costuma emitir por ~24h); a sincronização usa o `refresh_token` pra renová-lo automaticamente quando precisa, sem precisar reconectar manualmente — só quando o refresh token expirar (~365 dias) é que será preciso clicar em "Conectar TikTok" de novo.

### Sincronizando dados

Depois de conectado, o botão "Sincronizar TikTok" chama `POST /api/tiktok/sync`, que:

1. Busca o perfil (`/v2/user/info/`) e faz upsert em `social_profiles` com `network = 'tiktok'`.
2. Busca os últimos vídeos (`/v2/video/list/`, até 50) e faz upsert em `posts` (`content_type = 'short'`).
3. Insere uma nova linha em `post_metrics` por vídeo a cada sincronização, com `views`, `likes`, `comments_count` e `shares` — todos vêm direto no objeto do vídeo, sem precisar de uma chamada de insights à parte como no Instagram. A API não expõe salvamentos nem alcance no escopo básico, então esses campos ficam em 0 pro TikTok.

Os posts do TikTok aparecem na mesma tabela e nos mesmos totais do Instagram na tela de Analytics (com uma coluna "Rede" pra diferenciar); a taxa de engajamento continua calculada só sobre o Instagram, já que é de lá que vem o número de seguidores.

> **Nota**: os nomes de campo e endpoints acima seguem a documentação pública da TikTok API v2 no momento da implementação — como já aconteceu com o Instagram, a TikTok pode ajustar nomes de métricas/escopos. Se a sincronização ou o login falharem, o erro retornado pela API aparece na tela (ou nos logs de função da Vercel) e deve indicar o que precisa ajustar.

## Exportando um relatório em PDF

Na tela **Analytics**, o botão "Exportar PDF" baixa um relatório gerado sob demanda (`GET /api/analytics/export-pdf`, sem cache) com:

1. **Resumo geral dos últimos 30 dias** — posts, curtidas, comentários, views, alcance e taxa de engajamento, por rede e no total. A taxa de engajamento por rede só aparece quando há `followers_count` pra ela (hoje, só o Instagram).
2. **Lista dos posts do período** (últimos 30 dias), ordenados por engajamento (curtidas + comentários + compartilhamentos + salvamentos), com legenda completa, rede, tipo, data, curtidas, comentários e views.
3. **Comentários dos 5 posts mais engajados do período**, até 5 por post, ordenados por curtidas do comentário (`comments.like_count`) — pensado pra servir de insumo pra pedir uma análise de tom/conteúdo a uma IA fora do app.

O PDF é gerado com [`@react-pdf/renderer`](https://react-pdf.org/) direto no servidor (rota Node.js, não Edge — a biblioteca depende de APIs do Node). Não há truncamento de legendas/comentários no PDF, só um limite de quantidade (5 posts, 5 comentários por post), justamente pra manter o texto completo disponível pra análise posterior.

## Estrutura do banco

- `social_profiles` — perfis conectados (rede, username, id da conta na plataforma)
- `posts` — conteúdos publicados (rede, id externo, tipo, legenda, data, link, duração, notas)
- `post_metrics` — métricas coletadas por post ao longo do tempo (curtidas, comentários, views, salvamentos, alcance)
- `comments` — comentários dos posts (com `like_count`, usado pra ordenar por relevância no relatório em PDF)
- `audience_demographics` — dados demográficos da audiência por rede/data
- `scripts` — roteiros de conteúdo (rascunho/pronto/publicado)
- `calendar_items` — itens do calendário editorial (data sugerida, rede, tema, status)
- `oauth_connections` — tokens OAuth de redes com login (TikTok), um registro por rede

## Próximos passos

A sincronização de Instagram e TikTok é manual (botões em Analytics); automatizar (cron/job) e renovar tokens automaticamente ficam para uma próxima etapa. Integração com YouTube e LinkedIn ainda não foi implementada.
