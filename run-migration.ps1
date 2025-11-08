# PowerShell script to run Prisma migrations
# Usage: .\run-migration.ps1 -DatabaseUrl "postgresql://user:password@host:5432/dbname"

param(
    [Parameter(Mandatory=$true)]
    [string]$DatabaseUrl
)

Write-Host "🚀 Running Prisma Migrations" -ForegroundColor Cyan
Write-Host ""

# Set environment variable
$env:DATABASE_URL = $DatabaseUrl

# Generate Prisma Client
Write-Host "📦 Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}

# Check migration status
Write-Host "📊 Checking migration status..." -ForegroundColor Yellow
npx prisma migrate status
if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne 1) {
    Write-Host "⚠️  Warning: Could not check migration status" -ForegroundColor Yellow
}

# Run migrations
Write-Host ""
Write-Host "🔄 Applying migrations..." -ForegroundColor Yellow
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Migrations completed successfully!" -ForegroundColor Green

