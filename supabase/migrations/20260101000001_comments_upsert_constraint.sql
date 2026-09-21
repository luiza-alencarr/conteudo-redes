-- Permite upsert idempotente de comentários importados de APIs externas
-- (reimportar o mesmo comentário não deve criar uma linha duplicada).
alter table comments
  add constraint comments_post_id_external_id_key unique (post_id, external_id);
