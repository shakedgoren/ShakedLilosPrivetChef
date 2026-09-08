/**
 * בדיקת עשן · מרים שרת זמני על SQLite נפרד, נרשם, מזמין קוסקוס, ושולף כמשתמשת וכמנהלת.
 * מריצים מתוך server/: `npm run smoke`
 */
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = new URL('..', import.meta.url).pathname;
const dir = mkdtempSync(join(tmpdir(), 'bite-tell-smoke-'));
const db = join(dir, 'smoke.db');

process.env.DATABASE_URL = `file:${db}`;
process.env.JWT_SECRET = 'smoke-secret';
process.env.RESET_DEBUG = '1';
process.env.ADMIN_EMAIL = 'shaked@localhost';
process.env.ADMIN_PHONE = '0500000000';
process.env.ADMIN_PASSWORD = 'changeme';
process.env.ADMIN_NAME = 'שקד לילוז';
process.env.NODE_ENV = 'test';

execSync('npx prisma db push --skip-generate', {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env },
});

const { createApp } = await import('../src/app.ts');
const { prisma } = await import('../src/db.ts');
const { hashPassword } = await import('../src/auth/passwords.ts');

await prisma.user.create({
  data: {
    email: 'shaked@localhost',
    phone: '0500000000',
    passwordHash: await hashPassword('changeme'),
    name: 'שקד לילוז',
    role: 'admin',
  },
});

const app = createApp();
const server = app.listen(0, '127.0.0.1');
await new Promise<void>((resolve) => server.once('listening', () => resolve()));
const addr = server.address();
if (!addr || typeof addr === 'string') throw new Error('no port');
const base = `http://127.0.0.1:${addr.port}`;

const api = async (path: string, init: RequestInit = {}) => {
  const res = await fetch(base + path, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* keep */
  }
  return { status: res.status, body };
};

const fail = (msg: string, extra?: unknown): never => {
  console.error('SMOKE FAIL', msg, extra ?? '');
  process.exit(1);
};

const health = await api('/health');
if (health.status !== 200) fail('health', health);

const registered = await api('/auth/register', {
  method: 'POST',
  body: JSON.stringify({ who: 'dana@example.com', password: 'secret12', name: 'דנה כהן' }),
});
if (registered.status !== 201) fail('register', registered);
const customerToken = (registered.body as { token: string }).token;

const created = await api('/orders', {
  method: 'POST',
  headers: { authorization: `Bearer ${customerToken}` },
  body: JSON.stringify({
    ship: 'self',
    time: '12:30',
    pay: 'ביט',
    details: { category: 'cous', qty: [2, 1, 0, 0, 0, 0] },
  }),
});
if (created.status !== 201) fail('create order', created);
const order = (created.body as { order: { id: string; total: number; status: string } }).order;
if (order.total !== 145) fail('price', order);
if (order.status !== 'חדשה') fail('status', order);

const listed = await api('/orders', { headers: { authorization: `Bearer ${customerToken}` } });
if (listed.status !== 200) fail('list mine', listed);
const mine = (listed.body as { orders: { id: string }[] }).orders;
if (!mine.some((o) => o.id === order.id)) fail('missing in list', listed);

const got = await api(`/orders/${order.id}`, {
  headers: { authorization: `Bearer ${customerToken}` },
});
if (got.status !== 200) fail('get mine', got);

const adminLogin = await api('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ who: 'shaked@localhost', password: 'changeme' }),
});
if (adminLogin.status !== 200) fail('admin login', adminLogin);
const adminToken = (adminLogin.body as { token: string }).token;

const adminList = await api('/admin/orders', {
  headers: { authorization: `Bearer ${adminToken}` },
});
if (adminList.status !== 200) fail('admin list', adminList);
const cards = (adminList.body as { cards: { id: string }[] }).cards;
if (!cards.some((c) => c.id === order.id)) fail('admin missing order', adminList);

const advanced = await api(`/admin/orders/${order.id}/status`, {
  method: 'PATCH',
  headers: { authorization: `Bearer ${adminToken}` },
  body: JSON.stringify({ status: 'מאושרת' }),
});
if (advanced.status !== 200) fail('admin status', advanced);
const after = (advanced.body as { order: { status: string } }).order;
if (after.status !== 'מאושרת') fail('status not confirmed', advanced);

const asAdmin = await api(`/orders/${order.id}`, {
  headers: { authorization: `Bearer ${adminToken}` },
});
if (asAdmin.status !== 200) fail('admin get customer order', asAdmin);

writeFileSync(
  join(dir, 'ok.txt'),
  `ok ${order.id} ${pathToFileURL(db).href}\n`,
  'utf8',
);

console.log('SMOKE OK');
console.log(`  user order ${order.id} total=${order.total}`);
console.log(`  admin saw it and set status=מאושרת`);

server.close();
await prisma.$disconnect();
process.exit(0);
