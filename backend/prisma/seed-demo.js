const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orgId = 'comp_das'; // The demo organization
  const repId = 'usr_rep'; // The Sales Exec

  // 1. Ensure Organization exists
  let org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        id: orgId,
        name: 'DAS Organization',
        slug: 'das-org',
      }
    });
  }

  // 1b. Check if the rep exists (create if not, though AuthContext implies it exists, it might not be in DB)
  let rep = await prisma.user.findUnique({ where: { id: repId } });
  if (!rep) {
    rep = await prisma.user.create({
      data: {
        id: repId,
        organizationId: orgId,
        email: 'rep@das.com',
        firstName: 'Sales',
        lastName: 'Executive',
        roleId: 'role_sales',
        passwordHash: 'dummyhash',
      }
    });
  }

  // 2. Create some demo Leads assigned to the Rep
  const lead1 = await prisma.lead.create({
    data: {
      organizationId: orgId,
      ownerId: repId,
      createdById: repId,
      firstName: 'Rohan',
      lastName: 'Deshmukh',
      email: 'rohan.d@apexinnovations.in',
      phone: '+91 98201 44521',
      jobTitle: 'VP Technology & Procurement',
      requirement: 'Enterprise CRM Suite API Integration',
      estimatedValue: 320000,
      statusId: 'status_new',
      sourceId: 'source_inbound',
    }
  });

  const lead2 = await prisma.lead.create({
    data: {
      organizationId: orgId,
      ownerId: repId,
      createdById: repId,
      firstName: 'Priya',
      lastName: 'Patel',
      email: 'priya.patel@zenithhealth.org',
      phone: '+91 97112 88304',
      jobTitle: 'Director of Operations',
      requirement: 'Patient Telemetry & Lead Routing Portal',
      estimatedValue: 185000,
      statusId: 'status_new',
      sourceId: 'source_inbound',
    }
  });

  // 3. Create some Follow-ups (Tasks) assigned to the Rep for these Leads
  const today = new Date();
  
  // Follow-up 1 (Due Now)
  const dueNow = new Date(today.getTime() - 1000 * 60 * 30); // 30 mins ago
  await prisma.task.create({
    data: {
      organizationId: orgId,
      assigneeId: repId,
      createdById: repId,
      leadId: lead1.id,
      title: 'Discuss custom ERP module requirements',
      taskType: 'FOLLOW_UP',
      followUpType: 'CALL',
      priority: 'HIGH',
      status: 'PENDING',
      dueAt: dueNow,
    }
  });

  // Follow-up 2 (Upcoming Today)
  const upcoming = new Date(today.getTime() + 1000 * 60 * 120); // 2 hours from now
  await prisma.task.create({
    data: {
      organizationId: orgId,
      assigneeId: repId,
      createdById: repId,
      leadId: lead2.id,
      title: 'Follow up on payment terms & MSA',
      taskType: 'FOLLOW_UP',
      followUpType: 'MEETING',
      priority: 'MEDIUM',
      status: 'PENDING',
      dueAt: upcoming,
    }
  });

  // Follow-up 3 (Overdue)
  const overdue = new Date(today.getTime() - 1000 * 60 * 60 * 24 * 2); // 2 days ago
  await prisma.task.create({
    data: {
      organizationId: orgId,
      assigneeId: repId,
      createdById: repId,
      title: 'Touch base regarding discounted quarter-end pricing',
      taskType: 'FOLLOW_UP',
      followUpType: 'EMAIL',
      priority: 'HIGH',
      status: 'PENDING',
      dueAt: overdue,
    }
  });

  console.log('Successfully seeded demo leads and follow-ups for Sales Rep!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
