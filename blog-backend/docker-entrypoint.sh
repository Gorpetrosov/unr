#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
i=0
until node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$connect()
  .then(() => p.\$disconnect())
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
" 2>/dev/null; do
  i=$((i + 1))
  if [ "$i" -gt 60 ]; then
    echo "PostgreSQL did not become ready in time."
    exit 1
  fi
  sleep 2
done
echo "PostgreSQL is ready."

echo "Running migrations..."
npx prisma migrate deploy

echo "Applying full-text search helpers..."
npx prisma db execute --file prisma/fts.sql || true

echo "Seeding database..."
npx tsx prisma/seed.ts

echo "Starting API..."
exec node dist/main.js
