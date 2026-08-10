import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  AuthPayload,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../middleware/auth';
import { env } from '../config/env';

function parseExpiryToDate(expiresIn: string): Date {
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  if (!match) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return new Date(Date.now() + value * multipliers[unit]);
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError('Invalid email or password', 401);
  }

  const payload: AuthPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: hashToken(refreshToken),
      expiresAt: parseExpiryToDate(env.JWT_REFRESH_EXPIRES_IN),
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}

export async function refresh(refreshToken: string) {
  let payload: AuthPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token: hashToken(refreshToken) },
  });

  if (!stored || stored.expiresAt < new Date() || stored.userId !== payload.userId) {
    throw new AppError('Refresh token revoked or expired', 401);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw new AppError('User not found', 401);
  }

  const newPayload: AuthPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const accessToken = signAccessToken(newPayload);
  const newRefreshToken = signRefreshToken(newPayload);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: hashToken(newRefreshToken),
      expiresAt: parseExpiryToDate(env.JWT_REFRESH_EXPIRES_IN),
    },
  });

  return { accessToken, refreshToken: newRefreshToken };
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
