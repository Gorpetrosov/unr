import { Injectable } from '@nestjs/common';
import { AppError } from '../common/app-error';
import { LocalizedString } from '../common/helpers';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories() {
    return this.prisma.category.findMany({ orderBy: { id: 'asc' } });
  }

  async createCategory(name: LocalizedString) {
    return this.prisma.category.create({ data: { name } });
  }

  async updateCategory(id: string, name: LocalizedString) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new AppError('Category not found', 404);
    return this.prisma.category.update({ where: { id }, data: { name } });
  }

  async deleteCategory(id: string) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new AppError('Category not found', 404);
    await this.prisma.category.delete({ where: { id } });
    return { deleted: true };
  }
}
