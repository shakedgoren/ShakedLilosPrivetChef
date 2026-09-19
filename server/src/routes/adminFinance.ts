import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { requireAdmin, requireAuth } from '../auth/middleware.ts';
import { EXPENSES, MONEY_CATS, PERIODS } from '../../../mobile/src/data/adminMoney.ts';
import { sortDishes, compareCost, menuRowsOf, unitCost, viewOf, type CostPart } from '../admin/costsMath.ts';
import { splitByDish, type SoldMap } from '../admin/saleSplit.ts';
import { hebrewDayLabel, hebrewMonthYear, isoDate, monthKey } from '../admin/sold.ts';
import { CANCELLED } from '../catalog/status.ts';
import { CATS, type DayCatKey } from '../../../mobile/src/data/adminDays.ts';
import { upcomingSale } from '../../../mobile/src/data/saleWeek.ts';
import { soldByDish } from '../admin/sold.ts';
import { readJson } from '../json.ts';
import { notFound } from '../errors.ts';
import { STATE } from '../../../mobile/src/data/adminHome.ts';
import { type AdminCatKey } from '../../../mobile/src/data/adminOrders.ts';
import { dishPrices } from '../admin/prices.ts';
import { EXPENSE_CATS } from '../admin/expenseCats.ts';
import { qtyOfOrder } from '../admin/sold.ts';

/** קיצורי החודשים לתוויות הגרף · שלוש אותיות כמו בדף הבית */
const MONTH_SHORT = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יוני', 'יולי', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];

export const adminFinanceRouter = Router();
adminFinanceRouter.use(requireAuth, requireAdmin);

function periodRange(key: 'month' | 'quart' | 'year', now = new Date()): { from: Date; to: Date; label: string } {
  const y = now.getFullYear();
  const m = now.getMonth();
  if (key === 'month') {
    const from = new Date(y, m, 1);
    const to = new Date(y, m + 1, 1);
    return { from, to, label: hebrewMonthYear(now) };
  }
  if (key === 'quart') {
    const from = new Date(y, m - 2, 1);
    const to = new Date(y, m + 1, 1);
    const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    return { from, to, label: `${months[from.getMonth()]}–${months[m]} ${y}` };
  }
  const from = new Date(y - 1, m + 1, 1);
  const to = new Date(y, m + 1, 1);
  const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  return { from, to, label: `${months[from.getMonth()]} ${from.getFullYear()} – ${months[m]} ${y}` };
}

