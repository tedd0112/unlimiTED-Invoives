const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(msg || `Request failed: ${res.status}`)
  }
  return res.json()
}

export const api = {
  getClients: () => request('/api/clients'),
  getClient: (id: string) => request(`/api/clients/${id}`),
  createClient: (data: any, token: string) => request('/api/clients', { method: 'POST', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } }),
  updateClient: (id: string, data: any, token: string) => request(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } }),
  deleteClient: (id: string, token: string) => request(`/api/clients/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  bulkCreateClients: (rows: any[], token: string) => request('/api/clients/bulk', { method: 'POST', body: JSON.stringify(rows), headers: { Authorization: `Bearer ${token}` } }),

  getInvoices: () => request('/api/invoices'),
  getInvoice: (id: string) => request(`/api/invoices/${id}`),
  createInvoice: (data: any, token: string) => request('/api/invoices', { method: 'POST', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } }),
  updateInvoice: (id: string, data: any, token: string) => request(`/api/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } }),
  deleteInvoice: (id: string, token: string) => request(`/api/invoices/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  markStatus: (id: string, status: 'paid'|'unpaid'|'overdue', token: string) => request(`/api/invoices/${id}/mark`, { method: 'POST', body: JSON.stringify({ status }), headers: { Authorization: `Bearer ${token}` } }),
}

export type ApiClient = typeof api

