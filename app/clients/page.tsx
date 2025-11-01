"use client"

import { useInvoice } from "@/contexts/invoice-context"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Plus, Search, Eye, Edit, Trash2, Mail, Phone } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function ClientsPage() {
  const { clients, invoices, deleteClient } = useInvoice()
  const [searchQuery, setSearchQuery] = useState("")
  const [csvText, setCsvText] = useState("")
  const [importOpen, setImportOpen] = useState(false)
  const { toast } = useToast()
  const [isImporting, setIsImporting] = useState(false)

  const handleImport = async () => {
    try {
      setIsImporting(true)
      const rows = parseCsvClients(csvText)
      if (rows.length === 0) {
        toast({ title: "Nothing to import", description: "No valid rows found.", variant: "destructive" })
        return
      }
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''
      if (!token) {
        toast({ title: "Authentication required", description: "Login to import clients.", variant: "destructive" })
        return
      }
      const res = await api.bulkCreateClients(rows, token)
      toast({ title: "Import complete", description: `Imported ${res.count} client(s).` })
      setImportOpen(false)
      setCsvText("")
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    } catch (e: any) {
      toast({ title: "Import failed", description: e?.message || "Unable to import clients.", variant: "destructive" })
    } finally {
      setIsImporting(false)
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getClientInvoiceCount = (clientId: string) => {
    return invoices.filter((inv) => inv.clientId === clientId).length
  }

  const getClientTotalRevenue = (clientId: string) => {
    return invoices
      .filter((inv) => inv.clientId === clientId && inv.status === "paid")
      .reduce((sum, inv) => sum + inv.total, 0)
  }

  const handleDelete = (id: string) => {
    const clientInvoices = invoices.filter((inv) => inv.clientId === id)
    if (clientInvoices.length > 0) {
      alert("Cannot delete client with existing invoices. Please delete or reassign invoices first.")
      return
    }
    if (confirm("Are you sure you want to delete this client?")) {
      deleteClient(id)
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
              <h1 className="text-3xl font-bold text-foreground">Clients</h1>
              <p className="text-muted-foreground">Manage your client relationships</p>
            </div>
            <div className="flex gap-2">
              <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Import</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Clients from CSV</DialogTitle>
                    <DialogDescription>
                      Paste CSV rows below. Each row should have columns in this order:
                      <br />
                      <span className="font-mono">name,email,phone,address</span>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-2">CSV format notes</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Header row is optional.</li>
                      <li>Required: <span className="font-mono">name</span>, <span className="font-mono">email</span>.</li>
                      <li>Optional: <span className="font-mono">phone</span>, <span className="font-mono">address</span>.</li>
                      <li>Example: <span className="font-mono">Jane Doe,jane@example.com,+1 555 000 1111,123 Main St</span></li>
                      <li>You can also upload a <span className="font-mono">.csv</span> file below.</li>
                    </ul>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileSelect}
                      className="text-sm"
                    />
                  </div>
                  <Textarea
                    placeholder="name,email,phone,address\nJohn Smith,john@acme.com,555-1234,123 Tech St"
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    className="min-h-40"
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
                    <Button onClick={handleImport} disabled={isImporting}>{isImporting ? 'Importing...' : 'Import'}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Link href="/clients/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Client
                </Button>
              </Link>
            </div>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name, email, or company..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Clients Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredClients.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No clients found. Add your first client to get started.</p>
              </div>
            ) : (
              filteredClients.map((client) => (
                <Card key={client.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">{client.name}</h3>
                        {client.company && <p className="text-sm text-muted-foreground">{client.company}</p>}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{client.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{client.phone}</span>
                      </div>
                    </div>

                    <div className="mb-4 grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Invoices</p>
                        <p className="text-lg font-semibold text-foreground">{getClientInvoiceCount(client.id)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                        <p className="text-lg font-semibold text-foreground">
                          ${getClientTotalRevenue(client.id).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/clients/${client.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/clients/${client.id}/edit`}>
                        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(client.id)}
                        className="bg-transparent"
                      >
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function parseCsvClients(text: string) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return []
  const looksLikeHeader = /name\s*,\s*email/i.test(lines[0])
  const rows = (looksLikeHeader ? lines.slice(1) : lines)
  const parsed = rows.map((line) => {
    const cols = splitCsvLine(line)
    const [name, email, phone, address] = cols
    return { name: (name||"").trim(), email: (email||"").trim(), phone: (phone||"").trim() || undefined, address: (address||"").trim() || undefined }
  }).filter(r => r.name && r.email)
  return parsed
}

function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') { current += '"'; i++; } else { inQuotes = !inQuotes }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const text = typeof reader.result === 'string' ? reader.result : ''
    setCsvText(text)
  }
  reader.readAsText(file)
}
