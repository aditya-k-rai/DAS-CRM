const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const lead = await prisma.lead.findFirst({
    where: { id: 'cmuojhdgu000jikm4z3gs6v5r' },
    include: {
      status: true,
      owner: { select: { id: true, firstName: true, lastName: true, role: true } },
      activities: {
        include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
        orderBy: { createdAt: 'desc' }
      },
      tasks: { orderBy: { dueAt: 'asc' } },
      statusHistory: { include: { status: true }, orderBy: { changedAt: 'desc' } }
    }
  });

  console.log('FINDONE RESULT FOR POOJA NAIR:');
  console.log('Lead Name:', lead.firstName, lead.lastName);
  console.log('Activities count:', lead.activities.length);
  lead.activities.forEach(a => console.log(' - Activity:', a.type, '|', a.description, '| by:', a.user?.firstName));
  console.log('Tasks count:', lead.tasks.length);
  lead.tasks.forEach(t => console.log(' - Task:', t.taskType, '|', t.title, '| purpose:', t.purpose));
}

run().catch(console.error).finally(() => prisma.$disconnect());
