#!/bin/sh
set -e

echo "[kin] applying Prisma migrations..."
npx prisma migrate deploy

if [ "$KIN_SEED_ON_BOOT" = "true" ]; then
  echo "[kin] seeding database..."
  npx tsx prisma/seed.ts || echo "[kin] seed skipped (likely already seeded)"
fi

echo "[kin] starting Next.js on port ${PORT:-3000}..."
exec npm run start
