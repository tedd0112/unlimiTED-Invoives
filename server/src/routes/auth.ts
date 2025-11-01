import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../prisma.js'
import { authLoginSchema, authRegisterSchema } from '../validation/schemas.js'

export const router = Router()

router.post('/register', async (req, res, next) => {
  try {
    const body = authRegisterSchema.parse(req.body)
    const hashed = await bcrypt.hash(body.password, 10)
    const user = await prisma.user.create({ data: { email: body.email, password: hashed } })
    res.status(201).json({ id: user.id, email: user.email })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors })
    if ((err as any).code === 'P2002') return res.status(409).json({ error: 'Email already in use' })
    next(err)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const body = authLoginSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { email: body.email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const ok = await bcrypt.compare(body.password, user.password)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
    const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' })
    res.json({ token })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors })
    next(err)
  }
})

