-- Guarda tokens de OAuth de redes que exigem login do usuário (TikTok), em
-- vez de um token estático de longa duração como o do Instagram.
create table oauth_connections (
  id uuid primary key default gen_random_uuid(),
  network social_network not null unique,
  access_token text not null,
  refresh_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scope text,
  open_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on oauth_connections
  for each row execute function set_updated_at();

alter table oauth_connections enable row level security;

create policy "Authenticated user has full access" on oauth_connections
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
