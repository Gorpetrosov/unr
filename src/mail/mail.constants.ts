export const EMAIL_QUEUE = 'email';

export type EmailJobName = 'confirm' | 'welcome' | 'unsubscribed';

export type EmailJobPayload = {
  type: EmailJobName;
  to: string;
  locale?: string;
  confirmUrl?: string;
  unsubscribeUrl?: string;
  siteName?: string;
};
