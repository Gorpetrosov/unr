import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { LocalizedString } from '../utils/helpers';

export async function listCategories() {
  return prisma.category.findMany({ orderBy: { id: 'asc' } });
}

export async function createCategory(name: LocalizedString) {
  return prisma.category.create({ data: { name } });
}

export async function updateCategory(id: string, name: LocalizedString) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new AppError('Category not found', 404);
  return prisma.category.update({ where: { id }, data: { name } });
}

export async function deleteCategory(id: string) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new AppError('Category not found', 404);
  await prisma.category.delete({ where: { id } });
  return { deleted: true };
}
