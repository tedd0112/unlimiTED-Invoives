'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          credentials: 'include',
        })

        if (!response.ok) {
          router.push('/login')
          return
        }

        const data = await response.json()
        setUser(data.user)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user.email}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Role</CardTitle>
            <CardDescription>Your current role</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{user.role}</p>
          </CardContent>
        </Card>

        {user.tenant && (
          <Card>
            <CardHeader>
              <CardTitle>Tenant</CardTitle>
              <CardDescription>Your organization</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{user.tenant.name}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>User ID</CardTitle>
            <CardDescription>Your unique identifier</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">#{user.id}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <a href="/invoices" className="block text-blue-600 hover:underline">
            View Invoices
          </a>
          <a href="/clients" className="block text-blue-600 hover:underline">
            View Clients
          </a>
        </CardContent>
      </Card>
    </div>
  )
}

