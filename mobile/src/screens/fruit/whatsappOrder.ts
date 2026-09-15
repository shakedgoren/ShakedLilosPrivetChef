import type { OrderLine } from '../../order/types';
import { FRUIT_SHIPPING } from '../../data/fruit';
import { DOWS, dowOf } from '../../data/calendar';
import type { FruitDetails } from './FruitOrderSheet';

/**
 * הזמנת מגש פירות בוואטסאפ.
 *
 * ⚠ לא דרך השרת · מגשי הפירות נעשים אצל מיכל גורן ולא עוברים
 * במערכת ההזמנות של האתר, ולכן אין כאן התחברות ואין זרימת מסירה.
 * הכפתור פותח שיחת וואטסאפ עם ההזמנה כתובה בפנים.
 *
 * נוסח ההודעה נכתב על ידי Claude · ✅ שקד אישרה אותו ב-11 בספטמבר 2026.
 * אין לשנות בלי בקשה מפורשת ממנה. זה המקום היחיד שבו הנוסח חי.
 *
 * ⚠ **הורחב ב-15 בספטמבר 2026 לבקשת שקד** · היא ביקשה שחלונית
 * תאסוף שם, תאריך, שעה ואופן מסירה, ושההודעה תצא ״עם הפרטים
 * המלאים״. הפתיח, שורות המגשים ושורת הסה״כ נשארו מילה במילה כפי
 * שאישרה; שורות הפרטים נוספו אחריהן, והניסוח שלהן הוא שלי.
 */

/** מספר הוואטסאפ של מיכל · אותו מספר שמופיע במסך, בפורמט בינלאומי */
export const MICHAL_WA = '972522958511';

const GREETING = 'היי מיכל, אשמח להזמין מגש פירות';
const TOTAL_LABEL = 'סה״כ';

/** ⚠ נוסח שכתבתי · תוויות שורות הפרטים */
const NAME_LABEL = 'שם';
const DATE_LABEL = 'תאריך';
const TIME_LABEL = 'שעה';
const SHIP_LABEL = 'מסירה';
const PICKUP_TEXT = 'איסוף עצמי';
const DELIV_TEXT = 'משלוח';
const ADDR_LABEL = 'כתובת';
const FEE_LABEL = 'דמי משלוח';

/**
 * דמי המשלוח לעיר שנבחרה.
 * ⚠ **החלוקה לשתי המדרגות היא שלי** · הקנבס כותב ״משלוחים בתוך
 * יבנה״ מול ״משלוחים באזור השפלה״, ולכן יבנה מקבלת את המדרגה
 * הקרובה וכל שאר הערים את הרחוקה. הסכומים עצמם מהקנבס.
 */
const NEAR_CITY = 'יבנה';
export const shippingFee = (city: string): number =>
  city === NEAR_CITY ? FRUIT_SHIPPING.near.fee : FRUIT_SHIPPING.far.fee;

/** תאריך קריא · ״17.09.2026 (יום ה׳)״ במקום מפתח ISO */
export function humanDate(key: string): string {
  const [y, m, d] = key.split('-');
  return `${d}.${m}.${y} (יום ${DOWS[dowOf(key)]}׳)`;
}

/** גוף ההודעה · שורה לכל מגש, הסכום, ואז פרטי ההזמנה */
export function whatsappMessage(
  lines: OrderLine[],
  total: number,
  details?: FruitDetails,
): string {
  const items = lines.map((l) => `· ${l.name} × ${l.qty} — ${l.sum} ₪`);
  const out = [GREETING + ':', ...items, '', `${TOTAL_LABEL}: ${total} ₪`];
  if (!details) return out.join('\n');

  const deliv = details.ship === 'deliv';
  out.push(
    '',
    `${NAME_LABEL}: ${details.name}`,
    `${DATE_LABEL}: ${humanDate(details.date)}`,
    `${TIME_LABEL}: ${details.time}`,
    `${SHIP_LABEL}: ${deliv ? DELIV_TEXT : PICKUP_TEXT}`,
  );
  if (deliv && details.city) {
    out.push(
      `${ADDR_LABEL}: ${details.address}, ${details.city}`,
      `${FEE_LABEL}: ${shippingFee(details.city)} ₪`,
    );
  }
  return out.join('\n');
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
