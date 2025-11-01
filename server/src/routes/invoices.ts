import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../prisma.js'
import { invoiceCreateSchema, invoiceUpdateSchema, lineItemSchema } from '../validation/schemas.js'
import { requireAuth } from '../middleware/auth.js'

export const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: { lineItems: true }
    })
    res.json(invoices)
  } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { lineItems: true }
    })
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    res.json(invoice)
  } catch (err) { next(err) }
})

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = invoiceCreateSchema.parse(req.body)
    const created = await prisma.invoice.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        clientId: data.clientId,
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
      include: { lineItems: true }
    })
    res.status(201).json(created)
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors })
    next(err)
  }
})

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const data = invoiceUpdateSchema.parse(req.body)
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
      include: { lineItems: true }
    })
    res.json(updated)
  } catch (err) {
    if ((err as any).code === 'P2025') return res.status(404).json({ error: 'Invoice not found' })
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors })
    next(err)
  }
})

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await prisma.invoice.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) {
    if ((err as any).code === 'P2025') return res.status(404).json({ error: 'Invoice not found' })
    next(err)
  }
})

router.post('/:id/mark', requireAuth, async (req, res, next) => {
  try {
    const status = z.enum(['paid','unpaid','overdue']).parse(req.body.status)
    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: mapStatus(status) },
      include: { lineItems: true }
    })
    res.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors })
    if ((err as any).code === 'P2025') return res.status(404).json({ error: 'Invoice not found' })
    next(err)
  }
})

router.post('/:id/line-items', requireAuth, async (req, res, next) => {
  try {
    const li = lineItemSchema.parse(req.body)
    const created = await prisma.lineItem.create({ data: { ...li, invoiceId: req.params.id } })
    res.status(201).json(created)
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors })
    next(err)
  }
})

router.put('/:id/line-items/:lineItemId', requireAuth, async (req, res, next) => {
  try {
    const li = lineItemSchema.partial().parse(req.body)
    const updated = await prisma.lineItem.update({ where: { id: req.params.lineItemId }, data: li })
    res.json(updated)
  } catch (err) {
    if ((err as any).code === 'P2025') return res.status(404).json({ error: 'Line item not found' })
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors })
    next(err)
  }
})

router.delete('/:id/line-items/:lineItemId', requireAuth, async (req, res, next) => {
  try {
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

