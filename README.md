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

## Estrutura do banco

- `social_profiles` — perfis conectados (rede, username, id da conta na plataforma)
- `posts` — conteúdos publicados (rede, id externo, tipo, legenda/roteiro, data, link)
- `post_metrics` — métricas coletadas por post ao longo do tempo (curtidas, comentários, views, salvamentos, alcance)
- `comments` — comentários dos posts
- `audience_demographics` — dados demográficos da audiência por rede/data
- `scripts` — roteiros de conteúdo (rascunho/pronto/publicado)
- `calendar_items` — itens do calendário editorial (data sugerida, rede, tema, status)

## Próximos passos

Integração com TikTok ainda não foi implementada. A sincronização do Instagram é manual (botão em Analytics); automatizar (cron/job) e renovar o token automaticamente ficam para uma próxima etapa.
