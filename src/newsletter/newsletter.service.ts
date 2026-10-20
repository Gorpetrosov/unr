import { randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, SubscriberStatus } from '@prisma/client';
import { AppError } from '../common/app-error';
import { MailQueueService } from '../mail/mail-queue.service';
import { PrismaService } from '../prisma/prisma.service';

function newToken(): string {
  return randomBytes(32).toString('hex');
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

@Injectable()
export class NewsletterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailQueue: MailQueueService,
    private readonly config: ConfigService
  ) {}

  private siteUrl() {
    return this.config.get<string>('PUBLIC_SITE_URL', 'http://localhost:5173').replace(/\/$/, '');
  }

  private apiUrl() {
    return this.config.get<string>('PUBLIC_API_URL', 'http://localhost:4000').replace(/\/$/, '');
  }

  private confirmLink(token: string) {
    return `${this.apiUrl()}/api/newsletter/confirm?token=${encodeURIComponent(token)}`;
  }

  private unsubscribeLink(token: string) {
    return `${this.siteUrl()}/unsubscribe?token=${encodeURIComponent(token)}`;
  }

  async subscribe(emailRaw: string, locale = 'en') {
    const email = normalizeEmail(emailRaw);
    const safeLocale = locale === 'ru' ? 'ru' : 'en';

    const existing = await this.prisma.subscriber.findUnique({ where: { email } });

    if (existing?.status === SubscriberStatus.active) {
      return {
        status: 'already_subscribed' as const,
        message: 'This email is already subscribed.',
      };
    }

    const confirmToken = newToken();
    const unsubscribeToken = existing?.unsubscribeToken || newToken();

    const subscriber = await this.prisma.subscriber.upsert({
      where: { email },
      create: {
        email,
        locale: safeLocale,
        status: SubscriberStatus.pending,
        confirmToken,
        unsubscribeToken,
      },
      update: {
        locale: safeLocale,
        status: SubscriberStatus.pending,
        confirmToken,
        unsubscribedAt: null,
        confirmedAt: null,
      },
    });

    await this.mailQueue.enqueue({
      type: 'confirm',
      to: subscriber.email,
      locale: subscriber.locale,
      confirmUrl: this.confirmLink(subscriber.confirmToken),
      unsubscribeUrl: this.unsubscribeLink(subscriber.unsubscribeToken),
    });

    return {
      status: 'pending_confirmation' as const,
      message: 'Check your inbox to confirm the subscription.',
    };
  }

  async confirm(token: string) {
    const subscriber = await this.prisma.subscriber.findUnique({
      where: { confirmToken: token },
    });

    if (!subscriber) {
      throw new AppError('Invalid or expired confirmation link', 404);
    }

    if (subscriber.status === SubscriberStatus.active) {
      return {
        status: 'already_subscribed' as const,
        redirectUrl: `${this.siteUrl()}/subscribe/confirmed`,
      };
    }

    const updated = await this.prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        status: SubscriberStatus.active,
        confirmedAt: new Date(),
        unsubscribedAt: null,
        confirmToken: newToken(),
      },
    });

    await this.mailQueue.enqueue({
      type: 'welcome',
      to: updated.email,
      locale: updated.locale,
      unsubscribeUrl: this.unsubscribeLink(updated.unsubscribeToken),
    });

    return {
      status: 'confirmed' as const,
      redirectUrl: `${this.siteUrl()}/subscribe/confirmed`,
    };
  }

  async unsubscribeByToken(token: string) {
    const subscriber = await this.prisma.subscriber.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!subscriber) {
      throw new AppError('Invalid unsubscribe link', 404);
    }

    if (subscriber.status === SubscriberStatus.unsubscribed) {
      return {
        status: 'already_unsubscribed' as const,
        emailHint: this.maskEmail(subscriber.email),
      };
    }

    const updated = await this.prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        status: SubscriberStatus.unsubscribed,
        unsubscribedAt: new Date(),
        confirmToken: newToken(),
      },
    });

    await this.mailQueue.enqueue({
      type: 'unsubscribed',
      to: updated.email,
      locale: updated.locale,
    });

    return {
      status: 'unsubscribed' as const,
      emailHint: this.maskEmail(updated.email),
    };
  }

  async unsubscribeByEmail(emailRaw: string) {
    const email = normalizeEmail(emailRaw);
    const subscriber = await this.prisma.subscriber.findUnique({ where: { email } });

    // Always return a generic success to avoid email enumeration.
    if (!subscriber || subscriber.status === SubscriberStatus.unsubscribed) {
      return {
        status: 'ok' as const,
        message: 'If that email was subscribed, it has been unsubscribed.',
      };
    }

    await this.prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        status: SubscriberStatus.unsubscribed,
        unsubscribedAt: new Date(),
        confirmToken: newToken(),
      },
    });

    await this.mailQueue.enqueue({
      type: 'unsubscribed',
      to: subscriber.email,
      locale: subscriber.locale,
    });

    return {
      status: 'ok' as const,
      message: 'If that email was subscribed, it has been unsubscribed.',
    };
  }

  async listSubscribers(opts: { page: number; limit: number; status?: string }) {
    const where: Prisma.SubscriberWhereInput = {
      ...(opts.status ? { status: opts.status as SubscriberStatus } : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.subscriber.count({ where }),
      this.prisma.subscriber.findMany({
        where,
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          status: true,
          locale: true,
          confirmedAt: true,
          unsubscribedAt: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page: opts.page,
        limit: opts.limit,
        total,
        pages: Math.ceil(total / opts.limit) || 0,
      },
    };
  }

  private maskEmail(email: string) {
    const [user, domain] = email.split('@');
    if (!user || !domain) return '***';
    const visible = user.slice(0, 2);
    return `${visible}${'*'.repeat(Math.max(user.length - 2, 1))}@${domain}`;
  }
}
