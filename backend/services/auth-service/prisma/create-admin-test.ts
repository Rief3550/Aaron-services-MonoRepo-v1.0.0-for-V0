import { PrismaClient } from '@aaron/prisma-client-auth';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    if (!adminRole) {
      console.log('❌ Role ADMIN not found');
      process.exit(1);
    }
    
    const email = 'admin@test.com';
    const password = 'Admin123!';
    const passwordHash = await bcrypt.hash(password, 10);
    
    const existing = await prisma.user.findUnique({ where: { email } });
    
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          isEmailVerified: true,
          roles: { set: [{ id: adminRole.id }] },
        },
      });
      console.log('✅ User updated:', email);
    } else {
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          fullName: 'Admin Test User',
          isEmailVerified: true,
          roles: { connect: [{ id: adminRole.id }] },
        },
      });
      console.log('✅ User created:', email);
    }
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();




