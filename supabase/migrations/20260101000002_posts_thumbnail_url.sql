-- Miniatura do post (capa de vídeo/reel ou a própria imagem), usada na listagem
-- de Analytics. URLs de CDN de APIs externas expiram/rotacionam; não é uma
-- fonte de verdade permanente, só uma conveniência de exibição.
alter table posts add column thumbnail_url text;
