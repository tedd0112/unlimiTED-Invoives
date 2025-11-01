import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'

import { errorHandler } from './middleware/error.js'
import { router as clientsRouter } from './routes/clients.js'
import { router as invoicesRouter } from './routes/invoices.js'
import { router as authRouter } from './routes/auth.js'

dotenv.config()

export function createApp() {
  const app = express()
  app.use(helmet())
  app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*', credentials: true }))
  app.use(express.json())
  app.use(morgan('dev'))

  app.get('/health', (_req, res) => res.json({ ok: true }))

  app.use('/api/auth', authRouter)
  app.use('/api/clients', clientsRouter)
  app.use('/api/invoices', invoicesRouter)

  app.use(errorHandler)
  return app
}

