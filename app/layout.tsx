import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { InvoiceProvider } from "@/contexts/invoice-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "InvoiceFlow - Professional Invoicing System",
  description: "Modern invoicing and client management system",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <InvoiceProvider>
          {children}
          <Toaster />
        </InvoiceProvider>
      </body>
    </html>
  )
}
