"use client"

import { useInvoice } from "@/contexts/invoice-context"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ClientForm } from "@/components/clients/client-form"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Client } from "@/lib/types"

export default function EditClientPage({ params }: { params: { id: string } }) {
  const { getClientById, updateClient } = useInvoice()
  const router = useRouter()
  const { toast } = useToast()

  const client = getClientById(params.id)

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

  const handleSubmit = (updatedClient: Omit<Client, "id">) => {
    updateClient(client.id, updatedClient)
    toast({
      title: "Client updated",
      description: `${updatedClient.name} has been updated successfully.`,
    })
    router.push(`/clients/${client.id}`)
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Edit Client</h1>
            <p className="text-muted-foreground">Update client information</p>
          </div>
          <ClientForm client={client} onSubmit={handleSubmit} />
        </main>
      </div>
    </div>
  )
}
