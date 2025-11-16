# Start Backend Server
Write-Host "🚀 Starting backend server..." -ForegroundColor Cyan

cd server

# Set environment variables
$env:DATABASE_URL = "postgresql://postgres:Kud%402003@localhost:5432/Invoice"
$env:JWT_SECRET = "dev-secret-key-change-in-production"
$env:JWT_EXPIRES_IN = "7d"
$env:CORS_ORIGIN = "http://localhost:3000"
$env:PORT = "4000"
$env:NODE_ENV = "development"

# Start server
Write-Host "Backend will run on http://localhost:4000" -ForegroundColor Green
npm run dev

