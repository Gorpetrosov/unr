# Blog Backend

Nest.js API with PostgreSQL (Prisma), JWT auth, full-text search, analytics, banner ads, and an embedded Vue admin panel.

## Stack

- Nest.js + TypeScript
- PostgreSQL + Prisma ORM
- JWT access/refresh tokens + bcrypt
- Zod validation, Helmet, CORS, throttling, XSS sanitization
- Vue 3 admin SPA (served at `/admin`)

## Docker (recommended)

From the **repository root**:

```bash
cp .env.example .env
docker compose up --build
```

This starts Postgres, this API, and the public frontend. See the root [README](../README.md).

Postgres-only (for local npm dev):

```bash
docker compose up -d
```

## Local npm development

```bash
cp .env.example .env
# edit DATABASE_URL, JWT secrets, admin credentials

npm install
npx prisma migrate dev
# apply full-text search helpers (tsvector + trigger)
npx prisma db execute --file prisma/fts.sql
npm run db:seed

npm run dev          # Nest API on :4000
npm run admin:dev    # Admin Vite on :5174 (proxies /api)
# or build admin into the API image/static path:
npm run admin:build
```

Production-style local build:

```bash
npm run build
npm start
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default `4000`) |
| `NODE_ENV` | `development` / `production` |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Access token secret |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `JWT_ACCESS_EXPIRES_IN` | e.g. `15m` |
| `JWT_REFRESH_EXPIRES_IN` | e.g. `7d` |
| `CORS_ORIGIN` | Comma-separated allowed origins |
| `REDIS_URL` / `REDIS_ENABLED` | Optional (unused by default) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seed admin user |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | Rate limit config |

## Public API

- `GET /api/articles` — paginated published articles
- `GET /api/articles/:slug` — article by EN or RU slug
- `GET /api/articles/search?q=` — PostgreSQL full-text search
- `GET /api/banners?position=` — active banners (random for position)
- `POST /api/banners/:id/click` — track banner click
- `POST /api/analytics/view` — unique views (IP + article, 24h)
- `POST /api/analytics/share` — share by platform
- `GET /api/categories` — categories

## Default admin credentials

Created by seed (override via `ADMIN_EMAIL` / `ADMIN_PASSWORD`):

| Field | Value |
|-------|-------|
| Email | `admin@example.com` |
| Password | `ChangeMe123!` |

## Admin API (JWT)

- `POST /api/admin/auth/login`
- `POST /api/admin/auth/refresh`
- Articles / banners / categories CRUD
- `GET /api/admin/analytics/stats|views|shares`
