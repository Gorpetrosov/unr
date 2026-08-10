# Personal Blog Platform

Two separate repositories:

| Folder | Stack | Role |
|--------|-------|------|
| [`blog-backend`](./blog-backend) | Node.js, Express, Prisma, PostgreSQL | REST API + Vue admin panel |
| [`blog-frontend`](./blog-frontend) | Vue 3, Vite, vue-i18n | Public bilingual blog |

## Setup order

1. Start Postgres (`cd blog-backend && docker compose up -d`)
2. Configure and run **blog-backend** (see its README)
3. Configure and run **blog-frontend**

Default admin: `admin@example.com` / `ChangeMe123!`
