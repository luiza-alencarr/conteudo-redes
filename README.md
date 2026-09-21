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

## Estrutura do banco

- `social_profiles` — perfis conectados (rede, username, id da conta na plataforma)
- `posts` — conteúdos publicados (rede, id externo, tipo, legenda/roteiro, data, link)
- `post_metrics` — métricas coletadas por post ao longo do tempo (curtidas, comentários, views, salvamentos, alcance)
- `comments` — comentários dos posts
- `audience_demographics` — dados demográficos da audiência por rede/data
- `scripts` — roteiros de conteúdo (rascunho/pronto/publicado)
- `calendar_items` — itens do calendário editorial (data sugerida, rede, tema, status)

## Próximos passos

Integrações com as APIs do Instagram e TikTok para importar posts/métricas automaticamente ainda não foram implementadas — por enquanto os dados são inseridos manualmente ou via Studio.
