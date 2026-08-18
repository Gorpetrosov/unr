const API_BASE = import.meta.env.VITE_API_URL || '';

export type Localized = { en: string; ru: string };

export type Author = {
  id: string;
  displayName: string;
  slug: string;
  bio?: Localized | null;
  avatarUrl?: string | null;
};

export type Taxonomy = {
  id: string;
  name: Localized;
  slug: Localized;
};

export type Article = {
  id: string;
  title: Localized;
  slug: Localized;
  content?: Localized;
  excerpt?: Localized | null;
  featuredImage?: string | null;
  featured?: boolean;
  status?: string;
  views: number;
  shares: number;
  publishedAt?: string | null;
  categories?: Array<{ categoryId: string; category: Taxonomy }>;
  tags?: Array<{ tagId: string; tag: Taxonomy }>;
  author?: Author;
};

export type Comment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type Reactions = {
  counts: { like: number; love: number; insightful: number };
  mine: Array<'like' | 'love' | 'insightful'>;
};

export type Banner = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: string;
};

export type Pagination = { page: number; limit: number; total: number; pages: number };

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

function qs(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

export function listArticles(
  page = 1,
  limit = 9,
  filters?: { category?: string; tag?: string; featured?: boolean; ids?: string[] }
) {
  return request<{ items: Article[]; pagination: Pagination }>(
    `/api/articles${qs({
      page,
      limit,
      category: filters?.category,
      tag: filters?.tag,
      featured: filters?.featured ? 'true' : undefined,
      ids: filters?.ids?.length ? filters.ids.join(',') : undefined,
    })}`
  );
}

export function getArticle(slug: string, visitorId?: string) {
  return request<{
    article: Article;
    related: Article[];
    comments: Comment[];
    reactions: Reactions;
  }>(`/api/articles/${encodeURIComponent(slug)}${qs({ visitorId })}`);
}

export function searchArticles(q: string, page = 1, category?: string) {
  return request<{ items: Article[]; pagination: Pagination }>(
    `/api/articles/search${qs({ q, page, category })}`
  );
}

export function listCategories() {
  return request<{ categories: Taxonomy[] }>('/api/categories');
}

export function listTags() {
  return request<{ tags: Taxonomy[] }>('/api/tags');
}

export function getAuthor(slug: string, page = 1) {
  return request<{ author: Author; items: Article[]; pagination: Pagination }>(
    `/api/authors/${encodeURIComponent(slug)}${qs({ page, limit: 9 })}`
  );
}

export function addComment(articleId: string, payload: { authorName: string; body: string }) {
  return request<{ comment: Comment }>(`/api/articles/${articleId}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function toggleReaction(
  articleId: string,
  payload: { type: 'like' | 'love' | 'insightful'; visitorId: string }
) {
  return request<Reactions>(`/api/articles/${articleId}/reactions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
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
