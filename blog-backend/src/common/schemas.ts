import { z } from 'zod';

export const localizedStringSchema = z.object({
  en: z.string().min(1),
  ru: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const articleCreateSchema = z.object({
  title: localizedStringSchema,
  content: localizedStringSchema,
  excerpt: localizedStringSchema.optional(),
  featuredImage: z.string().url().optional().nullable(),
  status: z.enum(['draft', 'published']).default('draft'),
  categoryIds: z.array(z.string()).optional().default([]),
  slug: localizedStringSchema.optional(),
});

export const articleUpdateSchema = articleCreateSchema.partial();

export const articlesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  category: z.string().optional(),
  locale: z.enum(['en', 'ru']).optional().default('en'),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  locale: z.enum(['en', 'ru']).optional().default('en'),
});

export const bannersQuerySchema = z.object({
  position: z.enum(['sidebar', 'header', 'in_article']).optional(),
});

export const viewAnalyticsSchema = z.object({
  articleId: z.string().min(1),
  url: z.string().optional(),
});

export const shareAnalyticsSchema = z.object({
  articleId: z.string().min(1),
  platform: z.enum(['twitter', 'facebook', 'linkedin', 'telegram', 'whatsapp', 'copy', 'other']),
});

export const bannerSchema = z.object({
  title: z.string().min(1).max(200),
  imageUrl: z.string().url(),
  linkUrl: z.string().url(),
  position: z.enum(['sidebar', 'header', 'in_article']),
  isActive: z.boolean().optional().default(true),
});

export const bannerUpdateSchema = bannerSchema.partial();

export const categorySchema = z.object({
  name: localizedStringSchema,
});

export const analyticsRangeSchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});
