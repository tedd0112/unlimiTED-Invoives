"use client"

import { Bell, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { notificationManager, type Notification } from "@/lib/notifications"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

export function Header() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setNotifications(notificationManager.getNotifications())
    setUnreadCount(notificationManager.getUnreadCount())

    const unsubscribe = notificationManager.subscribe((newNotifications) => {
      setNotifications(newNotifications)
      setUnreadCount(notificationManager.getUnreadCount())
    })

    return unsubscribe
  }, [])

  const handleMarkAllRead = () => {
    notificationManager.markAllAsRead()
  }

  const handleDeleteNotification = (id: string) => {
    notificationManager.deleteNotification(id)
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "invoice_created":
        return "📄"
      case "invoice_paid":
        return "✅"
      case "invoice_overdue":
        return "⚠️"
      case "client_added":
        return "👤"
      default:
        return "🔔"
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Search invoices, clients..." className="pl-10" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="end">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs">
                  Mark all read
                </Button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="mx-auto h-12 w-12 mb-2 opacity-20" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-b p-4 hover:bg-accent/50 ${!notification.read ? "bg-accent/20" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm text-foreground">{notification.title}</p>
                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatDate(notification.timestamp)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDeleteNotification(notification.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        {notification.invoiceId && (
                          <Link
                            href={`/invoices/${notification.invoiceId}`}
                            onClick={() => {
                              notificationManager.markAsRead(notification.id)
                              setIsOpen(false)
                            }}
                          >
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs mt-1">
                              View Invoice →
                            </Button>
                          </Link>
                        )}
                        {notification.clientId && (
                          <Link
                            href={`/clients/${notification.clientId}`}
                            onClick={() => {
                              notificationManager.markAsRead(notification.id)
                              setIsOpen(false)
                            }}
                          >
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs mt-1">
                              View Client →
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary" />
          <div className="text-sm">
            <div className="font-medium">Admin User</div>
            <div className="text-muted-foreground">admin@invoiceflow.com</div>
          </div>
        </div>
      </div>
    </header>
  )
}
