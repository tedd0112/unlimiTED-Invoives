"use client"

import { useInvoice } from "@/contexts/invoice-context"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { InvoiceForm } from "@/components/invoices/invoice-form"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { Invoice } from "@/lib/types"
import { notificationManager } from "@/lib/notifications"

export default function NewInvoicePage() {
  const { addInvoice, getClientById } = useInvoice()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = (invoice: Omit<Invoice, "id">) => {
    addInvoice(invoice)
    toast({
      title: "Invoice created",
      description: `Invoice ${invoice.invoiceNumber} has been created successfully.`,
    })

    const client = getClientById(invoice.clientId)
    if (client) {
      notificationManager.notifyInvoiceCreated({ ...invoice, id: `INV-${Date.now()}` }, client)
    }

    router.push("/invoices")
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Create New Invoice</h1>
            <p className="text-muted-foreground">Fill in the details to create a new invoice</p>
          </div>
          <InvoiceForm onSubmit={handleSubmit} />
        </main>
      </div>
    </div>
  )
}
