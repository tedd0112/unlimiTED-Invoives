# Multi-Tenant Invoice Management System

A production-ready multi-tenant invoice management system with role-based access control, built with Next.js, Express, Prisma, and PostgreSQL.

## Architecture

- **Shared Database Multi-Tenancy**: Single PostgreSQL database with tenant isolation via `tenantId`
- **Role-Based Access Control**: Three roles - SYSTEM_ADMIN, COMPANY_ADMIN, ACCOUNTANT
- **Authentication**: JWT stored in httpOnly cookies for security
- **Tenant Isolation**: Automatic tenant-scoping for all data operations

## Features

- ✅ Secure authentication with JWT cookies
- ✅ Multi-tenant data isolation
- ✅ Role-based authorization
- ✅ System admin can create tenants and users
- ✅ Tenant-scoped invoices, clients, and line items
- ✅ Protected API routes with middleware
- ✅ Next.js login page and protected routes

## Prerequisites

- Node.js 18+ and npm/pnpm
- PostgreSQL 14+
- Environment variables configured (see below)

## Environment Variables

Create a `.env` file in the root directory and in the `server` directory:

### Root `.env` (for Next.js)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/invoices?schema=public"
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

### Server `.env` (for Express API)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/invoices?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000"
PORT=4000
NODE_ENV="development"

# Seed script variables
SYSTEM_ADMIN_EMAIL="admin@yourapp.com"
SYSTEM_ADMIN_PASSWORD="SecurePassword123!"

# Optional: Create sample tenant and users
CREATE_SAMPLE_TENANT="true"
SAMPLE_COMPANY_ADMIN_EMAIL="admin@sample.com"
SAMPLE_COMPANY_ADMIN_PASSWORD="Admin123!"
SAMPLE_ACCOUNTANT_EMAIL="accountant@sample.com"
SAMPLE_ACCOUNTANT_PASSWORD="Accountant123!"
```

## Setup Instructions

### 1. Install Dependencies

```bash
# Install root dependencies (Next.js)
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 2. Database Setup

```bash
# Generate Prisma client (run from root directory)
npx prisma generate

# Create and run migrations (run from root directory)
npx prisma migrate dev --name init

# Seed the database with system admin
# Option 1: From root directory (recommended)
SYSTEM_ADMIN_EMAIL=admin@yourapp.com SYSTEM_ADMIN_PASSWORD=SecurePass123! npm run prisma:seed

# Option 2: From server directory
cd server
SYSTEM_ADMIN_EMAIL=admin@yourapp.com SYSTEM_ADMIN_PASSWORD=SecurePass123! npm run prisma:seed
cd ..
```

**Note for Windows PowerShell**: Use this syntax instead:
```powershell
$env:SYSTEM_ADMIN_EMAIL="admin@yourapp.com"; $env:SYSTEM_ADMIN_PASSWORD="SecurePass123!"; npm run prisma:seed
```

**Note**: The seed script creates:
- A system admin user (from env vars)
- Optionally: A sample tenant, company admin, and accountant (if `CREATE_SAMPLE_TENANT=true`)

### 3. Start Development Servers

**Terminal 1 - Backend API:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

The API will run on `http://localhost:4000` and the frontend on `http://localhost:3000`.

## API Endpoints

### Authentication

- `POST /auth/login` - Login and receive JWT cookie
  - Body: `{ "email": "user@example.com", "password": "password" }`
  - Returns: User object with role and tenant info

- `GET /auth/me` - Get current user (requires auth)
  - Returns: Current user details

- `POST /auth/logout` - Logout and clear cookie

### Admin Endpoints (SYSTEM_ADMIN only)

- `POST /admin/tenants` - Create a new tenant
  - Body: `{ "name": "Company Name" }`
  - Returns: Created tenant

- `POST /admin/users` - Create a user
  - Body: `{ "email": "user@example.com", "password": "password", "role": "COMPANY_ADMIN", "tenantId": 1 }`
  - For SYSTEM_ADMIN: `tenantId` must be `null`
  - For other roles: `tenantId` is required
  - Returns: Created user

- `GET /admin/tenants` - List all tenants
- `GET /admin/users` - List all users

### Tenant-Scoped Endpoints (require authentication)

- `GET /api/invoices` - List invoices for user's tenant
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

- `GET /api/clients` - List clients for user's tenant
- `POST /api/clients` - Create client
- `GET /api/clients/:id` - Get client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

## Roles

### SYSTEM_ADMIN
- Full system-level control
- Can create tenants and users
- Can access all tenant data (no tenant filtering)
- No tenant assignment required

### COMPANY_ADMIN
- Tenant-level administrator
- Can manage tenant data (invoices, clients)
- Cannot create other users (future feature)
- Must be assigned to a tenant

### ACCOUNTANT
- Tenant-level staff
- Can create and manage invoices
- Cannot create users or manage tenant settings
- Must be assigned to a tenant

## Testing the System

### 1. Login as System Admin

1. Navigate to `http://localhost:3000/login`
2. Login with system admin credentials (from seed)
3. You'll be redirected to `/admin`

### 2. Create a Tenant

Using the API (or a tool like Postman/curl):

```bash
curl -X POST http://localhost:4000/admin/tenants \
  -H "Content-Type: application/json" \
  -b cookies.txt -c cookies.txt \
  -d '{"name": "Acme Corp"}'
```

