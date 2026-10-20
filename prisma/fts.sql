-- Full-text search support for multilingual article content
-- Includes title, excerpt, content, categories, and tags.
-- Run after: npx prisma migrate dev  (or prisma db push)

CREATE EXTENSION IF NOT EXISTS unaccent;

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION articles_rebuild_search_vector(p_article_id text) RETURNS void AS $$
DECLARE
  v_title jsonb;
  v_excerpt jsonb;
  v_content jsonb;
  v_categories text;
  v_tags text;
BEGIN
  SELECT title, excerpt, content
  INTO v_title, v_excerpt, v_content
  FROM articles
  WHERE id = p_article_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT coalesce(string_agg(
    unaccent(coalesce(c.name->>'en', '')) || ' ' ||
    unaccent(coalesce(c.name->>'ru', '')) || ' ' ||
    unaccent(coalesce(c.slug->>'en', '')) || ' ' ||
    unaccent(coalesce(c.slug->>'ru', '')),
    ' '
  ), '')
  INTO v_categories
  FROM article_categories ac
  JOIN categories c ON c.id = ac.category_id
  WHERE ac.article_id = p_article_id;

  SELECT coalesce(string_agg(
    unaccent(coalesce(t.name->>'en', '')) || ' ' ||
    unaccent(coalesce(t.name->>'ru', '')) || ' ' ||
    unaccent(coalesce(t.slug->>'en', '')) || ' ' ||
    unaccent(coalesce(t.slug->>'ru', '')),
    ' '
  ), '')
  INTO v_tags
  FROM article_tags at
  JOIN tags t ON t.id = at.tag_id
  WHERE at.article_id = p_article_id;

  UPDATE articles
  SET search_vector =
    setweight(to_tsvector('simple', unaccent(coalesce(v_title->>'en', ''))), 'A') ||
    setweight(to_tsvector('simple', unaccent(coalesce(v_title->>'ru', ''))), 'A') ||
    setweight(to_tsvector('simple', unaccent(coalesce(v_excerpt->>'en', ''))), 'B') ||
    setweight(to_tsvector('simple', unaccent(coalesce(v_excerpt->>'ru', ''))), 'B') ||
    setweight(to_tsvector('simple', unaccent(coalesce(v_content->>'en', ''))), 'C') ||
    setweight(to_tsvector('simple', unaccent(coalesce(v_content->>'ru', ''))), 'C') ||
    setweight(to_tsvector('simple', v_categories), 'B') ||
    setweight(to_tsvector('simple', v_tags), 'B')
  WHERE id = p_article_id;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION articles_search_vector_after_write() RETURNS trigger AS $$
BEGIN
  PERFORM articles_rebuild_search_vector(NEW.id);
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION article_taxonomy_search_vector_update() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM articles_rebuild_search_vector(OLD.article_id);
    RETURN OLD;
  END IF;
  PERFORM articles_rebuild_search_vector(NEW.article_id);
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION taxonomy_name_search_vector_update() RETURNS trigger AS $$
DECLARE
  r RECORD;
BEGIN
  IF TG_TABLE_NAME = 'categories' THEN
    FOR r IN SELECT article_id FROM article_categories WHERE category_id = NEW.id LOOP
      PERFORM articles_rebuild_search_vector(r.article_id);
    END LOOP;
  ELSIF TG_TABLE_NAME = 'tags' THEN
    FOR r IN SELECT article_id FROM article_tags WHERE tag_id = NEW.id LOOP
      PERFORM articles_rebuild_search_vector(r.article_id);
    END LOOP;
  END IF;
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS articles_search_vector_trigger ON articles;
DROP TRIGGER IF EXISTS articles_search_vector_after_trigger ON articles;
CREATE TRIGGER articles_search_vector_after_trigger
  AFTER INSERT OR UPDATE OF title, excerpt, content
  ON articles
  FOR EACH ROW
  EXECUTE PROCEDURE articles_search_vector_after_write();

DROP TRIGGER IF EXISTS article_categories_search_vector_trigger ON article_categories;
CREATE TRIGGER article_categories_search_vector_trigger
  AFTER INSERT OR UPDATE OR DELETE
  ON article_categories
  FOR EACH ROW
  EXECUTE PROCEDURE article_taxonomy_search_vector_update();

DROP TRIGGER IF EXISTS article_tags_search_vector_trigger ON article_tags;
CREATE TRIGGER article_tags_search_vector_trigger
  AFTER INSERT OR UPDATE OR DELETE
  ON article_tags
  FOR EACH ROW
  EXECUTE PROCEDURE article_taxonomy_search_vector_update();

DROP TRIGGER IF EXISTS categories_search_vector_trigger ON categories;
CREATE TRIGGER categories_search_vector_trigger
  AFTER UPDATE OF name, slug
  ON categories
  FOR EACH ROW
  EXECUTE PROCEDURE taxonomy_name_search_vector_update();

DROP TRIGGER IF EXISTS tags_search_vector_trigger ON tags;
CREATE TRIGGER tags_search_vector_trigger
  AFTER UPDATE OF name, slug
  ON tags
  FOR EACH ROW
  EXECUTE PROCEDURE taxonomy_name_search_vector_update();

CREATE INDEX IF NOT EXISTS articles_search_vector_idx ON articles USING GIN (search_vector);

-- Backfill existing rows
SELECT articles_rebuild_search_vector(id) FROM articles WHERE deleted_at IS NULL;
