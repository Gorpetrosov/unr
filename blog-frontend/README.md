# Blog Frontend

Vue 3 bilingual personal blog (English / Russian) that consumes the `blog-backend` API.

## Features

- Article listing, detail pages, and full-text search
- EN/RU locale switch with localized slugs and content
- Weather widget via [Open-Meteo](https://open-meteo.com/)
- Currency rates via [exchangerate.host](https://exchangerate.host/)
- Social share buttons with backend analytics
- Custom banner ads + optional Google AdSense
- SEO: titles, meta description, Open Graph, Twitter cards, canonical URLs

## Stack

- Vue 3 + Vite + TypeScript
- Vue Router + Pinia + vue-i18n

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Frontend: `http://localhost:5173`  
API proxy: `/api` → `http://localhost:4000`

## Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API origin (empty = Vite proxy) |
| `VITE_SITE_NAME` | Brand name |
| `VITE_SITE_URL` | Canonical site URL |
| `VITE_DEFAULT_LOCALE` | `en` or `ru` |
| `VITE_WEATHER_LAT` / `VITE_WEATHER_LON` / `VITE_WEATHER_LABEL` | Weather fallback (default New York) when browser geolocation is denied or unavailable |
| `VITE_CURRENCY_BASE` / `VITE_CURRENCY_SYMBOLS` | FX widget |
| `VITE_ADSENSE_CLIENT` / `VITE_ADSENSE_SLOT` | Optional AdSense |

## Related repo

Run `blog-backend` first (Postgres + API on port 4000), then start this frontend.
