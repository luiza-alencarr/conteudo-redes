-- Necessário pra calcular taxa de engajamento (interações / seguidores) na tela
-- de Analytics.
alter table social_profiles add column followers_count integer;
