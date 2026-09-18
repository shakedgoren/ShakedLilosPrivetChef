import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { requireAdmin, requireAuth } from '../auth/middleware.ts';
import {
  CATS,
  impliedWeekdayRecord,
  mergeWeekdayDays,
  type DayCatKey,
  type DayRecord,
} from '../../../mobile/src/data/adminDays.ts';
import { notifySaleOpen } from '../push/saleOpen.ts';
import { hebrewDayLabel, soldByDish } from '../admin/sold.ts';
import { readJson } from '../json.ts';
import { CANCELLED } from '../catalog/status.ts';
import { notFound } from '../errors.ts';

export const adminDaysRouter = Router();
adminDaysRouter.use(requireAuth, requireAdmin);

function serialize(row: {
  date: string;
  blocked: boolean;
  sale: string;
  exceptCat: string;
  open: boolean;
  quotasJson: string;
  wasteJson: string;
  soldJson?: string;
}, sold: Record<string, number>): DayRecord & { date: string } {
  const q = readJson<Record<string, number>>(row.quotasJson, {});
  /**
   * ⚠ **התיקון הידני גובר** · שקד יכולה להקליד כמה נמכר בפועל,
   * למשל כשהיא מכרה משהו בטלפון בלי להזין הזמנה. הספירה
   * מההזמנות נשארת מתחת, ומחיקת התיקון מחזירה אותה.
   */
  const fix = readJson<Record<string, number>>(row.soldJson ?? '', {});
  sold = { ...sold, ...fix };
  return {
    date: row.date,
    blocked: row.blocked || undefined,
    sale: (row.sale || null) as DayCatKey | null,
    except: (row.exceptCat || null) as DayCatKey | null,
    open: row.open || undefined,
    q: Object.keys(q).length ? q : undefined,
    sold: Object.keys(sold).length ? sold : undefined,
  };
}

async function soldForDate(date: string, category: string) {
  if (!category) return {};
  const orders = await prisma.order.findMany({
    where: { saleDate: date, category, status: { not: CANCELLED } },
  });
  return soldByDish(orders, category, date);
}

