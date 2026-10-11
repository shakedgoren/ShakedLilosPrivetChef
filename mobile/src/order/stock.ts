import { useCallback, useSyncExternalStore } from 'react';
import { apiEnabled } from '../api/config';
import { saleDayStatus } from '../api/orders';
import { SALE_DAY_CATEGORIES } from '../data/shared';
import { MENU } from '../data/adminOrders';

/**
 * המנות שאזלו · מקור אמת אחד לכל האפליקציה.
 *
 * ⚠ **נבנה ב-18 בספטמבר 2026** · בקשה של שקד: כשנגמר המלאי, ההזמנה
 * של אותה מנה תיחסם בצד הלקוחה — ״מסמן באפור וכותב ׳נגמר המלאי׳״.
 *
 * ⚠ **בלי מספרים · הדגשה שלה** · ״אין תצוגה של המלאי ללקוח!!!!!
 * זה רק עבור האחראיות על ההזמנות שלא יתקבלו יותר מדי״. לכן השרת
 * מחזיר **רשימת מזהים** ולא יתרות, ואי אפשר להסיק מהתשובה כמה נשאר
 * באף מנה.
 *
 * ⚠ **החסימה כאן אינה ההגנה** · השרת כבר דוחה הזמנה שחורגת מהמכסה
 * (`quota_exceeded`), וזה מה ששומר שלא יתקבלו יותר מדי. מה שכאן הוא
 * שההודעה תגיע **לפני** שממלאים הזמנה שלמה ולא אחריה.
 *
 * ⚠ **מפה ברמת המודול** · בדיוק מאותה סיבה כמו ב-`reminders.ts`:
 * המסכים שצריכים את המידע אינם חולקים הורה משותף.
 */

/**
 * מזהי מנות הקוסקוס **לפי סדר התפריט**.
 * ⚠ זו בדיוק ההתאמה שהשרת עושה (`qtyOfCustomerDetails`): מערך
 * הכמויות של הלקוחה נקרא לפי מיקום מול `MENU.cous`. נגזר ולא
 * מוקלד, כדי שלא יוכל להיפרד ממנו.
 */
export const COUS_IDS: readonly string[] = (MENU.cous ?? []).map((it) => it.id);
/** חלות בודדות · לפי סדר `SCHNITZEL_TYPES` */
export const SCHN_UNIT_IDS = ['thin', 'temp'] as const;
/** מארזים · אותו סדר */
export const SCHN_BOX_IDS = ['boxThin', 'boxTemp'] as const;

/**
 * הכיתוב על מנה שאזלה.
 * ⚠ **הנוסח של שקד, מילה במילה** · ״מסמן באפור וכותב ׳נגמר המלאי׳״
 * (18 בספטמבר 2026).
 */
export const SOLD_OUT = 'נגמר המלאי';

/**
 * מה שמוצג כשמנסים להוסיף מעבר למכסה.
 *
 * ⚠ **הנוסח נכתב על ידי Claude · 11 באוקטובר 2026** · שקד ביקשה
 * הודעה ולא כתבה אותה. בניגוד ל-`SOLD_OUT`, שהוא הנוסח שלה מילה
 * במילה.
 *
 * ⚠⚠ **בלי מספרים** · ההודעה אומרת שנגמרה הכמות, לא כמה נשאר.
 * זה הגבול שבין ״לעצור בפלוס״ (שאושר) לבין ״תצוגת מלאי ללקוח״
 * (שנפסל ב-18 בספטמבר).
 */
export const AT_CAP = 'זו הכמות המקסימלית שאפשר להזמין כרגע';

type Listener = () => void;

const EMPTY: ReadonlySet<string> = new Set();
const state = new Map<string, ReadonlySet<string>>();
const listeners = new Set<Listener>();

const same = (a: ReadonlySet<string>, b: readonly string[]) =>
  a.size === b.length && b.every((id) => a.has(id));

/** עדכון רשימת האזילות של קטגוריה */
export function setSoldOut(category: string, ids: readonly string[]): void {
  const now = state.get(category);
  if (now && same(now, ids)) return;
  state.set(category, new Set(ids));
  listeners.forEach((fn) => fn());
}

/** קריאה בלי מנוי · לשימוש בתוך מטפלי אירועים */
export const soldOutOf = (category: string): ReadonlySet<string> =>
  state.get(category) ?? EMPTY;

/** המנות שאזלו בקטגוריה · קבוצה ריקה כל עוד השרת לא נשאל */
export function useSoldOut(category: string): ReadonlySet<string> {
  const subscribe = useCallback((fn: Listener) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => state.get(category) ?? EMPTY,
    () => state.get(category) ?? EMPTY,
  );
}

/**
 * כמה נשאר מכל מנה · מזהה → מספר.
 *
 * ⚠ **בקשת שקד · 11 באוקטובר 2026** · ״אם אין כמות מספיקה ברגע
 * ההוספה בלחיצה על הפלוס זה צריך לעצור את הלקוח מלהמשיך להוסיף
 * מנות״. עד עכשיו החריגה נתפסה רק בשליחה, אחרי שהלקוחה כבר מילאה
 * הזמנה שלמה.
 *
 * ⚠⚠ **לא להציג את המספר במסך · לעולם** · זה מרכך בכוונה את ״אין
 * תצוגה של המלאי ללקוח!!!!!״ מ-18 בספטמבר, והוצג לשקד ואושר. הוא
 * משמש **אך ורק** כתקרה לכפתור. `soldOut` נשאר הדרך היחידה לסמן
 * מנה כאזלה על המסך.
 *
 * ⚠ **ברירת מחדל `Infinity`** · שרת ישן, או קטגוריה בלי מכסות,
 * אינם אמורים לנעול את הכפתור.
 */
