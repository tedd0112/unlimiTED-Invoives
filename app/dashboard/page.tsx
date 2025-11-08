import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

async function getCurrentUser() {
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      credentials: 'include',
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const userData = await getCurrentUser()

  if (!userData || !userData.user) {
    redirect('/login')
  }

  const { user } = userData

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

