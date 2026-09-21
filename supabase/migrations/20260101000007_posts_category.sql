-- Categoria extraída automaticamente da última hashtag da legenda (ex.: uma
-- legenda terminando em "...#bastidores" vira category = 'bastidores').
-- Posts antigos ou sem hashtag de categoria ficam com category = null.
alter table posts add column category text;

create index posts_category_idx on posts (category);
