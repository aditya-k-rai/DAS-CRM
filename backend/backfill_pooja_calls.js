const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const lead = await prisma.lead.findFirst({
    where: { id: 'cmuojhdgu000jikm4z3gs6v5r' },
  });

  if (!lead) {
    console.error('Lead Pooja Nair not found');
    return;
  }

  const existingCalls = await prisma.activity.findMany({
    where: { leadId: lead.id, type: 'CALL' },
  });

  if (existingCalls.length > 0) {
    console.log('Call activities already exist:', existingCalls.length);
    return;
  }

  const adminUser = await prisma.user.findFirst({
    where: { organizationId: lead.organizationId, role: { name: 'ADMIN' } },
  });

  const callsToCreate = [
    {
      organizationId: lead.organizationId,
      userId: adminUser?.id,
      leadId: lead.id,
      type: 'CALL',
      description: 'Outbound Call: Talked & Responded — In-Person / Virtual Visit Scheduled for 2026-10-04 at 10:30',
      metadata: {
        type: 'CALL_OUT',
        outcome: 'TALKED',
        durationSeconds: 165,
        durationMin: 3,
        productInterest: 'DAS CRM Enterprise Suite',
        notes: 'Client confirmed availability for product walkthrough and demo visit tomorrow.',
        by: 'Anurag Sharma',
        byRole: 'ADMIN',
        followUpDate: '2026-10-04',
        followUpTime: '10:30',
        audioRecordingAvailable: true,
      },
      createdAt: new Date('2026-10-03T03:39:06.570Z'),
    },
    {
      organizationId: lead.organizationId,
      userId: adminUser?.id,
      leadId: lead.id,
      type: 'CALL',
      description: 'Follow-up Call: Scheduled callback confirmed for 10:30 AM',
      metadata: {
        type: 'CALL_OUT',
        outcome: 'FOLLOW_UP_SCHEDULED',
        durationSeconds: 84,
        durationMin: 2,
        productInterest: 'DAS CRM Enterprise Suite',
        notes: 'Follow-up confirmed with client team for walkthrough session.',
        by: 'Anurag Sharma',
        byRole: 'ADMIN',
        followUpDate: '2026-10-04',
        followUpTime: '10:30',
        audioRecordingAvailable: true,
      },
      createdAt: new Date('2026-10-03T07:03:58.372Z'),
    },
  ];

  for (const c of callsToCreate) {
    await prisma.activity.create({ data: c });
  }

  // Update lead requirement if empty
  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      lastActivityAt: new Date(),
      customFields: {
        ...(typeof lead.customFields === 'object' && lead.customFields !== null ? lead.customFields : {}),
        requirement: 'DAS CRM Enterprise Suite',
        productInterest: 'DAS CRM Enterprise Suite',
      },
    },
  });

  console.log('Successfully backfilled call activities for Pooja Nair in PostgreSQL!');
}

run().catch(console.error).finally(() => prisma.$disconnect());