adminFinanceRouter.get('/money', async (req, res, next) => {
  try {
    const period = (typeof req.query.period === 'string' ? req.query.period : 'month') as 'month' | 'quart' | 'year';
    const key = period === 'quart' || period === 'year' ? period : 'month';
    const { from, to, label } = periodRange(key);
    /**
     * ⚠ **רק שלושת השדות שבאמת נחוצים · 19 בספטמבר 2026** · כאן
     * נשלפה **כל שורת הזמנה במלואה** לתקופה — כולל `itemsJson`
     * ו-`detailsJson`, שהם בפער גדול העמודות הכבדות בטבלה. בתצוגת
     * ״שנה״ זו כל השנה, עם כל פירוט ההזמנות, רק כדי לחבר מספרים
     * ולפלח אותם לחודשים.
     *
     * ⚠ **תקרה כאן הייתה הופכת את המספרים לשקר** · זו הסיבה
     * שהשאילתות האלה לא קיבלו `take` כמו הרשימות: מחזור חתוך הוא
     * מחזור **שגוי**, וזה גרוע מאיטי. `select` מצמצם את המשקל בלי
     * לשנות ולו מספר אחד.
     *
     * ⚠ **הטרנד הוא שמחייב שורות** · הפילוח לימים ולחודשים נגזר
     * מ-`createdAt` של כל שורה, ו-`groupBy` של Prisma אינו יודע
     * לקבץ לפי חלק מתאריך. לכן נשארות שורות — רק רזות.
     */
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: from, lt: to },
        status: { not: CANCELLED },
        category: { not: 'fruit' },
      },
      select: { createdAt: true, total: true, category: true },
    });
    const revenue = orders.reduce((s, o) => s + o.total, 0);
    const byCat: Record<string, number> = { cous: 0, schn: 0, box: 0, chef: 0 };
    for (const o of orders) {
      if (o.category in byCat) byCat[o.category] += o.total;
    }

    const expenses = await prisma.expense.findMany({
      where: { createdAt: { gte: from, lt: to } },
      select: { createdAt: true, amount: true, category: true },
    });
    const grouped: Record<string, number> = {};
    for (const e of EXPENSES) grouped[e.k] = 0;
    for (const e of expenses) grouped[e.category] = (grouped[e.category] ?? 0) + e.amount;
    const expTotal = Object.values(grouped).reduce((s, n) => s + n, 0);
    const profit = revenue - expTotal;
    const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

    /**
     * ⚠ **מגמת המחזור וההוצאות** · שקד בחרה (15 בספטמבר 2026) את
     * עיצוב ״הגלים״, שבו הגרף הוא הרקע של הכרטיס. החודש מחולק
     * לימים, והרבעון והשנה לחודשים — כל טווח והסלים שלו.
     */
    const byDay = key === 'month';
    const bucketOf = (d: Date) => (byDay ? String(d.getDate()) : monthKey(d));
    const order: string[] = [];
    const seen = new Set<string>();
    for (const cur = new Date(from); cur < to; byDay ? cur.setDate(cur.getDate() + 1) : cur.setMonth(cur.getMonth() + 1)) {
      const k = bucketOf(cur);
      if (!seen.has(k)) {
        seen.add(k);
        order.push(k);
      }
    }
    const revBy: Record<string, number> = {};
    const expBy: Record<string, number> = {};
    for (const k of order) {
      revBy[k] = 0;
      expBy[k] = 0;
    }
    for (const o of orders) {
      const k = bucketOf(o.createdAt);
      if (k in revBy) revBy[k] += o.total;
    }
    for (const e of expenses) {
      const k = bucketOf(e.createdAt);
      if (k in expBy) expBy[k] += e.amount;
    }
    const points = order.map((k) => ({
      k: byDay ? k : MONTH_SHORT[Number(k.slice(5, 7)) - 1] ?? k,
      rev: revBy[k],
      exp: expBy[k],
    }));

    const cats = MONEY_CATS.map((c) => {
      const v = byCat[c.id] ?? 0;
      const share = revenue > 0 ? v / revenue : c.share;
      return { ...c, v, pct: Math.round(share * 100), share };
    });

    res.json({
      period: key,
      label,
      periodName: PERIODS[key].n,
      revenue,
      expenses: expTotal,
      profit,
      margin,
      cats,
      points,
      expenseRows: EXPENSES.map((e) => ({ k: e.k, sub: e.sub, v: grouped[e.k] ?? 0 })),
    });
  } catch (err) {
    next(err);
  }
});

/* ────────────────────────────────────────────────────────────
   הוצאות · הזנה ידנית

   ⚠ **בקשה של שקד (15 בספטמבר 2026)** · עד כה הדבר היחיד שיצר
   הוצאה היה סגירת רשימת קניות, ולכן ארבע מתוך חמש הקטגוריות
   במסך הכספים לא יכלו לזוז לעולם.

   ⚠ **התאריך נשמר ב-`createdAt`** · כל שאילתות הכספים מסננות
   לפיו, ולכן תאריך שנבחר ידנית חייב לשבת שם — אחרת ההוצאה
   תיפול על החודש שבו הוקלדה ולא על החודש שאליו היא שייכת.
   ──────────────────────────────────────────────────────────── */

