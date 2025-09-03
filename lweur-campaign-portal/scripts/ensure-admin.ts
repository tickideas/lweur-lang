import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Production-safe script to ensure a SUPER_ADMIN exists.
 * Usage (provide env vars):
 *  ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='Strong#Password123' npm run admin:ensure
 */

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const firstName = process.env.ADMIN_FIRST_NAME || 'Super';
  const lastName = process.env.ADMIN_LAST_NAME || 'Admin';

  if (!email || !password) {
    console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
    process.exit(1);
  }

  if (password.length < 12) {
    console.error('❌ ADMIN_PASSWORD must be at least 12 characters long.');
    process.exit(1);
  }

  console.log(`🔐 Ensuring SUPER_ADMIN account exists for ${email} ...`);

  const existing = await prisma.admin.findUnique({ where: { email } });
  const reset = process.env.ADMIN_RESET === '1';

  if (existing) {
    if (reset) {
      console.log('⚠️  ADMIN_RESET=1 provided. Updating password (and role to SUPER_ADMIN).');
      const passwordHash = await bcrypt.hash(password, 12);
      const updated = await prisma.admin.update({
        where: { id: existing.id },
        data: { role: 'SUPER_ADMIN', passwordHash }
      });
      console.log(`✅ Password reset & role ensured for ${updated.email}.`);
      return;
    }
    if (existing.role === 'SUPER_ADMIN') {
      console.log('✅ SUPER_ADMIN already present. (Use ADMIN_RESET=1 to rotate password)');
      return;
    }
    console.log(`ℹ️ Admin exists with role ${existing.role}. Elevating to SUPER_ADMIN (password unchanged).`);
    await prisma.admin.update({
      where: { id: existing.id },
      data: { role: 'SUPER_ADMIN' }
    });
    console.log(`✅ Elevated ${existing.email} to SUPER_ADMIN.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const created = await prisma.admin.create({
    data: {
      email,
      firstName,
      lastName,
      role: 'SUPER_ADMIN',
      passwordHash,
      isActive: true,
    }
  });

  console.log(`✅ Created SUPER_ADMIN: ${created.email}`);
}

main().catch(err => {
  console.error('❌ Error ensuring admin:', err);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
