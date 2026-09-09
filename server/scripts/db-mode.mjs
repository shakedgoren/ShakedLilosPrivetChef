#!/usr/bin/env node
/**
 * SQLite נשאר ב-prisma/schema.prisma (ברירת המחדל).
 * ל-Postgres מקומי: מייצרים schema.postgresql.prisma בלי לשנות את קובץ ה-SQLite.
 *
 *   docker compose up -d
 *   # ב-.env: DATABASE_URL="postgresql://bite:bite@localhost:5432/biteandtell"
 *   npm run db:postgres:push
 *   npm run db:seed
 *
 * חזרה ל-SQLite: DATABASE_URL="file:./dev.db" ואז `npx prisma generate`
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: resolve(root, '.env') });

const sqliteSchema = resolve(root, 'prisma/schema.prisma');
const pgSchema = resolve(root, 'prisma/schema.postgresql.prisma');

const cmd = process.argv[2] ?? 'help';

function renderPostgresSchema() {
  const src = readFileSync(sqliteSchema, 'utf8');
  if (!src.includes('provider = "sqlite"')) {
    throw new Error('prisma/schema.prisma אינו sqlite — מפסיקים כדי לא לדרוס');
  }
  const out = src.replace('provider = "sqlite"', 'provider = "postgresql"');
  writeFileSync(pgSchema, out);
  console.log('wrote prisma/schema.postgresql.prisma');
}

function runPrisma(args, schema) {
  const result = spawnSync('npx', ['prisma', ...args, '--schema', schema], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (cmd === 'render') {
  renderPostgresSchema();
} else if (cmd === 'push') {
  const url = process.env.DATABASE_URL ?? '';
  if (!url.startsWith('postgres')) {
    console.error('db:postgres:push דורש DATABASE_URL של postgresql://...');
    console.error('כרגע:', url || '(ריק)');
    process.exit(1);
  }
  renderPostgresSchema();
  runPrisma(['db', 'push'], pgSchema);
  runPrisma(['generate'], pgSchema);
} else if (cmd === 'generate') {
  const url = process.env.DATABASE_URL ?? '';
  if (url.startsWith('postgres')) {
    renderPostgresSchema();
    runPrisma(['generate'], pgSchema);
  } else {
    runPrisma(['generate'], sqliteSchema);
  }
} else {
  console.log(`שימוש: node scripts/db-mode.mjs <render|push|generate>

  render     כותב prisma/schema.postgresql.prisma מתוך schema.prisma
  push       db push + generate מול Postgres (DATABASE_URL חייב להיות postgresql)
  generate   prisma generate לפי DATABASE_URL (sqlite או postgres)
`);
  process.exit(cmd === 'help' ? 0 : 1);
}
