import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning demo data while preserving Super Admin adtyamighty@gmail.com...');

  // 1. Ensure Super Admin exists
  const superAdminEmail = 'adtyamighty@gmail.com';
  let superAdmin = await prisma.superAdmin.findUnique({
    where: { email: superAdminEmail },
  });

  if (!superAdmin) {
    superAdmin = await prisma.superAdmin.create({
      data: {
        email: superAdminEmail,
        name: 'Aditya Rai (Super Admin)',
        isActive: true,
      },
    });
    console.log(`✅ Super Admin created: ${superAdminEmail}`);
  } else {
    console.log(`✅ Super Admin verified: ${superAdminEmail}`);
  }

  // 2. Wipe dummy leads, contacts, deals, activities if any exist
  await prisma.activity.deleteMany({});
  await prisma.deal.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.task.deleteMany({});

  console.log('✨ Demo leads, contacts, deals, activities, and tasks cleaned successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
