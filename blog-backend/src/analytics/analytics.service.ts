import { Injectable } from '@nestjs/common';
import { AppError } from '../common/app-error';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async trackView(opts: {
    articleId: string;
    ipAddress: string;
    userAgent?: string;
    referrer?: string;
    url?: string;
  }) {
    const article = await this.prisma.article.findFirst({
      where: { id: opts.articleId, deletedAt: null, status: 'published' },
    });
    if (!article) throw new AppError('Article not found', 404);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await this.prisma.analytics.findFirst({
      where: {
        articleId: opts.articleId,
        eventType: 'view',
        ipAddress: opts.ipAddress,
        createdAt: { gte: since },
      },
    });

    if (existing) {
      return { tracked: false, reason: 'duplicate_within_24h' };
    }

    await this.prisma.$transaction([
      this.prisma.analytics.create({
        data: {
          articleId: opts.articleId,
          eventType: 'view',
          ipAddress: opts.ipAddress,
          userAgent: opts.userAgent,
          referrer: opts.referrer,
          url: opts.url,
        },
      }),
      this.prisma.article.update({
        where: { id: opts.articleId },
        data: { views: { increment: 1 } },
      }),
    ]);

    return { tracked: true };
  }

  async trackShare(opts: {
    articleId: string;
    platform: string;
    ipAddress: string;
    userAgent?: string;
    referrer?: string;
  }) {
    const article = await this.prisma.article.findFirst({
      where: { id: opts.articleId, deletedAt: null },
    });
    if (!article) throw new AppError('Article not found', 404);

    await this.prisma.$transaction([
      this.prisma.analytics.create({
        data: {
          articleId: opts.articleId,
          eventType: 'share',
          platform: opts.platform,
          ipAddress: opts.ipAddress,
          userAgent: opts.userAgent,
          referrer: opts.referrer,
        },
      }),
      this.prisma.article.update({
        where: { id: opts.articleId },
        data: { shares: { increment: 1 } },
      }),
    ]);

    return { tracked: true };
  }

  async getDashboardStats() {
    const [totalViews, totalShares, totalArticles, publishedArticles, totalBanners, topArticles] =
      await Promise.all([
        this.prisma.analytics.count({ where: { eventType: 'view' } }),
        this.prisma.analytics.count({ where: { eventType: 'share' } }),
        this.prisma.article.count({ where: { deletedAt: null } }),
        this.prisma.article.count({ where: { deletedAt: null, status: 'published' } }),
        this.prisma.banner.count({ where: { isActive: true } }),
        this.prisma.article.findMany({
          where: { deletedAt: null, status: 'published' },
          orderBy: { views: 'desc' },
          take: 10,
          select: {
            id: true,
            title: true,
            slug: true,
            views: true,
            shares: true,
            publishedAt: true,
          },
        }),
      ]);

    return {
      totalViews,
      totalShares,
      totalArticles,
      publishedArticles,
      activeBanners: totalBanners,
      topArticles,
    };
  }

  async getViewsOverTime(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await this.prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
      SELECT date_trunc('day', created_at) AS day, COUNT(*)::bigint AS count
      FROM analytics
      WHERE event_type = 'view' AND created_at >= ${since}
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    return rows.map((r) => ({
      date: r.day,
      views: Number(r.count),
    }));
  }

  async getSharesByPlatform(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await this.prisma.$queryRaw<Array<{ platform: string | null; count: bigint }>>`
      SELECT platform, COUNT(*)::bigint AS count
      FROM analytics
      WHERE event_type = 'share' AND created_at >= ${since}
      GROUP BY platform
      ORDER BY count DESC
    `;

    return rows.map((r) => ({
      platform: r.platform || 'unknown',
      shares: Number(r.count),
    }));
  }
}
