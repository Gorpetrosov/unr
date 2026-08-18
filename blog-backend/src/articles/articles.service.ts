import { Injectable } from '@nestjs/common';
import { ArticleStatus, Prisma } from '@prisma/client';
import { AppError } from '../common/app-error';
import {
  LocalizedString,
  localizedSlugs,
  makeSlug,
  publicAuthorSelect,
  sanitizeLocalizedHtml,
} from '../common/helpers';
import { PrismaService } from '../prisma/prisma.service';

type ArticleInput = {
  title: LocalizedString;
  content: LocalizedString;
  excerpt?: LocalizedString;
  featuredImage?: string | null;
  featured?: boolean;
  status?: 'draft' | 'published' | 'scheduled';
  scheduledAt?: string | null;
  categoryIds?: string[];
  tagIds?: string[];
  slug?: LocalizedString;
};

const articleInclude = {
  author: { select: publicAuthorSelect },
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
} satisfies Prisma.ArticleInclude;

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureUniqueSlugs(
    slugs: LocalizedString,
    excludeId?: string
  ): Promise<LocalizedString> {
    const result = { ...slugs };

    for (const locale of ['en', 'ru'] as const) {
      let candidate = result[locale];
      let suffix = 2;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const existing = await this.prisma.$queryRaw<{ id: string }[]>`
          SELECT id FROM articles
          WHERE deleted_at IS NULL
            AND slug->>${locale} = ${candidate}
            ${excludeId ? Prisma.sql`AND id <> ${excludeId}` : Prisma.empty}
          LIMIT 1
        `;

        if (existing.length === 0) {
          result[locale] = candidate;
          break;
        }
        candidate = `${makeSlug(slugs[locale])}-${suffix}`;
        suffix += 1;
      }
    }

    return result;
  }

  private mapArticle(article: Record<string, unknown>) {
    return {
      ...article,
      title: article.title as LocalizedString,
      slug: article.slug as LocalizedString,
      content: article.content as LocalizedString,
      excerpt: (article.excerpt as LocalizedString | null) ?? null,
    };
  }

  private parseScheduledAt(value?: string | null): Date | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new AppError('Invalid scheduledAt', 400);
    }
    return date;
  }

  private resolvePublishState(
    status: ArticleInput['status'] | ArticleStatus | undefined,
    scheduledAtRaw?: string | null,
    existingPublishedAt?: Date | null
  ) {
    let nextStatus = (status || 'draft') as ArticleStatus;
    let scheduledAt = this.parseScheduledAt(scheduledAtRaw ?? null);
    let publishedAt = existingPublishedAt ?? null;

    if (nextStatus === 'scheduled') {
      if (!scheduledAt) {
        throw new AppError('scheduledAt is required when status is scheduled', 400);
      }
      if (scheduledAt.getTime() <= Date.now()) {
        nextStatus = ArticleStatus.published;
        publishedAt = scheduledAt;
        scheduledAt = null;
      } else {
        publishedAt = null;
      }
    } else if (nextStatus === ArticleStatus.published) {
      publishedAt = publishedAt || new Date();
      scheduledAt = null;
    } else {
      scheduledAt = null;
    }

    return { status: nextStatus, scheduledAt, publishedAt };
  }

  async publishDueArticles() {
    const now = new Date();
    await this.prisma.article.updateMany({
      where: {
        deletedAt: null,
        status: ArticleStatus.scheduled,
        scheduledAt: { lte: now },
      },
      data: {
        status: ArticleStatus.published,
        publishedAt: now,
      },
    });
  }

  private publicWhere(): Prisma.ArticleWhereInput {
    return {
      deletedAt: null,
      OR: [
        { status: ArticleStatus.published },
        { status: ArticleStatus.scheduled, scheduledAt: { lte: new Date() } },
      ],
    };
  }

  private async resolveTaxonomyId(
    table: 'categories' | 'tags',
    value?: string
  ): Promise<string | undefined> {
    if (!value) return undefined;

    if (table === 'categories') {
      const byId = await this.prisma.category.findUnique({
        where: { id: value },
        select: { id: true },
      });
      if (byId) return byId.id;
      const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM categories
        WHERE slug->>'en' = ${value} OR slug->>'ru' = ${value}
        LIMIT 1
      `;
      return rows[0]?.id;
    }

    const byId = await this.prisma.tag.findUnique({
      where: { id: value },
      select: { id: true },
    });
    if (byId) return byId.id;
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM tags
      WHERE slug->>'en' = ${value} OR slug->>'ru' = ${value}
      LIMIT 1
    `;
    return rows[0]?.id;
  }

  async listPublishedArticles(opts: {
    page: number;
    limit: number;
    category?: string;
    tag?: string;
    featured?: boolean;
    ids?: string;
  }) {
    await this.publishDueArticles();

    if (opts.ids) {
      const ids = opts.ids
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, 50);

      const items = await this.prisma.article.findMany({
        where: { ...this.publicWhere(), id: { in: ids } },
        include: articleInclude,
      });
      const order = new Map(ids.map((id, i) => [id, i]));
      items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

      return {
        items: items.map((a) => this.mapArticle(a as unknown as Record<string, unknown>)),
        pagination: { page: 1, limit: ids.length, total: items.length, pages: 1 },
      };
    }

    const categoryId = await this.resolveTaxonomyId('categories', opts.category);
    const tagId = await this.resolveTaxonomyId('tags', opts.tag);

    const where: Prisma.ArticleWhereInput = {
      ...this.publicWhere(),
      ...(opts.featured === true ? { featured: true } : {}),
      ...(categoryId
        ? { categories: { some: { categoryId } } }
        : opts.category
          ? { id: { in: [] } }
          : {}),
      ...(tagId ? { tags: { some: { tagId } } } : opts.tag ? { id: { in: [] } } : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.article.count({ where }),
      this.prisma.article.findMany({
        where,
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
        orderBy: { publishedAt: 'desc' },
        include: articleInclude,
      }),
    ]);

    return {
      items: items.map((a) => this.mapArticle(a as unknown as Record<string, unknown>)),
      pagination: {
        page: opts.page,
        limit: opts.limit,
        total,
        pages: Math.ceil(total / opts.limit),
      },
    };
  }

  async getRelatedArticles(
    articleId: string,
    categoryIds: string[],
    tagIds: string[],
    limit = 3
  ) {
    const overlap: Prisma.ArticleWhereInput[] = [];
    if (categoryIds.length) {
      overlap.push({ categories: { some: { categoryId: { in: categoryIds } } } });
    }
    if (tagIds.length) {
      overlap.push({ tags: { some: { tagId: { in: tagIds } } } });
    }

    const related = overlap.length
      ? await this.prisma.article.findMany({
          where: {
            ...this.publicWhere(),
            id: { not: articleId },
            OR: overlap,
          },
          take: limit,
          orderBy: { publishedAt: 'desc' },
          include: articleInclude,
        })
      : [];

    if (related.length >= limit) {
      return related.map((a) => this.mapArticle(a as unknown as Record<string, unknown>));
    }

    const extra = await this.prisma.article.findMany({
      where: {
        ...this.publicWhere(),
        id: { notIn: [articleId, ...related.map((a) => a.id)] },
      },
      take: limit - related.length,
      orderBy: { publishedAt: 'desc' },
      include: articleInclude,
    });

    return [...related, ...extra].map((a) =>
      this.mapArticle(a as unknown as Record<string, unknown>)
    );
  }

  async getArticleBySlug(slug: string) {
    await this.publishDueArticles();

    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM articles
      WHERE deleted_at IS NULL
        AND (
          status = 'published'
          OR (status = 'scheduled' AND scheduled_at <= NOW())
        )
        AND (slug->>'en' = ${slug} OR slug->>'ru' = ${slug})
      LIMIT 1
    `;

    if (!rows[0]) {
      throw new AppError('Article not found', 404);
    }

    const article = await this.prisma.article.findUnique({
      where: { id: rows[0].id },
      include: articleInclude,
    });

    if (!article) {
      throw new AppError('Article not found', 404);
    }

    return this.mapArticle(article as unknown as Record<string, unknown>);
  }

  async searchArticles(opts: { q: string; page: number; limit: number; category?: string }) {
    await this.publishDueArticles();

    const offset = (opts.page - 1) * opts.limit;
    const query = opts.q.trim();
    const categoryId = await this.resolveTaxonomyId('categories', opts.category);
    const categoryFilter = categoryId
      ? Prisma.sql`AND EXISTS (
          SELECT 1 FROM article_categories ac
          WHERE ac.article_id = articles.id AND ac.category_id = ${categoryId}
        )`
      : Prisma.empty;

    const countRows = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM articles
      WHERE deleted_at IS NULL
        AND (
          status = 'published'
          OR (status = 'scheduled' AND scheduled_at <= NOW())
        )
        AND search_vector @@ plainto_tsquery('simple', unaccent(${query}))
        ${categoryFilter}
    `;

    const items = await this.prisma.$queryRaw<
      Array<{
        id: string;
        title: LocalizedString;
        slug: LocalizedString;
        excerpt: LocalizedString | null;
        featured_image: string | null;
        featured: boolean;
        views: number;
        shares: number;
        published_at: Date | null;
        rank: number;
      }>
    >`
      SELECT
        id,
        title,
        slug,
        excerpt,
        featured_image,
        featured,
        views,
        shares,
        published_at,
        ts_rank(search_vector, plainto_tsquery('simple', unaccent(${query}))) AS rank
      FROM articles
      WHERE deleted_at IS NULL
        AND (
          status = 'published'
          OR (status = 'scheduled' AND scheduled_at <= NOW())
        )
        AND search_vector @@ plainto_tsquery('simple', unaccent(${query}))
        ${categoryFilter}
      ORDER BY rank DESC, published_at DESC
      LIMIT ${opts.limit} OFFSET ${offset}
    `;

    const total = Number(countRows[0]?.count ?? 0);

    return {
      items: items.map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt,
        featuredImage: row.featured_image,
        featured: row.featured,
        views: row.views,
        shares: row.shares,
        publishedAt: row.published_at,
        rank: Number(row.rank),
      })),
      pagination: {
        page: opts.page,
        limit: opts.limit,
        total,
        pages: Math.ceil(total / opts.limit) || 0,
      },
    };
  }

  async listAdminArticles(opts: { page: number; limit: number; status?: string }) {
    const where: Prisma.ArticleWhereInput = {
      deletedAt: null,
      ...(opts.status ? { status: opts.status as ArticleStatus } : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.article.count({ where }),
      this.prisma.article.findMany({
        where,
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
        orderBy: { updatedAt: 'desc' },
        include: articleInclude,
      }),
    ]);

    return {
      items: items.map((a) => this.mapArticle(a as unknown as Record<string, unknown>)),
      pagination: {
        page: opts.page,
        limit: opts.limit,
        total,
        pages: Math.ceil(total / opts.limit),
      },
    };
  }

  async getAdminArticle(id: string) {
    const article = await this.prisma.article.findFirst({
      where: { id, deletedAt: null },
      include: articleInclude,
    });
    if (!article) throw new AppError('Article not found', 404);
    return this.mapArticle(article as unknown as Record<string, unknown>);
  }

  async listByAuthorSlug(slug: string, opts: { page: number; limit: number }) {
    await this.publishDueArticles();

    const author = await this.prisma.user.findUnique({
      where: { slug },
      select: publicAuthorSelect,
    });
    if (!author) throw new AppError('Author not found', 404);

    const where: Prisma.ArticleWhereInput = {
      ...this.publicWhere(),
      authorId: author.id,
    };

    const [total, items] = await Promise.all([
      this.prisma.article.count({ where }),
      this.prisma.article.findMany({
        where,
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
        orderBy: { publishedAt: 'desc' },
        include: articleInclude,
      }),
    ]);

    return {
      author,
      items: items.map((a) => this.mapArticle(a as unknown as Record<string, unknown>)),
      pagination: {
        page: opts.page,
        limit: opts.limit,
        total,
        pages: Math.ceil(total / opts.limit),
      },
    };
  }

  async createArticle(authorId: string, input: ArticleInput) {
    const title = input.title;
    const content = sanitizeLocalizedHtml(input.content);
    const excerpt = input.excerpt
      ? sanitizeLocalizedHtml(input.excerpt)
      : { en: content.en.slice(0, 200), ru: content.ru.slice(0, 200) };

    const slugs = await this.ensureUniqueSlugs(input.slug || localizedSlugs(title));
    const { status, scheduledAt, publishedAt } = this.resolvePublishState(
      input.status,
      input.scheduledAt
    );

    const article = await this.prisma.article.create({
      data: {
        title,
        slug: slugs,
        content,
        excerpt,
        featuredImage: input.featuredImage || null,
        featured: input.featured ?? false,
        status,
        scheduledAt,
        publishedAt,
        authorId,
        categories: input.categoryIds?.length
          ? {
              create: input.categoryIds.map((categoryId) => ({ categoryId })),
            }
          : undefined,
        tags: input.tagIds?.length
          ? {
              create: input.tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
      },
      include: articleInclude,
    });

    return this.mapArticle(article as unknown as Record<string, unknown>);
  }

  async updateArticle(id: string, input: Partial<ArticleInput>) {
    const existing = await this.prisma.article.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError('Article not found', 404);

    const title = input.title || (existing.title as LocalizedString);
    const content = input.content
      ? sanitizeLocalizedHtml(input.content)
      : (existing.content as LocalizedString);
    const excerpt = input.excerpt
      ? sanitizeLocalizedHtml(input.excerpt)
      : (existing.excerpt as LocalizedString | null);

    let slugs = existing.slug as LocalizedString;
    if (input.slug || input.title) {
      slugs = await this.ensureUniqueSlugs(input.slug || localizedSlugs(title), id);
    }

    const { status, scheduledAt, publishedAt } = this.resolvePublishState(
      input.status || existing.status,
      input.scheduledAt !== undefined
        ? input.scheduledAt
        : existing.scheduledAt?.toISOString() ?? null,
      existing.publishedAt
    );

    if (input.categoryIds) {
      await this.prisma.articleCategory.deleteMany({ where: { articleId: id } });
    }
    if (input.tagIds) {
      await this.prisma.articleTag.deleteMany({ where: { articleId: id } });
    }

    const article = await this.prisma.article.update({
      where: { id },
      data: {
        title,
        slug: slugs,
        content,
        excerpt: excerpt === null ? Prisma.JsonNull : excerpt,
        featuredImage:
          input.featuredImage !== undefined ? input.featuredImage : existing.featuredImage,
        featured: input.featured !== undefined ? input.featured : existing.featured,
        status,
        scheduledAt,
        publishedAt,
        ...(input.categoryIds
          ? {
              categories: {
                create: input.categoryIds.map((categoryId) => ({ categoryId })),
              },
            }
          : {}),
        ...(input.tagIds
          ? {
              tags: {
                create: input.tagIds.map((tagId) => ({ tagId })),
              },
            }
          : {}),
      },
      include: articleInclude,
    });

    return this.mapArticle(article as unknown as Record<string, unknown>);
  }

  async deleteArticle(id: string, hard = false) {
    const existing = await this.prisma.article.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError('Article not found', 404);

    if (hard) {
      await this.prisma.article.delete({ where: { id } });
      return { deleted: true, hard: true };
    }

    await this.prisma.article.update({
      where: { id },
      data: { deletedAt: new Date(), status: ArticleStatus.draft },
    });

    return { deleted: true, hard: false };
  }
}
