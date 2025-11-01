import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../prisma.js'
import { clientCreateSchema, clientUpdateSchema } from '../validation/schemas.js'
import { requireAuth } from '../middleware/auth.js'

export const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const clients = await prisma.client.findMany({ orderBy: { createdAt: 'desc' } })
    res.json(clients)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const client = await prisma.client.findUnique({ where: { id: req.params.id } })
    if (!client) return res.status(404).json({ error: 'Client not found' })
    res.json(client)
  } catch (err) {
    next(err)
  }
})

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = clientCreateSchema.parse(req.body)
    const created = await prisma.client.create({ data })
    res.status(201).json(created)
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors })
    next(err)
  }
})

// Bulk import clients
router.post('/bulk', requireAuth, async (req, res, next) => {
  try {
    const arraySchema = z.array(clientCreateSchema).min(1).max(1000)
    const clients = arraySchema.parse(req.body)

    // createMany ignores duplicates beyond unique constraints; here no unique on email in schema
    const created = await prisma.client.createMany({ data: clients, skipDuplicates: false })
    res.status(201).json({ count: created.count })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors })
    next(err)
  }
})

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const data = clientUpdateSchema.parse(req.body)
    const updated = await prisma.client.update({ where: { id: req.params.id }, data })
    res.json(updated)
  } catch (err) {
    if ((err as any).code === 'P2025') return res.status(404).json({ error: 'Client not found' })
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors })
    next(err)
  }
})

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await prisma.client.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) {
    if ((err as any).code === 'P2025') return res.status(404).json({ error: 'Client not found' })
    next(err)
  }
})

