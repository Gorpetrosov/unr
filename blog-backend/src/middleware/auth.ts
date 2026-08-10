import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env';
import { AppError } from './errorHandler';

export interface AuthPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export function signAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AuthPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthPayload;
}

export function verifyRefreshToken(token: string): AuthPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthPayload;
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }

  try {
    const token = header.slice(7);
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}

export function requireAdmin(req: AuthRequest, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }
  if (req.user.role !== Role.admin && req.user.role !== Role.editor) {
    return next(new AppError('Insufficient permissions', 403));
  }
  next();
}

export function requireAdminOnly(req: AuthRequest, _res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== Role.admin) {
    return next(new AppError('Admin role required', 403));
  }
  next();
}
