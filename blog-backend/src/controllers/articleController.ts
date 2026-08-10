import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as articleService from '../services/articleService';
import { asyncHandler } from '../middleware/errorHandler';

export const listPublic = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, category } = req.query as unknown as {
    page: number;
    limit: number;
    category?: string;
  };
  const result = await articleService.listPublishedArticles({ page, limit, category });
  res.json(result);
});

export const getBySlug = asyncHandler(async (req: AuthRequest, res: Response) => {
  const article = await articleService.getArticleBySlug(req.params.slug);
  res.json({ article });
});

export const search = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { q, page, limit } = req.query as unknown as {
    q: string;
    page: number;
    limit: number;
  };
  const result = await articleService.searchArticles({ q, page, limit });
  res.json(result);
});

export const listAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const result = await articleService.listAdminArticles({ page, limit, status });
  res.json(result);
});

export const getAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const article = await articleService.getAdminArticle(req.params.id);
  res.json({ article });
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const article = await articleService.createArticle(req.user!.userId, req.body);
  res.status(201).json({ article });
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const article = await articleService.updateArticle(req.params.id, req.body);
  res.json({ article });
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const hard = req.query.hard === 'true';
  const result = await articleService.deleteArticle(req.params.id, hard);
  res.json(result);
});
