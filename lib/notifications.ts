import type { Invoice, Client } from "./types"

export interface Notification {
  id: string
  type: "invoice_created" | "invoice_paid" | "invoice_overdue" | "client_added"
  title: string
  message: string
  timestamp: string
  read: boolean
  invoiceId?: string
  clientId?: string
}

class NotificationManager {
  private notifications: Notification[] = []
  private listeners: Array<(notifications: Notification[]) => void> = []

  constructor() {
    // Load notifications from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("notifications")
      if (saved) {
        this.notifications = JSON.parse(saved)
      }
    }
  }

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.notifications))
    if (typeof window !== "undefined") {
      localStorage.setItem("notifications", JSON.stringify(this.notifications))
    }
  }

  addNotification(notification: Omit<Notification, "id" | "timestamp" | "read">) {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    }
    this.notifications = [newNotification, ...this.notifications]
    this.notify()
  }

  markAsRead(id: string) {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    this.notify()
  }

  markAllAsRead() {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }))
    this.notify()
  }

  deleteNotification(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id)
    this.notify()
  }

  getNotifications() {
    return this.notifications
  }

  getUnreadCount() {
    return this.notifications.filter((n) => !n.read).length
  }

  // Helper methods for common notifications
  notifyInvoiceCreated(invoice: Invoice, client: Client) {
    this.addNotification({
      type: "invoice_created",
      title: "Invoice Created",
      message: `Invoice ${invoice.invoiceNumber} created for ${client.name}`,
      invoiceId: invoice.id,
    })
  }

  notifyInvoicePaid(invoice: Invoice, client: Client) {
    this.addNotification({
      type: "invoice_paid",
      title: "Payment Received",
      message: `Invoice ${invoice.invoiceNumber} from ${client.name} has been paid`,
      invoiceId: invoice.id,
    })
  }

  notifyInvoiceOverdue(invoice: Invoice, client: Client) {
    this.addNotification({
      type: "invoice_overdue",
      title: "Invoice Overdue",
      message: `Invoice ${invoice.invoiceNumber} for ${client.name} is overdue`,
      invoiceId: invoice.id,
    })
  }

  notifyClientAdded(client: Client) {
    this.addNotification({
      type: "client_added",
      title: "Client Added",
      message: `${client.name} has been added to your clients`,
      clientId: client.id,
    })
  }
}

export const notificationManager = new NotificationManager()