Or login first to get the cookie, then use it in subsequent requests.

### 3. Create a Company Admin

```bash
curl -X POST http://localhost:4000/admin/users \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "email": "admin@acme.com",
    "password": "Admin123!",
    "role": "COMPANY_ADMIN",
    "tenantId": 1
  }'
```

### 4. Login as Company Admin

1. Logout from system admin
2. Login with company admin credentials
3. You'll be redirected to `/dashboard`
4. Try creating invoices/clients - they'll be automatically scoped to your tenant

### 5. Test Tenant Isolation

1. Create two tenants (Tenant A and Tenant B)
2. Create users for each tenant
3. Login as user from Tenant A
4. Create some invoices/clients
5. Login as user from Tenant B
6. Verify you only see Tenant B's data

## Database Schema

### Key Models

- **Tenant**: Organizations/companies using the system
- **User**: Users with roles (SYSTEM_ADMIN, COMPANY_ADMIN, ACCOUNTANT)
- **Client**: Clients belonging to a tenant
- **Invoice**: Invoices belonging to a tenant and client
- **LineItem**: Line items belonging to an invoice

### Tenant Isolation

All tenant-scoped models (Client, Invoice, LineItem) include a `tenantId` field. The system automatically filters queries by `tenantId` based on the authenticated user's tenant, except for SYSTEM_ADMIN users who can access all data.

## Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT tokens in httpOnly cookies (XSS protection)
- ✅ Role-based authorization middleware
- ✅ Tenant isolation enforcement
- ✅ Input validation with Zod
- ✅ CORS configuration
- ✅ Helmet for security headers

## Development

### Running Migrations

Run from the root directory (where `prisma/schema.prisma` is located):
```bash
npx prisma migrate dev
```

### Viewing Database

Run from the root directory:
```bash
npx prisma studio
```

### Generating Prisma Client

Run from the root directory:
```bash
npx prisma generate
```

### Running Seed Script

Run from the root directory:
```bash
# Set environment variables first
export SYSTEM_ADMIN_EMAIL=admin@yourapp.com
export SYSTEM_ADMIN_PASSWORD=SecurePass123!

# Run seed
npm run prisma:seed
```

Or from the server directory:
```bash
cd server
npm run prisma:seed
```

## Production Deployment

### Database Migrations

**⚠️ IMPORTANT: Run migrations BEFORE deploying code to production**

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed instructions.

#### Quick Start (First Deployment)

1. **Run migrations:**
   ```bash
   # Set production database URL
   export DATABASE_URL="your-production-database-url"
   
   # Apply migrations
   npx prisma migrate deploy
   ```

2. **Seed database (one-time):**
   ```bash
   export DATABASE_URL="your-production-database-url"
   export SYSTEM_ADMIN_EMAIL="admin@yourapp.com"
   export SYSTEM_ADMIN_PASSWORD="SecurePassword123!"
   npm run prisma:seed
   ```

#### Subsequent Deployments

1. **Create migration locally:**
   ```bash
   npx prisma migrate dev --name migration_name
   ```

2. **Apply to production:**
   ```bash
   DATABASE_URL="your-production-database-url" npx prisma migrate deploy
   ```

3. **Deploy code to Vercel:**
   ```bash
   vercel --prod
   ```

### Vercel Deployment

1. **Set environment variables in Vercel:**
   - `DATABASE_URL` - Your production PostgreSQL URL
   - `JWT_SECRET` - Strong secret (generate with `openssl rand -base64 32`)
   - `JWT_EXPIRES_IN` - Token expiration (e.g., `7d`)
   - `CORS_ORIGIN` - Your frontend URL
   - `NEXT_PUBLIC_API_URL` - Your API URL
   - `NODE_ENV` - `production`

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Run migrations (if not using CI/CD):**
   - Use the migration scripts in `scripts/` directory
   - Or run manually: `DATABASE_URL="prod-url" npx prisma migrate deploy`

### Backend Deployment Options

#### Option 1: Vercel Serverless Functions
- Backend runs as serverless functions
- **Note:** Migrations cannot run in serverless - run separately
- Use migration scripts or CI/CD

#### Option 2: Separate Backend Service
- Deploy backend to Railway, Render, or similar
- Run migrations as part of deployment process
- Or use separate migration service

### Migration Scripts

**Linux/Mac:**
```bash
./scripts/migrate-prod.sh
./scripts/seed-prod.sh
```

**Windows (PowerShell):**
```powershell
.\scripts\migrate-prod.ps1
.\scripts\seed-prod.ps1
```

### CI/CD Integration

See `.github/workflows/migrate.yml` for GitHub Actions example.

**To use:**
1. Add `DATABASE_URL` to GitHub Secrets
2. Push to main branch or trigger workflow manually
3. Migrations run automatically before deployment

## Troubleshooting

### Cookie not being sent

- Ensure `credentials: 'include'` is set in fetch requests
- Check CORS configuration allows credentials
- Verify cookie domain and path settings

### Tenant isolation not working

- Verify user has a `tenantId` (except SYSTEM_ADMIN)
- Check that `withTenant` helper is used in queries
- Ensure auth middleware is setting `req.user.tenantId`

### Migration errors

- Ensure database is running and accessible
- Check `DATABASE_URL` is correct
- Try resetting: `npx prisma migrate reset` (WARNING: deletes all data)

## License

MIT

