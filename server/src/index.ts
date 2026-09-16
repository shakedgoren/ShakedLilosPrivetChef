import { createApp } from './app.ts';
import { env } from './env.ts';
import { prisma } from './db.ts';

const app = createApp();

const server = app.listen(env.port, env.host, () => {
  const wa = env.whatsapp.enabled ? 'WhatsApp Cloud API פועל' : 'WhatsApp כבוי (חסר TOKEN או PHONE_NUMBER_ID)';
  const db = env.databaseUrl.startsWith('postgres') ? 'postgres' : 'sqlite';
  console.log(`BITE & TELL · http://${env.host}:${env.port} · db=${db} · ${wa}`);
});

const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
