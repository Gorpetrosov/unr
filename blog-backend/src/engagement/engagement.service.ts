import { Injectable } from '@nestjs/common';
import { AppError } from '../common/app-error';
import { sanitizePlainText } from '../common/helpers';
import { PrismaService } from '../prisma/prisma.service';

const REACTION_TYPES = ['like', 'love', 'insightful'] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

@Injectable()
export class EngagementService {
  constructor(private readonly prisma: PrismaService) {}

  async listComments(articleId: string) {
    return this.prisma.comment.findMany({
      where: { articleId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      take: 100,
      select: {
        id: true,
        authorName: true,
        body: true,
        createdAt: true,
      },
    });
  }

  async addComment(articleId: string, input: { authorName: string; body: string }) {
    const article = await this.prisma.article.findFirst({
      where: { id: articleId, deletedAt: null },
      select: { id: true },
    });
    if (!article) throw new AppError('Article not found', 404);

    return this.prisma.comment.create({
      data: {
        articleId,
        authorName: sanitizePlainText(input.authorName).slice(0, 80),
        body: sanitizePlainText(input.body).slice(0, 2000),
      },
      select: {
        id: true,
        authorName: true,
        body: true,
        createdAt: true,
      },
    });
  }

  async reactionSummary(articleId: string, visitorId?: string) {
    const grouped = await this.prisma.reaction.groupBy({
      by: ['type'],
      where: { articleId },
      _count: { _all: true },
    });

    const counts: Record<ReactionType, number> = {
      like: 0,
      love: 0,
      insightful: 0,
    };
    for (const row of grouped) {
      if (row.type in counts) {
        counts[row.type as ReactionType] = row._count._all;
      }
    }

    let mine: ReactionType[] = [];
    if (visitorId) {
      const mineRows = await this.prisma.reaction.findMany({
        where: { articleId, visitorId },
        select: { type: true },
      });
      mine = mineRows
        .map((r) => r.type)
        .filter((t): t is ReactionType => REACTION_TYPES.includes(t as ReactionType));
    }

    return { counts, mine };
  }

  async toggleReaction(articleId: string, type: ReactionType, visitorId: string) {
    const article = await this.prisma.article.findFirst({
      where: { id: articleId, deletedAt: null },
      select: { id: true },
    });
    if (!article) throw new AppError('Article not found', 404);

    const existing = await this.prisma.reaction.findUnique({
      where: {
        articleId_visitorId_type: { articleId, visitorId, type },
      },
    });

    if (existing) {
      await this.prisma.reaction.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.reaction.create({
        data: { articleId, type, visitorId },
      });
    }

    return this.reactionSummary(articleId, visitorId);
  }
}
