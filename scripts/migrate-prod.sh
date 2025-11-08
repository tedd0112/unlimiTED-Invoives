#!/bin/bash
set -e

echo "🚀 Running production migrations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Run migrations
echo "🔄 Applying migrations..."
npx prisma migrate deploy

echo "✅ Migrations completed successfully!"

