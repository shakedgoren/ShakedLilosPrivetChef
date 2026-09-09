import type { PrismaClient } from '@prisma/client';
import { CATS, impliedWeekdayRecord, type DayCatKey } from '../../../mobile/src/data/adminDays.ts';
import { addDaysIso, weekdaySale } from '../../../mobile/src/data/saleWeek.ts';
import type { CustomerDetails } from '../catalog/quote.ts';
import { CANCELLED } from '../catalog/status.ts';
import { badRequest, conflict } from '../errors.ts';
import { readJson } from '../json.ts';
import { isoDate, qtyOfCustomerDetails, qtyOfOrder, type QtyMap } from '../admin/sold.ts';

export type SaleDayView = {
  date: string;
  blocked: boolean;
  sale: string;
  exceptCat: string;
  open: boolean;
  quotas: Record<string, number>;
  waste: Record<string, number>;
  sold: QtyMap;
};

export const isIsoDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

export function activeCategory(rec: { blocked: boolean; sale: string; exceptCat: string }): string {
  return rec.blocked ? rec.exceptCat : rec.sale;
}

const SALE_CATS = new Set(['cous', 'schn']);

export type SaleDayError = { code: string; message: string; dishId?: string };

/** חוקי יום מכירה ללקוחה · בלי גישה למסד, לבדיקות */
export function evaluateCustomerSaleDay(opts: {
  rec: SaleDayView | null;
  category: string;
  requested: QtyMap;
  today: string;
}): SaleDayError | null {
  const { rec, category, requested, today } = opts;
  const saleCat = SALE_CATS.has(category);

  if (saleCat && rec && rec.date < today) {
    return { code: 'day_closed', message: 'היום הזה כבר עבר' };
  }

  if (!rec) {
    if (saleCat) return { code: 'day_closed', message: 'אין יום מכירה בתאריך הזה' };
    return null;
  }

  const active = activeCategory(rec);

  if (rec.blocked) {
    if (active !== category) {
      return { code: 'day_blocked', message: 'היום חסום להזמנות' };
    }
    if (!rec.open) {
      return { code: 'day_closed', message: 'היום סגור להזמנות' };
    }
  } else if (saleCat) {
    if (!active) {
      return { code: 'day_closed', message: 'אין יום מכירה בתאריך הזה' };
    }
    if (active !== category) {
      return { code: 'category_closed', message: 'הקטגוריה לא פתוחה ביום הזה' };
    }
    if (!rec.open) {
      return { code: 'day_closed', message: 'היום סגור להזמנות' };
    }
  }

  const dishes = CATS[category as DayCatKey]?.dishes ?? [];
  for (const [id, n] of Object.entries(requested)) {
    if (n <= 0) continue;
    const dish = dishes.find((d) => d.id === id);
    const quota = rec.quotas[id] ?? dish?.q;
    if (quota === undefined) continue;
    const used = (rec.sold[id] ?? 0) + (rec.waste[id] ?? 0);
    if (used + n > quota) {
      return {
        code: 'quota_exceeded',
        message: `המכסה של ${dish?.n ?? id} מלאה`,
        dishId: id,
      };
    }
  }
  return null;
}

export function throwSaleDayError(err: SaleDayError): never {
  if (err.code === 'quota_exceeded') throw conflict(err.code, err.message);
  throw badRequest(err.code, err.message);
}

type Db = Pick<PrismaClient, 'saleDay' | 'order'>;

export async function resolveCustomerSaleDate(
  db: Db,
  requested: string | undefined,
  category: string,
): Promise<string> {
  const raw = (requested ?? '').trim();
  if (isIsoDate(raw)) return raw;

  const today = isoDate(new Date());
  const open = await db.saleDay.findMany({
    where: { open: true, date: { gte: today } },
    orderBy: { date: 'asc' },
  });
  const match = open.find((d) => activeCategory(d) === category);
  if (match) return match.date;

  if (category === 'cous' || category === 'schn') {
    for (let i = 0; i < 21; i++) {
      const d = addDaysIso(today, i);
      if (weekdaySale(d) === category) return d;
    }
  }
  return today;
}

export async function loadSaleDayView(db: Db, date: string, category: string): Promise<SaleDayView | null> {
  const row = await db.saleDay.findUnique({ where: { date } });
  const implied = impliedWeekdayRecord(date);
  if (!row && !implied) return null;

  const view: SaleDayView = {
    date,
    blocked: row ? row.blocked : !!implied?.blocked,
    sale: row ? row.sale : (implied?.sale ?? ''),
    exceptCat: row ? row.exceptCat : (implied?.except ?? ''),
    open: row ? row.open : !!implied?.open,
    quotas: row ? readJson<Record<string, number>>(row.quotasJson, {}) : { ...(implied?.q ?? {}) },
    waste: row ? readJson<Record<string, number>>(row.wasteJson, {}) : {},
    sold: {},
  };

  const orders = await db.order.findMany({
    where: { saleDate: date, category, status: { not: CANCELLED } },
  });
  view.sold = {};
  for (const o of orders) {
    const q = qtyOfOrder(o);
    for (const [id, n] of Object.entries(q)) view.sold[id] = (view.sold[id] ?? 0) + n;
  }
  return view;
}

export async function assertCustomerOrderDay(
  db: Db,
  opts: { requested?: string; category: string; details: CustomerDetails },
): Promise<string> {
  const date = await resolveCustomerSaleDate(db, opts.requested, opts.category);
  const rec = await loadSaleDayView(db, date, opts.category);
  const err = evaluateCustomerSaleDay({
    rec,
    category: opts.category,
    requested: qtyOfCustomerDetails(opts.details),
    today: isoDate(new Date()),
  });
  if (err) throwSaleDayError(err);
  return date;
}
