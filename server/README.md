# InvoiceFlow Backend

Create a `.env` file in `server/` with:

DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"
PORT=4000
JWT_SECRET=replace-with-strong-secret
CORS_ORIGIN=http://localhost:3000

Scripts:
- pnpm install (or npm install)
- pnpm prisma:generate
- npx prisma migrate dev --name init
- pnpm dev

Deploy by setting `DATABASE_URL`, `JWT_SECRET`, `PORT`.

