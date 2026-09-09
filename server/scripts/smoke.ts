/**
 * בדיקת עשן · מרים שרת זמני על SQLite נפרד, נרשם, מזמין קוסקוס, ושולף כמשתמשת וכמנהלת.
 * גם מכסות, להזמין שוב, גוגל 501, והעלאת תמונת פרופיל.
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
process.env.UPLOAD_DIR = join(dir, 'uploads');

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

await prisma.saleDay.create({
  data: {
    date: '2026-09-15',
    sale: 'cous',
    open: true,
    quotasJson: JSON.stringify({
      veg: 40,
      chick: 30,
      mafr: 30,
      aVeg: 20,
      aChick: 15,
      aMafr: 15,
    }),
    wasteJson: '{}',
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

const googleUnset = await api('/auth/google', {
  method: 'POST',
  body: JSON.stringify({ idToken: 'anything' }),
});
if (googleUnset.status !== 501) fail('google unset should 501', googleUnset);
if ((googleUnset.body as { error?: string }).error !== 'google_not_configured') {
  fail('google unset error code', googleUnset);
}

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
const order = (created.body as { order: { id: string; total: number; status: string; saleDate: string } }).order;
if (order.total !== 145) fail('price', order);
if (order.status !== 'חדשה') fail('status', order);
if (order.saleDate !== '2026-09-15') fail('saleDate resolved to open couscous day', order);

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

const png =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const photo = await api('/users/me/photo', {
  method: 'POST',
  headers: { authorization: `Bearer ${customerToken}` },
  body: JSON.stringify({ image: `data:image/png;base64,${png}` }),
});
if (photo.status !== 201) fail('photo upload', photo);
const avatarUrl = (photo.body as { user: { avatarUrl: string } }).user.avatarUrl;
if (!avatarUrl.startsWith('/uploads/avatars/')) fail('avatarUrl path', photo.body);
const served = await api(avatarUrl);
if (served.status !== 200) fail('serve avatar', served);

const quotaDay = await api('/admin/days/2026-09-22', {
  method: 'PUT',
  headers: { authorization: `Bearer ${adminToken}` },
  body: JSON.stringify({
    sale: 'cous',
    open: true,
    q: { veg: 1, chick: 30, mafr: 30, aVeg: 20, aChick: 15, aMafr: 15 },
  }),
});
if (quotaDay.status !== 200) fail('open quota day', quotaDay);

const overQuota = await api('/orders', {
  method: 'POST',
  headers: { authorization: `Bearer ${customerToken}` },
  body: JSON.stringify({
    ship: 'self',
    time: '12:30',
    pay: 'ביט',
    saleDate: '2026-09-22',
    details: { category: 'cous', qty: [2, 0, 0, 0, 0, 0] },
  }),
});
if (overQuota.status !== 409) fail('quota should 409', overQuota);
if ((overQuota.body as { error?: string }).error !== 'quota_exceeded') fail('quota code', overQuota);

const closedDay = await api('/admin/days/2026-09-29', {
  method: 'PUT',
  headers: { authorization: `Bearer ${adminToken}` },
  body: JSON.stringify({ sale: 'cous', open: false }),
});
if (closedDay.status !== 200) fail('close day', closedDay);

const closedOrder = await api('/orders', {
  method: 'POST',
  headers: { authorization: `Bearer ${customerToken}` },
  body: JSON.stringify({
    ship: 'self',
    time: '12:30',
    pay: 'ביט',
    saleDate: '2026-09-29',
    details: { category: 'cous', qty: [1, 0, 0, 0, 0, 0] },
  }),
});
if (closedOrder.status !== 400) fail('closed day should 400', closedOrder);
if ((closedOrder.body as { error?: string }).error !== 'day_closed') fail('closed code', closedOrder);

const again = await api(`/orders/${order.id}/reorder`, {
  method: 'POST',
  headers: { authorization: `Bearer ${customerToken}` },
  body: JSON.stringify({}),
});
if (again.status !== 201) fail('reorder', again);
const copy = (again.body as { order: { id: string; total: number; saleDate: string } }).order;
if (copy.id === order.id) fail('reorder must be a new order', again);
if (copy.total !== 145) fail('reorder price from catalog', again);
if (copy.saleDate !== '2026-09-15') fail('reorder saleDate', again);

process.env.GOOGLE_CLIENT_ID = 'smoke.apps.googleusercontent.com';
const googleNoToken = await api('/auth/google', { method: 'POST', body: JSON.stringify({}) });
if (googleNoToken.status !== 400) fail('google configured without token', googleNoToken);
const googleOk = await api('/auth/google', {
  method: 'POST',
  body: JSON.stringify({ idToken: 'test:gid-smoke:galia@example.com:גליה' }),
});
if (googleOk.status !== 200) fail('google test token', googleOk);
if (!(googleOk.body as { token?: string }).token) fail('google session token', googleOk);
delete process.env.GOOGLE_CLIENT_ID;

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
