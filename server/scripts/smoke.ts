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

const customers = await api('/admin/customers', {
  headers: { authorization: `Bearer ${adminToken}` },
});
if (customers.status !== 200) fail('admin customers', customers);

const patched = await api('/users/me', {
  method: 'PATCH',
  headers: { authorization: `Bearer ${customerToken}` },
  body: JSON.stringify({
    name: 'דנה כהן',
    phone: '0521112233',
    address: 'הרצל 10',
    city: 'אילת',
    email: 'dana@example.com',
  }),
});
if (patched.status !== 200) fail('patch me', patched);
const patchedUser = (patched.body as { user: { city: string; createdAt?: string } }).user;
if (patchedUser.city !== 'אילת') fail('city not saved outside delivery area', patched.body);
if (!patchedUser.createdAt) fail('createdAt missing', patched.body);

const meAfter = await api('/auth/me', {
  headers: { authorization: `Bearer ${customerToken}` },
});
if (meAfter.status !== 200) fail('me after patch', meAfter);
if ((meAfter.body as { user: { city: string } }).user.city !== 'אילת') fail('me city', meAfter.body);

const badPass = await api('/auth/change-password', {
  method: 'POST',
  headers: { authorization: `Bearer ${customerToken}` },
  body: JSON.stringify({ current: 'wrong-pass', next: 'newsecret99' }),
});
if (badPass.status !== 401) fail('change password wrong current', badPass);

const changed = await api('/auth/change-password', {
  method: 'POST',
  headers: { authorization: `Bearer ${customerToken}` },
  body: JSON.stringify({ current: 'secret12', next: 'newsecret99' }),
});
if (changed.status !== 200) fail('change password', changed);

const relogin = await api('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ who: 'dana@example.com', password: 'newsecret99' }),
});
if (relogin.status !== 200) fail('login after password change', relogin);

const days = await api('/admin/days', {
  headers: { authorization: `Bearer ${adminToken}` },
});
if (days.status !== 200) fail('admin days', days);

const week = await api('/admin/days?from=2026-10-06&to=2026-10-09', {
  headers: { authorization: `Bearer ${adminToken}` },
});
if (week.status !== 200) fail('admin days range', week);
const weekDays = (week.body as { days: Record<string, { sale?: string }> }).days;
if (weekDays['2026-10-06']?.sale !== 'cous') fail('tuesday couscous default', week.body);
if (weekDays['2026-10-09']?.sale !== 'schn') fail('friday schnitzel default', week.body);
if (weekDays['2026-10-07']?.sale) fail('wednesday must not be a sale day', week.body);

const tue = await api('/admin/days/2026-10-06', {
  headers: { authorization: `Bearer ${adminToken}` },
});
if (tue.status !== 200) fail('admin day tuesday', tue);
if ((tue.body as { rec: { sale?: string } }).rec.sale !== 'cous') fail('get tuesday couscous', tue.body);

for (const path of [
  '/admin/summary',
  '/admin/board',
  '/admin/money?period=month',
  '/admin/stock/sale',
  '/admin/stock/supply',
  '/admin/shop/active',
  '/admin/shop/history',
  '/admin/menu',
  '/admin/costs',
]) {
  const hit = await api(path, { headers: { authorization: `Bearer ${adminToken}` } });
  if (hit.status !== 200) fail(`admin ${path}`, hit);
}

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
