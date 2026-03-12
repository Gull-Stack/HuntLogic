#!/usr/bin/env bash
set -euo pipefail

echo "=== HuntLogic Database Setup ==="
echo ""

# 1. Start Docker containers
echo "[1/5] Starting PostgreSQL..."
docker compose up -d postgres

# 2. Wait for PostgreSQL to be ready
echo "[2/5] Waiting for PostgreSQL to be ready..."
until docker compose exec -T postgres pg_isready -U huntlogic; do
  sleep 1
done
echo "  PostgreSQL is ready."

# 3. Run migrations
echo "[3/5] Running migrations..."
npx drizzle-kit push

# 4. Run seed
echo "[4/5] Seeding database..."
npx tsx src/lib/db/seed.ts

# 5. Validate
echo "[5/5] Validating database..."
npx tsx src/lib/db/validate.ts

echo ""
echo "=== Database setup complete ==="
