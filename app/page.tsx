"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function HomePage() {
  const router = useRouter()
  
  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          credentials: 'include',
        })
        
        if (!response.ok) {
          // Not authenticated, redirect to login
          router.push('/login')
        } else {
          // Authenticated, redirect to dashboard
          router.push('/dashboard')
        }
      } catch (error) {
        // Error checking auth, redirect to login
        router.push('/login')
      }
    }
    
    checkAuth()
  }, [router])
  
  // Show loading state while checking
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
