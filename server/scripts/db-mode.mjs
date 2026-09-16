#!/usr/bin/env node
/**
 * SQLite נשאר ב-prisma/schema.prisma (ברירת המחדל המקומית).
 * ל-Postgres: נכתב prisma-pg/schema.prisma בלי לשנות את קובץ ה-SQLite.
 *
 * מקומי (Docker Compose, בלי ענן):
 *   docker compose up -d
 *   # ב-.env: DATABASE_URL="postgresql://bite:bite@localhost:5432/biteandtell"
 *   npm run db:postgres:push
 *   npm run db:seed
 *
 * פרודקשן (Railway):
 *   DATABASE_URL מתוסף Postgres
 *   npm run start:prod
 *     → generate מול prisma-pg + prisma migrate deploy + tsx
 *
 * חזרה ל-SQLite: DATABASE_URL="file:./dev.db" ואז `npx prisma generate`
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: resolve(root, '.env') });

const sqliteSchema = resolve(root, 'prisma/schema.prisma');
const pgSchema = resolve(root, 'prisma-pg/schema.prisma');

const cmd = process.argv[2] ?? 'help';

function isPostgresUrl(url) {
  return url.startsWith('postgres://') || url.startsWith('postgresql://');
}

function renderPostgresSchema() {
  const src = readFileSync(sqliteSchema, 'utf8');
  if (!src.includes('provider = "sqlite"')) {
    throw new Error('prisma/schema.prisma אינו sqlite — מפסיקים כדי לא לדרוס');
  }
  const header = `// GENERATED — אל תערכי מודלים כאן.
// מקור: prisma/schema.prisma (sqlite). עדכון: npm run db:postgres:render
// פרודקשן: npx prisma migrate deploy --schema prisma-pg/schema.prisma

`;
  const out =
    header +
    src
      .replace('provider = "sqlite"', 'provider = "postgresql"')
      .replace(
        '// ספק ברירת מחדל: sqlite. ל-Postgres מקומי (docker compose) ראו README · npm run db:postgres:push',
        '// Postgres · מקור המודלים: prisma/schema.prisma · מיגרציות: prisma-pg/migrations',
      );
  mkdirSync(dirname(pgSchema), { recursive: true });
  writeFileSync(pgSchema, out);
  console.log('wrote prisma-pg/schema.prisma');
}

function runPrisma(args, schema) {
  const result = spawnSync('npx', ['prisma', ...args, '--schema', schema], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function requirePostgresUrl() {
  const url = process.env.DATABASE_URL ?? '';
  if (!isPostgresUrl(url)) {
    console.error('הפקודה דורשת DATABASE_URL של postgres:// או postgresql://');
    console.error('כרגע:', url || '(ריק)');
    process.exit(1);
  }
  return url;
}

function generatePostgres() {
  renderPostgresSchema();
  runPrisma(['generate'], pgSchema);
}

function migrateDeploy() {
  requirePostgresUrl();
  generatePostgres();
  runPrisma(['migrate', 'deploy'], pgSchema);
}

if (cmd === 'render') {
  renderPostgresSchema();
} else if (cmd === 'push') {
  requirePostgresUrl();
  renderPostgresSchema();
  runPrisma(['db', 'push'], pgSchema);
  runPrisma(['generate'], pgSchema);
} else if (cmd === 'generate') {
  const url = process.env.DATABASE_URL ?? '';
  if (isPostgresUrl(url)) {
    generatePostgres();
  } else {
    runPrisma(['generate'], sqliteSchema);
  }
} else if (cmd === 'generate-pg') {
  generatePostgres();
} else if (cmd === 'migrate-deploy') {
  migrateDeploy();
} else if (cmd === 'diff') {
  renderPostgresSchema();
  runPrisma(
    ['migrate', 'diff', '--from-empty', '--to-schema-datamodel', pgSchema, '--script'],
    pgSchema,
  );
} else {
  console.log(`שימוש: node scripts/db-mode.mjs <render|push|generate|generate-pg|migrate-deploy|diff>

  render           כותב prisma-pg/schema.prisma מתוך schema.prisma
  push             db push + generate מול Postgres (DATABASE_URL חייב להיות postgresql)
  generate         prisma generate לפי DATABASE_URL (sqlite או postgres)
  generate-pg      generate תמיד ל-Postgres (Docker build, בלי DATABASE_URL)
  migrate-deploy   generate + prisma migrate deploy מול prisma-pg (Railway)
  diff             מדפיס SQL ממצב ריק לסכמה הנוכחית (עזר למיגרציית בסיס)
`);
  process.exit(cmd === 'help' ? 0 : 1);
}
