import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../prisma.js'
import { invoiceCreateSchema, invoiceUpdateSchema, lineItemSchema } from '../validation/schemas.js'
import { requireAuth, requireTenant, AuthRequest } from '../middleware/auth.js'
import { withTenant } from '../prisma.js'

export const router = Router()

// All invoice routes require authentication and tenant context
router.use(requireAuth)
router.use(requireTenant)

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const invoices = await prisma.invoice.findMany(
      withTenant(
        {
          orderBy: { createdAt: 'desc' },
          include: { lineItems: true, client: true }
        },
        req.user.tenantId,
        req.user.role !== 'SYSTEM_ADMIN'
      )
    )
    res.json(invoices)
  } catch (err) { next(err) }
})

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const invoice = await prisma.invoice.findFirst(
      withTenant(
        {
          where: { id: req.params.id },
          include: { lineItems: true, client: true }
        },
        req.user.tenantId,
        req.user.role !== 'SYSTEM_ADMIN'
      )
    )
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    res.json(invoice)
  } catch (err) { next(err) }
})

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const data = invoiceCreateSchema.parse(req.body)

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

    // Verify client belongs to the same tenant
    if (tenantId) {
      const client = await prisma.client.findFirst({
        where: {
          id: data.clientId,
          tenantId: tenantId,
        },
      })

      if (!client) {
        return res.status(404).json({ error: 'Client not found or access denied' })
      }
    }

    const created = await prisma.invoice.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        clientId: data.clientId,
        tenantId: tenantId!,
        status: mapStatus(data.status),
        subtotal: data.subtotal,
        tax: data.tax,
        discount: data.discount,
        total: data.total,
        date: data.date ? new Date(data.date) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        notes: data.notes,
        lineItems: { create: data.lineItems.map(li => ({
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          total: li.total,
        })) }
      },
      include: { lineItems: true, client: true }
    })
    res.status(201).json(created)
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors })
    if ((err as any).code === 'P2002') return res.status(409).json({ error: 'Invoice number already exists for this tenant' })
    next(err)
  }
})

router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const data = invoiceUpdateSchema.parse(req.body)

    // Verify invoice belongs to tenant (if not system admin)
    const existingInvoice = await prisma.invoice.findFirst(
      withTenant(
        {
          where: { id: req.params.id },
        },
        req.user.tenantId,
        req.user.role !== 'SYSTEM_ADMIN'
      )
    )

    if (!existingInvoice) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    // If updating clientId, verify new client belongs to same tenant
    if (data.clientId && req.user.tenantId) {
      const client = await prisma.client.findFirst({
        where: {
          id: data.clientId,
          tenantId: req.user.tenantId,
        },
      })

      if (!client) {
        return res.status(404).json({ error: 'Client not found or access denied' })
      }
    }

    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        invoiceNumber: data.invoiceNumber,
        clientId: data.clientId,
        status: data.status ? mapStatus(data.status) : undefined,
        subtotal: data.subtotal,
        tax: data.tax,
        discount: data.discount,
        total: data.total,
        date: data.date ? new Date(data.date) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        notes: data.notes,
      },
      include: { lineItems: true, client: true }
    })
    res.json(updated)
  } catch (err) {
    if ((err as any).code === 'P2025') return res.status(404).json({ error: 'Invoice not found' })
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors })
    next(err)
  }
})

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Verify invoice belongs to tenant (if not system admin)
    const invoice = await prisma.invoice.findFirst(
      withTenant(
        {
          where: { id: req.params.id },
        },
        req.user.tenantId,
        req.user.role !== 'SYSTEM_ADMIN'
      )
    )

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    await prisma.invoice.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) {
    if ((err as any).code === 'P2025') return res.status(404).json({ error: 'Invoice not found' })
    next(err)
  }
})

router.post('/:id/mark', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const status = z.enum(['paid','unpaid','overdue']).parse(req.body.status)

    // Verify invoice belongs to tenant (if not system admin)
    const invoice = await prisma.invoice.findFirst(
      withTenant(
        {
          where: { id: req.params.id },
        },
        req.user.tenantId,
        req.user.role !== 'SYSTEM_ADMIN'
      )
    )

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: mapStatus(status) },
      include: { lineItems: true, client: true }
    })
    res.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors })
    if ((err as any).code === 'P2025') return res.status(404).json({ error: 'Invoice not found' })
    next(err)
  }
})

router.post('/:id/line-items', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Verify invoice belongs to tenant
    const invoice = await prisma.invoice.findFirst(
      withTenant(
        {
          where: { id: req.params.id },
        },
        req.user.tenantId,
        req.user.role !== 'SYSTEM_ADMIN'
      )
    )

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    const li = lineItemSchema.parse(req.body)
    const created = await prisma.lineItem.create({ data: { ...li, invoiceId: req.params.id } })
    res.status(201).json(created)
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors })
    next(err)
  }
})

router.put('/:id/line-items/:lineItemId', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Verify invoice belongs to tenant
    const invoice = await prisma.invoice.findFirst(
      withTenant(
        {
          where: { id: req.params.id },
        },
        req.user.tenantId,
        req.user.role !== 'SYSTEM_ADMIN'
      )
    )

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    const li = lineItemSchema.partial().parse(req.body)
    const updated = await prisma.lineItem.update({ where: { id: req.params.lineItemId }, data: li })
    res.json(updated)
  } catch (err) {
    if ((err as any).code === 'P2025') return res.status(404).json({ error: 'Line item not found' })
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors })
    next(err)
  }
})

router.delete('/:id/line-items/:lineItemId', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Verify invoice belongs to tenant
    const invoice = await prisma.invoice.findFirst(
      withTenant(
        {
          where: { id: req.params.id },
        },
        req.user.tenantId,
        req.user.role !== 'SYSTEM_ADMIN'
      )
    )

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    await prisma.lineItem.delete({ where: { id: req.params.lineItemId } })
    res.status(204).end()
  } catch (err) {
    if ((err as any).code === 'P2025') return res.status(404).json({ error: 'Line item not found' })
    next(err)
  }
})

function mapStatus(s: 'paid'|'unpaid'|'overdue') {
  return s === 'paid' ? 'PAID' : s === 'overdue' ? 'OVERDUE' : 'UNPAID'
}