/**
 * פנקס ההכנסות · כל יום מכירה וכל קטגוריה, מהחדש לישן.
 *
 * ⚠ **הסכום הוא `total` של ההזמנה** · בדיוק מה שהלקוחה שילמה,
 * כולל דמי משלוח — וזה מה שמסך הכספים מסכם בכרטיס ״מחזור״, כך
 * שהפנקס מתיישב איתו. בדף הבית ״הכנסות עבור היום״ מחושב אחרת,
 * מנות × מחיר, לפי בקשה מפורשת של שקד.
 *
 * ⚠ **פירות בחוץ** · מגשי הפירות נעשים אצל מיכל גורן ואינם
 * ההכנסה של שקד.
 */
adminFinanceRouter.get('/income', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 400, 1000);
    const orders = await prisma.order.findMany({
      where: { status: { not: CANCELLED }, category: { not: 'fruit' } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    const named: Record<string, { n: string; hue: string; deep: string }> = {};
    for (const c of MONEY_CATS) named[c.id] = { n: c.n, hue: c.hue, deep: c.deep };

    const buckets = new Map<
      string,
      { date: string; cat: string; catName: string; hue: string; deep: string; orders: number; meals: number; amount: number }
    >();
    for (const o of orders) {
      /* ⚠ יום המכירה קודם · הזמנת שף אינה נושאת אחד ולכן נופלת על יום הפתיחה */
      const date = o.saleDate || isoDate(o.createdAt);
      const key = `${date}|${o.category}`;
      const meta = named[o.category] ?? { n: o.category, hue: '#8A8194', deep: '#4A4254' };
      const b = buckets.get(key) ?? {
        date,
        cat: o.category,
        catName: meta.n,
        hue: meta.hue,
        deep: meta.deep,
        orders: 0,
        meals: 0,
        amount: 0,
      };
      b.orders += 1;
      b.amount += o.total;
      b.meals += Object.values(qtyOfOrder(o)).reduce((t, n) => t + n, 0);
      buckets.set(key, b);
    }

    const rows = [...buckets.values()]
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .map((b) => ({ ...b, id: `${b.date}|${b.cat}`, label: hebrewDayLabel(b.date), period: b.date.slice(0, 7) }));

    res.json({ rows });
  } catch (err) {
    next(err);
  }
});

const expenseBody = z.object({
  category: z.string().min(1).max(60),
  /** אגורות אינן נשמרות · הסכומים במסך הכספים שלמים */
  amount: z.number().int().positive().max(1_000_000),
  /** yyyy-mm-dd · היום שבו ההוצאה נעשתה */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(200).default(''),
});

function dateOfIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

adminFinanceRouter.get('/expenses', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 120, 500);
    const rows = await prisma.expense.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
    res.json({
      cats: EXPENSE_CATS,
      rows: rows.map((e) => ({
        id: e.id,
        category: e.category,
        amount: e.amount,
        period: e.period,
        note: e.note,
        /** הוצאה שנולדה מסגירת קנייה · לא הוקלדה ידנית */
        fromShop: e.source !== '',
        date: isoDate(e.createdAt),
      })),
    });
  } catch (err) {
    next(err);
  }
});

adminFinanceRouter.post('/expenses', async (req, res, next) => {
  try {
    const body = expenseBody.parse(req.body);
    if (!EXPENSE_CATS.includes(body.category)) {
      res.status(400).json({ error: 'unknown_category', message: 'קטגוריה לא מוכרת' });
      return;
    }
    const when = dateOfIso(body.date);
    const row = await prisma.expense.create({
      data: {
        category: body.category,
        amount: body.amount,
        period: monthKey(when),
        note: body.note,
        createdAt: when,
      },
    });
    res.status(201).json({ id: row.id });
  } catch (err) {
    next(err);
  }
});

