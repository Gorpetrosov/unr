# GP Media Server

NestJS API for the GP Media blog platform: bilingual (EN/RU) articles, PostgreSQL full-text search, analytics, banner ads, comments and reactions, and a double opt-in newsletter.

Related projects:

- [`../gp-media-front`](../gp-media-front) — public site (Vue 3 + Vite, dev on `:5173`)
- [`../gp-media-front/gp-media-admin`](../gp-media-front/gp-media-admin) — admin panel (Vue 3 + Vite, dev on `:5173`/`:5174`)

Both frontends proxy `/api` to `http://localhost:4000` in development.

## Stack

- NestJS 11 + TypeScript, Node.js 22
- PostgreSQL 16 + Prisma 6
- Redis + BullMQ email queue (optional; emails are sent in-process when disabled)
- Resend transactional email (console-log fallback when no API key)
- JWT access/refresh tokens + bcrypt
- Zod validation, Helmet, CORS, rate limiting, XSS sanitization

## Quick start (local development)

```bash
cp .env.example .env          # then set JWT secrets and admin credentials
docker compose up -d          # Postgres on :5433, Redis on :6379

npm install
npm run db:migrate            # apply Prisma migrations
npm run db:fts                # full-text search tsvector + trigger (required for /api/articles/search)
npm run db:seed               # admin user, sample categories/tags/article

npm run dev                   # API on http://localhost:4000
```

Check it's up: `curl http://localhost:4000/api/health`.

To use the BullMQ queue locally, set `REDIS_ENABLED=true` in `.env` (Redis from `docker compose` is already running).

## Docker

Run the API in a container together with Postgres and Redis:

```bash
cp .env.example .env
docker compose --profile api up -d --build
```

The container overrides `DATABASE_URL`, `REDIS_URL`, `REDIS_ENABLED=true` and `NODE_ENV=production` to point at the compose services. On every start the entrypoint waits for Postgres, runs `prisma migrate deploy`, applies `prisma/fts.sql`, runs the seed, and starts the API.

> The seed is re-run on each container start and resets the admin password to `ADMIN_PASSWORD`.

Build the image on its own:

```bash
docker build -t gp-media-server .
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start in watch mode |
| `npm run build` | Compile to `dist/` |
| `npm start` / `npm run start:prod` | Run compiled build |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Create/apply migrations (dev) |
| `npm run db:migrate:deploy` | Apply migrations (production) |
| `npm run db:push` | Push schema without migrations |
| `npm run db:fts` | Apply full-text search helpers (`prisma/fts.sql`) |
| `npm run db:seed` | Seed admin user and sample content |
| `npm run db:studio` | Open Prisma Studio |

## Environment variables

Validated at startup by `src/config/env.ts`; the app refuses to start if a required variable is missing or invalid.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | | `4000` | API port |
| `NODE_ENV` | | `development` | `development` / `production` / `test`. In `development` CORS allows any origin |
| `DATABASE_URL` | ✓ | | PostgreSQL connection string |
| `JWT_SECRET` | ✓ | | Access token secret (min 16 chars) |
| `JWT_REFRESH_SECRET` | ✓ | | Refresh token secret (min 16 chars) |
| `JWT_ACCESS_EXPIRES_IN` | | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | | `7d` | Refresh token lifetime |
| `CORS_ORIGIN` | | `http://localhost:5173` | Comma-separated allowed origins (enforced outside development) |
| `REDIS_ENABLED` | | `false` | `true` to send emails through the BullMQ queue |
| `REDIS_URL` | | `redis://localhost:6379` | Redis connection URL |
| `RESEND_API_KEY` | | empty | [Resend](https://resend.com) API key; empty = log emails to console |
| `EMAIL_FROM` | | `Horizon Notes <onboarding@resend.dev>` | Sender address (use the Resend onboarding domain until yours is verified) |
| `PUBLIC_SITE_URL` | | `http://localhost:5173` | Public frontend URL for newsletter redirects |
| `PUBLIC_API_URL` | | `http://localhost:4000` | Public API URL for links in emails |
| `RATE_LIMIT_WINDOW_MS` | | `900000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX` | | `200` | Max requests per window |
| `ADMIN_EMAIL` | | `admin@example.com` | Seed admin email (seed only) |
| `ADMIN_PASSWORD` | | `ChangeMe123!` | Seed admin password (seed only) |
| `POSTGRES_PORT` | | `5433` | Host port for Postgres (docker compose only) |
| `REDIS_PORT` | | `6379` | Host port for Redis (docker compose only) |

## Public API

- `GET /api/health` — health check
- `GET /api/articles` — paginated published articles
- `GET /api/articles/:slug` — article by EN or RU slug
- `GET /api/articles/search?q=` — PostgreSQL full-text search
- `GET /api/articles/:articleId/comments` / `POST` — list / add comments
- `GET /api/articles/:articleId/reactions` / `POST` — reaction counts / react
- `GET /api/authors/:slug` — author profile
- `GET /api/categories` — categories
- `GET /api/tags` — tags
- `GET /api/banners?position=` — active banner for a position (`sidebar`, `header`, `in_article`)
- `POST /api/banners/:id/click` — track banner click
- `POST /api/analytics/view` — unique view (IP + article, 24h)
- `POST /api/analytics/share` — share by platform
- `POST /api/newsletter/subscribe` — double opt-in subscribe (sends confirm email)
- `GET /api/newsletter/confirm?token=` — confirm subscription (redirects to site)
- `POST /api/newsletter/unsubscribe` — unsubscribe by token or email
- `GET /api/newsletter/unsubscribe?token=` — unsubscribe via link

## Admin API (JWT, roles `admin` / `editor`)

- `POST /api/admin/auth/login`, `POST /api/admin/auth/refresh`
- `GET /api/admin/auth/me`, `PUT /api/admin/auth/me` — current user profile
- `GET|POST /api/admin/articles`, `GET|PUT|DELETE /api/admin/articles/:id`
- `GET|POST /api/admin/categories`, `PUT|DELETE /api/admin/categories/:id`
- `GET|POST /api/admin/tags`, `PUT|DELETE /api/admin/tags/:id`
- `GET|POST /api/admin/banners`, `PUT|DELETE /api/admin/banners/:id`
- `GET /api/admin/subscribers` — newsletter subscribers
- `GET /api/admin/analytics/stats|views|shares`

## Default admin credentials

Created by the seed (override with `ADMIN_EMAIL` / `ADMIN_PASSWORD`):

| Field | Value |
|-------|-------|
| Email | `admin@example.com` |
| Password | `ChangeMe123!` |

Change these before deploying.
