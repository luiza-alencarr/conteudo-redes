-- Schema inicial: gestão de conteúdo e analytics de redes sociais.
-- App de uso pessoal (um único usuário autenticado via Supabase Auth).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type social_network as enum (
  'instagram',
  'tiktok',
  'youtube',
  'linkedin'
);

create type content_type as enum (
  'image',
  'carousel',
  'video',
  'reel',
  'short',
  'story',
  'live',
  'article',
  'text'
);

create type script_status as enum (
  'rascunho',
  'pronto',
  'publicado'
);

create type calendar_status as enum (
  'ideia',
  'planejado',
  'em_producao',
  'pronto',
  'publicado'
);

-- ---------------------------------------------------------------------------
-- social_profiles
-- ---------------------------------------------------------------------------

create table social_profiles (
  id uuid primary key default gen_random_uuid(),
  network social_network not null,
  username text not null,
  platform_account_id text,
  display_name text,
  profile_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (network, username)
);

-- ---------------------------------------------------------------------------
-- posts
-- ---------------------------------------------------------------------------

create table posts (
  id uuid primary key default gen_random_uuid(),
  social_profile_id uuid references social_profiles (id) on delete set null,
  network social_network not null,
  external_id text,
  content_type content_type not null,
  caption text,
  script_id uuid,
  published_at timestamptz,
  url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (network, external_id)
);

create index posts_network_idx on posts (network);
create index posts_published_at_idx on posts (published_at);

-- ---------------------------------------------------------------------------
-- post_metrics
-- ---------------------------------------------------------------------------

create table post_metrics (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  likes integer default 0,
  comments_count integer default 0,
  views integer default 0,
  saves integer default 0,
  shares integer default 0,
  reach integer default 0,
  collected_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index post_metrics_post_id_idx on post_metrics (post_id);
create index post_metrics_collected_at_idx on post_metrics (collected_at);

-- ---------------------------------------------------------------------------
-- comments
-- ---------------------------------------------------------------------------

create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  external_id text,
  author text,
  text text not null,
  commented_at timestamptz,
  created_at timestamptz not null default now()
);

create index comments_post_id_idx on comments (post_id);

-- ---------------------------------------------------------------------------
-- audience_demographics
-- ---------------------------------------------------------------------------

create table audience_demographics (
  id uuid primary key default gen_random_uuid(),
  network social_network not null,
  snapshot_date date not null,
  age_range text,
  gender text,
  location text,
  percentage numeric(5, 2) not null,
  created_at timestamptz not null default now()
);

create index audience_demographics_network_idx on audience_demographics (network);
create index audience_demographics_snapshot_date_idx on audience_demographics (snapshot_date);

-- ---------------------------------------------------------------------------
-- scripts
-- ---------------------------------------------------------------------------

create table scripts (
  id uuid primary key default gen_random_uuid(),
  network social_network not null,
  title text not null,
  content text,
  status script_status not null default 'rascunho',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index scripts_status_idx on scripts (status);

alter table posts
  add constraint posts_script_id_fkey
  foreign key (script_id) references scripts (id) on delete set null;

-- ---------------------------------------------------------------------------
-- calendar_items
-- ---------------------------------------------------------------------------

create table calendar_items (
  id uuid primary key default gen_random_uuid(),
  suggested_date date not null,
  network social_network not null,
  content_type content_type not null,
  theme text not null,
  status calendar_status not null default 'ideia',
  script_id uuid references scripts (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index calendar_items_suggested_date_idx on calendar_items (suggested_date);
create index calendar_items_status_idx on calendar_items (status);

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on social_profiles
  for each row execute function set_updated_at();

create trigger set_updated_at before update on posts
  for each row execute function set_updated_at();

create trigger set_updated_at before update on scripts
  for each row execute function set_updated_at();

create trigger set_updated_at before update on calendar_items
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- App de uso pessoal: qualquer usuário autenticado (só existe um) tem acesso
-- total. Não há coluna user_id porque os dados não são multi-tenant.
-- ---------------------------------------------------------------------------

alter table social_profiles enable row level security;
alter table posts enable row level security;
alter table post_metrics enable row level security;
alter table comments enable row level security;
alter table audience_demographics enable row level security;
alter table scripts enable row level security;
alter table calendar_items enable row level security;

create policy "Authenticated user has full access" on social_profiles
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated user has full access" on posts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated user has full access" on post_metrics
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated user has full access" on comments
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated user has full access" on audience_demographics
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated user has full access" on scripts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated user has full access" on calendar_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
