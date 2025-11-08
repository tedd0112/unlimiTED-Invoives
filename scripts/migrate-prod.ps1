# PowerShell script for Windows
# Run production migrations on Windows

$ErrorActionPreference = "Stop"

Write-Host "🚀 Running production migrations..." -ForegroundColor Cyan

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "❌ ERROR: DATABASE_URL environment variable is not set" -ForegroundColor Red
    exit 1
}

# Generate Prisma Client
Write-Host "📦 Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

# Run migrations
Write-Host "🔄 Applying migrations..." -ForegroundColor Yellow
npx prisma migrate deploy

Write-Host "✅ Migrations completed successfully!" -ForegroundColor Green

