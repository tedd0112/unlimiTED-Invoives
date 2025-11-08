import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../prisma.js'
import { createTenantSchema, createUserSchema } from '../validation/schemas.js'
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js'
import { Role } from '@prisma/client'

export const router = Router()

// All admin routes require authentication
router.use(requireAuth)

// POST /admin/tenants - Create a new tenant (system admin only)
router.post('/tenants', requireRole(Role.SYSTEM_ADMIN), async (req, res, next) => {
  try {
    const data = createTenantSchema.parse(req.body)

    const tenant = await prisma.tenant.create({
      data: {
        name: data.name,
      },
    })

    res.status(201).json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        createdAt: tenant.createdAt,
      },
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors })
    }
    next(err)
  }
})

// POST /admin/users - Create a new user (system admin only)
router.post('/users', requireRole(Role.SYSTEM_ADMIN), async (req, res, next) => {
  try {
    const data = createUserSchema.parse(req.body)

    // Validate: SYSTEM_ADMIN users must have tenantId = null
    if (data.role === 'SYSTEM_ADMIN' && data.tenantId !== null && data.tenantId !== undefined) {
      return res.status(400).json({ 
        error: 'SYSTEM_ADMIN users cannot be assigned to a tenant. Set tenantId to null.' 
      })
    }

    // Validate: Non-SYSTEM_ADMIN users must have a tenantId
    if (data.role !== 'SYSTEM_ADMIN' && !data.tenantId) {
      return res.status(400).json({ 
        error: 'Non-SYSTEM_ADMIN users must be assigned to a tenant. Provide tenantId.' 
      })
    }

    // Verify tenant exists if tenantId is provided
    if (data.tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: data.tenantId },
      })

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' })
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: data.role as Role,
        tenantId: data.tenantId || null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        createdAt: true,
      },
    })

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        createdAt: user.createdAt,
      },
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors })
    }
    if ((err as any).code === 'P2002') {
      return res.status(409).json({ error: 'Email already in use' })
    }
    next(err)
  }
})

// GET /admin/tenants - List all tenants (system admin only)
router.get('/tenants', requireRole(Role.SYSTEM_ADMIN), async (_req, res, next) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            invoices: true,
            clients: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.json({ tenants })
  } catch (err) {
    next(err)
  }
})

// GET /admin/users - List all users (system admin only)
router.get('/users', requireRole(Role.SYSTEM_ADMIN), async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        tenant: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.json({ users })
  } catch (err) {
    next(err)
  }
})

