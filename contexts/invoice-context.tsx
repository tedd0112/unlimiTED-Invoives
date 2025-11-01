"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { mockInvoices, mockClients } from "@/lib/mock-data"
import { api } from "@/lib/api"
import type { Invoice, Client } from "@/lib/types"

interface InvoiceContextType {
  invoices: Invoice[]
  clients: Client[]
  addInvoice: (invoice: Omit<Invoice, "id">) => void
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void
  deleteInvoice: (id: string) => void
  addClient: (client: Omit<Client, "id">) => void
  updateClient: (id: string, client: Partial<Client>) => void
  deleteClient: (id: string) => void
  getInvoiceById: (id: string) => Invoice | undefined
  getClientById: (id: string) => Client | undefined
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined)

export function InvoiceProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])

  // Initial load: try API; fallback to localStorage; then to mocks
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [clientsRes, invoicesRes] = await Promise.all([
          api.getClients(),
          api.getInvoices(),
        ])
        if (!cancelled) {
          setClients(clientsRes)
          setInvoices(normalizeInvoicesFromApi(invoicesRes))
        }
      } catch {
        const savedInvoices = typeof window !== 'undefined' ? localStorage.getItem("invoices") : null
        const savedClients = typeof window !== 'undefined' ? localStorage.getItem("clients") : null
        if (!cancelled) {
          setInvoices(savedInvoices ? JSON.parse(savedInvoices) : mockInvoices)
          setClients(savedClients ? JSON.parse(savedClients) : mockClients)
        }
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (invoices.length > 0) {
      localStorage.setItem("invoices", JSON.stringify(invoices))
    }
  }, [invoices])

  useEffect(() => {
    if (clients.length > 0) {
      localStorage.setItem("clients", JSON.stringify(clients))
    }
  }, [clients])

  const addInvoice = (invoice: Omit<Invoice, "id">) => {
    const newInvoice = { ...invoice, id: `INV-${Date.now()}` }
    setInvoices((prev) => [newInvoice, ...prev])
    // fire-and-forget API create if available
    void (async () => {
      try {
        const token = localStorage.getItem('token') || ''
        await api.createInvoice(serializeInvoiceForApi(newInvoice), token)
      } catch {}
    })()
  }

  const updateInvoice = (id: string, updatedInvoice: Partial<Invoice>) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, ...updatedInvoice } : inv)))
    void (async () => {
      try {
        const token = localStorage.getItem('token') || ''
        await api.updateInvoice(id, serializeInvoiceForApi({ ...(getInvoiceById(id) as Invoice), ...updatedInvoice } as Invoice), token)
      } catch {}
    })()
  }

  const deleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id))
    void (async () => {
      try { const token = localStorage.getItem('token') || ''
        await api.deleteInvoice(id, token)
      } catch {}
    })()
  }

  const addClient = (client: Omit<Client, "id">) => {
    const newClient = { ...client, id: `CLI-${Date.now()}` }
    setClients((prev) => [newClient, ...prev])
    void (async () => {
      try { const token = localStorage.getItem('token') || ''
        await api.createClient(newClient, token)
      } catch {}
    })()
  }

  const updateClient = (id: string, updatedClient: Partial<Client>) => {
    setClients((prev) => prev.map((cli) => (cli.id === id ? { ...cli, ...updatedClient } : cli)))
    void (async () => {
      try { const token = localStorage.getItem('token') || ''
        await api.updateClient(id, updatedClient, token)
      } catch {}
    })()
  }

  const deleteClient = (id: string) => {
    setClients((prev) => prev.filter((cli) => cli.id !== id))
    void (async () => {
      try { const token = localStorage.getItem('token') || ''
        await api.deleteClient(id, token)
      } catch {}
    })()
  }

  const getInvoiceById = (id: string) => {
    return invoices.find((inv) => inv.id === id)
  }

  const getClientById = (id: string) => {
    return clients.find((cli) => cli.id === id)
  }

  return (
    <InvoiceContext.Provider
      value={{
        invoices,
        clients,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        addClient,
        updateClient,
        deleteClient,
        getInvoiceById,
        getClientById,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  )
}

export function useInvoice() {
  const context = useContext(InvoiceContext)
  if (context === undefined) {
    throw new Error("useInvoice must be used within an InvoiceProvider")
  }
  return context
}

function normalizeInvoicesFromApi(raw: any[]): Invoice[] {
  return raw.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    clientId: inv.clientId,
    date: inv.date ? new Date(inv.date).toISOString().slice(0,10) : "",
    dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().slice(0,10) : "",
    status: inv.status === 'PAID' ? 'paid' : inv.status === 'OVERDUE' ? 'overdue' : 'unpaid',
    lineItems: (inv.lineItems || []).map((li: any) => ({
      id: li.id,
      description: li.description,
      quantity: Number(li.quantity),
      unitPrice: Number(li.unitPrice),
      total: Number(li.total),
    })),
    subtotal: Number(inv.subtotal),
    // derive rate if possible (avoid division by zero)
    taxRate: Number(inv.subtotal) > 0 ? Number(inv.tax) / Number(inv.subtotal) * 100 : 0,
    taxAmount: Number(inv.tax),
    discount: Number(inv.discount),
    total: Number(inv.total),
    notes: inv.notes || undefined,
  }))
}

function serializeInvoiceForApi(invoice: Invoice) {
  return {
    invoiceNumber: invoice.invoiceNumber,
    clientId: invoice.clientId,
    status: invoice.status,
    subtotal: invoice.subtotal,
    tax: invoice.taxAmount,
    discount: invoice.discount,
    total: invoice.total,
    date: invoice.date,
    dueDate: invoice.dueDate,
    notes: invoice.notes,
    lineItems: invoice.lineItems,
  }
}
