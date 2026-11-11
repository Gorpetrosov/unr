# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++ openssl
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm install

FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
RUN npx prisma generate
RUN npx nest build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public&sslmode=require&sslrootcert=/app/certs/aiven-ca.pem"
RUN apk add --no-cache openssl

COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY certs/aiven-ca.pem /app/certs/aiven-ca.pem
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
  && npm prune --omit=dev \
  && npm install prisma@7.10.1 tsx --no-save

EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
