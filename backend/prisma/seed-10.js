const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orgId = 'comp_das';
  const repId = 'usr_rep';

  // Find org and required sources
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    console.error("Organization not found.");
    return;
  }

  // 1. Delete existing demo data for this rep to start fresh (keeps it exactly at 10)
  await prisma.task.deleteMany({ where: { assigneeId: repId } });
  await prisma.lead.deleteMany({ where: { ownerId: repId } });

  // 2. Get all 7 statuses
  const statuses = await prisma.leadStatus.findMany();
  const statusMap = {};
  statuses.forEach(s => { statusMap[s.name] = s.id; });

  // 3. Ensure some sources exist
  let sourceWeb = await prisma.leadSource.findFirst({ where: { name: 'Website' } });
  if (!sourceWeb) sourceWeb = await prisma.leadSource.create({ data: { name: 'Website', organizationId: orgId } });
  
  let sourceRef = await prisma.leadSource.findFirst({ where: { name: 'Referral' } });
  if (!sourceRef) sourceRef = await prisma.leadSource.create({ data: { name: 'Referral', organizationId: orgId } });
  
  let sourceEvent = await prisma.leadSource.findFirst({ where: { name: 'Trade Show' } });
  if (!sourceEvent) sourceEvent = await prisma.leadSource.create({ data: { name: 'Trade Show', organizationId: orgId } });

  const sources = [sourceWeb.id, sourceRef.id, sourceEvent.id];

  // 4. Data for 10 Leads covering different fields/statuses
  const leadData = [
    { fn: 'Rohan', ln: 'Deshmukh', st: 'New', src: 0, val: 320000 },
    { fn: 'Priya', ln: 'Patel', st: 'Contacted', src: 1, val: 185000 },
    { fn: 'Vikram', ln: 'Malhotra', st: 'Qualified', src: 2, val: 450000 },
    { fn: 'Neha', ln: 'Sharma', st: 'Proposal', src: 0, val: 50000 },
    { fn: 'Arjun', ln: 'Reddy', st: 'Negotiation', src: 1, val: 780000 },
    { fn: 'Kavita', ln: 'Singh', st: 'Won', src: 2, val: 1200000 },
    { fn: 'Siddharth', ln: 'Mehta', st: 'Lost', src: 0, val: 90000 },
    { fn: 'Anjali', ln: 'Verma', st: 'New', src: 1, val: 210000 },
    { fn: 'Rahul', ln: 'Kapoor', st: 'Contacted', src: 2, val: 340000 },
    { fn: 'Pooja', ln: 'Nair', st: 'Qualified', src: 0, val: 670000 }
  ];

  const createdLeads = [];

  for (let i = 0; i < leadData.length; i++) {
    const l = leadData[i];
    const lead = await prisma.lead.create({
      data: {
        organizationId: orgId,
        ownerId: repId,
        createdById: repId,
        firstName: l.fn,
        lastName: l.ln,
        email: `${l.fn.toLowerCase()}.${l.ln.toLowerCase()}@example.com`,
        phone: `+91 98000 ${String(10000 + i)}`,
        statusId: statusMap[l.st] || statuses[0].id,
        sourceId: sources[l.src],
      }
    });
    createdLeads.push(lead);
  }

  // 5. Create 10 Follow-ups covering all scenarios
  const now = new Date();
  const followUpData = [
    // 1. Due Now (Pending, High, Call)
    { type: 'CALL', prio: 'HIGH', stat: 'PENDING', min: -5, leadIdx: 0, title: 'Immediate callback required' },
    // 2. Upcoming Today (Pending, Medium, Email)
    { type: 'EMAIL', prio: 'MEDIUM', stat: 'PENDING', min: 120, leadIdx: 1, title: 'Send proposal document' },
    // 3. Overdue (Pending, High, Meeting)
    { type: 'MEETING', prio: 'HIGH', stat: 'PENDING', min: -1440, leadIdx: 2, title: 'Reschedule missed demo' }, // 1 day ago
    // 4. Completed Today (Completed, Low, General)
    { type: 'GENERAL', prio: 'LOW', stat: 'COMPLETED', min: -120, leadIdx: 3, title: 'Checked in on WhatsApp' },
    // 5. Cancelled (Cancelled, Medium, Call)
    { type: 'CALL', prio: 'MEDIUM', stat: 'CANCELLED', min: 60, leadIdx: 4, title: 'Client declined call' },
    // 6. Upcoming Tomorrow (Pending, High, Meeting)
    { type: 'MEETING', prio: 'HIGH', stat: 'PENDING', min: 1440, leadIdx: 5, title: 'Final Contract Signing' }, // tomorrow
    // 7. Due Now (Pending, Medium, Email)
    { type: 'EMAIL', prio: 'MEDIUM', stat: 'PENDING', min: -10, leadIdx: 6, title: 'Follow up on lost reason' },
    // 8. Upcoming Today (Pending, High, Call)
    { type: 'CALL', prio: 'HIGH', stat: 'PENDING', min: 60, leadIdx: 7, title: 'Discovery Call' },
    // 9. Completed Yesterday (Completed, Medium, Meeting)
    { type: 'MEETING', prio: 'MEDIUM', stat: 'COMPLETED', min: -2880, leadIdx: 8, title: 'Initial Consultation' }, // 2 days ago
    // 10. Overdue Long (Pending, Low, Email)
    { type: 'EMAIL', prio: 'LOW', stat: 'PENDING', min: -4320, leadIdx: 9, title: 'Check if still interested' } // 3 days ago
  ];

  for (let i = 0; i < followUpData.length; i++) {
    const f = followUpData[i];
    const dueTime = new Date(now.getTime() + (f.min * 60000));
    
    await prisma.task.create({
      data: {
        organizationId: orgId,
        assigneeId: repId,
        createdById: repId,
        leadId: createdLeads[f.leadIdx].id,
        title: f.title,
        taskType: 'FOLLOW_UP',
        followUpType: f.type,
        priority: f.prio,
        status: f.stat,
        dueAt: dueTime,
      }
    });
  }

  console.log('✅ Successfully seeded exactly 10 diverse Leads and 10 Follow-ups.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