adminFinanceRouter.delete('/expenses/:id', async (req, res, next) => {
  try {
    const found = await prisma.expense.findUnique({ where: { id: req.params.id } });
    if (!found) throw notFound();
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

adminFinanceRouter.get('/menu', async (_req, res, next) => {
  try {
    /* ⚠ הסדר הקנוני · ראו `sortDishes` */
    const rows = sortDishes(await prisma.productionDish.findMany());
    const views = rows.map(viewOf);
    res.json({ items: menuRowsOf(views) });
  } catch (err) {
    next(err);
  }
});

adminFinanceRouter.get('/costs', async (_req, res, next) => {
  try {
    /* ⚠ הסדר הקנוני · ראו `sortDishes` */
    const rows = sortDishes(await prisma.productionDish.findMany());
    const views = rows.map(viewOf);
    res.json({
      dishes: views.map((d) => ({
        ...d,
        unit: unitCost(d, views),
        cost: compareCost(d, views),
      })),
    });
  } catch (err) {
    next(err);
  }
});

adminFinanceRouter.put('/costs/:id', async (req, res, next) => {
  try {
    const id = String(req.params.id ?? '');
    const body = z
      .object({
        price: z.number().optional(),
        yld: z.number().optional(),
        parts: z.array(z.object({ n: z.string(), price: z.number(), qty: z.number() })).optional(),
        note: z.string().optional(),
      })
      .parse(req.body);
    const existing = await prisma.productionDish.findUnique({ where: { id } });
    if (!existing) throw notFound();
    const row = await prisma.productionDish.update({
      where: { id },
      data: {
        ...(body.price !== undefined ? { price: body.price } : {}),
        ...(body.yld !== undefined ? { yieldQty: body.yld } : {}),
        ...(body.parts !== undefined ? { partsJson: JSON.stringify(body.parts) } : {}),
        ...(body.note !== undefined ? { note: body.note } : {}),
      },
    });
    const all = sortDishes(await prisma.productionDish.findMany()).map(viewOf);
    const view = viewOf(row);
    res.json({ dish: { ...view, unit: unitCost(view, all), cost: compareCost(view, all) } });
  } catch (err) {
    next(err);
  }
});

adminFinanceRouter.post('/costs/import/:listId', async (req, res, next) => {
  try {
    const listId = String(req.params.listId ?? '');
    const list = await prisma.shoppingList.findUnique({ where: { id: listId } });
    if (!list) throw notFound();
    const items = readJson<{ name: string; price: string; actual?: string; qty: string; done?: boolean }[]>(
      list.itemsJson,
      [],
    );
    const price: Record<string, number> = {};
    for (const it of items) {
      const p = parseFloat(String(it.price).replace(/[^\d.]/g, ''));
      if (it.name && Number.isFinite(p)) price[it.name.trim()] = p;
    }
    const dishes = await prisma.productionDish.findMany();
    let hit = 0;
    for (const d of dishes) {
      const parts = readJson<CostPart[]>(d.partsJson, []);
      let changed = false;
      const next = parts.map((p) => {
        const v = price[p.n.trim()];
        if (v === undefined) return p;
        hit++;
        changed = true;
        return { ...p, price: v };
      });
      if (changed) {
        await prisma.productionDish.update({ where: { id: d.id }, data: { partsJson: JSON.stringify(next) } });
      }
    }
    res.json({ hit, message: hit === 0 ? 'לא נמצאו מצרכים תואמים' : `עודכנו ${hit} שורות מצרכים` });
  } catch (err) {
    next(err);
  }
});

/**
 * מחזור לפי טווח · שקד ביקשה (15 בספטמבר 2026) לבחור בין היום,
 * השבוע, החודש וחצי השנה האחרונה.
 *
 * כל טווח מצויר בסלים הטבעיים שלו: היום לפי שעות, השבוע לפי ימים,
 * החודש לפי ימים, וחצי שנה לפי חודשים. הסכום הוא `total` של
 * ההזמנות שלא בוטלו — כלומר מה שבאמת נכנס, כולל משלוחים.
 */
const HE_MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const HE_DOW = ['א','ב','ג','ד','ה','ו','ש'];
const RANGES = ['day', 'week', 'month', 'half'] as const;
type RangeKey = (typeof RANGES)[number];

const RANGE_LABEL: Record<RangeKey, string> = {
  day: 'מחזור · היום',
  week: 'מחזור · השבוע',
  month: 'מחזור · החודש',
  half: 'מחזור · ששת החודשים האחרונים',
};

/** ⚠ שעות העבודה · מחוצה להן הגרף היה מלא באפסים */
const DAY_FROM = 8;
const DAY_TO = 22;

function rangeStart(key: RangeKey, now: Date): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (key === 'day') return d;
  if (key === 'week') {
    /* השבוע מתחיל ביום ראשון · כמו בלוח ימי המכירה */
    d.setDate(d.getDate() - d.getDay());
    return d;
  }
  if (key === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(now.getFullYear(), now.getMonth() - 5, 1);
}

adminFinanceRouter.get('/revenue', async (req, res, next) => {
  try {
    const raw = typeof req.query.range === 'string' ? req.query.range : 'half';
    const key = (RANGES as readonly string[]).includes(raw) ? (raw as RangeKey) : 'half';
    const now = new Date();
    const from = rangeStart(key, now);
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    /* ⚠ בלי פירות · אינם הכנסה של שקד, לבקשתה (15 בספטמבר 2026) */
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: from, lt: to }, status: { not: CANCELLED }, category: { not: 'fruit' } },
      select: { createdAt: true, total: true },
    });

    const points: { k: string; v: number }[] = [];
    const add = (k: string, v: number) => points.push({ k, v });

    if (key === 'day') {
      const byHour = new Map<number, number>();
      for (const o of orders) {
        const h = Math.min(DAY_TO, Math.max(DAY_FROM, o.createdAt.getHours()));
        byHour.set(h, (byHour.get(h) ?? 0) + o.total);
      }
      for (let h = DAY_FROM; h <= DAY_TO; h += 2) add(`${h}:00`, byHour.get(h) ?? 0);
    } else if (key === 'week' || key === 'month') {
      const byDay = new Map<string, number>();
      for (const o of orders) {
        const k2 = isoDate(o.createdAt);
        byDay.set(k2, (byDay.get(k2) ?? 0) + o.total);
      }
      for (let d = new Date(from); d < to; d.setDate(d.getDate() + 1)) {
        const label = key === 'week' ? HE_DOW[d.getDay()] : String(d.getDate());
        add(label, byDay.get(isoDate(d)) ?? 0);
      }
    } else {
      const byMonth = new Map<string, number>();
      for (const o of orders) {
        const k2 = `${o.createdAt.getFullYear()}-${o.createdAt.getMonth()}`;
        byMonth.set(k2, (byMonth.get(k2) ?? 0) + o.total);
      }
      for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        add(HE_MONTHS[d.getMonth()].slice(0, 4), byMonth.get(`${d.getFullYear()}-${d.getMonth()}`) ?? 0);
      }
    }

    res.json({
      range: key,
      label: RANGE_LABEL[key],
      total: orders.reduce((s2, o) => s2 + o.total, 0),
      points,
    });
  } catch (err) {
    next(err);
  }
});

