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

export function sanitizePlainText(text: string): string {
  return xss(text, { whiteList: {}, stripIgnoreTag: true }).replace(/\s+/g, ' ').trim();
}

export const publicAuthorSelect = {
  id: true,
  displayName: true,
  slug: true,
  bio: true,
  avatarUrl: true,
} as const;

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

export async function uniqueLocalizedSlugs(
  slugs: LocalizedString,
  exists: (locale: 'en' | 'ru', candidate: string) => Promise<boolean>
): Promise<LocalizedString> {
  const result = { ...slugs };

  for (const locale of ['en', 'ru'] as const) {
    let candidate = result[locale] || 'item';
    let suffix = 2;
    const base = candidate;

    while (await exists(locale, candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }

    result[locale] = candidate;
  }

  return result;
}

export async function uniqueSlug(
  base: string,
  exists: (candidate: string) => Promise<boolean>
): Promise<string> {
  let candidate = makeSlug(base) || 'author';
  const root = candidate;
  let suffix = 2;
  while (await exists(candidate)) {
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export function getClientIp(req: {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
}): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(',')[0].trim();
  }
  return req.ip || '0.0.0.0';
}
