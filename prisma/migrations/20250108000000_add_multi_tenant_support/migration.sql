-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SYSTEM_ADMIN', 'COMPANY_ADMIN', 'ACCOUNTANT');

-- CreateTable
CREATE TABLE IF NOT EXISTS "Tenant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- Create a default tenant for existing data
INSERT INTO "Tenant" ("name", "createdAt", "updatedAt")
SELECT 'Default Tenant', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Tenant" WHERE "name" = 'Default Tenant');

-- AlterTable: Update User table
-- Add new columns
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" "Role";
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;

-- Set default role for existing users
UPDATE "User" SET "role" = 'ACCOUNTANT'::"Role" WHERE "role" IS NULL;

-- Make role NOT NULL after setting defaults
ALTER TABLE "User" ALTER COLUMN "role" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ACCOUNTANT'::"Role";

-- Migrate existing password to passwordHash
UPDATE "User" SET "passwordHash" = "password" WHERE "passwordHash" IS NULL AND "password" IS NOT NULL;

-- Set default tenant for existing users
UPDATE "User" 
SET "tenantId" = (SELECT id FROM "Tenant" WHERE "name" = 'Default Tenant' LIMIT 1) 
WHERE "tenantId" IS NULL;

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'User_tenantId_fkey'
    ) THEN
        ALTER TABLE "User" 
        ADD CONSTRAINT "User_tenantId_fkey" 
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AlterTable: Update Client table
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;

-- Set default tenant for existing clients
UPDATE "Client" 
SET "tenantId" = (SELECT id FROM "Tenant" WHERE "name" = 'Default Tenant' LIMIT 1) 
WHERE "tenantId" IS NULL;

-- Make tenantId NOT NULL after setting defaults
ALTER TABLE "Client" ALTER COLUMN "tenantId" SET NOT NULL;

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Client_tenantId_fkey'
    ) THEN
        ALTER TABLE "Client" 
        ADD CONSTRAINT "Client_tenantId_fkey" 
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AlterTable: Update Invoice table
-- Add tenantId column
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;

-- Set default tenant for existing invoices
UPDATE "Invoice" 
SET "tenantId" = (SELECT id FROM "Tenant" WHERE "name" = 'Default Tenant' LIMIT 1) 
WHERE "tenantId" IS NULL;

-- Make tenantId NOT NULL after setting defaults
ALTER TABLE "Invoice" ALTER COLUMN "tenantId" SET NOT NULL;

-- Drop old unique constraint on invoiceNumber if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Invoice_invoiceNumber_key'
    ) THEN
        ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_invoiceNumber_key";
    END IF;
END $$;

-- Add new composite unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNumber_tenantId_key" 
ON "Invoice"("invoiceNumber", "tenantId");

-- Add index on tenantId for performance
CREATE INDEX IF NOT EXISTS "Invoice_tenantId_idx" ON "Invoice"("tenantId");

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Invoice_tenantId_fkey'
    ) THEN
        ALTER TABLE "Invoice" 
        ADD CONSTRAINT "Invoice_tenantId_fkey" 
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Drop old password column if it exists (after migration)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'password'
    ) THEN
        ALTER TABLE "User" DROP COLUMN "password";
    END IF;
END $$;
