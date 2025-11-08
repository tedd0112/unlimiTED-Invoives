#!/bin/bash
set -e

echo "🌱 Seeding production database..."

# Check required environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

if [ -z "$SYSTEM_ADMIN_EMAIL" ]; then
  echo "❌ ERROR: SYSTEM_ADMIN_EMAIL environment variable is not set"
  exit 1
fi

if [ -z "$SYSTEM_ADMIN_PASSWORD" ]; then
  echo "❌ ERROR: SYSTEM_ADMIN_PASSWORD environment variable is not set"
  exit 1
fi

# Run seed
echo "📝 Running seed script..."
npm run prisma:seed

echo "✅ Seeding completed successfully!"

