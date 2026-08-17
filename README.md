# Personal Blog Platform

| Folder | Stack | Role |
|--------|-------|------|
| [`blog-backend`](./blog-backend) | Nest.js, Prisma, PostgreSQL | REST API + Vue admin panel |
| [`blog-frontend`](./blog-frontend) | Vue 3, Vite, vue-i18n | Public bilingual blog |

## Quick start (Docker)

One command runs Postgres, the Nest API (with admin), and the public frontend:

```bash
cp .env.example .env
docker compose up --build
```

Then open:

| Service | URL |
|---------|-----|
| Public blog | http://localhost:5173 |
| API health | http://localhost:4000/api/health |
| Admin panel | http://localhost:4000/admin or http://localhost:5173/admin |

Default admin: `admin@example.com` / `ChangeMe123!`

## Local development (without full Docker stack)

1. Start Postgres: `cd blog-backend && docker compose up -d`
2. Configure and run **blog-backend** (see its README)
3. Configure and run **blog-frontend**
