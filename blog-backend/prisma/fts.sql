-- Full-text search support for multilingual article content
-- Run after: npx prisma migrate dev  (or prisma db push)

CREATE EXTENSION IF NOT EXISTS unaccent;

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION articles_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', unaccent(coalesce(NEW.title->>'en', ''))), 'A') ||
    setweight(to_tsvector('simple', unaccent(coalesce(NEW.title->>'ru', ''))), 'A') ||
    setweight(to_tsvector('simple', unaccent(coalesce(NEW.excerpt->>'en', ''))), 'B') ||
    setweight(to_tsvector('simple', unaccent(coalesce(NEW.excerpt->>'ru', ''))), 'B') ||
    setweight(to_tsvector('simple', unaccent(coalesce(NEW.content->>'en', ''))), 'C') ||
    setweight(to_tsvector('simple', unaccent(coalesce(NEW.content->>'ru', ''))), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS articles_search_vector_trigger ON articles;
CREATE TRIGGER articles_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, excerpt, content
  ON articles
  FOR EACH ROW
  EXECUTE PROCEDURE articles_search_vector_update();

CREATE INDEX IF NOT EXISTS articles_search_vector_idx ON articles USING GIN (search_vector);

-- Backfill existing rows
UPDATE articles SET title = title;
