const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Updating company registration keys to 4-letter prefix (ADOR-EC-7187) ---');
  
  // Find existing key for Adorable Trading
  const org = await prisma.organization.findFirst({
    where: { name: { contains: 'Adorable', mode: 'insensitive' } }
  });
  console.log('Found Organization:', org?.id, org?.name);

  // Update company registration key
  const updatedKeys = await prisma.companyRegistrationKey.updateMany({
    where: {
      OR: [
        { key: 'ADO-EC-7187' },
        { usedByOrganizationId: org?.id }
      ]
    },
    data: {
      key: 'ADOR-EC-7187',
      status: 'ACTIVE'
    }
  });
  console.log('Updated CompanyRegistrationKey count:', updatedKeys.count);

  if (org) {
    const currentSettings = org.settings || {};
    currentSettings.registrationKey = 'ADOR-EC-7187';
    await prisma.organization.update({
      where: { id: org.id },
      data: {
        settings: currentSettings,
        registrationKeyId: 'ADOR-EC-7187'
      }
    });
    console.log('Updated Organization settings & registrationKeyId.');
  }

  // Also check if any other company key starts with ADO-EC-7187
  const allKeys = await prisma.companyRegistrationKey.findMany();
  console.log('All Company Keys now:', allKeys.map(k => ({ id: k.id, key: k.key, status: k.status, orgId: k.usedByOrganizationId })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
