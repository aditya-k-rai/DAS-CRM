import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

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
      settings: { currency: 'INR', timezone: 'Asia/Kolkata' },
    },
  });
  console.log(`✅ Organization created: ${org.name} (${org.id})`);

  // 2. Create Roles
  const rolesData = [
    { name: 'OWNER' },
    { name: 'ADMIN' },
    { name: 'HR' },
    { name: 'TEAM_LEADER' },
    { name: 'SALES' },
  ];

  const roles: Record<string, string> = {};
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { organizationId_name: { organizationId: org.id, name: r.name } },
      update: {},
      create: { organizationId: org.id, name: r.name },
    });
    roles[r.name] = role.id;
  }
  console.log('✅ Roles created:', Object.keys(roles));

  // 3. Create Password Hash
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 4. Create Users
  const adminUser = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'admin@acme.com' } },
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
    where: { organizationId_email: { organizationId: org.id, email: 'hr@acme.com' } },
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
    where: { organizationId_email: { organizationId: org.id, email: 'tl@acme.com' } },
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
    where: { organizationId_email: { organizationId: org.id, email: 'rep@acme.com' } },
    update: {},
    create: {
      organizationId: org.id,
      email: 'rep@acme.com',
      passwordHash,
      firstName: 'Rajesh',
      lastName: 'Kumar',
      roleId: roles['SALES'],
    },
  });

  console.log('✅ Users seeded: Admin, HR, Team Leader, Sales Exec');

  // 5. Default Pipeline & Stages
  const pipeline = await prisma.pipeline.upsert({
    where: { organizationId_name: { organizationId: org.id, name: 'Standard Sales Pipeline' } },
    update: {},
    create: {
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
    { name: 'Closed Won', order: 5, probability: 100 },
    { name: 'Closed Lost', order: 6, probability: 0 },
  ];

  for (const st of stagesData) {
    await prisma.stage.create({
      data: {
        pipelineId: pipeline.id,
        name: st.name,
        order: st.order,
        probability: st.probability,
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
