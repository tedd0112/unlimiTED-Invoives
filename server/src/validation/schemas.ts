import { z } from 'zod'

export const clientCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
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

export const authRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const authLoginSchema = authRegisterSchema

