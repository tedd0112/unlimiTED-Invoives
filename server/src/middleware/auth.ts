import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Define Role type (matches Prisma enum)
type Role = 'SYSTEM_ADMIN' | 'COMPANY_ADMIN' | 'ACCOUNTANT'

// Role constants for comparison
const Role = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN' as const,
  COMPANY_ADMIN: 'COMPANY_ADMIN' as const,
  ACCOUNTANT: 'ACCOUNTANT' as const,
}

export interface AuthRequest extends Request {
  user?: {
    userId: number
    email: string
    role: Role
    tenantId: number | null
  }
}

// Extract JWT token from cookie or Authorization header
function extractToken(req: Request): string | null {
  // Try cookie first (preferred for httpOnly security)
  const token = req.cookies?.token
  if (token) return token

  // Fallback to Authorization header
  const auth = req.headers.authorization
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7)
  }

  return null
}

// Middleware to authenticate user and set req.user
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractToken(req)
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as {
      userId: number
      email: string
      role: Role
      tenantId: number | null
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
    }

    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Middleware to require specific roles
export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' })
    }

    next()
  }
}

// Convenience middleware for system admin only
export function requireSystemAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  return requireRole(Role.SYSTEM_ADMIN)(req, res, next)
}

// Middleware to require tenant context (for tenant-scoped operations)
export function requireTenant(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // System admin can access without tenant
  if (req.user.role === Role.SYSTEM_ADMIN) {
    return next()
  }

  // Other roles must have a tenant
  if (!req.user.tenantId) {
    return res.status(403).json({ error: 'Forbidden - Tenant context required' })
  }

  next()
}

