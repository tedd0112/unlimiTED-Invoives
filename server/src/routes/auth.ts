import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../prisma.js'
import { authLoginSchema } from '../validation/schemas.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'

export const router = Router()

// POST /auth/login - Login and set JWT cookie
router.post('/login', async (req, res, next) => {
  try {
    const body = authLoginSchema.parse(req.body)
    
    // Find user by email
    const user = await prisma.user.findUnique({ 
      where: { email: body.email },
      include: { tenant: true }
    })
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Verify password
    const ok = await bcrypt.compare(body.password, user.passwordHash)
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Create JWT payload
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    }

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    // Return user info (without password)
    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tenant: user.tenant ? { id: user.tenant.id, name: user.tenant.name } : null,
      },
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors })
    }
    next(err)
  }
})

// GET /auth/me - Get current user info
router.get('/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { tenant: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tenant: user.tenant,
        createdAt: user.createdAt,
      },
    })
  } catch (err) {
    next(err)
  }
})

// POST /auth/logout - Clear cookie
router.post('/logout', (_req, res) => {
  res.clearCookie('token', { path: '/' })
  res.json({ message: 'Logged out successfully' })
})

