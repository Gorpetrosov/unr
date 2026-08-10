import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as bannerService from '../services/bannerService';
import { asyncHandler } from '../middleware/errorHandler';

export const listPublic = asyncHandler(async (req: AuthRequest, res: Response) => {
  const position = typeof req.query.position === 'string' ? req.query.position : undefined;
  const banners = await bannerService.getActiveBanners(position);
  res.json({ banners });
});

export const click = asyncHandler(async (req: AuthRequest, res: Response) => {
  const banner = await bannerService.trackBannerClick(req.params.id);
  res.json({ banner });
});

export const listAdmin = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const banners = await bannerService.listBanners();
  res.json({ banners });
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const banner = await bannerService.createBanner(req.body);
  res.status(201).json({ banner });
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const banner = await bannerService.updateBanner(req.params.id, req.body);
  res.json({ banner });
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await bannerService.deleteBanner(req.params.id);
  res.json(result);
});
