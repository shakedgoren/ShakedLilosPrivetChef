import { createApp } from './app.ts';
import { env } from './env.ts';
import { prisma } from './db.ts';

const app = createApp();

const server = app.listen(env.port, env.host, () => {
  console.log(`BITE & TELL · http://${env.host}:${env.port}`);
});

const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
