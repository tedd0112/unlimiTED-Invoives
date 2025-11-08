import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../prisma.js'
import { clientCreateSchema, clientUpdateSchema } from '../validation/schemas.js'
import { requireAuth, requireTenant, AuthRequest } from '../middleware/auth.js'
import { withTenant } from '../prisma.js'

export const router = Router()

// All client routes require authentication and tenant context
router.use(requireAuth)
router.use(requireTenant)

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const clients = await prisma.client.findMany(
      withTenant(
        {
          orderBy: { createdAt: 'desc' }
        },
        req.user.tenantId,
        req.user.role !== 'SYSTEM_ADMIN'
      )
    )
    res.json(clients)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const client = await prisma.client.findFirst(
      withTenant(
        {
          where: { id: req.params.id }
        },
        req.user.tenantId,
        req.user.role !== 'SYSTEM_ADMIN'
      )
    )
    if (!client) return res.status(404).json({ error: 'Client not found' })
    res.json(client)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const data = clientCreateSchema.parse(req.body)

    // Get tenantId - from user context for tenant users, or from request body for system admin
    let tenantId = req.user.tenantId
    if (req.user.role === 'SYSTEM_ADMIN') {
      // System admin must provide tenantId in request body
      if (!data.tenantId) {
        return res.status(400).json({ error: 'tenantId is required' })
      }
      tenantId = data.tenantId
    } else if (!tenantId) {
      return res.status(403).json({ error: 'Tenant context required' })
    }

    const created = await prisma.client.create({
      data: {
        ...data,
        tenantId: tenantId!,
      }
    })
    res.status(201).json(created)
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors })
    next(err)
  }
})

// Bulk import clients
router.post('/bulk', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const arraySchema = z.array(clientCreateSchema).min(1).max(1000)
    const clientsData = arraySchema.parse(req.body)

    // Get tenantId - from user context for tenant users, or from request body for system admin
    let tenantId = req.user.tenantId
    if (req.user.role === 'SYSTEM_ADMIN') {
      // For bulk create, system admin should specify tenantId in each client object
      // Check if all clients have the same tenantId
      const firstTenantId = (clientsData[0] as any)?.tenantId
      if (!firstTenantId) {
        return res.status(400).json({ error: 'tenantId is required for each client when creating as system admin' })
      }
      tenantId = firstTenantId
    } else if (!tenantId) {
      return res.status(403).json({ error: 'Tenant context required' })
    }

    // Add tenantId to all clients (system admin provides it, tenant users use their tenantId)
    const clientsWithTenant = clientsData.map(client => ({
      ...client,
      tenantId: req.user!.role === 'SYSTEM_ADMIN' ? (client as any).tenantId : tenantId!,
    }))

    const created = await prisma.client.createMany({
      data: clientsWithTenant,
      skipDuplicates: false
    })
    res.status(201).json({ count: created.count })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors })
    next(err)
  }
})

router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const data = clientUpdateSchema.parse(req.body)

    // Verify client belongs to tenant (if not system admin)
    const existingClient = await prisma.client.findFirst(
      withTenant(
        {
          where: { id: req.params.id }
        },
        req.user.tenantId,
        req.user.role !== 'SYSTEM_ADMIN'
      )
    )

    if (!existingClient) {
      return res.status(404).json({ error: 'Client not found' })
    }

    const updated = await prisma.client.update({
      where: { id: req.params.id },
      data
    })
    res.json(updated)
  } catch (err) {
    if ((err as any).code === 'P2025') return res.status(404).json({ error: 'Client not found' })
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors })
    next(err)
  }
})

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Verify client belongs to tenant (if not system admin)
    const client = await prisma.client.findFirst(
      withTenant(
        {
          where: { id: req.params.id }
        },
        req.user.tenantId,
        req.user.role !== 'SYSTEM_ADMIN'
      )
    )

    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }

    await prisma.client.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) {
    if ((err as any).code === 'P2025') return res.status(404).json({ error: 'Client not found' })
    next(err)
  }
})

