-- Necessário pra definir "comentários mais relevantes" no relatório em PDF
-- (ordenamos por curtidas do comentário, na falta de um sinal melhor).
alter table comments add column like_count integer not null default 0;
