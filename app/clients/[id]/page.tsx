"use client"

import { useInvoice } from "@/contexts/invoice-context"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, Building } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { InvoiceStatus } from "@/lib/types"

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const { getClientById, invoices, deleteClient } = useInvoice()
  const router = useRouter()
  const { toast } = useToast()

  const client = getClientById(params.id)
  const clientInvoices = invoices.filter((inv) => inv.clientId === params.id)

  if (!client) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Client not found</h1>
              <Link href="/clients">
                <Button className="mt-4">Back to Clients</Button>
              </Link>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const totalRevenue = clientInvoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + inv.total, 0)

  const outstandingAmount = clientInvoices
    .filter((inv) => inv.status !== "paid")
    .reduce((sum, inv) => sum + inv.total, 0)

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

  const handleDelete = () => {
    if (clientInvoices.length > 0) {
      alert("Cannot delete client with existing invoices. Please delete or reassign invoices first.")
      return
    }
    if (confirm("Are you sure you want to delete this client?")) {
      deleteClient(client.id)
      toast({
        title: "Client deleted",
        description: "The client has been deleted successfully.",
      })
      router.push("/clients")
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
              <Link href="/clients">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{client.name}</h1>
                <p className="text-muted-foreground">Client details and invoice history</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/clients/${client.id}/edit`}>
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
            {/* Client Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {client.company && (
                    <div className="flex items-start gap-3">
                      <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Company</p>
                        <p className="font-medium text-foreground">{client.company}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium text-foreground">{client.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium text-foreground">{client.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium text-foreground">{client.address}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Invoices</p>
                    <p className="text-2xl font-bold text-foreground">{clientInvoices.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-success">{formatCurrency(totalRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Outstanding</p>
                    <p className="text-2xl font-bold text-warning">{formatCurrency(outstandingAmount)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Invoices */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Invoice History</CardTitle>
                  <Link href={`/invoices/new?clientId=${client.id}`}>
                    <Button size="sm" className="gap-2">
                      <Mail className="h-4 w-4" />
                      New Invoice
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {clientInvoices.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No invoices yet for this client.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b">
                          <tr className="text-left text-sm text-muted-foreground">
                            <th className="pb-3 font-medium">Invoice #</th>
                            <th className="pb-3 font-medium">Date</th>
                            <th className="pb-3 font-medium">Due Date</th>
                            <th className="pb-3 font-medium">Amount</th>
                            <th className="pb-3 font-medium">Status</th>
                            <th className="pb-3 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientInvoices.map((invoice) => (
                            <tr key={invoice.id} className="border-b last:border-0 hover:bg-accent/50">
                              <td className="py-3">
                                <Link
                                  href={`/invoices/${invoice.id}`}
                                  className="font-medium text-primary hover:underline"
                                >
                                  {invoice.invoiceNumber}
                                </Link>
                              </td>
                              <td className="py-3 text-muted-foreground">{formatDate(invoice.date)}</td>
                              <td className="py-3 text-muted-foreground">{formatDate(invoice.dueDate)}</td>
                              <td className="py-3 font-medium text-foreground">{formatCurrency(invoice.total)}</td>
                              <td className="py-3">
                                <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                              </td>
                              <td className="py-3 text-right">
                                <Link href={`/invoices/${invoice.id}`}>
                                  <Button variant="ghost" size="sm">
                                    View
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
