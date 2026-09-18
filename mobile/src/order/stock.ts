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
      } catch {
        /* ראו ההערה למעלה */
      }
    }),
  );
}
