import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

import { errorHandler } from './middleware/error.js'
import { router as clientsRouter } from './routes/clients.js'
import { router as invoicesRouter } from './routes/invoices.js'
import { router as authRouter } from './routes/auth.js'
import { router as adminRouter } from './routes/admin.js'

dotenv.config()

export function createApp() {
  const app = express()
  app.use(helmet())
  app.use(cors({ 
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000', 
    credentials: true 
  }))
  app.use(cookieParser())
  app.use(express.json())
  app.use(morgan('dev'))

  app.get('/health', (_req, res) => res.json({ ok: true }))

  app.use('/auth', authRouter)
  app.use('/admin', adminRouter)
  app.use('/api/clients', clientsRouter)
  app.use('/api/invoices', invoicesRouter)

  app.use(errorHandler)
  return app
}

