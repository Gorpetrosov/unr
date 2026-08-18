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
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories() {
    return this.prisma.category.findMany({ orderBy: { id: 'asc' } });
  }

  private async ensureUniqueSlugs(slugs: LocalizedString, excludeId?: string) {
    return uniqueLocalizedSlugs(slugs, async (locale, candidate) => {
      const existing = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM categories
        WHERE slug->>${locale} = ${candidate}
          ${excludeId ? Prisma.sql`AND id <> ${excludeId}` : Prisma.empty}
        LIMIT 1
      `;
      return existing.length > 0;
    });
  }

  async createCategory(name: LocalizedString) {
    const slug = await this.ensureUniqueSlugs(localizedSlugs(name));
    return this.prisma.category.create({ data: { name, slug } });
  }

  async updateCategory(id: string, name: LocalizedString) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new AppError('Category not found', 404);
    const slug = await this.ensureUniqueSlugs(localizedSlugs(name), id);
    return this.prisma.category.update({ where: { id }, data: { name, slug } });
  }

  async deleteCategory(id: string) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new AppError('Category not found', 404);
    await this.prisma.category.delete({ where: { id } });
    return { deleted: true };
  }
}
