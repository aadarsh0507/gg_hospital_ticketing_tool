import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      department: 'IT'
    }
  });

  // Create staff users
  const staff1 = await prisma.user.upsert({
    where: { email: 'staff1@example.com' },
    update: {},
    create: {
      email: 'staff1@example.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'STAFF',
      department: 'Nursing'
    }
  });

  const staff2 = await prisma.user.upsert({
    where: { email: 'staff2@example.com' },
    update: {},
    create: {
      email: 'staff2@example.com',
      password: hashedPassword,
      firstName: 'Michael',
      lastName: 'Chen',
      role: 'STAFF',
      department: 'Emergency'
    }
  });

  // Create requester user
  const requester = await prisma.user.upsert({
    where: { email: 'requester@example.com' },
    update: {},
    create: {
      email: 'requester@example.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'REQUESTER',
      department: 'General'
    }
  });

  // Create departments
  const dept1 = await prisma.department.upsert({
    where: { name: 'Nursing' },
    update: {},
    create: {
      name: 'Nursing',
      description: 'Nursing Department'
    }
  });

  const dept2 = await prisma.department.upsert({
    where: { name: 'Emergency' },
    update: {},
    create: {
      name: 'Emergency',
      description: 'Emergency Department'
    }
  });

  const dept3 = await prisma.department.upsert({
    where: { name: 'Facilities' },
    update: {},
    create: {
      name: 'Facilities',
      description: 'Facilities Management'
    }
  });

  // Create blocks
  const block1 = await prisma.block.upsert({
    where: { name: 'Main Building' },
    update: {},
    create: {
      name: 'Main Building',
      description: 'Main Hospital Building'
    }
  });

  const block2 = await prisma.block.upsert({
    where: { name: 'Emergency Wing' },
    update: {},
    create: {
      name: 'Emergency Wing',
      description: 'Emergency Department Wing'
    }
  });

  // Create locations
  const location1 = await prisma.location.upsert({
    where: { blockId_name: { blockId: block1.id, name: 'ICU Ward A' } },
    update: {},
    create: {
      blockId: block1.id,
      name: 'ICU Ward A',
      floor: 3,
      areaType: 'Ward',
      departmentId: dept1.id
    }
  });

  const location2 = await prisma.location.upsert({
    where: { blockId_name: { blockId: block2.id, name: 'Emergency Room' } },
    update: {},
    create: {
      blockId: block2.id,
      name: 'Emergency Room',
      floor: 1,
      areaType: 'Room',
      departmentId: dept2.id
    }
  });

  console.log('✅ Seeding completed successfully!');
  console.log('📝 Created users:', { admin: admin.email, staff1: staff1.email, staff2: staff2.email, requester: requester.email });
  console.log('🏢 Created departments:', dept1.name, dept2.name, dept3.name);
  console.log('🏗️  Created blocks:', block1.name, block2.name);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

