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

export const profileUpdateSchema = z.object({
  displayName: z.string().min(2).max(80).optional(),
  bio: localizedStringSchema.optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});

const articleStatusSchema = z.enum(['draft', 'published', 'scheduled']);

export const articleCreateSchema = z.object({
  title: localizedStringSchema,
  content: localizedStringSchema,
  excerpt: localizedStringSchema.optional(),
  featuredImage: z.string().url().optional().nullable(),
  featured: z.boolean().optional().default(false),
  status: articleStatusSchema.default('draft'),
  scheduledAt: z.string().optional().nullable(),
  categoryIds: z.array(z.string()).optional().default([]),
  tagIds: z.array(z.string()).optional().default([]),
  slug: localizedStringSchema.optional(),
});

export const articleUpdateSchema = articleCreateSchema.partial();

export const articlesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  category: z.string().optional(),
  tag: z.string().optional(),
  featured: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  ids: z.string().optional(),
  locale: z.enum(['en', 'ru']).optional().default('en'),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  category: z.string().optional(),
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

export const tagSchema = z.object({
  name: localizedStringSchema,
});

export const analyticsRangeSchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export const commentSchema = z.object({
  authorName: z.string().min(2).max(80),
  body: z.string().min(2).max(2000),
});

export const reactionSchema = z.object({
  type: z.enum(['like', 'love', 'insightful']),
  visitorId: z.string().uuid(),
});

export const articleDetailQuerySchema = z.object({
  visitorId: z.string().uuid().optional(),
});

export const newsletterSubscribeSchema = z.object({
  email: z.string().email().max(254),
  locale: z.enum(['en', 'ru']).optional().default('en'),
});

export const newsletterTokenSchema = z.object({
  token: z.string().min(16).max(128),
});

export const newsletterUnsubscribeEmailSchema = z
  .object({
    token: z.string().min(16).max(128).optional(),
    email: z.string().email().max(254).optional(),
  })
  .refine((v) => Boolean(v.token || v.email), {
    message: 'Provide token or email',
  });

export const newsletterAdminQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'active', 'unsubscribed']).optional(),
});
