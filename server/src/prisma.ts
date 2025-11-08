import { PrismaClient } from '@prisma/client'

// Base Prisma client instance
export const prisma = new PrismaClient()

// Helper to create tenant-scoped where clause
export function withTenant<T extends { where?: any }>(
  args: T,
  tenantId: number | null | undefined,
  enforceTenant: boolean = true
): T {
  // If tenantId is null (system admin), don't filter
  if (tenantId === null) {
    return args
  }

  // If tenantId is undefined and enforcement is required, throw error
  if (tenantId === undefined && enforceTenant) {
    throw new Error('Missing tenantId in context for tenant-scoped operation. Ensure user is authenticated and has a tenant.')
  }

  // Add tenantId to where clause if it doesn't already exist
  if (tenantId !== undefined && tenantId !== null) {
    return {
      ...args,
      where: {
        ...args.where,
        tenantId,
      },
    } as T
  }

  return args
}

