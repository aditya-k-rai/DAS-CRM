const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const counts = await p.lead.groupBy({ by: ['organizationId'], _count: { id: true } });
  console.log('LEADS GROUPED BY ORG:', counts);

  const adorableLeads = await p.lead.findMany({
    where: { organizationId: 'cmuev7n3o000mikew7je1tdiw' },
    include: { owner: true, status: true },
  });
  console.log('ADORABLE TRADING LEADS COUNT:', adorableLeads.length);
  adorableLeads.forEach(l => {
    console.log(` - ID: ${l.id}, Name: ${l.firstName} ${l.lastName}, Owner: ${l.owner?.firstName || 'none'}, OwnerId: ${l.ownerId}`);
  });
}

run().catch(console.error).finally(() => p.$disconnect());
