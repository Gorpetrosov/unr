import type { Localized } from '@/services/api';
import type { AppLocale } from '@/i18n';

export function tLocal(value: Localized | null | undefined, locale: AppLocale): string {
  if (!value) return '';
  return value[locale] || value.en || value.ru || '';
}

export function siteName() {
  return import.meta.env.VITE_SITE_NAME || 'Horizon Notes';
}

export function siteUrl() {
  return (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');
}

export function setSeo(opts: {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  locale?: string;
}) {
  const fullTitle = opts.title.includes(siteName()) ? opts.title : `${opts.title} · ${siteName()}`;
  document.title = fullTitle;

  const desc = opts.description || '';
  const url = opts.url || window.location.href;
  const image = opts.image || `${siteUrl()}/og-default.svg`;
  const locale = opts.locale === 'ru' ? 'ru_RU' : 'en_US';

  upsertMeta('name', 'description', desc);
  upsertMeta('property', 'og:title', fullTitle);
  upsertMeta('property', 'og:description', desc);
  upsertMeta('property', 'og:type', 'article');
  upsertMeta('property', 'og:url', url);
  upsertMeta('property', 'og:image', image);
  upsertMeta('property', 'og:locale', locale);
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', fullTitle);
  upsertMeta('name', 'twitter:description', desc);
  upsertMeta('name', 'twitter:image', image);

  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = url;
}

export function setJsonLd(data: Record<string, unknown> | null) {
  let el = document.querySelector('script[data-seo="jsonld"]') as HTMLScriptElement | null;
  if (!data) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.dataset.seo = 'jsonld';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

export function shareUrl(
  platform: string,
  opts: { url: string; title: string }
): string | 'copy' {
  const u = encodeURIComponent(opts.url);
  const t = encodeURIComponent(opts.title);
  switch (platform) {
    case 'twitter':
      return `https://twitter.com/intent/tweet?url=${u}&text=${t}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case 'telegram':
      return `https://t.me/share/url?url=${u}&text=${t}`;
    case 'whatsapp':
      return `https://wa.me/?text=${t}%20${u}`;
    case 'copy':
      return 'copy';
    default:
      return opts.url;
  }
}
