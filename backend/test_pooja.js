const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const leads = await prisma.lead.findMany({
    where: { firstName: 'Pooja' },
    include: {
      activities: true,
      tasks: true,
      meetings: true,
      owner: true,
      status: true,
    }
  });
  console.log('ALL POOJA LEADS:', JSON.stringify(leads, null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());
