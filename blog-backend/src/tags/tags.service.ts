import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppError } from '../common/app-error';
import {
  LocalizedString,
  localizedSlugs,
  uniqueLocalizedSlugs,
} from '../common/helpers';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async listTags() {
    return this.prisma.tag.findMany({ orderBy: { id: 'asc' } });
  }

  private async ensureUniqueSlugs(slugs: LocalizedString, excludeId?: string) {
    return uniqueLocalizedSlugs(slugs, async (locale, candidate) => {
      const existing = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM tags
        WHERE slug->>${locale} = ${candidate}
          ${excludeId ? Prisma.sql`AND id <> ${excludeId}` : Prisma.empty}
        LIMIT 1
      `;
      return existing.length > 0;
    });
  }

  async createTag(name: LocalizedString) {
    const slug = await this.ensureUniqueSlugs(localizedSlugs(name));
    return this.prisma.tag.create({ data: { name, slug } });
  }

  async updateTag(id: string, name: LocalizedString) {
    const existing = await this.prisma.tag.findUnique({ where: { id } });
    if (!existing) throw new AppError('Tag not found', 404);
    const slug = await this.ensureUniqueSlugs(localizedSlugs(name), id);
    return this.prisma.tag.update({ where: { id }, data: { name, slug } });
  }

  async deleteTag(id: string) {
    const existing = await this.prisma.tag.findUnique({ where: { id } });
    if (!existing) throw new AppError('Tag not found', 404);
    await this.prisma.tag.delete({ where: { id } });
    return { deleted: true };
  }
}
