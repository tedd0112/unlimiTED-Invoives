export type InvoiceStatus = "paid" | "unpaid" | "overdue"

export interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  clientId: string
  date: string
  dueDate: string
  status: InvoiceStatus
  lineItems: LineItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  discount: number
  total: number
  notes?: string
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
  company?: string
}