const remaining = new Map<string, Readonly<Record<string, number>>>();
const EMPTY_LEFT: Readonly<Record<string, number>> = {};

export function setRemaining(category: string, left: Record<string, number>): void {
  remaining.set(category, { ...left });
  listeners.forEach((fn) => fn());
}

/** כמה נשאר ממנה · `Infinity` כשאין נתון */
export function remainingOf(category: string, id: string): number {
  const v = (remaining.get(category) ?? EMPTY_LEFT)[id];
  return v === undefined ? Infinity : v;
}

export function useRemaining(category: string): Readonly<Record<string, number>> {
  const subscribe = useCallback((fn: Listener) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => remaining.get(category) ?? EMPTY_LEFT,
    () => remaining.get(category) ?? EMPTY_LEFT,
  );
}

/**
 * תאריך יום המכירה של הקטגוריה · כפי שהשרת רואה אותו.
 *
 * ⚠ **בקשת שקד · 11 באוקטובר 2026** · במסכי הקוסקוס והשניצל ישבו
 * `COUSCOUS_DATE` ו-`SCHNITZEL_DATE` — מחרוזות קבועות מהקנבס
 * (״שלישי · 25 באוגוסט״, ״שישי · 28 באוגוסט״). לקוחה שנכנסה
 * באוקטובר ראתה תאריך מלפני חודשיים מעל התפריט.
 *
 * ⚠ **מהשרת ולא מחישוב מקומי** · `nextSaleDate` יודע את הכלל
 * הקבוע (שלישי, שישי), אבל השרת יודע גם מה שקד עשתה בלוח —
 * יום שנחסם, או חריגה ביום אחר. הוא התשובה הנכונה כשהיא קיימת,
 * והחישוב המקומי הוא מה שמוצג עד שהיא מגיעה.
 */
const saleDate = new Map<string, string>();

export function setSaleDate(category: string, date: string): void {
  if (!date || saleDate.get(category) === date) return;
  saleDate.set(category, date);
  listeners.forEach((fn) => fn());
}

/** ריק = השרת עוד לא נשאל · הקורא נופל לחישוב המקומי */
export const saleDateOf = (category: string): string => saleDate.get(category) ?? '';

export function useSaleDate(category: string): string {
  const subscribe = useCallback((fn: Listener) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => saleDate.get(category) ?? '',
    () => saleDate.get(category) ?? '',
  );
}

/**
 * שעות משלוח חסומות בתאריך של אותה קטגוריה.
 *
 * ⚠ **בקשת שקד · 11 באוקטובר 2026** · ״שעות איסוף חורגות
 * מהמותר״, ו״אם היום סגור למשלוחים האופציה למשלוח צריכה להיות
 * מסומנת באפור״. הכלל נאכף בשרת מאז 27 בספטמבר, אבל בוחר השעות
 * אצל הלקוחה לא ידע עליו דבר.
 *
 * ⚠ **משלוחים בלבד** · איסוף עצמי אינו נחסם — שם שקד ממילא
 * קובעת מתי היא בבית. ראו `server/src/orders/deliveryHours.ts`.
 */
export type BlockedRange = { from: string; to: string };
const blocked = new Map<string, readonly BlockedRange[]>();
const NO_RANGES: readonly BlockedRange[] = [];

export function setBlockedHours(category: string, ranges: readonly BlockedRange[]): void {
  blocked.set(category, ranges.slice());
  listeners.forEach((fn) => fn());
}

export const blockedHoursOf = (category: string): readonly BlockedRange[] =>
  blocked.get(category) ?? NO_RANGES;

export function useBlockedHours(category: string): readonly BlockedRange[] {
  const subscribe = useCallback((fn: Listener) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => blocked.get(category) ?? NO_RANGES,
    () => blocked.get(category) ?? NO_RANGES,
  );
}

/**
 * טעינה מהשרת · לכל קטגוריות יום המכירה יחד.
 * ⚠ **כישלון אינו חוסם כלום** · רשת שנפלה לא תסמן מנה כאזלה;
 * במקרה הגרוע ההודעה תגיע מהשרת בשליחת ההזמנה, כמו קודם.
 */
export async function syncStock(): Promise<void> {
  if (!apiEnabled) return;
  await Promise.all(
    SALE_DAY_CATEGORIES.map(async (category) => {
      try {
        const day = await saleDayStatus(category);
        setSoldOut(category, day.soldOut ?? []);
        /* ⚠ התאריך שמוצג מעל התפריט · ראו `setSaleDate` */
        setSaleDate(category, day.date ?? '');
        /* ⚠ שרת ישן אינו מחזיר את השדות · ברירת המחדל לא נועלת כלום */
        setRemaining(category, day.remaining ?? {});
        setBlockedHours(category, day.blockedHours ?? []);
      } catch {
        /* ראו ההערה למעלה */
      }
    }),
  );
}
