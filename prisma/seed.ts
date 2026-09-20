import { PrismaClient, Role, RepairStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const techPassword = await bcrypt.hash('tech123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  // 1. Create or upsert Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mobilerepair.com' },
    update: {
      password_hash: adminPassword,
      role: Role.ADMIN,
      active: true,
    },
    create: {
      name: 'Amit (Admin)',
      email: 'admin@mobilerepair.com',
      password_hash: adminPassword,
      role: Role.ADMIN,
      active: true,
    },
  });
  console.log(`👤 Admin created: ${admin.email}`);

  // 2. Create or upsert Technician
  const tech = await prisma.user.upsert({
    where: { email: 'tech@mobilerepair.com' },
    update: {
      password_hash: techPassword,
      role: Role.TECHNICIAN,
      active: true,
    },
    create: {
      name: 'Rahul (Technician)',
      email: 'tech@mobilerepair.com',
      password_hash: techPassword,
      role: Role.TECHNICIAN,
      active: true,
    },
  });
  console.log(`👤 Technician created: ${tech.email}`);

  // 3. Create or upsert Standard User
  const deskUser = await prisma.user.upsert({
    where: { email: 'user@mobilerepair.com' },
    update: {
      password_hash: userPassword,
      role: Role.USER,
      active: true,
    },
    create: {
      name: 'Tanishq (Service Desk)',
      email: 'user@mobilerepair.com',
      password_hash: userPassword,
      role: Role.USER,
      active: true,
    },
  });
  console.log(`👤 Service User created: ${deskUser.email}`);

  // Initialize Repair Sequence counter
  const currentYear = new Date().getFullYear();
  await prisma.repairSequence.upsert({
    where: { year: currentYear },
    update: { last_value: 4 },
    create: { year: currentYear, last_value: 4 },
  });

  // 4. Sample Repair 1: Completed
  const rep1 = await prisma.repair.upsert({
    where: { repair_id: `REP-${currentYear}-00001` },
    update: {},
    create: {
      repair_id: `REP-${currentYear}-00001`,
      serial_number: 'SN123456',
      mobile_name: 'iPhone 15 Pro',
      problem: 'Display damaged and screen flickers after drop',
      repair_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      additional_id: 'JOB-901',
      status: RepairStatus.COMPLETED,
      assigned_to_id: tech.id,
      completed_by_id: tech.id,
      completion_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      notes: 'OLED screen replaced with genuine assembly. Tested touch and TrueTone calibration.',
      created_by_id: deskUser.id,
    },
  });

  // History for Repair 1
  const countRep1Hist = await prisma.repairHistory.count({ where: { repair_id: rep1.id } });
  if (countRep1Hist === 0) {
    await prisma.repairHistory.createMany({
      data: [
        {
          repair_id: rep1.id,
          old_status: null,
          new_status: RepairStatus.PENDING,
          changed_by_id: deskUser.id,
          changed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          notes: 'Repair ticket created at reception desk',
        },
        {
          repair_id: rep1.id,
          old_status: RepairStatus.PENDING,
          new_status: RepairStatus.IN_PROCESS,
          changed_by_id: tech.id,
          changed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          notes: 'Disassembly started. Display unit extracted.',
        },
        {
          repair_id: rep1.id,
          old_status: RepairStatus.IN_PROCESS,
          new_status: RepairStatus.COMPLETED,
          changed_by_id: tech.id,
          changed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          notes: 'Screen replacement complete. Quality tests passed.',
        },
      ],
    });
  }

  // 5. Sample Repair 2: In Process
  const rep2 = await prisma.repair.upsert({
    where: { repair_id: `REP-${currentYear}-00002` },
    update: {},
    create: {
      repair_id: `REP-${currentYear}-00002`,
      serial_number: 'SN987654',
      mobile_name: 'Samsung Galaxy S24 Ultra',
      problem: 'Battery drains from 100% to 20% in 2 hours and overheats',
      repair_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      additional_id: 'CUST-441',
      status: RepairStatus.IN_PROCESS,
      assigned_to_id: tech.id,
      notes: 'Testing battery thermal sensor and cycle count.',
      created_by_id: deskUser.id,
    },
  });

  const countRep2Hist = await prisma.repairHistory.count({ where: { repair_id: rep2.id } });
  if (countRep2Hist === 0) {
    await prisma.repairHistory.createMany({
      data: [
        {
          repair_id: rep2.id,
          old_status: null,
          new_status: RepairStatus.PENDING,
          changed_by_id: deskUser.id,
          changed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          notes: 'Device logged for battery diagnostics',
        },
        {
          repair_id: rep2.id,
          old_status: RepairStatus.PENDING,
          new_status: RepairStatus.IN_PROCESS,
          changed_by_id: tech.id,
          changed_at: new Date(Date.now() - 12 * 60 * 60 * 1000),
          notes: 'Undergoing battery health diagnostic test',
        },
      ],
    });
  }

  // 6. Sample Repair 3: Multi-repair demonstration (Same serial SN123456, Pending)
  const rep3 = await prisma.repair.upsert({
    where: { repair_id: `REP-${currentYear}-00003` },
    update: {},
    create: {
      repair_id: `REP-${currentYear}-00003`,
      serial_number: 'SN123456',
      mobile_name: 'iPhone 15 Pro',
      problem: 'USB-C charging port loose and not fast charging',
      repair_date: new Date(),
      additional_id: 'JOB-992',
      status: RepairStatus.PENDING,
      notes: 'Customer returned 1 month later for separate charging port issue. Note: Display is working fine.',
      created_by_id: deskUser.id,
    },
  });

  const countRep3Hist = await prisma.repairHistory.count({ where: { repair_id: rep3.id } });
  if (countRep3Hist === 0) {
    await prisma.repairHistory.create({
      data: {
        repair_id: rep3.id,
        old_status: null,
        new_status: RepairStatus.PENDING,
        changed_by_id: deskUser.id,
        changed_at: new Date(),
        notes: 'Repair created for secondary port fault',
      },
    });
  }

  // 7. Sample Repair 4: Cancelled
  const rep4 = await prisma.repair.upsert({
    where: { repair_id: `REP-${currentYear}-00004` },
    update: {},
    create: {
      repair_id: `REP-${currentYear}-00004`,
      serial_number: 'SN554433',
      mobile_name: 'OnePlus 12',
      problem: 'Primary microphone produces screeching noise during voice calls',
      repair_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      status: RepairStatus.CANCELLED,
      notes: 'Customer declined repair estimate and collected device.',
      created_by_id: admin.id,
    },
  });

  const countRep4Hist = await prisma.repairHistory.count({ where: { repair_id: rep4.id } });
  if (countRep4Hist === 0) {
    await prisma.repairHistory.create({
      data: {
        repair_id: rep4.id,
        old_status: RepairStatus.PENDING,
        new_status: RepairStatus.CANCELLED,
        changed_by_id: admin.id,
        changed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        notes: 'Cancelled per customer request',
      },
    });
  }

  console.log('✅ Seed completed successfully with 3 users and 4 sample repairs!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
