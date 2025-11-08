# Production Migration Guide for Vercel Deployment

## Overview
This guide explains how to run Prisma migrations and seed your production database when deploying to Vercel.

## Prerequisites
- PostgreSQL database (Supabase, Railway, Neon, AWS RDS, etc.)
- Database connection string for production
- Access to run commands locally or via CI/CD

## Migration Strategy

### Option 1: Run Migrations Locally (Recommended for First Deploy)

1. **Set up production database connection:**
   ```bash
   # Create a .env.production file (don't commit this!)
   DATABASE_URL="postgresql://user:password@your-production-db:5432/dbname?sslmode=require"
   ```

2. **Run migrations against production:**
   ```bash
   # Use production database URL
   DATABASE_URL="your-production-database-url" npx prisma migrate deploy
   ```

3. **Seed the database (one-time):**
   ```bash
   # Set environment variables
   export DATABASE_URL="your-production-database-url"
   export SYSTEM_ADMIN_EMAIL="admin@yourapp.com"
   export SYSTEM_ADMIN_PASSWORD="SecurePassword123!"
   
   # Run seed
   npm run prisma:seed
   ```

### Option 2: Use Prisma Migrate Deploy (Recommended for Updates)

For production deployments, use `prisma migrate deploy` instead of `prisma migrate dev`:

```bash
# This applies all pending migrations
npx prisma migrate deploy
```

**Important:** This command:
- ✅ Applies pending migrations only
- ✅ Safe for production (no interactive prompts)
- ✅ Can be run multiple times safely
- ✅ Doesn't create new migrations (use `migrate dev` locally)

### Option 3: CI/CD Pipeline (GitHub Actions, etc.)

Create a GitHub Action to run migrations on deploy:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx prisma generate
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Step-by-Step: First Production Deployment

### 1. Prepare Your Production Database

1. Create a PostgreSQL database (if you haven't already)
   - **Supabase**: Create a new project
   - **Railway**: Create a new PostgreSQL service
   - **Neon**: Create a new project
   - **AWS RDS**: Create a PostgreSQL instance

2. Get your production database URL:
   ```
   postgresql://user:password@host:5432/dbname?sslmode=require
   ```

### 2. Run Initial Migration

```bash
# From your local machine
export DATABASE_URL="your-production-database-url"
npx prisma migrate deploy
```

This will:
- Create all tables (Tenant, User, Client, Invoice, LineItem)
- Set up relationships and indexes
- Apply the multi-tenant schema

### 3. Seed Production Database

```bash
# Set environment variables
export DATABASE_URL="your-production-database-url"
export SYSTEM_ADMIN_EMAIL="admin@yourapp.com"
export SYSTEM_ADMIN_PASSWORD="SecurePassword123!"
export CREATE_SAMPLE_TENANT="false" # Don't create sample data in production

# Run seed
npm run prisma:seed
```

### 4. Configure Vercel Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

**For Frontend (Next.js):**
```
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

**For Backend (if using Vercel Serverless Functions):**
```
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend-domain.vercel.app
NODE_ENV=production
PORT=4000
```

### 5. Deploy to Vercel

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel --prod
```

## Subsequent Deployments (After Schema Changes)

### 1. Create Migration Locally (Development)

```bash
# Make your schema changes in prisma/schema.prisma
# Then create migration
npx prisma migrate dev --name your_migration_name
```

### 2. Test Migration Locally

```bash
# Test against a local/staging database first
DATABASE_URL="your-staging-db-url" npx prisma migrate deploy
```

### 3. Apply to Production

**Option A: Before Deploying**
```bash
# Run migration against production BEFORE deploying code
DATABASE_URL="your-production-db-url" npx prisma migrate deploy
```

**Option B: As Part of Deploy (CI/CD)**
- Set up GitHub Actions or similar
- Run `prisma migrate deploy` in your CI/CD pipeline
- Then deploy code to Vercel

### 4. Deploy Updated Code

```bash
vercel --prod
```

## Vercel-Specific Considerations

### If Backend is on Vercel (Serverless Functions)

1. **Migrations cannot run in serverless functions** - Run them separately
2. **Use a separate migration service or CI/CD**
3. **Or run migrations from your local machine before deploying**

### If Backend is Separate (Railway, Render, etc.)

1. Run migrations as part of your backend deployment process
2. Or use a separate migration service
3. Or run migrations manually before deploying

## Migration Scripts

### Create a Migration Script

Create `scripts/migrate-prod.sh`:

```bash
#!/bin/bash
set -e

echo "Running production migrations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Run migrations
echo "Applying migrations..."
npx prisma migrate deploy

echo "Migrations completed successfully!"
```

Make it executable:
```bash
chmod +x scripts/migrate-prod.sh
```

### Create a Seed Script

Create `scripts/seed-prod.sh`:

```bash
#!/bin/bash
set -e

echo "Seeding production database..."

# Check required environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

if [ -z "$SYSTEM_ADMIN_EMAIL" ]; then
  echo "ERROR: SYSTEM_ADMIN_EMAIL environment variable is not set"
  exit 1
fi

if [ -z "$SYSTEM_ADMIN_PASSWORD" ]; then
  echo "ERROR: SYSTEM_ADMIN_PASSWORD environment variable is not set"
  exit 1
fi

# Run seed
npm run prisma:seed

echo "Seeding completed successfully!"
```

## Safety Best Practices

### 1. Always Backup Before Migrations

```bash
# Backup your production database before running migrations
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
```

### 2. Test Migrations on Staging First

- Create a staging database
- Run migrations there first
- Verify everything works
- Then apply to production

### 3. Use Transaction Wraps (Prisma does this automatically)

Prisma migrations run in transactions, so if a migration fails, it will roll back.

### 4. Monitor Migration Status

```bash
# Check migration status
npx prisma migrate status
```

## Troubleshooting

### Migration Fails

1. **Check database connection:**
   ```bash
   npx prisma db pull
   ```

2. **Check migration status:**
   ```bash
   npx prisma migrate status
   ```

3. **Reset if needed (⚠️ DESTRUCTIVE - Only for development):**
   ```bash
   npx prisma migrate reset
   ```

### "Migration already applied" Error

This is normal - the migration has already been applied. Safe to ignore.

### "Database schema is not in sync"

1. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

2. Check for drift:
   ```bash
   npx prisma migrate diff
   ```

## Quick Reference

### First Time Setup
```bash
# 1. Migrate
DATABASE_URL="prod-url" npx prisma migrate deploy

# 2. Seed
DATABASE_URL="prod-url" SYSTEM_ADMIN_EMAIL="admin@example.com" SYSTEM_ADMIN_PASSWORD="pass" npm run prisma:seed

# 3. Deploy
vercel --prod
```

### Regular Updates
```bash
# 1. Create migration locally
npx prisma migrate dev --name update_name

# 2. Apply to production
DATABASE_URL="prod-url" npx prisma migrate deploy

# 3. Deploy code
vercel --prod
```

## Recommended Workflow

1. **Development**: Use `prisma migrate dev` locally
2. **Staging**: Use `prisma migrate deploy` on staging database
3. **Production**: Use `prisma migrate deploy` on production database
4. **Deploy**: Deploy code to Vercel after migrations succeed

## Additional Resources

- [Prisma Migrate Deploy](https://www.prisma.io/docs/concepts/components/prisma-migrate/migrate-development-production#production)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Prisma Production Checklist](https://www.prisma.io/docs/guides/performance-and-optimization/prisma-client-in-production)

