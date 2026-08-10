import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as categoryService from '../services/categoryService';
import { asyncHandler } from '../middleware/errorHandler';

export const list = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const categories = await categoryService.listCategories();
  res.json({ categories });
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const category = await categoryService.createCategory(req.body.name);
  res.status(201).json({ category });
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const category = await categoryService.updateCategory(req.params.id, req.body.name);
  res.json({ category });
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await categoryService.deleteCategory(req.params.id);
  res.json(result);
});
