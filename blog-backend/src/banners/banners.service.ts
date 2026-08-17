import { Injectable } from '@nestjs/common';
import { BannerPosition, Prisma } from '@prisma/client';
import { AppError } from '../common/app-error';
import { PrismaService } from '../prisma/prisma.service';

type BannerInput = {
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: 'sidebar' | 'header' | 'in_article';
  isActive?: boolean;
};

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveBanners(position?: string) {
    const where: Prisma.BannerWhereInput = {
      isActive: true,
      ...(position ? { position: position as BannerPosition } : {}),
    };

    const banners = await this.prisma.banner.findMany({ where });

    if (banners.length === 0) return [];

    if (position && banners.length > 1) {
      const picked = banners[Math.floor(Math.random() * banners.length)];
      await this.prisma.banner.update({
        where: { id: picked.id },
        data: { impressions: { increment: 1 } },
      });
      return [{ ...picked, impressions: picked.impressions + 1 }];
    }

    await this.prisma.banner.updateMany({
      where: { id: { in: banners.map((b) => b.id) } },
      data: { impressions: { increment: 1 } },
    });

    return banners.map((b) => ({ ...b, impressions: b.impressions + 1 }));
  }

  async trackBannerClick(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new AppError('Banner not found', 404);

    return this.prisma.banner.update({
      where: { id },
      data: { clicks: { increment: 1 } },
    });
  }

  async listBanners() {
    return this.prisma.banner.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createBanner(input: BannerInput) {
    return this.prisma.banner.create({
      data: {
        title: input.title,
        imageUrl: input.imageUrl,
        linkUrl: input.linkUrl,
        position: input.position,
        isActive: input.isActive ?? true,
      },
    });
  }

  async updateBanner(id: string, input: Partial<BannerInput>) {
    const existing = await this.prisma.banner.findUnique({ where: { id } });
    if (!existing) throw new AppError('Banner not found', 404);

    return this.prisma.banner.update({
      where: { id },
      data: input,
    });
  }

  async deleteBanner(id: string) {
    const existing = await this.prisma.banner.findUnique({ where: { id } });
    if (!existing) throw new AppError('Banner not found', 404);
    await this.prisma.banner.delete({ where: { id } });
    return { deleted: true };
  }
}
