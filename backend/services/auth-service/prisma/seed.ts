/**
 * Seed minimal roles: ADMIN, OPERATOR, CREW, CUSTOMER
 * And create test admin user
 */
/* eslint-disable */
/* eslint-disable no-console */
import { PrismaClient } from '@aaron/prisma-client-auth';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding roles...');

  const roles = [
    { name: 'ADMIN' },
    { name: 'OPERATOR' },
    { name: 'CREW' },
    { name: 'CUSTOMER' },
    { name: 'AUDITOR' },
    { name: 'FINANCE' },
    { name: 'SUPER_ADMIN' },
  ];

  const createdRoles: { [key: string]: { id: string; name: string } } = {};

  for (const role of roles) {
    const created = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
    createdRoles[role.name] = created;
    console.log(`✅ Role ${role.name} created/updated`);
  }

  // Crear usuario admin de prueba
  console.log('🌱 Seeding test admin user...');
  
  const testEmail = 'admin@aaron.com';
  const testPassword = 'admin123';
  const passwordHash = await bcrypt.hash(testPassword, 10);

  const existingUser = await prisma.user.findUnique({
    where: { email: testEmail },
  });

  if (!existingUser) {
    const adminUser = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        fullName: 'Admin User',
        isEmailVerified: true,
        roles: {
          connect: [{ id: createdRoles['ADMIN'].id }],
        },
      },
    });
    console.log(`✅ Test admin user created: ${adminUser.email}`);
    console.log(`   📧 Email: ${testEmail}`);
    console.log(`   🔑 Password: ${testPassword}`);
  } else {
    // Actualizar el usuario existente para asegurar que tenga el rol ADMIN
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        passwordHash, // Actualizar contraseña por si cambió
        isEmailVerified: true,
        roles: {
          set: [{ id: createdRoles['ADMIN'].id }],
        },
      },
    });
    console.log(`✅ Test admin user updated: ${testEmail}`);
    console.log(`   📧 Email: ${testEmail}`);
    console.log(`   🔑 Password: ${testPassword}`);
  }

  // Create admin@test.com user (el que usa el usuario)
  console.log('🌱 Seeding admin@test.com user...');
  const adminTestEmail = 'admin@test.com';
  const adminTestPassword = 'Admin123!';
  const adminTestHash = await bcrypt.hash(adminTestPassword, 10);

  const existingAdminTest = await prisma.user.findUnique({ where: { email: adminTestEmail } });

  if (!existingAdminTest) {
    await prisma.user.create({
      data: {
        email: adminTestEmail,
        passwordHash: adminTestHash,
        fullName: 'Admin Test User',
        isEmailVerified: true,
        roles: { connect: [{ id: createdRoles['ADMIN'].id }] },
      },
    });
    console.log(`✅ Test admin user created: ${adminTestEmail}`);
    console.log(`   📧 Email: ${adminTestEmail}`);
    console.log(`   🔑 Password: ${adminTestPassword}`);
  } else {
    await prisma.user.update({
      where: { id: existingAdminTest.id },
      data: {
        passwordHash: adminTestHash,
        isEmailVerified: true,
        roles: { set: [{ id: createdRoles['ADMIN'].id }] },
      },
    });
    console.log(`✅ Test admin user updated: ${adminTestEmail}`);
    console.log(`   📧 Email: ${adminTestEmail}`);
    console.log(`   🔑 Password: ${adminTestPassword}`);
  }

  // Create Operator User
  console.log('🌱 Seeding test operator user...');
  const opEmail = 'operator@test.com';
  const opPassword = 'Operator123!';
  const opHash = await bcrypt.hash(opPassword, 10);

  const existingOp = await prisma.user.findUnique({ where: { email: opEmail } });

  if (!existingOp) {
    await prisma.user.create({
      data: {
        email: opEmail,
        passwordHash: opHash,
        fullName: 'Operator User',
        isEmailVerified: true,
        roles: { connect: [{ id: createdRoles['OPERATOR'].id }] },
      },
    });
    console.log(`✅ Test operator user created: ${opEmail}`);
  } else {
    await prisma.user.update({
      where: { id: existingOp.id },
      data: {
        passwordHash: opHash,
        roles: { set: [{ id: createdRoles['OPERATOR'].id }] },
      },
    });
    console.log(`✅ Test operator user updated: ${opEmail}`);
  }

  console.log('✅ Seed completed');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });

