'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function AdminPage() {
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
        
        // Verify user is system admin
        if (data.user.role !== 'SYSTEM_ADMIN') {
          router.push('/dashboard')
          return
        }

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
        <h1 className="text-3xl font-bold">System Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome, {user.email}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Manage Tenants</CardTitle>
            <CardDescription>Create and manage tenant organizations</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Use the API endpoints to create tenants:
            </p>
            <code className="block p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm mb-4">
              POST /admin/tenants
            </code>
            <p className="text-sm text-muted-foreground">
              Body: {`{ "name": "Company Name" }`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manage Users</CardTitle>
            <CardDescription>Create user accounts for tenants</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Use the API endpoints to create users:
            </p>
            <code className="block p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm mb-4">
              POST /admin/users
            </code>
            <p className="text-sm text-muted-foreground">
              Body: {`{ "email": "user@example.com", "password": "password", "role": "COMPANY_ADMIN", "tenantId": 1 }`}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Your system admin account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="font-semibold">Email: </span>
            <span>{user.email}</span>
          </div>
          <div>
            <span className="font-semibold">Role: </span>
            <span>{user.role}</span>
          </div>
          <div>
            <span className="font-semibold">User ID: </span>
            <span>#{user.id}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

