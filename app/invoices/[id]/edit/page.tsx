"use client"

import { useInvoice } from "@/contexts/invoice-context"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { InvoiceForm } from "@/components/invoices/invoice-form"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Invoice } from "@/lib/types"

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  const { getInvoiceById, updateInvoice } = useInvoice()
  const router = useRouter()
  const { toast } = useToast()

  const invoice = getInvoiceById(params.id)

  if (!invoice) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Invoice not found</h1>
              <Link href="/invoices">
                <Button className="mt-4">Back to Invoices</Button>
              </Link>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const handleSubmit = (updatedInvoice: Omit<Invoice, "id">) => {
    updateInvoice(invoice.id, updatedInvoice)
    toast({
      title: "Invoice updated",
      description: `Invoice ${updatedInvoice.invoiceNumber} has been updated successfully.`,
    })
    router.push(`/invoices/${invoice.id}`)
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Edit Invoice</h1>
            <p className="text-muted-foreground">Update invoice details</p>
          </div>
          <InvoiceForm invoice={invoice} onSubmit={handleSubmit} />
        </main>
      </div>
    </div>
  )
}
