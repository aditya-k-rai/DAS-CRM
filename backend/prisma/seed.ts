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

  // 2. Wipe ALL demo tenant data from database
  console.log('🧹 Purging all demo organizations, users, keys, leads, deals, tasks, and activities...');

  await prisma.activity.deleteMany({});
  await prisma.deal.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.roleTransition.deleteMany({});
  await prisma.planUpgradeRequest.deleteMany({});
  await prisma.companyRegistrationKey.deleteMany({});
  await prisma.userInviteKey.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.stage.deleteMany({});
  await prisma.pipeline.deleteMany({});
  await prisma.leadStatus.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.organization.deleteMany({});

  console.log('✨ Database clean! All demo users, companies, keys, and data purged. Only Super Admin adtyamighty@gmail.com remains.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
