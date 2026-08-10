import { BannerPosition, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

type BannerInput = {
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: 'sidebar' | 'header' | 'in_article';
  isActive?: boolean;
};

export async function getActiveBanners(position?: string) {
  const where: Prisma.BannerWhereInput = {
    isActive: true,
    ...(position ? { position: position as BannerPosition } : {}),
  };

  const banners = await prisma.banner.findMany({ where });

  if (banners.length === 0) return [];

  // Random selection among active banners for the position
  if (position && banners.length > 1) {
    const picked = banners[Math.floor(Math.random() * banners.length)];
    await prisma.banner.update({
      where: { id: picked.id },
      data: { impressions: { increment: 1 } },
    });
    return [{ ...picked, impressions: picked.impressions + 1 }];
  }

  await prisma.banner.updateMany({
    where: { id: { in: banners.map((b) => b.id) } },
    data: { impressions: { increment: 1 } },
  });

  return banners.map((b) => ({ ...b, impressions: b.impressions + 1 }));
}

export async function trackBannerClick(id: string) {
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) throw new AppError('Banner not found', 404);

  return prisma.banner.update({
    where: { id },
    data: { clicks: { increment: 1 } },
  });
}

export async function listBanners() {
  return prisma.banner.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function createBanner(input: BannerInput) {
  return prisma.banner.create({
    data: {
      title: input.title,
      imageUrl: input.imageUrl,
      linkUrl: input.linkUrl,
      position: input.position,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateBanner(id: string, input: Partial<BannerInput>) {
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) throw new AppError('Banner not found', 404);

  return prisma.banner.update({
    where: { id },
    data: input,
  });
}

export async function deleteBanner(id: string) {
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) throw new AppError('Banner not found', 404);
  await prisma.banner.delete({ where: { id } });
  return { deleted: true };
}
