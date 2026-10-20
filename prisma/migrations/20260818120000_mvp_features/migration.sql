-- AlterEnum
ALTER TYPE "ArticleStatus" ADD VALUE 'scheduled';

-- AlterTable users
ALTER TABLE "users"
  ADD COLUMN "display_name" TEXT NOT NULL DEFAULT 'Editor',
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "bio" JSONB,
  ADD COLUMN "avatar_url" TEXT;

UPDATE "users"
SET "slug" = regexp_replace(split_part("email", '@', 1), '[^a-zA-Z0-9]+', '-', 'g')
WHERE "slug" IS NULL;

WITH ranked AS (
  SELECT id, slug, row_number() OVER (PARTITION BY slug ORDER BY created_at) AS rn
  FROM "users"
)
UPDATE "users" u
SET slug = ranked.slug || '-' || ranked.rn
FROM ranked
WHERE u.id = ranked.id AND ranked.rn > 1;

ALTER TABLE "users" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "users_slug_key" ON "users"("slug");

-- AlterTable articles
ALTER TABLE "articles"
  ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "scheduled_at" TIMESTAMP(3);

CREATE INDEX "articles_featured_status_idx" ON "articles"("featured", "status");
CREATE INDEX "articles_scheduled_at_idx" ON "articles"("scheduled_at");

-- AlterTable categories
ALTER TABLE "categories" ADD COLUMN "slug" JSONB;

UPDATE "categories"
SET "slug" = jsonb_build_object(
  'en', trim(both '-' from lower(regexp_replace(coalesce("name"->>'en', 'category'), '[^a-zA-Z0-9]+', '-', 'g'))),
  'ru', trim(both '-' from lower(regexp_replace(coalesce("name"->>'ru', 'kategoriya'), '[^a-zA-Z0-9]+', '-', 'g')))
)
WHERE "slug" IS NULL;

ALTER TABLE "categories" ALTER COLUMN "slug" SET NOT NULL;

-- CreateTable tags
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "slug" JSONB NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "article_tags" (
    "article_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "article_tags_pkey" PRIMARY KEY ("article_id","tag_id")
);

ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable comments
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "comments_article_id_created_at_idx" ON "comments"("article_id", "created_at");
ALTER TABLE "comments" ADD CONSTRAINT "comments_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable reactions
CREATE TABLE "reactions" (
    "id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "visitor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reactions_article_id_visitor_id_type_key" ON "reactions"("article_id", "visitor_id", "type");
CREATE INDEX "reactions_article_id_type_idx" ON "reactions"("article_id", "type");
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