adminDaysRouter.get('/', async (req, res, next) => {
  try {
    const from = typeof req.query.from === 'string' ? req.query.from : '';
    const to = typeof req.query.to === 'string' ? req.query.to : '';
    const rows = await prisma.saleDay.findMany({
      where: {
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: { date: 'asc' },
    });
    const days: Record<string, DayRecord> = {};
    for (const row of rows) {
      const cat = row.blocked ? row.exceptCat : row.sale;
      const sold = await soldForDate(row.date, cat);
      const rec = serialize(row, sold);
      const { date: _d, ...rest } = rec;
      days[row.date] = rest;
    }
    const merged = from && to ? mergeWeekdayDays(days, from, to) : days;
    const open = rows.filter((r) => r.open);
    res.json({
      days: merged,
      open: open.map((r) => ({ date: r.date, sale: r.sale, label: hebrewDayLabel(r.date) })),
    });
  } catch (err) {
    next(err);
  }
});

adminDaysRouter.get('/:date', async (req, res, next) => {
  try {
    const date = String(req.params.date ?? '');
    const row = await prisma.saleDay.findUnique({ where: { date } });
    if (!row) {
      res.json({ date, rec: impliedWeekdayRecord(date) ?? {} });
      return;
    }
    const cat = row.blocked ? row.exceptCat : row.sale;
    const sold = await soldForDate(date, cat);
    res.json({ date, rec: serialize(row, sold) });
  } catch (err) {
    next(err);
  }
});

const patchBody = z.object({
  blocked: z.boolean().optional(),
  sale: z.string().nullable().optional(),
  except: z.string().nullable().optional(),
  open: z.boolean().optional(),
  q: z.record(z.number()).optional(),
  waste: z.record(z.number()).optional(),
});

/**
 * תיקון ידני של מספר המנות שנמכרו.
 *
 * ⚠ **גובר על הספירה מההזמנות** · שקד ביקשה (15 בספטמבר 2026)
 * ללחוץ על המספר ולהקליד. הספירה האמיתית נשארת במקומה — התיקון
 * נשמר בנפרד, וכשהוא קיים הוא מה שמוצג. מחיקת הערך (או אפס
 * שווה לספירה) מחזירה את הספירה האוטומטית.
 */
adminDaysRouter.patch('/:date/sold', async (req, res, next) => {
  try {
    const date = String(req.params.date ?? '');
    const body = z
      .object({ dishId: z.string().min(1), sold: z.number().int().nonnegative().nullable() })
      .parse(req.body);
    const row = await prisma.saleDay.findUnique({ where: { date } });
    if (!row) throw notFound();
    const map = readJson<Record<string, number>>(row.soldJson, {});
    if (body.sold === null) delete map[body.dishId];
    else map[body.dishId] = body.sold;
    const next2 = await prisma.saleDay.update({
      where: { date },
      data: { soldJson: JSON.stringify(map) },
    });
    const cat = next2.blocked ? next2.exceptCat : next2.sale;
    const sold = await soldForDate(date, cat);
    res.json({ date, rec: serialize(next2, sold) });
  } catch (err) {
    next(err);
  }
});

adminDaysRouter.put('/:date', async (req, res, next) => {
  try {
    const date = String(req.params.date ?? '');
    const body = patchBody.parse(req.body);
    const existing = await prisma.saleDay.findUnique({ where: { date } });
    const sale = body.sale === undefined ? (existing?.sale ?? '') : body.sale ?? '';
    const exceptCat = body.except === undefined ? (existing?.exceptCat ?? '') : body.except ?? '';
    const blocked = body.blocked ?? existing?.blocked ?? false;
    const open = body.open ?? existing?.open ?? false;
    const quotasJson =
      body.q !== undefined ? JSON.stringify(body.q) : (existing?.quotasJson ?? '{}');
    const wasteJson =
      body.waste !== undefined ? JSON.stringify(body.waste) : (existing?.wasteJson ?? '{}');

    const wasOpen = existing?.open ?? false;
    /**
     * ⚠ **חותמת הפתיחה · 18 בספטמבר 2026** · בלעדיה `open: false`
     * אינו מבדיל בין ״המכירה טרם נפתחה״ ל״המכירה נסגרה״, ושקד
     * ביקשה את שני הכיתובים · ראו `SaleState`.
     *
     * ⚠ **נכתבת פעם אחת ולא נמחקת** · סגירה ופתיחה מחדש של אותו
     * יום לא מאפסות אותה, כי המכירה אכן כבר נפתחה.
     */
    const openedAt = existing?.openedAt ?? (open ? new Date() : null);
    const row = await prisma.saleDay.upsert({
      where: { date },
      create: { date, blocked, sale, exceptCat, open, quotasJson, wasteJson, openedAt },
      update: { blocked, sale, exceptCat, open, quotasJson, wasteJson, openedAt },
    });
    const cat = row.blocked ? row.exceptCat : row.sale;

    /**
     * ⚠ **ההתראה יוצאת כאן · 18 בספטמבר 2026** · ברגע שהיום עובר
     * מסגור לפתוח, ולא לפני. ראו `notifySaleOpen`.
     *
     * ⚠ **רק במעבר, לא בכל שמירה** · בלי `wasOpen` כל עדכון מכסה
     * ביום פתוח היה שולח התראה נוספת לכל מי שביקשה תזכורת.
     *
     * ⚠ **בלי `await`** · פתיחת היום לא תמתין לשירות דחיפה חיצוני,
     * ולא תיכשל בגללו.
     */
    if (!wasOpen && row.open && cat) {
      void notifySaleOpen(prisma, cat, date).catch(() => undefined);
    }
    const sold = await soldForDate(date, cat);
    res.json({ date, rec: serialize(row, sold) });
  } catch (err) {
    next(err);
  }
});

export { CATS };
