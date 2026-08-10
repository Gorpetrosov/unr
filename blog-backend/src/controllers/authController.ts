import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as authService from '../services/authService';
import { asyncHandler } from '../middleware/errorHandler';

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await authService.login(req.body.email, req.body.password);
  res.json(result);
});

export const refresh = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await authService.refresh(req.body.refreshToken);
  res.json(result);
});

export const me = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return next();
  res.json({ user: req.user });
});
