const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const users = await p.user.findMany({
    where: { organizationId: 'cmuev7n3o000mikew7je1tdiw' },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, managerId: true },
  });
  console.log('USERS IN ADORABLE TRADING:', users);
}

run().catch(console.error).finally(() => p.$disconnect());
