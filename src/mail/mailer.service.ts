import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import type { EmailJobPayload } from './mail.constants';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly resend: Resend | null;
  private readonly from: string;
  private readonly siteName: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY', '');
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from = this.config.get<string>('EMAIL_FROM', 'Horizon Notes <onboarding@resend.dev>');
    this.siteName = 'Horizon Notes';

    if (!this.resend) {
      this.logger.warn(
        'RESEND_API_KEY is empty — emails will be logged to the console (dev fallback).'
      );
    }
  }

  async send(payload: EmailJobPayload): Promise<void> {
    const { subject, html, text } = this.buildContent(payload);

    if (!this.resend) {
      this.logger.log(
        `[dev-mail] to=${payload.to} subject=${subject}\n${text}\n---\n${html}`
      );
      return;
    }

    const result = await this.resend.emails.send({
      from: this.from,
      to: payload.to,
      subject,
      html,
      text,
    });

    if (result.error) {
      throw new Error(result.error.message || 'Resend send failed');
    }

    this.logger.log(`Email sent via Resend: ${payload.type} → ${payload.to}`);
  }

  private buildContent(payload: EmailJobPayload): {
    subject: string;
    html: string;
    text: string;
  } {
    const ru = payload.locale === 'ru';
    const site = payload.siteName || this.siteName;

    if (payload.type === 'confirm') {
      const subject = ru
        ? `Подтвердите подписку на ${site}`
        : `Confirm your subscription to ${site}`;
      const lead = ru
        ? 'Спасибо за интерес к нашей рассылке. Нажмите кнопку ниже, чтобы подтвердить подписку.'
        : 'Thanks for your interest. Click the button below to confirm your subscription.';
      const cta = ru ? 'Подтвердить подписку' : 'Confirm subscription';
      return {
        subject,
        text: `${lead}\n\n${payload.confirmUrl}`,
        html: this.layout(site, lead, cta, payload.confirmUrl || '#'),
      };
    }

    if (payload.type === 'welcome') {
      const subject = ru ? `Вы подписаны на ${site}` : `You are subscribed to ${site}`;
      const lead = ru
        ? 'Подписка подтверждена. Мы будем присылать новые материалы на этот адрес.'
        : 'Your subscription is confirmed. We will send new stories to this address.';
      const cta = ru ? 'Отписаться' : 'Unsubscribe';
      return {
        subject,
        text: `${lead}\n\nUnsubscribe: ${payload.unsubscribeUrl}`,
        html: this.layout(site, lead, cta, payload.unsubscribeUrl || '#', true),
      };
    }

    const subject = ru ? `Вы отписались от ${site}` : `You unsubscribed from ${site}`;
    const lead = ru
      ? 'Вы больше не будете получать письма с этой рассылки. Вы всегда можете подписаться снова на сайте.'
      : 'You will no longer receive emails from this list. You can subscribe again anytime on the site.';
    return {
      subject,
      text: lead,
      html: this.layout(site, lead),
    };
  }

  private layout(
    site: string,
    lead: string,
    cta?: string,
    href?: string,
    mutedCta = false
  ): string {
    const button =
      cta && href
        ? `<p style="margin:24px 0">
            <a href="${href}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:${mutedCta ? '#6b7280' : '#2f5d50'};color:#fff;text-decoration:none;font-weight:600">${cta}</a>
          </p>`
        : '';

    return `<!doctype html>
<html>
  <body style="font-family:Georgia,serif;background:#f6f3ee;padding:24px;color:#1c1917">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e7e0d6;border-radius:16px;padding:28px">
      <h1 style="margin:0 0 12px;font-size:22px">${site}</h1>
      <p style="line-height:1.55;margin:0">${lead}</p>
      ${button}
      <p style="margin:28px 0 0;font-size:12px;color:#78716c">If the button does not work, copy this link:<br/>${href || ''}</p>
    </div>
  </body>
</html>`;
  }
}
