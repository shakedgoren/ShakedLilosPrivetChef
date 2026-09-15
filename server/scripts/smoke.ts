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
  '/admin/revenue?range=day',
  '/admin/revenue?range=week',
  '/admin/revenue?range=month',
  '/admin/revenue?range=half',
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

/**
 * גוש יום המכירה בדף הניהול · שקד ביקשה (15 בספטמבר 2026) שכל
 * המנות של יום המכירה הקרוב יופיעו עם המלאי והמכירות שלהן, ושמספר
 * ההזמנות והמחזור יהיו **של תאריך המכירה** ולא של היום.
 */
const summary = await api('/admin/summary', {
  headers: { authorization: `Bearer ${adminToken}` },
});
const sale = (summary.body as {
  sale?: {
    date: string;
    cat: string;
    open: boolean;
    dishes: { id: string; name: string; sold: number; quota: number }[];
    orders: number;
    meals: number;
    revenue: number;
  };
}).sale;
if (!sale) fail('summary sale block missing', summary.body);
if (!/^\d{4}-\d{2}-\d{2}$/.test(sale.date)) fail('sale date', sale);
if (sale.cat !== 'cous' && sale.cat !== 'schn') fail('sale category', sale);
if (!Array.isArray(sale.dishes) || sale.dishes.length === 0) fail('sale dishes', sale);
for (const d of sale.dishes) {
  if (!d.id || !d.name) fail('dish row missing name', d);
  if (typeof d.sold !== 'number' || typeof d.quota !== 'number') fail('dish row numbers', d);
}
if (typeof sale.orders !== 'number' || typeof sale.revenue !== 'number') fail('sale totals', sale);
/* ⚠ המחזור נגזר מהמנות · לא מ-total של ההזמנה */
const byDish = sale.dishes.reduce((s2, d) => s2 + d.sold, 0);
if (sale.meals !== byDish) fail('sale meals != dish sum', sale);
if (sale.revenue > 0 && byDish === 0) fail('revenue without dishes', sale);

/**
 * תיקון ידני של ״נמכר״ · שקד מקלידה מספר והוא גובר על הספירה
 * מההזמנות, ומחיקתו מחזירה את הספירה.
 */
/**
 * ⚠ **יום המכירה של עכשיו ולא תאריך קבוע** · הבדיקה נעלה פעם על
 * ‎2026-09-15, ולכן נשברה בשלישי ב-18:00 כשחלון המכירה עבר
 * לשישי של השניצל. היא לוקחת עכשיו את היום והמנה שהשרת עצמו
 * מחזיר.
 */
const fixDate = sale.date;
const fixDish = sale.dishes[0].id;
/* יום המכירה הזה אינו בהכרח הזרוע · נפתח אותו כדי שיהיה מה לתקן */
const openedFixDay = await api(`/admin/days/${fixDate}`, {
  method: 'PUT',
  headers: { authorization: `Bearer ${adminToken}` },
  body: JSON.stringify({ open: true, sale: sale.cat }),
});
if (openedFixDay.status !== 200) fail('open sale day for the manual fix', openedFixDay);
const beforeFix = await api(`/admin/days/${fixDate}`, {
  headers: { authorization: `Bearer ${adminToken}` },
});
const countedDish = ((beforeFix.body as { rec: { sold?: Record<string, number> } }).rec.sold ?? {})[fixDish] ?? 0;

const fixed = await api(`/admin/days/${fixDate}/sold`, {
  method: 'PATCH',
  headers: { authorization: `Bearer ${adminToken}` },
  body: JSON.stringify({ dishId: fixDish, sold: countedDish + 7 }),
});
if (fixed.status !== 200) fail('patch sold', fixed);
if (((fixed.body as { rec: { sold?: Record<string, number> } }).rec.sold ?? {})[fixDish] !== countedDish + 7) {
  fail('manual sold not applied', fixed.body);
}

const afterFix = await api('/admin/summary', { headers: { authorization: `Bearer ${adminToken}` } });
const fixedRow = ((afterFix.body as { sale: { dishes: { id: string; sold: number }[] } }).sale.dishes)
  .find((d) => d.id === fixDish);
if (!fixedRow || fixedRow.sold !== countedDish + 7) fail('summary ignores manual sold', fixedRow);

const cleared = await api(`/admin/days/${fixDate}/sold`, {
  method: 'PATCH',
  headers: { authorization: `Bearer ${adminToken}` },
  body: JSON.stringify({ dishId: fixDish, sold: null }),
});
if (cleared.status !== 200) fail('clear sold', cleared);
if ((((cleared.body as { rec: { sold?: Record<string, number> } }).rec.sold ?? {})[fixDish] ?? 0) !== countedDish) {
  fail('clearing did not restore the count', cleared.body);
}

