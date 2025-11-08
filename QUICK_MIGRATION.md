# Quick Migration Guide

## Run Migrations - Choose Your Option

### Option 1: Using the PowerShell Script (Easiest)

```powershell
# For production database
.\run-migration.ps1 -DatabaseUrl "postgresql://user:password@host:5432/dbname?sslmode=require"

# For local database
.\run-migration.ps1 -DatabaseUrl "postgresql://user:password@localhost:5432/dbname"
```

### Option 2: Manual PowerShell Commands

```powershell
# Set your database URL
$env:DATABASE_URL = "postgresql://user:password@host:5432/dbname"

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed database
$env:SYSTEM_ADMIN_EMAIL = "admin@yourapp.com"
$env:SYSTEM_ADMIN_PASSWORD = "SecurePassword123!"
npm run prisma:seed
```

### Option 3: One-Line Command

```powershell
$env:DATABASE_URL = "your-database-url"; npx prisma generate; npx prisma migrate deploy
```

## Get Your Database URL

### If using Vercel:
1. Go to Vercel Dashboard
2. Your Project → Settings → Environment Variables
3. Copy the `DATABASE_URL` value

### If using Supabase:
```
postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
```

### If using Railway:
```
postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway
```

### If using Neon:
```
postgresql://[user]:[password]@[endpoint]/[dbname]?sslmode=require
```

## After Running Migrations

1. **Check migration status:**
   ```powershell
   $env:DATABASE_URL = "your-db-url"
   npx prisma migrate status
   ```

2. **Seed the database (first time only):**
   ```powershell
   $env:DATABASE_URL = "your-db-url"
   $env:SYSTEM_ADMIN_EMAIL = "admin@yourapp.com"
   $env:SYSTEM_ADMIN_PASSWORD = "SecurePassword123!"
   npm run prisma:seed
   ```

3. **Deploy to Vercel:**
   ```powershell
   vercel --prod
   ```

## Troubleshooting

### "Environment variable not found"
Make sure you set `DATABASE_URL` before running commands:
```powershell
$env:DATABASE_URL = "your-database-url"
```

### "Connection refused"
- Check your database URL is correct
- Ensure database is running and accessible
- Check firewall/network settings
- For cloud databases, verify IP whitelisting

### "Migration already applied"
This is normal - the migration has already been applied. Safe to continue.

