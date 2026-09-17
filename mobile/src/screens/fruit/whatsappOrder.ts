import type { OrderLine } from '../../order/types';
import { FRUIT_SHIPPING } from '../../data/fruit';
import { shippingFeeFor } from '../../data/shared';
import { DOWS, dowOf } from '../../data/calendar';
import type { FruitDetails } from './FruitOrderSheet';

/**
 * הזמנת מגש פירות בוואטסאפ.
 *
 * ⚠ לא דרך השרת · מגשי הפירות נעשים אצל מיכל גורן ולא עוברים
 * במערכת ההזמנות של האתר, ולכן אין כאן התחברות ואין זרימת מסירה.
 * הכפתור פותח שיחת וואטסאפ עם ההזמנה כתובה בפנים.
 *
 * ⚠ **הנוסח הוחלף כולו ב-17 בספטמבר 2026** · שקד מסרה תבנית
 * מדויקת וביקשה אותה מילה במילה. הנוסח הקודם — שאני כתבתי והיא
 * אישרה ב-11 בספטמבר — ירד לגמרי, וגם שורות השם, הסכום ודמי
 * המשלוח שהיו בו. זה המקום היחיד שבו הנוסח חי.
 */

/** מספר הוואטסאפ של מיכל · אותו מספר שמופיע במסך, בפורמט בינלאומי */
export const MICHAL_WA = '972522958511';

/**
 * ⚠ **הנוסח נכתב על ידי שקד · 17 בספטמבר 2026** · היא מסרה אותו
 * מילה במילה, כולל הפיסוק וצורות הפנייה הכפולות. כל הנוסח הקודם
 * הוחלף. **אין לשנות כאן דבר בלי בקשה מפורשת ממנה.**
 */
const OPEN = 'היי מיכל, אני מעוניינ/ת לבצע הזמנה של : ';
const WHEN = 'לתאריך ושעה : ';
const SHIP = 'אופן מסירה : ';
const SIGN = 'תודה, אני ממתינ/ה לתשובה!';

/** ⚠ הנוסח של שקד · הכתובת המלאה של נקודת האיסוף */
const PICKUP_TEXT = 'איסוף עצמי מרחוב הנופר 25 יבנה';
const DELIV_PREFIX = 'משלוח לרחוב ';

/**
 * דמי המשלוח לעיר שנבחרה.
 * ✅ **אושר על ידי שקד** ב-15 בספטמבר 2026 · 20 ש״ח בתוך יבנה,
 * 60 ש״ח מחוץ ליבנה. החישוב עבר ל-`shared.ts`, שהוא המקור היחיד
 * לכל האפליקציה ולשרת.
 */
export const shippingFee = shippingFeeFor;

/** תאריך קריא · ״17.09.2026 (יום ה׳)״ במקום מפתח ISO */
export function humanDate(key: string): string {
  const [y, m, d] = key.split('-');
  return `${d}.${m}.${y} (יום ${DOWS[dowOf(key)]}׳)`;
}

/**
 * גוף ההודעה · בדיוק בתבנית של שקד.
 *
 * ⚠ **ארבעה שדות בלבד** · סוג המגשים והכמות, התאריך, השעה ואופן
 * המסירה. הסכום, השם ודמי המשלוח **ירדו** — הם לא בתבנית שמסרה.
 */
export function whatsappMessage(
  lines: OrderLine[],
  total: number,
  details?: FruitDetails,
): string {
  /* ⚠ הסכום אינו בהודעה · נשאר בחתימה כדי לא לשבור קוראים קיימים */
  void total;
  const what = lines.map((l) => `${l.name} × ${l.qty}`).join(', ');
  if (!details) return `${OPEN}${what},\n${SIGN}`;

  const deliv = details.ship === 'deliv';
  const where = deliv
    ? `${DELIV_PREFIX}${[details.address, details.city].filter(Boolean).join(', ')}`
    : PICKUP_TEXT;

  return [
    `${OPEN}${what},`,
    `${WHEN}${humanDate(details.date)} , ${details.time},`,
    `${SHIP}${where},`,
    SIGN,
  ].join('\n');
}

/** הקישור המלא · wa.me עם ההודעה מקודדת */
export function whatsappLink(
  lines: OrderLine[],
  total: number,
  details?: FruitDetails,
): string {
  return `https://wa.me/${MICHAL_WA}?text=${encodeURIComponent(
    whatsappMessage(lines, total, details),
  )}`;
}
