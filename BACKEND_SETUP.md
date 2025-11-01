## Backend setup (Express + PostgreSQL)

1) Create env file at `server/.env`:

DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"
PORT=4000
JWT_SECRET=replace-with-strong-secret
CORS_ORIGIN=http://localhost:3000

2) Install and generate:
- cd server
- npm install (or pnpm install)
- npx prisma generate
- npx prisma migrate dev --name init

3) Run:
- npm run dev

### API endpoints (base: /api)
- POST /auth/register { email, password }
- POST /auth/login { email, password } -> { token }
- GET /clients
- GET /clients/:id
- POST /clients (auth)
- PUT /clients/:id (auth)
- DELETE /clients/:id (auth)
- GET /invoices
- GET /invoices/:id
- POST /invoices (auth)
- PUT /invoices/:id (auth)
- DELETE /invoices/:id (auth)
- POST /invoices/:id/mark { status: paid|unpaid|overdue } (auth)
- POST /invoices/:id/line-items (auth)
- PUT /invoices/:id/line-items/:lineItemId (auth)
- DELETE /invoices/:id/line-items/:lineItemId (auth)

Set `NEXT_PUBLIC_API_URL` in front-end env (e.g. `.env.local`) to `http://localhost:4000` or your deployed URL.

