import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create a test organization
  const organization = await prisma.organization.upsert({
    where: { id: 'test-org-1' },
    update: {},
    create: {
      id: 'test-org-1',
      name: 'Test Organization',
      plan: 'FREE',
    },
  })

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'test@flowcraft.io' },
    update: {},
    create: {
      email: 'test@flowcraft.io',
      name: 'Test User',
      passwordHash: 'hashed-password',
      organizationId: organization.id,
      role: 'ADMIN',
    },
  })

  // Create some test connectors
  const connectors = await Promise.all([
    prisma.connector.upsert({
      where: { name: 'http' },
      update: {},
      create: {
        name: 'http',
        category: 'core',
        version: '1.0.0',
        definition: {
          name: 'HTTP Request',
          description: 'Make HTTP requests',
          config: {
            method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
            url: { type: 'string' },
            headers: { type: 'object' },
            body: { type: 'object' },
          },
        },
      },
    }),
    prisma.connector.upsert({
      where: { name: 'slack' },
      update: {},
      create: {
        name: 'slack',
        category: 'communication',
        version: '1.0.0',
        definition: {
          name: 'Slack',
          description: 'Send messages to Slack',
          config: {
            channel: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    }),
  ])

  console.log('✅ Database seeded successfully!')
  console.log(`📊 Created:`)
  console.log(`  - Organization: ${organization.name}`)
  console.log(`  - User: ${user.name} (${user.email})`)
  console.log(`  - Connectors: ${connectors.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 