"use client"

import { useInvoice } from "@/contexts/invoice-context"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ClientForm } from "@/components/clients/client-form"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { Client } from "@/lib/types"
import { notificationManager } from "@/lib/notifications"

export default function NewClientPage() {
  const { addClient } = useInvoice()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = (client: Omit<Client, "id">) => {
    addClient(client)
    toast({
      title: "Client added",
      description: `${client.name} has been added successfully.`,
    })

    notificationManager.notifyClientAdded({ ...client, id: `CLI-${Date.now()}` })

    router.push("/clients")
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Add New Client</h1>
            <p className="text-muted-foreground">Fill in the client details</p>
          </div>
          <ClientForm onSubmit={handleSubmit} />
        </main>
      </div>
    </div>
  )
}
