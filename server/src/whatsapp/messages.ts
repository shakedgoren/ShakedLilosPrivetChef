/**
 * טקסטי ההודעות ללקוחה · **כאן, ולא אצל ספק.**
 *
 * ⚠ **למה הקובץ הזה נולד · 8 באוקטובר 2026** · מול Meta ההודעות היו
 * **תבניות מאושרות** ששמורות אצלה. הקוד שלח רק את *שם* התבנית ואת
 * הפרמטרים לפי סדר, והנוסח עצמו חי בממשק של Meta ולא במאגר הזה.
 * Green API שולח **טקסט חופשי**, ולכן הנוסח חייב לחיות כאן.
 *
 * ⚠⚠ **כל חמשת הנוסחים בקובץ הזה נכתבו על ידי Claude, לא על ידי
 * שקד.** הם שחזור של מה שהתבניות אמורות היו להגיד, לא העתק שלהן —
 * אין לי גישה לנוסח המאושר ב-Meta. **שקד צריכה לקרוא ולאשר כל אחד
 * מהם לפני שהם יוצאים ללקוחות.** אם היא מעתיקה את הנוסח המקורי
 * מ-WhatsApp Manager, מחליפים כאן מילה במילה.
 *
 * ⚠ **אין יותר מגבלת 24 שעות ואין אישור תבניות** · זה היתרון
 * המעשי של המעבר. מצד שני כל שינוי נוסח הוא מעכשיו שינוי קוד.
 */

import { deliveryAddress, type OrderTemplateSlots } from './vars.ts';

/** שם פרטי בלבד · ״דנה כהן״ → ״דנה״. ריק → פנייה בלי שם */
function firstName(raw: string): string {
  return raw.trim().split(/\s+/)[0] ?? '';
}

/** ״שלום דנה,״ · בלי שם, ״שלום,״ */
function greeting(name: string): string {
  const n = firstName(name);
  return n ? `שלום ${n},` : 'שלום,';
}

/** סכום בשקלים · מספר שלם, בלי אגורות. ⚠ עוסק פטור · אין מע״מ */
function money(total: number): string {
  return `${total} ₪`;
}

const SIGN = 'BITE & TELL · שקד לילוז';

/**
 * קוד האימות.
 * ⚠ **הקוד לבדו בשורה נפרדת** · כך וואטסאפ מציע להעתיק אותו בלחיצה.
 */
export function otpText(code: string): string {
  return [
    `קוד האימות שלך ל-BITE & TELL:`,
    ``,
    code,
    ``,
    `הקוד תקף לעשר דקות. אם לא ביקשת אותו, אפשר להתעלם מההודעה.`,
  ].join('\n');
}

/** ההזמנה התקבלה · איסוף עצמי */
export function confirmPickupText(o: OrderTemplateSlots): string {
  return [
    greeting(o.name),
    `ההזמנה שלך התקבלה 🤍`,
    ``,
    `סה״כ לתשלום: ${money(o.total)}`,
    `איסוף עצמי: ${o.time.trim() || '—'}`,
    ``,
    `נעדכן אותך כשההזמנה מוכנה.`,
    SIGN,
  ].join('\n');
}

/** ההזמנה התקבלה · משלוח */
export function confirmDeliveryText(o: OrderTemplateSlots): string {
  return [
    greeting(o.name),
    `ההזמנה שלך התקבלה 🤍`,
    ``,
    `סה״כ לתשלום: ${money(o.total)}`,
    `משלוח אל: ${deliveryAddress(o) || '—'}`,
    `מועד: ${o.time.trim() || '—'}`,
    ``,
    `נעדכן אותך כשההזמנה יוצאת.`,
    SIGN,
  ].join('\n');
}

/** ההזמנה מוכנה לאיסוף */
export function readyPickupText(o: OrderTemplateSlots): string {
  return [
    greeting(o.name),
    `ההזמנה שלך מוכנה לאיסוף 🤍`,
    ``,
    `מחכה לך. נתראה!`,
    SIGN,
  ].join('\n');
}

/** ההזמנה נמסרה */
export function deliveredText(o: OrderTemplateSlots): string {
  return [
    greeting(o.name),
    `ההזמנה שלך יצאה אליך 🤍`,
    ``,
    `כתובת: ${deliveryAddress(o) || '—'}`,
    ``,
    `בתיאבון!`,
    SIGN,
  ].join('\n');
}
