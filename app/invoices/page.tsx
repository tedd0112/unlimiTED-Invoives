"use client"

import { useInvoice } from "@/contexts/invoice-context"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter, Eye, Edit, Trash2 } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import { useState } from "react"
import type { InvoiceStatus } from "@/lib/types"

export default function InvoicesPage() {
  const { invoices, clients, deleteInvoice } = useInvoice()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all")

  const filteredInvoices = invoices.filter((invoice) => {
    const client = clients.find((c) => c.id === invoice.clientId)
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client?.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
    return matchesSearch && matchesStatus
  })

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

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      deleteInvoice(id)
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
              <p className="text-muted-foreground">Manage and track all your invoices</p>
            </div>
            <Link href="/invoices/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Invoice
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[250px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by invoice number or client..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as InvoiceStatus | "all")}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Invoices Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="p-4 font-medium">Invoice #</th>
                      <th className="p-4 font-medium">Client</th>
                      <th className="p-4 font-medium">Issue Date</th>
                      <th className="p-4 font-medium">Due Date</th>
                      <th className="p-4 font-medium">Amount</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          No invoices found. Create your first invoice to get started.
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((invoice) => {
                        const client = clients.find((c) => c.id === invoice.clientId)
                        return (
                          <tr key={invoice.id} className="border-b last:border-0 hover:bg-accent/50">
                            <td className="p-4">
                              <Link
                                href={`/invoices/${invoice.id}`}
                                className="font-medium text-primary hover:underline"
                              >
                                {invoice.invoiceNumber}
                              </Link>
                            </td>
                            <td className="p-4 text-foreground">{client?.name || "Unknown"}</td>
                            <td className="p-4 text-muted-foreground">{formatDate(invoice.date)}</td>
                            <td className="p-4 text-muted-foreground">{formatDate(invoice.dueDate)}</td>
                            <td className="p-4 font-medium text-foreground">{formatCurrency(invoice.total)}</td>
                            <td className="p-4">
                              <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                            </td>
                            <td className="p-4">
                              <div className="flex justify-end gap-2">
                                <Link href={`/invoices/${invoice.id}`}>
                                  <Button variant="ghost" size="icon">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Link href={`/invoices/${invoice.id}/edit`}>
                                  <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(invoice.id)}>
                                  <Trash2 className="h-4 w-4 text-danger" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
