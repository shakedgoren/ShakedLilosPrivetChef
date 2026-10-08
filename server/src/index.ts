import { createApp } from './app.ts';
import { env } from './env.ts';
import { prisma } from './db.ts';

const app = createApp();

const server = app.listen(env.port, env.host, () => {
  const wa = env.whatsapp.enabled ? 'וואטסאפ · Green API פועל' : 'וואטסאפ כבוי (חסר GREENAPI_ID_INSTANCE או GREENAPI_API_TOKEN)';
  console.log(`BITE & TELL · http://${env.host}:${env.port} · ${wa}`);
});

const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
