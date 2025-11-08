# Deployment Guide for Vercel

## Quick Answer: How to Run Migrations for Production

### Step 1: Run Migrations (BEFORE Deploying)

**From your local machine:**

```bash
# Set your production database URL
export DATABASE_URL="postgresql://user:password@your-db-host:5432/dbname?sslmode=require"

# Apply all migrations
npx prisma migrate deploy
```

**Or use the script:**
```bash
# Linux/Mac
DATABASE_URL="your-production-url" ./scripts/migrate-prod.sh

# Windows PowerShell
$env:DATABASE_URL="your-production-url"; .\scripts\migrate-prod.ps1
```

### Step 2: Seed Database (First Time Only)

```bash
export DATABASE_URL="your-production-database-url"
export SYSTEM_ADMIN_EMAIL="admin@yourapp.com"
export SYSTEM_ADMIN_PASSWORD="SecurePassword123!"

npm run prisma:seed
```

### Step 3: Deploy to Vercel

```bash
vercel --prod
```

## Detailed Migration Process

### For First Deployment

1. **Backup your existing database** (if you have data):
   ```bash
   pg_dump $DATABASE_URL > backup.sql
   ```

2. **Run migrations:**
   ```bash
   DATABASE_URL="your-production-url" npx prisma migrate deploy
   ```

3. **Seed initial data:**
   ```bash
   DATABASE_URL="your-production-url" SYSTEM_ADMIN_EMAIL="admin@example.com" SYSTEM_ADMIN_PASSWORD="password" npm run prisma:seed
   ```

4. **Deploy code:**
   ```bash
   vercel --prod
   ```

### For Subsequent Deployments (After Schema Changes)

1. **Create migration locally:**
   ```bash
   # Make changes to prisma/schema.prisma
   npx prisma migrate dev --name add_new_feature
   ```

2. **Test migration on staging** (if you have one):
   ```bash
   DATABASE_URL="staging-url" npx prisma migrate deploy
   ```

3. **Apply to production:**
   ```bash
   DATABASE_URL="production-url" npx prisma migrate deploy
   ```

4. **Deploy code:**
   ```bash
   vercel --prod
   ```

## Backend Deployment Options

Since your backend is in the `server/` directory, you have two options:

### Option 1: Deploy Backend Separately (Recommended)

Deploy your Express backend to a service like:
- **Railway** (recommended - easy setup)
- **Render**
- **Fly.io**
- **DigitalOcean App Platform**
- **AWS/Google Cloud**

**Steps:**
1. Push your code to GitHub
2. Connect your repository to Railway/Render
3. Set environment variables
4. Deploy

**Railway Example:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Set environment variables
railway variables set DATABASE_URL="your-db-url"
railway variables set JWT_SECRET="your-secret"

# Deploy
railway up
```

### Option 2: Use Vercel Serverless Functions

Convert your Express routes to Vercel serverless functions. This requires restructuring your backend code.

**Note:** This is more complex and migrations still need to run separately.

## Environment Variables for Vercel

Set these in Vercel Dashboard → Your Project → Settings → Environment Variables:

### Frontend Variables
```
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

### Backend Variables (if using separate service)
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-strong-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend.vercel.app
NODE_ENV=production
PORT=4000
```

## Migration Workflow Summary

```
┌─────────────────┐
│  1. Develop     │ → Make schema changes locally
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. Migrate     │ → npx prisma migrate dev --name change
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. Test        │ → Test locally
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. Deploy DB   │ → DATABASE_URL=prod npx prisma migrate deploy
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. Deploy Code │ → vercel --prod
└─────────────────┘
```

## Common Issues

### "Migration already applied"
This is normal if the migration was already run. Safe to ignore.

### "Database schema is not in sync"
Run:
```bash
npx prisma generate
npx prisma migrate deploy
```

### "Connection timeout"
- Check your database URL
- Ensure database allows connections from your IP
- Check firewall settings
- For cloud databases, check if IP whitelisting is needed

## Automated Migration with GitHub Actions

See `.github/workflows/migrate.yml` for automatic migration on push.

**Setup:**
1. Add `DATABASE_URL` to GitHub Secrets
2. Push to main branch
3. Migrations run automatically

## Quick Commands Reference

```bash
# Check migration status
npx prisma migrate status

# Apply migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# View database
npx prisma studio

# Seed database
npm run prisma:seed
```

## Need Help?

- See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed instructions
- Check Prisma docs: https://www.prisma.io/docs/guides/migrate/production-troubleshooting

