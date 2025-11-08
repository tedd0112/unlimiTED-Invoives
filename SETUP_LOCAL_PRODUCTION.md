# Local Production Setup

## Your Setup
- **Database**: Local PostgreSQL (localhost:5432)
- **Backend**: Running on local machine (port 4000)
- **Frontend**: Deployed to Vercel

## Database URL
```
postgresql://postgres:Kud%402003@localhost:5432/Invoice
```

## Setup Steps

### 1. Create Environment Files

**Root `.env.local` (for Next.js):**
```env
DATABASE_URL="postgresql://postgres:Kud%402003@localhost:5432/Invoice"
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

**Server `server/.env` (for Express backend):**
```env
DATABASE_URL="postgresql://postgres:Kud%402003@localhost:5432/Invoice"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000,https://your-app.vercel.app"
PORT=4000
NODE_ENV="production"
```

### 2. For Vercel Frontend Deployment

Since your backend is local, you have two options:

#### Option A: Expose Backend to Internet (Recommended)
Use a tunnel service to expose your local backend:

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   ```

2. **Start your backend:**
   ```bash
   cd server
   npm run dev
   ```

3. **In another terminal, create tunnel:**
   ```bash
   ngrok http 4000
   ```

4. **Update Vercel environment variable:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Set `NEXT_PUBLIC_API_URL` to the ngrok URL (e.g., `https://abc123.ngrok.io`)

#### Option B: Keep Backend Local (Development Only)
- Frontend on Vercel won't be able to connect to localhost
- Only works for local development
- Not suitable for production

### 3. Run Migrations

Migrations run against your local database:

```powershell
$env:DATABASE_URL = "postgresql://postgres:Kud%402003@localhost:5432/Invoice"
npx prisma migrate deploy
```

### 4. Start Backend

```bash
cd server
npm install
npm run dev
```

Backend runs on `http://localhost:4000`

### 5. Deploy Frontend to Vercel

```bash
vercel --prod
```

Set environment variable in Vercel:
- `NEXT_PUBLIC_API_URL` = Your ngrok URL or public backend URL

## Important Notes

⚠️ **For Production with Local Database:**
- Your database must be accessible from your backend server (localhost works)
- Vercel frontend cannot directly connect to localhost
- Use ngrok or similar tunnel for backend access from Vercel
- Or deploy backend to a server (Railway, Render, etc.) that can access your local DB via VPN/tunnel

## Better Architecture (Recommended)

For true production, consider:
1. **Database**: Cloud database (Supabase, Railway, Neon) - accessible from anywhere
2. **Backend**: Deploy to Railway/Render - can access cloud DB
3. **Frontend**: Vercel - connects to deployed backend

This way everything is accessible and you don't need tunnels.

