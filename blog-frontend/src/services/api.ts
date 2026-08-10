const API_BASE = import.meta.env.VITE_API_URL || '';

export type Localized = { en: string; ru: string };

export type Article = {
  id: string;
  title: Localized;
  slug: Localized;
  content?: Localized;
  excerpt?: Localized | null;
  featuredImage?: string | null;
  status?: string;
  views: number;
  shares: number;
  publishedAt?: string | null;
  categories?: Array<{ category: { id: string; name: Localized } }>;
  author?: { id: string; email: string };
};

export type Banner = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: string;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export function listArticles(page = 1, limit = 9) {
  return request<{
    items: Article[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>(`/api/articles?page=${page}&limit=${limit}`);
}

export function getArticle(slug: string) {
  return request<{ article: Article }>(`/api/articles/${encodeURIComponent(slug)}`);
}

export function searchArticles(q: string, page = 1) {
  return request<{
    items: Article[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>(`/api/articles/search?q=${encodeURIComponent(q)}&page=${page}`);
}

export function getBanners(position: string) {
  return request<{ banners: Banner[] }>(`/api/banners?position=${position}`);
}

export function trackBannerClick(id: string) {
  return request(`/api/banners/${id}/click`, { method: 'POST' });
}

export function trackView(articleId: string, url: string) {
  return request('/api/analytics/view', {
    method: 'POST',
    body: JSON.stringify({ articleId, url }),
  });
}

export function trackShare(articleId: string, platform: string) {
  return request('/api/analytics/share', {
    method: 'POST',
    body: JSON.stringify({ articleId, platform }),
  });
}
