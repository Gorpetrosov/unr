import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { AppError } from '../common/app-error';
import { AuthPayload } from '../common/current-user.decorator';
import { LocalizedString, uniqueSlug } from '../common/helpers';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  private parseExpiryToDate(expiresIn: string): Date {
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

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private signAccessToken(payload: AuthPayload): string {
    return jwt.sign(payload, this.config.getOrThrow<string>('JWT_SECRET'), {
      expiresIn: this.config.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN'),
    } as jwt.SignOptions);
  }

  private signRefreshToken(payload: AuthPayload): string {
    return jwt.sign(payload, this.config.getOrThrow<string>('JWT_REFRESH_SECRET'), {
      expiresIn: this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
    } as jwt.SignOptions);
  }

  private verifyRefreshToken(token: string): AuthPayload {
    return jwt.verify(
      token,
      this.config.getOrThrow<string>('JWT_REFRESH_SECRET')
    ) as AuthPayload;
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
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

    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.signRefreshToken(payload);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: this.hashToken(refreshToken),
        expiresAt: this.parseExpiryToDate(
          this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN')
        ),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: this.toAdminUser(user),
    };
  }

  private toAdminUser(user: {
    id: string;
    email: string;
    role: AuthPayload['role'];
    displayName: string;
    slug: string;
    bio: unknown;
    avatarUrl: string | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      slug: user.slug,
      bio: (user.bio as LocalizedString | null) ?? null,
      avatarUrl: user.avatarUrl,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);
    return { user: this.toAdminUser(user) };
  }

  async updateProfile(
    userId: string,
    input: { displayName?: string; bio?: LocalizedString | null; avatarUrl?: string | null }
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    let slug = user.slug;
    if (input.displayName && input.displayName !== user.displayName) {
      slug = await uniqueSlug(input.displayName, async (candidate) => {
        const existing = await this.prisma.user.findFirst({
          where: { slug: candidate, NOT: { id: userId } },
          select: { id: true },
        });
        return Boolean(existing);
      });
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: input.displayName ?? user.displayName,
        slug,
        bio: input.bio === undefined ? undefined : input.bio === null ? Prisma.JsonNull : input.bio,
        avatarUrl: input.avatarUrl === undefined ? undefined : input.avatarUrl,
      },
    });

    return { user: this.toAdminUser(updated) };
  }

  async refresh(refreshToken: string) {
    let payload: AuthPayload;
    try {
      payload = this.verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: this.hashToken(refreshToken) },
    });

    if (!stored || stored.expiresAt < new Date() || stored.userId !== payload.userId) {
      throw new AppError('Refresh token revoked or expired', 401);
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      throw new AppError('User not found', 401);
    }

    const newPayload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    const accessToken = this.signAccessToken(newPayload);
    const newRefreshToken = this.signRefreshToken(newPayload);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: this.hashToken(newRefreshToken),
        expiresAt: this.parseExpiryToDate(
          this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN')
        ),
      },
    });

    return { accessToken, refreshToken: newRefreshToken };
  }
}
