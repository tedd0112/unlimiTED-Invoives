"use client"

import { useInvoice } from "@/contexts/invoice-context"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowLeft, Download, Edit, Trash2, Mail } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { InvoiceStatus } from "@/lib/types"
import { generateInvoicePDF, downloadPDF } from "@/lib/pdf-generator"
import { notificationManager } from "@/lib/notifications"

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const { getInvoiceById, getClientById, deleteInvoice } = useInvoice()
  const router = useRouter()
  const { toast } = useToast()

  const invoice = getInvoiceById(params.id)
  const client = invoice ? getClientById(invoice.clientId) : null

  if (!invoice || !client) {
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

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case "paid":
        return "bg-success text-success-foreground"
      case "unpaid":
        return "bg-warning text-warning-foreground"
      case "overdue":
        return "bg-danger text-danger-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const handleDownload = async () => {
    if (!invoice || !client) return

    try {
      const pdfBlob = await generateInvoicePDF(invoice, client)
      downloadPDF(pdfBlob, `invoice-${invoice.invoiceNumber}.html`)
      toast({
        title: "Download started",
        description: "Your invoice has been downloaded successfully.",
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error generating the PDF.",
        variant: "destructive",
      })
    }
  }

  const handleSendEmail = () => {
    if (!invoice || !client) return

    toast({
      title: "Email sent",
      description: `Invoice has been sent to ${client.email}`,
    })

    // In a real app, this would send an actual email
    notificationManager.addNotification({
      type: "invoice_created",
      title: "Invoice Sent",
      message: `Invoice ${invoice.invoiceNumber} sent to ${client.email}`,
      invoiceId: invoice.id,
    })
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      deleteInvoice(invoice.id)
      toast({
        title: "Invoice deleted",
        description: "The invoice has been deleted successfully.",
      })
      router.push("/invoices")
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/invoices">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{invoice.invoiceNumber}</h1>
                <p className="text-muted-foreground">Invoice details and information</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSendEmail} className="gap-2 bg-transparent">
                <Mail className="h-4 w-4" />
                Send Email
              </Button>
              <Button variant="outline" onClick={handleDownload} className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Link href={`/invoices/${invoice.id}/edit`}>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Button variant="outline" onClick={handleDelete} className="gap-2 bg-transparent">
                <Trash2 className="h-4 w-4 text-danger" />
                Delete
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Invoice Preview */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-8">
                  {/* Header */}
                  <div className="mb-8 flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">INVOICE</h2>
                      <p className="text-sm text-muted-foreground">{invoice.invoiceNumber}</p>
                    </div>
                    <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                  </div>

                  {/* Dates */}
                  <div className="mb-8 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Issue Date</p>
                      <p className="font-medium text-foreground">{formatDate(invoice.date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                      <p className="font-medium text-foreground">{formatDate(invoice.dueDate)}</p>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="mb-8">
                    <p className="mb-2 text-sm text-muted-foreground">Bill To</p>
                    <div className="rounded-lg bg-muted/50 p-4">
                      <p className="font-semibold text-foreground">{client.name}</p>
                      {client.company && <p className="text-sm text-muted-foreground">{client.company}</p>}
                      <p className="text-sm text-muted-foreground">{client.email}</p>
                      <p className="text-sm text-muted-foreground">{client.phone}</p>
                      <p className="text-sm text-muted-foreground">{client.address}</p>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="mb-8">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr className="text-left text-sm text-muted-foreground">
                          <th className="pb-3 font-medium">Description</th>
                          <th className="pb-3 font-medium text-right">Qty</th>
                          <th className="pb-3 font-medium text-right">Price</th>
                          <th className="pb-3 font-medium text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.lineItems.map((item) => (
                          <tr key={item.id} className="border-b last:border-0">
                            <td className="py-3 text-foreground">{item.description}</td>
                            <td className="py-3 text-right text-muted-foreground">{item.quantity}</td>
                            <td className="py-3 text-right text-muted-foreground">{formatCurrency(item.unitPrice)}</td>
                            <td className="py-3 text-right font-medium text-foreground">
                              {formatCurrency(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="text-foreground">{formatCurrency(invoice.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span>
                        <span className="text-foreground">{formatCurrency(invoice.taxAmount)}</span>
                      </div>
                      {invoice.discount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Discount</span>
                          <span className="text-foreground">-{formatCurrency(invoice.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t pt-2 text-lg font-bold">
                        <span className="text-foreground">Total</span>
                        <span className="text-foreground">{formatCurrency(invoice.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {invoice.notes && (
                    <div className="mt-8 rounded-lg bg-muted/50 p-4">
                      <p className="mb-1 text-sm font-medium text-foreground">Notes</p>
                      <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(invoice.total)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Items</p>
                    <p className="font-medium text-foreground">{invoice.lineItems.length} items</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Client Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium text-foreground">{client.name}</p>
                  </div>
                  {client.company && (
                    <div>
                      <p className="text-sm text-muted-foreground">Company</p>
                      <p className="font-medium text-foreground">{client.company}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">{client.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium text-foreground">{client.phone}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