/**
 * סגירת רשימת קניות · הרשימה עוברת להיסטוריה, נוצרת הוצאה,
 * ונפתחת רשימה ריקה חדשה באותו אזור.
 */
const active = await api('/admin/shop/active', { headers: { authorization: `Bearer ${adminToken}` } });
if (active.status !== 200) fail('shop active', active);
const list0 = (active.body as { list: { id: string; area: string; items: { name: string; price: string; qty: string; done?: boolean }[] } }).list;

/* ⚠ במסד של בדיקת העשן הרשימה ריקה · מוסיפים פריט ואז מסמנים
   אותו כנקנה. בלי פריט מסומן הסגירה נדחית בכוונה. */
const marked = [
  { id: 'smoke1', g: 'ירקות ופירות', name: 'עגבניות', unit: 'ק״ג', qty: '8', price: '9', done: true, actual: '9' },
  ...list0.items,
];
const saved = await api('/admin/shop/active', {
  method: 'PUT',
  headers: { authorization: `Bearer ${adminToken}` },
  body: JSON.stringify({ items: marked }),
});
if (saved.status !== 200) fail('shop save', saved);

const closed = await api('/admin/shop/active/close', {
  method: 'POST',
  headers: { authorization: `Bearer ${adminToken}` },
});
if (closed.status !== 200) fail('shop close', closed);
const cb = closed.body as { closed: { id: string; area: string }; list: { id: string; items: unknown[] }; expense: number };
if (cb.closed.id === cb.list.id) fail('close did not open a fresh list', cb);
if (cb.list.items.length !== 0) fail('fresh list is not empty', cb.list);
if (cb.closed.area !== cb.list.area) fail('fresh list changed area', cb);

const hist = await api('/admin/shop/history', { headers: { authorization: `Bearer ${adminToken}` } });
if (hist.status !== 200) fail('shop history', hist);
const lists = (hist.body as { lists: { id: string }[] }).lists;
if (!lists.some((l) => l.id === cb.closed.id)) fail('closed list missing from history', lists);

/**
 * ⚠ פילוח הקטגוריות · **בלי פירות ועם שף** · מגשי הפירות נעשים
 * אצל מיכל גורן ואינם ההכנסה של שקד; פינת השף כן (15 בספטמבר 2026).
 */
const donut = (summary.body as { donut: { shares: { name: string }[] } }).donut;
const names = donut.shares.map((x) => x.name);
if (names.includes('פירות')) fail('fruit still in the category split', names);
if (!names.includes('שף וטאבון')) fail('chef missing from the category split', names);

/* ארבעת הטווחים · כל אחד מחזיר תווית, סכום ונקודות */
for (const r of ['day', 'week', 'month', 'half']) {
  const hit = await api(`/admin/revenue?range=${r}`, {
    headers: { authorization: `Bearer ${adminToken}` },
  });
  if (hit.status !== 200) fail(`revenue ${r}`, hit);
  const b = hit.body as { range: string; label: string; total: number; points: { k: string; v: number }[] };
  if (b.range !== r) fail('revenue range echo', b);
  if (!b.label || typeof b.total !== 'number') fail('revenue head', b);
  if (!Array.isArray(b.points) || b.points.length < 2) fail('revenue points', b);
  for (const p of b.points) {
    if (typeof p.k !== 'string' || typeof p.v !== 'number') fail('revenue point shape', p);
  }
}

/**
 * מגמת הכספים · עיצוב ״הגלים״ מצייר ממנה את שני הגלים, ולכן כל
 * טווח חייב להחזיר סלים עם מחזור והוצאות.
 */
for (const [p, least] of [['month', 28], ['quart', 3], ['year', 12]] as const) {
  const hit = await api(`/admin/money?period=${p}`, { headers: { authorization: `Bearer ${adminToken}` } });
  if (hit.status !== 200) fail(`money ${p}`, hit);
  const b = hit.body as { revenue: number; expenses: number; points: { k: string; rev: number; exp: number }[] };
  if (!Array.isArray(b.points) || b.points.length < least) fail(`money points ${p}`, b.points);
  for (const pt of b.points) {
    if (typeof pt.k !== 'string' || typeof pt.rev !== 'number' || typeof pt.exp !== 'number') {
      fail(`money point shape ${p}`, pt);
    }
  }
  /* הסלים חייבים להסתכם בדיוק בסך התקופה · אחרת הגרף מספר סיפור אחר מהמספר */
  const sumRev = b.points.reduce((t, pt) => t + pt.rev, 0);
  const sumExp = b.points.reduce((t, pt) => t + pt.exp, 0);
  if (sumRev !== b.revenue) fail(`money points sum != revenue (${p})`, { sumRev, revenue: b.revenue });
  if (sumExp !== b.expenses) fail(`money points sum != expenses (${p})`, { sumExp, expenses: b.expenses });
}

