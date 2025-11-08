import { z } from 'zod'

export const clientCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  tenantId: z.number().optional(), // Optional - used by system admin
})

export const clientUpdateSchema = clientCreateSchema.partial()

export const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  total: z.number().nonnegative(),
})

export const invoiceCreateSchema = z.object({
  invoiceNumber: z.string().min(1),
  clientId: z.string().min(1),
  tenantId: z.number().optional(), // Optional - used by system admin
  status: z.enum(['paid', 'unpaid', 'overdue']).default('unpaid'),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  total: z.number().nonnegative(),
  date: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  lineItems: z.array(lineItemSchema)
})

export const invoiceUpdateSchema = invoiceCreateSchema.partial()

export const authLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// Admin schemas
export const createTenantSchema = z.object({
  name: z.string().min(1),
})

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['SYSTEM_ADMIN', 'COMPANY_ADMIN', 'ACCOUNTANT']),
  tenantId: z.number().optional().nullable(),
})

