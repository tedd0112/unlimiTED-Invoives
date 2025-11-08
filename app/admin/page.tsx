import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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

    const data = await response.json()
    
    // Verify user is system admin
    if (data.user.role !== 'SYSTEM_ADMIN') {
      return null
    }

    return data
  } catch {
    return null
  }
}

export default async function AdminPage() {
  const userData = await getCurrentUser()

  if (!userData || !userData.user) {
    redirect('/login')
  }

  const { user } = userData

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

