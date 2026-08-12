import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting NexCRM Database Seeding...');

  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-sales' },
    update: {},
    create: {
      name: 'Acme Sales Solutions',
      slug: 'acme-sales',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
    },
  });
  console.log(`✅ Organization created: ${org.name} (${org.id})`);

  // 2. Create Roles
  const rolesData = [
    { name: 'OWNER', description: 'Full workspace owner access' },
    { name: 'ADMIN', description: 'Admin access (workflow, custom fields, team leaders)' },
    { name: 'HR', description: 'HR Portal access (attendance, leaves, salary/payroll)' },
    { name: 'TEAM_LEADER', description: 'Team leader (distributes leads, manages rep team)' },
    { name: 'SALES_EXEC', description: 'Sales representative (manages assigned leads)' },
  ];

  const roles: Record<string, string> = {};
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { organizationId_name: { organizationId: org.id, name: r.name } },
      update: {},
      create: { organizationId: org.id, name: r.name, description: r.description },
    });
    roles[r.name] = role.id;
  }
  console.log('✅ Roles created:', Object.keys(roles));

  // 3. Create Password Hash
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 4. Create Users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      organizationId: org.id,
      email: 'admin@acme.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Doe',
      roleId: roles['ADMIN'],
    },
  });

  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@acme.com' },
    update: {},
    create: {
      organizationId: org.id,
      email: 'hr@acme.com',
      passwordHash,
      firstName: 'Sunita',
      lastName: 'Verma',
      roleId: roles['HR'],
    },
  });

  const tlUser = await prisma.user.upsert({
    where: { email: 'tl@acme.com' },
    update: {},
    create: {
      organizationId: org.id,
      email: 'tl@acme.com',
      passwordHash,
      firstName: 'Amit',
      lastName: 'Shah',
      roleId: roles['TEAM_LEADER'],
    },
  });

  const repUser = await prisma.user.upsert({
    where: { email: 'rep@acme.com' },
    update: {},
    create: {
      organizationId: org.id,
      email: 'rep@acme.com',
      passwordHash,
      firstName: 'Rajesh',
      lastName: 'Kumar',
      roleId: roles['SALES_EXEC'],
      teamLeaderId: tlUser.id,
    },
  });

  console.log('✅ Users seeded: Admin, HR, Team Leader, Sales Exec');

  // 5. Default Pipeline & Stages
  const pipeline = await prisma.pipeline.upsert({
    where: { id: 'default-pipeline' },
    update: {},
    create: {
      id: 'default-pipeline',
      organizationId: org.id,
      name: 'Standard Sales Pipeline',
      isDefault: true,
    },
  });

  const stagesData = [
    { name: 'Prospecting', order: 1, probability: 10 },
    { name: 'Qualification', order: 2, probability: 30 },
    { name: 'Proposal', order: 3, probability: 60 },
    { name: 'Negotiation', order: 4, probability: 80 },
    { name: 'Closed Won', order: 5, probability: 100, isWon: true },
    { name: 'Closed Lost', order: 6, probability: 0, isLost: true },
  ];

  for (const st of stagesData) {
    await prisma.pipelineStage.create({
      data: {
        pipelineId: pipeline.id,
        name: st.name,
        order: st.order,
        probability: st.probability,
        isWon: st.isWon ?? false,
        isLost: st.isLost ?? false,
      },
    });
  }
  console.log('✅ Pipeline & 6 stages created');

  console.log('🎉 NexCRM Database Seeding Complete!');
}

main()
  .catch(e => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
