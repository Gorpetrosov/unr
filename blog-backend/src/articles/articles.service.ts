import { Injectable } from '@nestjs/common';
import { ArticleStatus, Prisma } from '@prisma/client';
import { AppError } from '../common/app-error';
import {
  LocalizedString,
  localizedSlugs,
  makeSlug,
  sanitizeLocalizedHtml,
} from '../common/helpers';
import { PrismaService } from '../prisma/prisma.service';

type ArticleInput = {
  title: LocalizedString;
  content: LocalizedString;
  excerpt?: LocalizedString;
  featuredImage?: string | null;
  status?: 'draft' | 'published';
  categoryIds?: string[];
  slug?: LocalizedString;
};

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

  async listPublishedArticles(opts: { page: number; limit: number; category?: string }) {
    const where: Prisma.ArticleWhereInput = {
      status: ArticleStatus.published,
      deletedAt: null,
      ...(opts.category
        ? {
            categories: {
              some: { categoryId: opts.category },
            },
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.article.count({ where }),
      this.prisma.article.findMany({
        where,
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: { select: { id: true, email: true } },
          categories: { include: { category: true } },
        },
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

  async getArticleBySlug(slug: string) {
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM articles
      WHERE deleted_at IS NULL
        AND status = 'published'
        AND (slug->>'en' = ${slug} OR slug->>'ru' = ${slug})
      LIMIT 1
    `;

    if (!rows[0]) {
      throw new AppError('Article not found', 404);
    }

    const article = await this.prisma.article.findUnique({
      where: { id: rows[0].id },
      include: {
        author: { select: { id: true, email: true } },
        categories: { include: { category: true } },
      },
    });

    if (!article) {
      throw new AppError('Article not found', 404);
    }

    return this.mapArticle(article as unknown as Record<string, unknown>);
  }

  async searchArticles(opts: { q: string; page: number; limit: number }) {
    const offset = (opts.page - 1) * opts.limit;
    const query = opts.q.trim();

    const countRows = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM articles
      WHERE deleted_at IS NULL
        AND status = 'published'
        AND search_vector @@ plainto_tsquery('simple', unaccent(${query}))
    `;

    const items = await this.prisma.$queryRaw<
      Array<{
        id: string;
        title: LocalizedString;
        slug: LocalizedString;
        excerpt: LocalizedString | null;
        featured_image: string | null;
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
        views,
        shares,
        published_at,
        ts_rank(search_vector, plainto_tsquery('simple', unaccent(${query}))) AS rank
      FROM articles
      WHERE deleted_at IS NULL
        AND status = 'published'
        AND search_vector @@ plainto_tsquery('simple', unaccent(${query}))
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
        include: {
          author: { select: { id: true, email: true } },
          categories: { include: { category: true } },
        },
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
      include: {
        author: { select: { id: true, email: true } },
        categories: { include: { category: true } },
      },
    });
    if (!article) throw new AppError('Article not found', 404);
    return this.mapArticle(article as unknown as Record<string, unknown>);
  }

  async createArticle(authorId: string, input: ArticleInput) {
    const title = input.title;
    const content = sanitizeLocalizedHtml(input.content);
    const excerpt = input.excerpt
      ? sanitizeLocalizedHtml(input.excerpt)
      : { en: content.en.slice(0, 200), ru: content.ru.slice(0, 200) };

    const slugs = await this.ensureUniqueSlugs(input.slug || localizedSlugs(title));
    const status = input.status || 'draft';

    const article = await this.prisma.article.create({
      data: {
        title,
        slug: slugs,
        content,
        excerpt,
        featuredImage: input.featuredImage || null,
        status,
        publishedAt: status === 'published' ? new Date() : null,
        authorId,
        categories: input.categoryIds?.length
          ? {
              create: input.categoryIds.map((categoryId) => ({ categoryId })),
            }
          : undefined,
      },
      include: {
        author: { select: { id: true, email: true } },
        categories: { include: { category: true } },
      },
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

    const status = input.status || existing.status;
    let publishedAt = existing.publishedAt;
    if (status === 'published' && !publishedAt) {
      publishedAt = new Date();
    }
    if (status === 'draft') {
      publishedAt = existing.publishedAt;
    }

    if (input.categoryIds) {
      await this.prisma.articleCategory.deleteMany({ where: { articleId: id } });
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
        status,
        publishedAt,
        ...(input.categoryIds
          ? {
              categories: {
                create: input.categoryIds.map((categoryId) => ({ categoryId })),
              },
            }
          : {}),
      },
      include: {
        author: { select: { id: true, email: true } },
        categories: { include: { category: true } },
      },
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
