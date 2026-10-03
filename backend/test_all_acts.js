const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const acts = await prisma.activity.findMany({
    where: { organizationId: 'cmuev7n3o000mikew7je1tdiw' }
  });
  console.log('TOTAL ACTIVITIES IN ADORABLE TRADING:', acts.length);
  acts.forEach(a => console.log(' - Type:', a.type, '| Lead:', a.leadId, '| Desc:', a.description));
}
run().catch(console.error).finally(() => prisma.$disconnect());