/**
 * פנקס ההכנסות · ההזמנה שנוצרה למעלה חייבת להופיע בו, ביום
 * המכירה שלה ובסכום ששולם.
 */
const income = await api('/admin/income', { headers: { authorization: `Bearer ${adminToken}` } });
if (income.status !== 200) fail('income ledger', income);
const incRows = (income.body as {
  rows: { id: string; date: string; cat: string; catName: string; orders: number; meals: number; amount: number }[];
}).rows;
if (!Array.isArray(incRows) || incRows.length === 0) fail('income ledger empty', income.body);
const incMine = incRows.find((r) => r.date === order.saleDate && r.cat === order.category);
if (!incMine) fail('income ledger misses the order sale day', incRows);
if (incMine.orders < 1 || incMine.amount < order.total) fail('income row totals', incMine);
if (!incMine.catName) fail('income row category name', incMine);
if (incRows.some((r) => r.cat === 'fruit')) fail('fruit counted as income', incRows);

/**
 * הוצאות · הזנה ידנית, סינון לפי החודש שנבחר, ומחיקה.
 *
 * ⚠ **התאריך קובע את החודש** · הוצאה שהוקלדה היום עם תאריך של
 * חודש שעבר חייבת להיחשב בחודש ההוא, אחרת מסך הכספים משקר.
 */
const expBefore = await api('/admin/money?period=month', {
  headers: { authorization: `Bearer ${adminToken}` },
});
const sumOf = (b: unknown) => (b as { expenses: number }).expenses;
const baseExp = sumOf(expBefore.body);

const today = new Date();
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const madeExp = await api('/admin/expenses', {
  method: 'POST',
  headers: { authorization: `Bearer ${adminToken}` },
  body: JSON.stringify({ category: 'שיווק', amount: 250, date: iso(today), note: 'צילומים' }),
});
if (madeExp.status !== 201) fail('expense create', madeExp);
const expId = (madeExp.body as { id: string }).id;

const badCat = await api('/admin/expenses', {
  method: 'POST',
  headers: { authorization: `Bearer ${adminToken}` },
  body: JSON.stringify({ category: 'לא קיימת', amount: 10, date: iso(today) }),
});
if (badCat.status !== 400) fail('expense unknown category accepted', badCat);

const expAfter = await api('/admin/money?period=month', {
  headers: { authorization: `Bearer ${adminToken}` },
});
if (sumOf(expAfter.body) !== baseExp + 250) fail('expense not counted in month', expAfter.body);
const rowsOf = (b: unknown) => (b as { expenseRows: { k: string; v: number }[] }).expenseRows;
const marketing = rowsOf(expAfter.body).find((r) => r.k === 'שיווק');
if (!marketing || marketing.v < 250) fail('expense missing from its category', marketing);

const expList = await api('/admin/expenses', { headers: { authorization: `Bearer ${adminToken}` } });
if (expList.status !== 200) fail('expense list', expList);
const listRow = (expList.body as { rows: { id: string; fromShop: boolean; date: string }[] }).rows.find(
  (r) => r.id === expId,
);
if (!listRow) fail('expense not listed', expList.body);
if (listRow.fromShop) fail('manual expense marked as coming from a shopping list', listRow);
if (listRow.date !== iso(today)) fail('expense date echo', listRow);

const gone = await api(`/admin/expenses/${expId}`, {
  method: 'DELETE',
  headers: { authorization: `Bearer ${adminToken}` },
});
if (gone.status !== 200) fail('expense delete', gone);
const expFinal = await api('/admin/money?period=month', {
  headers: { authorization: `Bearer ${adminToken}` },
});
if (sumOf(expFinal.body) !== baseExp) fail('expense still counted after delete', expFinal.body);

writeFileSync(
  join(dir, 'ok.txt'),
  `ok ${order.id} ${pathToFileURL(db).href}\n`,
  'utf8',
);

console.log('SMOKE OK');
console.log(`  user order ${order.id} total=${order.total}`);
console.log(`  admin saw it and set status=מאושרת`);
console.log(`  sale ${sale.date} ${sale.cat} · ${sale.dishes.length} dishes · ${sale.orders} orders`);

server.close();
await prisma.$disconnect();
process.exit(0);
