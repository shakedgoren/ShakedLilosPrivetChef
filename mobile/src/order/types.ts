/** שורה בסיכום ההזמנה · משותפת לכל הקטגוריות */
export type OrderLine = { name: string; qty: number; sum: number };

/** גוון הקטגוריה · נגזר מ-hues שב-tokens */
export type Accent = { hue: string; deep: string; rgb: string };

/** חלונות הזמן והמגבלות של קטגוריה · כל קטגוריה מגדירה את שלה */
export type FulfillmentConfig = {
  /** טווח האיסוף העצמי, בדקות מתחילת היום */
  pickupFrom: number;
  pickupTo: number;
  /** חלונות המשלוח המוכנים מראש */
  deliverySlots: string[];
  /** מינימום מנות למשלוח · undefined = אין מינימום */
  minMealsForDelivery?: number;
  /**
   * שעות משלוח שנחסמו בניהול לתאריך הזה.
   *
   * ⚠ **בקשת שקד · 11 באוקטובר 2026** · ״אם היום סגור למשלוחים
   * האופציה למשלוח צריכה להיות מסומנת באפור ושלא יתן בכלל לבחור
   * את האופציה של המשלוח״. הכלל נאכף בשרת מאז 27 בספטמבר, אבל
   * מסך הלקוחה לא ידע עליו דבר.
   *
   * ⚠ **משלוחים בלבד** · איסוף עצמי אינו נחסם — החלטה מפורשת של
   * שקד מ-27 בספטמבר. ראו `server/src/orders/deliveryHours.ts`.
   *
   * ⚠ **אין מתג ״יום סגור למשלוחים״** · חסימת כל החלונות **היא**
   * הסגירה, ומכאן נגזר `deliveryOpen`.
   */
  blockedHours?: readonly { from: string; to: string }[];
  /** כמה מנות יש כרגע בהזמנה · נדרש רק כשיש מינימום */
  meals?: number;
  clockFallback?: string;
  /**
   * לוח תאריכים לצד שעת האיסוף.
   * ⚠ **בקשה של שקד (16 בספטמבר 2026)** · ״בכל הספיישלים אין בחירה
   * של תאריך ביחד עם שעת האיסוף — צריך להוסיף שם גם תאריך״.
   * לקוסקוס ולשניצל יש יום מכירה קבוע ולכן אין להם תאריך לבחור.
   */
  pickDate?: boolean;
  /**
   * אילו תאריכים פתוחים בלוח · ברירת המחדל היא כלל פינת השף.
   * ⚠ **בקשה של שקד (17 בספטמבר 2026)** · חלק מהמארזים נמסרים
   * בימי שישי בלבד · ראו `FRIDAY_ONLY_BOXES`.
   */
  dateOpen?: (key: string) => boolean;
  /** ההסבר מתחת ללוח · הולך יד ביד עם `dateOpen` */
  dateHint?: string;
};

export const hhmm = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export const toMinutes = (t: string): number | null => {
  const [h, m] = String(t || '').split(':');
  const hh = parseInt(h, 10);
  const mm = parseInt(m, 10);
  return isNaN(hh) || isNaN(mm) ? null : hh * 60 + mm;
};

/** בונה חלונות משלוח בקפיצות קבועות */
export const buildSlots = (from: number, to: number, step: number): string[] => {
  const out: string[] = [];
  for (let m = from; m <= to; m += step) out.push(hhmm(m));
  return out;
};

/** ״כתובת מלאה״ = רחוב ומספר בית, ולכן נדרשת גם ספרה */
export const isAddressValid = (a: string) => {
  const t = String(a || '').trim();
  return t.length >= 4 && /\d/.test(t);
};

/**
 * האם השעה נופלת באחד הטווחים · **הקצוות כלולים.**
 *
 * ⚠ **זהה ל-`isHourBlocked` בשרת** · שתי הצורות חייבות להסכים,
 * אחרת המסך יציע חלון שהשרת ידחה. ראו
 * `server/src/orders/deliveryHours.ts` — שם ההערה המלאה על למה
 * ״לחסום 18:00 עד 21:00״ כולל את שני הקצוות.
 */
export function inAnyRange(
  time: string,
  ranges: readonly { from: string; to: string }[],
): boolean {
  const t = toMinutes(time);
  if (t === null) return false;
  return ranges.some((r) => {
    const a = toMinutes(r.from);
    const b = toMinutes(r.to);
    return a !== null && b !== null && t >= a && t <= b;
  });
}
