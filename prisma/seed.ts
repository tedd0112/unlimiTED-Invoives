import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Handle ES modules path resolution
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env from server directory (where the server runs)
dotenv.config({ path: join(__dirname, '..', 'server', '.env') })
// Also try root .env as fallback
dotenv.config({ path: join(__dirname, '..', '.env') })

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Check for required environment variables
  const systemAdminEmail = process.env.SYSTEM_ADMIN_EMAIL
  const systemAdminPassword = process.env.SYSTEM_ADMIN_PASSWORD

  if (!systemAdminEmail || !systemAdminPassword) {
    throw new Error(
      'Missing required environment variables: SYSTEM_ADMIN_EMAIL and SYSTEM_ADMIN_PASSWORD'
    )
  }

  // Create or update system admin user
  console.log('👤 Creating system admin user...')
  const passwordHash = await bcrypt.hash(systemAdminPassword, 10)

  const systemAdmin = await prisma.user.upsert({
    where: { email: systemAdminEmail },
    update: {
      passwordHash,
      role: Role.SYSTEM_ADMIN,
      tenantId: null,
    },
    create: {
      email: systemAdminEmail,
      passwordHash,
      role: Role.SYSTEM_ADMIN,
      tenantId: null,
    },
  })

  console.log(`✅ System admin created: ${systemAdmin.email} (ID: ${systemAdmin.id})`)

  // Create sample tenant and company admin (optional)
  const createSampleTenant = process.env.CREATE_SAMPLE_TENANT === 'true'

  if (createSampleTenant) {
    console.log('🏢 Creating sample tenant...')
    const sampleTenant = await prisma.tenant.upsert({
      where: { id: 1 },
      update: {
        name: 'Sample Company',
      },
      create: {
        name: 'Sample Company',
      },
    })

    console.log(`✅ Sample tenant created: ${sampleTenant.name} (ID: ${sampleTenant.id})`)

    // Create company admin for sample tenant
    const companyAdminEmail = process.env.SAMPLE_COMPANY_ADMIN_EMAIL || 'admin@sample.com'
    const companyAdminPassword = process.env.SAMPLE_COMPANY_ADMIN_PASSWORD || 'Admin123!'

    console.log('👤 Creating company admin user...')
    const companyAdminHash = await bcrypt.hash(companyAdminPassword, 10)

    const companyAdmin = await prisma.user.upsert({
      where: { email: companyAdminEmail },
      update: {
        passwordHash: companyAdminHash,
        role: Role.COMPANY_ADMIN,
        tenantId: sampleTenant.id,
      },
      create: {
        email: companyAdminEmail,
        passwordHash: companyAdminHash,
        role: Role.COMPANY_ADMIN,
        tenantId: sampleTenant.id,
      },
    })

    console.log(`✅ Company admin created: ${companyAdmin.email} (ID: ${companyAdmin.id})`)

    // Create sample accountant
    const accountantEmail = process.env.SAMPLE_ACCOUNTANT_EMAIL || 'accountant@sample.com'
    const accountantPassword = process.env.SAMPLE_ACCOUNTANT_PASSWORD || 'Accountant123!'

    console.log('👤 Creating accountant user...')
    const accountantHash = await bcrypt.hash(accountantPassword, 10)

    const accountant = await prisma.user.upsert({
      where: { email: accountantEmail },
      update: {
        passwordHash: accountantHash,
        role: Role.ACCOUNTANT,
        tenantId: sampleTenant.id,
      },
      create: {
        email: accountantEmail,
        passwordHash: accountantHash,
        role: Role.ACCOUNTANT,
        tenantId: sampleTenant.id,
      },
    })

    console.log(`✅ Accountant created: ${accountant.email} (ID: ${accountant.id})`)
  }

  console.log('✨ Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

