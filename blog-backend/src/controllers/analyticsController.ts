import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as analyticsService from '../services/analyticsService';
import { asyncHandler } from '../middleware/errorHandler';
import { getClientIp } from '../utils/helpers';

export const trackView = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await analyticsService.trackView({
    articleId: req.body.articleId,
    url: req.body.url,
    ipAddress: getClientIp(req),
    userAgent: req.get('user-agent') || undefined,
    referrer: req.get('referer') || undefined,
  });
  res.json(result);
});

export const trackShare = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await analyticsService.trackShare({
    articleId: req.body.articleId,
    platform: req.body.platform,
    ipAddress: getClientIp(req),
    userAgent: req.get('user-agent') || undefined,
    referrer: req.get('referer') || undefined,
  });
  res.json(result);
});

export const stats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const data = await analyticsService.getDashboardStats();
  res.json(data);
});

export const views = asyncHandler(async (req: AuthRequest, res: Response) => {
  const days = Number(req.query.days) || 30;
  const data = await analyticsService.getViewsOverTime(days);
  res.json({ items: data });
});

export const shares = asyncHandler(async (req: AuthRequest, res: Response) => {
  const days = Number(req.query.days) || 30;
  const data = await analyticsService.getSharesByPlatform(days);
  res.json({ items: data });
});
