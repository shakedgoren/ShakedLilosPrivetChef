import { prisma } from '../src/db.ts';
import { env } from '../src/env.ts';
import { hashPassword } from '../src/auth/passwords.ts';
import { normalizePhone } from '../src/auth/identity.ts';

async function main() {
  const email = env.adminEmail.toLowerCase();
  const phone = normalizePhone(env.adminPhone);
  const passwordHash = await hashPassword(env.adminPassword);

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      phone,
      passwordHash,
      name: env.adminName,
      role: 'admin',
    },
    update: {
      phone,
      passwordHash,
      name: env.adminName,
      role: 'admin',
    },
  });

  console.log(`seed · admin ${email} / ${phone}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