adminFinanceRouter.get('/summary', async (_req, res, next) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const todayOrders = await prisma.order.findMany({
      where: { createdAt: { gte: start, lt: end }, status: { not: CANCELLED }, category: { not: 'fruit' } },
    });
    const monthFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthOrders = await prisma.order.findMany({
      where: { createdAt: { gte: monthFrom, lt: end }, status: { not: CANCELLED }, category: { not: 'fruit' } },
    });
    const monthExp = await prisma.expense.aggregate({
      where: { createdAt: { gte: monthFrom, lt: end } },
      _sum: { amount: true },
    });
    /**
     * ⚠ **מגמת הרווח · 19 בספטמבר 2026** · בקשה של שקד: העמודות
     * בכרטיס ״רווח החודש״ ״צריכות להיות פונקציונליות בהתאם
     * לנתונים״. עד עכשיו הן היו ציור קבוע מהקנבס
     * (`PROFIT.bars`) — שישה מלבנים בגבהים כתובים מראש, שלא זזו
     * לעולם.
     *
     * ⚠ **שישה חודשים, כולל הנוכחי** · אותו טווח של גרף המחזור
     * שמעליו, כדי שהשניים יספרו את אותו סיפור.
     *
     * ⚠ **שדות רזים** · רק `createdAt` ו-`total`, בלי עמודות
     * ה-JSON הכבדות · ראו ההערה ב-`/money`.
     */
    const trendFrom = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const [trendOrders, trendExp] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: { gte: trendFrom, lt: end },
          status: { not: CANCELLED },
          category: { not: 'fruit' },
        },
        select: { createdAt: true, total: true },
      }),
      prisma.expense.findMany({
        where: { createdAt: { gte: trendFrom, lt: end } },
        select: { createdAt: true, amount: true },
      }),
    ]);
    const bucket = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
    const rev6 = new Map<string, number>();
    const exp6 = new Map<string, number>();
    for (const o of trendOrders) rev6.set(bucket(o.createdAt), (rev6.get(bucket(o.createdAt)) ?? 0) + o.total);
    for (const e of trendExp) exp6.set(bucket(e.createdAt), (exp6.get(bucket(e.createdAt)) ?? 0) + e.amount);
    const profitTrend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const k = bucket(d);
      return { k: MONTH_SHORT[d.getMonth()] ?? '', v: (rev6.get(k) ?? 0) - (exp6.get(k) ?? 0) };
    });

    /**
     * ⚠ **שתי הכרטיסיות בדף הבית · 19 בספטמבר 2026** · בקשה של
     * שקד: ״בכרטיסייה מצד ימין רק את ההכנסות של אותו החודש של
     * המכירות של הקוסקוס והשניצל, ושבצד שמאל רק את ההוצאות של
     * אותו החודש של המכירות של הקוסקוס והשניצל״.
     *
     * ⚠ **״הוצאות של המכירות״ = עלות הייצור של מה שנמכר** · טבלת
     * ההוצאות מסווגת לפי סוג ההוצאה (חומרי גלם, אריזות) ולא לפי
     * קטגוריית מכירה, ולכן אי אפשר לסנן אותה ל״קוסקוס ושניצל״.
     * מה שכן ניתן לחשב — וזה גם מה שהיא ביקשה בפועל — הוא **כמה
     * עלה לייצר את מה שנמכר**, לפי עלויות הייצור שהיא מזינה
     * במסך העלויות.
     *
     * ⚠ **0 עד שהיא תזין עלויות** · וזה נכון: בלי עלות ייצור
     * אין מה לדעת כמה עלה לייצר.
     */
    const saleCatOrders = monthOrders.filter((o) => o.category === 'cous' || o.category === 'schn');
    const saleRevenueMonth = saleCatOrders.reduce((s2, o) => s2 + o.total, 0);
    const dishViews = sortDishes(await prisma.productionDish.findMany()).map(viewOf);
    const saleCostMonth = saleCatOrders.reduce((s2, o) => {
      const qty = qtyOfOrder(o);
      let cost = 0;
      for (const [id, n] of Object.entries(qty)) {
        const dish = dishViews.find((d) => d.id === id);
        if (dish) cost += compareCost(dish, dishViews) * n;
      }
      return s2 + cost;
    }, 0);

    /**
     * ⚠ **פילוח לפי מנה · 19 בספטמבר 2026** · שתי הדיאגרמות
     * שבתחתית הדף · בקשה של שקד: ״איפה שהדיאגרמת עוגה — פילוח רק
     * של ההכנסות מהמכירות של הקוסקוס והשניצל בכל החודש. ואיפה
     * שהיה את הדיאגרמה השנייה העמודות — פילוח רק של ההוצאות״.
     * הפיצול לקוסקוס ולשניצל הוא כפתור במסך · ראו `saleSplit`.
     */
    const soldMonth: SoldMap = {};
    for (const o of saleCatOrders) {
      for (const [id, n] of Object.entries(qtyOfOrder(o))) {
        soldMonth[id] = (soldMonth[id] ?? 0) + n;
      }
    }
    const saleSplit = splitByDish(dishViews, soldMonth);

    const people = await prisma.user.count({ where: { role: 'customer' } });
    const openShop = await prisma.shoppingList.findFirst({ where: { closedAt: null } });
    const shopItems = openShop ? readJson<{ done: boolean }[]>(openShop.itemsJson, []) : [];
    const hist = await prisma.shoppingList.count({ where: { closedAt: { not: null } } });
    const supply = await prisma.supplyItem.findMany();
    const lowStock = supply.filter((s) => s.qty < s.min).length;
    const menuItems = await prisma.productionDish.count();
    const openDays = await prisma.saleDay.findMany({ where: { open: true } });
    const nextSale = await prisma.saleDay.findFirst({
      where: { sale: { not: '' }, date: { gte: isoDate(now) } },
      orderBy: { date: 'asc' },
    });

    const quotas = [];
    for (const day of openDays) {
      const catKey = (day.blocked ? day.exceptCat : day.sale) as DayCatKey;
      const cat = CATS[catKey];
      if (!cat) continue;
      const orders = await prisma.order.findMany({
        where: { saleDate: day.date, category: catKey, status: { not: CANCELLED } },
      });
      const sold = soldByDish(orders, catKey, day.date);
      const q = readJson<Record<string, number>>(day.quotasJson, {});
      const soldN = cat.dishes.reduce((s, d) => s + (sold[d.id] ?? 0), 0);
      const quotaN = cat.dishes.reduce((s, d) => s + (q[d.id] ?? d.q), 0);
      quotas.push({
        key: catKey,
        date: day.date,
        name: cat.short,
        hue: cat.hue,
        rgb: cat.rgb,
        sold: soldN,
        quota: quotaN,
        open: true,
      });
    }

    /**
     * יום המכירה הקרוב · שקד ביקשה (15 בספטמבר 2026) שדף הניהול
     * יצביע תמיד על יום המכירה של החלון הנוכחי: משישי ב-18:00 ועד
     * שלישי ב-18:00 הקוסקוס, ומשלישי ב-18:00 ועד שישי ב-18:00
     * השניצל. אם היום הזה כבר נפתח — מוצג הרשומה שלו; ואם לא —
     * מוצגות המנות עם המכסות שלהן מהתפריט, והמתג עדיין סגור.
     */
    const up = upcomingSale(now);
    const upCat = CATS[up.cat];
    const upDay = await prisma.saleDay.findUnique({ where: { date: up.date } });
    const upOrders = await prisma.order.findMany({
      where: { saleDate: up.date, status: { not: CANCELLED } },
    });
    /**
     * ⚠ **רק ההזמנות של הקטגוריה** · קודם נספרו כל ההזמנות שנושאות
     * את התאריך הזה, מכל הקטגוריות, ולכן ״מחזור עבור 15.9״ הראה
     * 31,770 ₪ בעוד שנמכרו 32 מנות בלבד.
     */
    const catOrders = upOrders.filter((o) => o.category === up.cat);
    /* ⚠ התיקון הידני של שקד גובר על הספירה מההזמנות */
    const upSold = {
      ...soldByDish(catOrders, up.cat, up.date),
      ...readJson<Record<string, number>>(upDay?.soldJson ?? '', {}),
    };
    const upQuota = readJson<Record<string, number>>(upDay?.quotasJson ?? '', {});

    /**
     * המחזור נגזר מהמנות שנמכרו · שקד ביקשה (15 בספטמבר 2026)
     * שהסכום יחושב לפי כמות המנות שנמכרו באותה מכירה, ולא מתוך
     * `total` של ההזמנה — שכולל גם דמי משלוח ופריטים אחרים.
     */
    const price = dishPrices(up.cat as AdminCatKey);
    const saleDishes = upCat.dishes.map((d) => ({
      id: d.id,
      name: d.n,
      sold: upSold[d.id] ?? 0,
      quota: upQuota[d.id] ?? d.q,
    }));
    const saleMeals = saleDishes.reduce((s2, d) => s2 + d.sold, 0);
    const saleRevenue = saleDishes.reduce((s2, d) => s2 + d.sold * (price[d.id] ?? 0), 0);

    const sale = {
      date: up.date,
      label: hebrewDayLabel(up.date),
      cat: up.cat,
      name: upCat.short,
      hue: upCat.hue,
      rgb: upCat.rgb,
      open: upDay?.open ?? false,
      dishes: saleDishes,
      /** מספר ההזמנות שהתקבלו ליום המכירה הזה */
      orders: catOrders.length,
      /** כמה מנות נמכרו בהן · שקד מבקשת לראות את שני המספרים יחד */
      meals: saleMeals,
      revenue: saleRevenue,
    };

    const newOrders = await prisma.order.count({ where: { status: 'חדשה' } });
    const revenue = monthOrders.reduce((s, o) => s + o.total, 0);
    const expenses = monthExp._sum.amount ?? 0;

    /**
     * ⚠ **פירות אינם הכנסה של שקד** · מגשי הפירות נעשים אצל מיכל
     * גורן, והכסף אינו עובר דרכה. שקד ביקשה (15 בספטמבר 2026)
     * להוציא אותם מהלפי-קטגוריה ומההכנסות. הם עדיין נשמרים
     * כהזמנות — רק לא נספרים בכסף.
     */
    const byCat: Record<string, number> = { cous: 0, schn: 0, box: 0, chef: 0 };
    const allMonth = await prisma.order.findMany({
      where: { createdAt: { gte: monthFrom, lt: end }, status: { not: CANCELLED }, category: { not: 'fruit' } },
    });
    for (const o of allMonth) {
      if (o.category in byCat) byCat[o.category] += o.total;
    }
    const donutTotal = Object.values(byCat).reduce((s, n) => s + n, 0);

    res.json({
      subtitle: hebrewDayLabel(isoDate(now)),
      isOpen: openDays.some((d) => d.open),
      openDate: openDays[0]?.date ?? '',
      quotas,
      sale,
      today: {
        orders: todayOrders.length,
        revenue: todayOrders.reduce((s, o) => s + o.total, 0),
      },
      month: { revenue, expenses, profit: revenue - expenses },
      /* ⚠ קוסקוס ושניצל בלבד · ראו ההערה למעלה */
      saleMonth: {
        revenue: Math.round(saleRevenueMonth),
        cost: Math.round(saleCostMonth),
      },
      /* ⚠ מגמת הרווח · ששת החודשים האחרונים · ראו ההערה למעלה */
      profitTrend,
      /* ⚠ פילוח החודש לפי מנה · קוסקוס ושניצל · ראו `saleSplit` */
      saleSplit,
      badges: {
        orders: newOrders,
        days: nextSale
          ? `${nextSale.date.slice(8).replace(/^0/, '')}.${nextSale.date.slice(5, 7).replace(/^0/, '')}`
          : STATE.nextSale,
        stock: lowStock,
        shop: shopItems.filter((x) => !x.done).length,
        people,
        menu: menuItems || STATE.menuItems,
        costs: now.getDate() === 1,
        hist,
      },
      donut: {
        total: donutTotal,
        shares: [
          { name: 'קוסקוס', color: '#7B5CBC', v: byCat.cous },
          { name: 'שישניצל', color: '#416D9E', v: byCat.schn },
          { name: 'ספיישל', color: '#437C59', v: byCat.box },
          { name: 'שף וטאבון', color: '#A85A28', v: byCat.chef },
        ],
      },
    });
  } catch (err) {
    next(err);
  }
});

