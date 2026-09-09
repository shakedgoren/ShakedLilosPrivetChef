import { config } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, '../.env') });

const required = (key: string, fallback?: string): string => {
  const v = process.env[key] ?? fallback;
  if (v === undefined || v === '') {
    throw new Error(`חסר משתנה סביבה: ${key}`);
  }
  return v;
};

const node = process.env.NODE_ENV ?? 'development';
const isProd = node === 'production';

export const env = {
  node,
  port: Number(process.env.PORT ?? 3001),
  host: process.env.HOST ?? '0.0.0.0',
  databaseUrl: required('DATABASE_URL', 'file:./dev.db'),
  jwtSecret: isProd ? required('JWT_SECRET') : (process.env.JWT_SECRET || 'dev-change-me-bite-and-tell'),
  jwtExpiresHours: Number(process.env.JWT_EXPIRES_HOURS ?? 168),
  adminEmail: (process.env.ADMIN_EMAIL ?? 'shaked@localhost').toLowerCase(),
  adminPhone: process.env.ADMIN_PHONE ?? '0500000000',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'changeme',
  adminName: process.env.ADMIN_NAME ?? 'שקד לילוז',
  get googleClientIds(): string[] {
    return (process.env.GOOGLE_CLIENT_ID ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  },
  get googleClientId(): string {
    return (process.env.GOOGLE_CLIENT_ID ?? '').split(',')[0]?.trim() ?? '';
  },
  resetDebug: process.env.RESET_DEBUG === '1',
  uploadDir: process.env.UPLOAD_DIR || resolve(here, '../uploads'),
};

export { isProd };
