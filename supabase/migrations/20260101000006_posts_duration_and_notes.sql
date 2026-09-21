-- duration_seconds: duração de posts em vídeo (quando a API de origem expõe
-- esse dado); null pra imagem/carrossel ou quando a API não retorna.
-- notes: campo livre editável na tela de Analytics, pra documentar o roteiro
-- real do vídeo ou anotações sobre desempenho — não vem de nenhuma API.
alter table posts add column duration_seconds integer;
alter table posts add column notes text;
