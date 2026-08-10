import slugify from 'slugify';
import xss from 'xss';

export type LocalizedString = { en: string; ru: string };

const xssOptions = {
  whiteList: {
    a: ['href', 'title', 'target', 'rel'],
    p: [],
    br: [],
    strong: [],
    em: [],
    ul: [],
    ol: [],
    li: [],
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    blockquote: [],
    code: [],
    pre: [],
    img: ['src', 'alt', 'title', 'width', 'height'],
    span: ['class'],
    div: ['class'],
  },
  stripIgnoreTag: true,
};

export function sanitizeHtml(html: string): string {
  return xss(html, xssOptions);
}

export function sanitizeLocalizedHtml(value: LocalizedString): LocalizedString {
  return {
    en: sanitizeHtml(value.en || ''),
    ru: sanitizeHtml(value.ru || ''),
  };
}

export function makeSlug(text: string): string {
  return slugify(text, { lower: true, strict: true, trim: true }) || 'article';
}

export function localizedSlugs(title: LocalizedString): LocalizedString {
  return {
    en: makeSlug(title.en),
    ru: makeSlug(title.ru),
  };
}

export function pickLocale<T extends Record<string, unknown>>(
  value: unknown,
  locale: string
): string {
  if (!value || typeof value !== 'object') return '';
  const obj = value as Record<string, string>;
  return obj[locale] || obj.en || obj.ru || Object.values(obj)[0] || '';
}

export function getClientIp(req: { ip?: string; headers: Record<string, unknown> }): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || '0.0.0.0';
}
