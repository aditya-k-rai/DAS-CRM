const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Let's emulate LeadsService.findAll exactly
async function getDownstreamUserIds(organizationId, managerId) {
  const allUsers = await prisma.user.findMany({
    where: { organizationId },
    select: { id: true, managerId: true },
  });
  const downstreamIds = new Set();
  downstreamIds.add(managerId);
  let added = true;
  while (added) {
    added = false;
    for (const u of allUsers) {
      if (u.managerId && downstreamIds.has(u.managerId) && !downstreamIds.has(u.id)) {
        downstreamIds.add(u.id);
        added = true;
      }
    }
  }
  return downstreamIds;
}

async function getHierarchyScope(organizationId, userId) {
  if (!userId) return {};
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
  const rawRole = currentUser?.role?.name || (typeof currentUser?.role === 'string' ? currentUser.role : '') || '';
  const roleName = rawRole.toUpperCase();

  if (['ADMIN', 'SUPER_ADMIN', 'OWNER', 'MANAGER', 'DEPT_MANAGER', 'HR'].includes(roleName)) {
    return {};
  }
  const subordinateIds = await getDownstreamUserIds(organizationId, userId);
  const allowedIds = Array.from(subordinateIds);
  return {
    OR: [
      { ownerId: { in: allowedIds } },
      { ownerId: null },
      { createdById: { in: allowedIds } },
      { createdById: userId },
    ],
  };
}

async function testFindAll(userId, label) {
  const orgId = 'cmuev7n3o000mikew7je1tdiw';
  const query = { page: 1, limit: 500, sortBy: 'createdAt', sortOrder: 'desc' };

  const hierarchyScope = await getHierarchyScope(orgId, userId);

  const whereConditions = [{ organizationId: orgId }];
  if (hierarchyScope && Object.keys(hierarchyScope).length > 0) {
    whereConditions.push(hierarchyScope);
  }

  const where = { AND: whereConditions };

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: {
        status: true,
        owner: true,
        source: true,
      },
      take: query.limit,
      skip: (query.page - 1) * query.limit,
    }),
    prisma.lead.count({ where }),
  ]);

  console.log(`=== ${label} ===`);
  console.log(`User ID: ${userId}`);
  console.log(`Hierarchy scope:`, JSON.stringify(hierarchyScope));
  console.log(`Total count: ${total}, Returned leads: ${leads.length}`);
}

async function run() {
  await testFindAll('cmuev7ni70016ikew8an7tdw8', 'ANURAG SHARMA (ADMIN)');
  await testFindAll('cmukv4tgl000n7d2d65001ydp', 'SACHIN PURI (TEAM_LEADER)');
}

run().catch(console.error).finally(() => prisma.$disconnect());
