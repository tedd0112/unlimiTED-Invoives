# PowerShell script for Windows
# Seed production database on Windows

$ErrorActionPreference = "Stop"

Write-Host "🌱 Seeding production database..." -ForegroundColor Cyan

# Check required environment variables
if (-not $env:DATABASE_URL) {
    Write-Host "❌ ERROR: DATABASE_URL environment variable is not set" -ForegroundColor Red
    exit 1
}

if (-not $env:SYSTEM_ADMIN_EMAIL) {
    Write-Host "❌ ERROR: SYSTEM_ADMIN_EMAIL environment variable is not set" -ForegroundColor Red
    exit 1
}

if (-not $env:SYSTEM_ADMIN_PASSWORD) {
    Write-Host "❌ ERROR: SYSTEM_ADMIN_PASSWORD environment variable is not set" -ForegroundColor Red
    exit 1
}

# Run seed
Write-Host "📝 Running seed script..." -ForegroundColor Yellow
npm run prisma:seed

Write-Host "✅ Seeding completed successfully!" -ForegroundColor Green

