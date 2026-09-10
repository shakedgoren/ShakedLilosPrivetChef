import type { OrderLine } from '../../order/types';

/**
 * הזמנת מגש פירות בוואטסאפ.
 *
 * ⚠ לא דרך השרת · מגשי הפירות נעשים אצל מיכל גורן ולא עוברים
 * במערכת ההזמנות של האתר, ולכן אין כאן התחברות ואין זרימת מסירה.
 * הכפתור פותח שיחת וואטסאפ עם ההזמנה כתובה בפנים.
 *
 * נוסח ההודעה נכתב על ידי Claude · ✅ שקד אישרה אותו ב-11 בספטמבר 2026.
 * אין לשנות בלי בקשה מפורשת ממנה. זה המקום היחיד שבו הנוסח חי.
 */

/** מספר הוואטסאפ של מיכל · אותו מספר שמופיע במסך, בפורמט בינלאומי */
export const MICHAL_WA = '972522958511';

const GREETING = 'היי מיכל, אשמח להזמין מגש פירות';
const TOTAL_LABEL = 'סה״כ';

/** גוף ההודעה · שורה לכל מגש ואז הסכום */
export function whatsappMessage(lines: OrderLine[], total: number): string {
  const items = lines.map((l) => `· ${l.name} × ${l.qty} — ${l.sum} ₪`);
  return [GREETING + ':', ...items, '', `${TOTAL_LABEL}: ${total} ₪`].join('\n');
}

/** הקישור המלא · wa.me עם ההודעה מקודדת */
export function whatsappLink(lines: OrderLine[], total: number): string {
  return `https://wa.me/${MICHAL_WA}?text=${encodeURIComponent(whatsappMessage(lines, total))}`;
}
