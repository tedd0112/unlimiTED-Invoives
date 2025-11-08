const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    credentials: 'include', // Include cookies for authentication
    ...options,
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(msg || `Request failed: ${res.status}`)
  }
  return res.json()
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    request<{ user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<{ user: any }>('/auth/me'),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
}

// Main API (requires authentication via cookies)
export const api = {
  getClients: () => request('/api/clients'),
  getClient: (id: string) => request(`/api/clients/${id}`),
  createClient: (data: any) => request('/api/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id: string, data: any) => request(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClient: (id: string) => request(`/api/clients/${id}`, { method: 'DELETE' }),
  bulkCreateClients: (rows: any[]) => request('/api/clients/bulk', { method: 'POST', body: JSON.stringify(rows) }),

  getInvoices: () => request('/api/invoices'),
  getInvoice: (id: string) => request(`/api/invoices/${id}`),
  createInvoice: (data: any) => request('/api/invoices', { method: 'POST', body: JSON.stringify(data) }),
  updateInvoice: (id: string, data: any) => request(`/api/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInvoice: (id: string) => request(`/api/invoices/${id}`, { method: 'DELETE' }),
  markStatus: (id: string, status: 'paid'|'unpaid'|'overdue') => request(`/api/invoices/${id}/mark`, { method: 'POST', body: JSON.stringify({ status }) }),
}

export type ApiClient = typeof api

