import type { PrismaClient } from '@prisma/client';
import { CATS, impliedWeekdayRecord, type DayCatKey } from '../../../mobile/src/data/adminDays.ts';
import { addDaysIso, SALE_SWITCH_HOUR, weekdaySale } from '../../../mobile/src/data/saleWeek.ts';
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
/**
 * המנות שאזלו · **מזהים בלבד, בלי מספרים**.
 *
 * ⚠ **נוסף ב-18 בספטמבר 2026** · שקד ביקשה שכשנגמר המלאי ההזמנה
 * תיחסם בצד הלקוחה, ובאותה נשימה הדגישה: ״אין תצוגה של המלאי
 * ללקוח!!!!! זה רק עבור האחראיות על ההזמנות שלא יתקבלו יותר מדי״.
 *
 * לכן חוזרת **רשימת מזהים** ולא מכסות ולא יתרות. הלקוחה רואה
 * ״נגמר המלאי״ על מנה שאזלה, ואי אפשר להסיק מהתשובה כמה נשאר בשום
 * מנה אחרת.
 *
 * ⚠ **אותו חישוב של `evaluateCustomerSaleDay`** · פסולת נספרת יחד
 * עם מה שנמכר, בדיוק כמו בבדיקה שחוסמת בפועל בשליחת ההזמנה.
 */
export function soldOutDishes(rec: SaleDayView | null, category: string): string[] {
  if (!rec) return [];
  const dishes = CATS[category as DayCatKey]?.dishes ?? [];
  const out: string[] = [];
  for (const dish of dishes) {
    const quota = rec.quotas[dish.id] ?? dish.q;
    if (quota === undefined) continue;
    const used = (rec.sold[dish.id] ?? 0) + (rec.waste[dish.id] ?? 0);
    if (used >= quota) out.push(dish.id);
  }
  return out;
}

export function evaluateCustomerSaleDay(opts: {
  rec: SaleDayView | null;
  category: string;
  requested: QtyMap;
  today: string;
  /**
   * השעה הנוכחית · רק כשהיום הנבדק הוא **היום עצמו**.
   * ⚠ ברירת המחדל היא ״לפני הסגירה״, כדי שבדיקות קיימות שלא
   * מעבירות שעה ימשיכו לבדוק את מה שהן נכתבו לבדוק.
   */
  hour?: number;
}): SaleDayError | null {
  const { rec, category, requested, today } = opts;
  const saleCat = SALE_CATS.has(category);

  if (saleCat && rec && rec.date < today) {
    return { code: 'day_closed', message: 'היום הזה כבר עבר' };
  }

  /**
   * ⚠ **מכירה שהסתיימה · 18 בספטמבר 2026** · שקד דיווחה: ״המכירה
   * של השניצל סגורה אבל זה נותן להכניס הזמנות של שניצלים״.
   *
   * מה שקרה בפועל: יום מכירה **לא נסגר מעצמו לעולם**. יום שישי
   * 18.9 נשאר `open: true` במסד גם בשעה 21:30, שעות אחרי שהמכירה
   * נגמרה, ולכן השרת המשיך לקבל הזמנות שניצל. באפליקציה עצמה
   * החלון כבר עבר: `upcomingSale` מחליף לקוסקוס ב-18:00, ודף
   * הבית כבר הציג את המכירה הבאה. שני חלקים של אותה אפליקציה
   * אמרו שני דברים סותרים.
   *
   * ⚠ **הסגירה הידנית שלך גוברת ולא מוחלפת** · זו רק רשת ביטחון
   * ליום שנשאר פתוח בטעות.
   *
   * ⚠ **השעה היא שלך** · `SALE_SWITCH_HOUR` הוא אותו קבוע שמחליף
   * את המכירה הקרובה באפליקציה, ולכן בחרתי בו — אבל אם ההזמנות
   * צריכות להיסגר מוקדם או מאוחר יותר, זה **מספר אחד**
   * ב-`mobile/src/data/saleWeek.ts`.
   *
   * ⚠ **לקוחות בלבד** · ההזמנה הידנית של מסך הניהול אינה עוברת
   * כאן, ולכן תמיד אפשר להוסיף הזמנה טלפונית באיחור.
   */
  if (saleCat && rec && rec.date === today && (opts.hour ?? 0) >= SALE_SWITCH_HOUR) {
    return { code: 'day_closed', message: 'המכירה של היום נסגרה' };
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

/**
 * שלושת מצבי יום המכירה שהלקוחה רואה בדף הבית.
 *
 * ⚠ **נוסף ב-16 בספטמבר 2026** · שקד ביקשה שדף הבית יציג ״טרם
 * נפתחה / החלה / נסגרה״ בשלושה צבעים. עד עכשיו השרת החזיר `open`
 * בלבד, ולכן אי אפשר היה להבחין בין יום שעוד לא נפתח לבין יום
 * שנפתח ואזל.
 *
 * ⚠ **ההבחנה היא לפי המכסות** · אין בבסיס הנתונים שדה ״היה פתוח״.
 * יום שכל המנות שלו מוקצות במלואן נחשב **נסגר**; כל יתר המקרים
 * שאינם פתוחים הם ״טרם החלה״. זו הקירוב הנאמן ביותר למה שהלקוחה
 * רואה, ובלי שינוי סכימה.
 */
export type SaleState = 'open' | 'pending' | 'sold_out';

export function saleDayState(opts: {
  rec: SaleDayView | null;
  category: string;
  today: string;
  /* ⚠ חייב לעבור הלאה · אחרת המסך יאמר ״פתוח״ וההזמנה תידחה בסוף */
  hour?: number;
}): SaleState {
  const { rec, category, today, hour } = opts;
  if (evaluateCustomerSaleDay({ rec, category, requested: {}, today, hour }) === null) return 'open';
  if (!rec) return 'pending';

  const dishes = CATS[category as DayCatKey]?.dishes ?? [];
  const quoted = dishes
    .map((d) => ({ quota: rec.quotas[d.id] ?? d.q, used: (rec.sold[d.id] ?? 0) + (rec.waste[d.id] ?? 0) }))
    .filter((x) => x.quota !== undefined);

  if (quoted.length > 0 && quoted.every((x) => x.used >= (x.quota as number))) return 'sold_out';
  return 'pending';
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
  /* ⚠ יום פתוח שהחלון שלו כבר עבר אינו ״המכירה הקרובה״ · ראו
     ההערה ב-`evaluateCustomerSaleDay` */
  const past = new Date().getHours() >= SALE_SWITCH_HOUR;
  const match = open.find(
    (d) => activeCategory(d) === category && !(past && d.date === today),
  );
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
    hour: new Date().getHours(),
  });
  if (err) throwSaleDayError(err);
  return date;
}
