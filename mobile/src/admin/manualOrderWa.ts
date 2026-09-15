import { MENU, ROLL } from '../data/adminOrders';
import { itemsSum, shipFee, total, trim, type NewOrderDraft } from './orderMath';

/**
 * אישור הזמנה ידנית בוואטסאפ.
 *
 * ⚠ **נוסח שכתבתי, לא מהקנבס** · שקד ביקשה (15 בספטמבר 2026)
 * שלחיצה על ״שמירת ההזמנה״ תשלח ללקוח הודעת אישור עם פרטי
 * ההזמנה המלאים. הנוסח כאן הוא שלי — תגידי מילה ואשנה אותו.
 *
 * ⚠ **וואטסאפ נפתח עם ההודעה מוכנה** · אין כאן שליחה אוטומטית.
 * לשליחה בלי מגע יד אדם צריך חשבון WhatsApp Business API, שאין
 * לנו. הקישור פותח את השיחה עם הלקוח וההודעה כבר כתובה בפנים,
 * ונשאר ללחוץ שלח.
 */

const GREETING = 'היי, תודה על ההזמנה!';
const CONFIRM = 'זה מה שרשמתי — אם משהו לא מדויק תכתבו לי ואתקן.';
const TOTAL_LABEL = 'סה״כ';
const SHIP_LABEL = 'משלוח';
const PICKUP_TEXT = 'איסוף עצמי';
const DELIV_TEXT = 'משלוח';
const TIME_LABEL = 'שעה';
const ADDR_LABEL = 'כתובת';
const HOW_LABEL = 'מסירה';

/** ‎050-1234567 → ‎972501234567 · הפורמט שוואטסאפ מצפה לו */
export function waPhone(phone: string): string {
  const digits = trim(phone).replace(/[^\d]/g, '');
  if (digits.startsWith('972')) return digits;
  return `972${digits.replace(/^0/, '')}`;
}

/** שורות הפריטים · שם, כמות ומחיר, כולל חלות בשניצל */
function lines(d: NewOrderDraft): string[] {
  const out = (MENU[d.cat] ?? [])
    .filter((it) => (d.qty[it.id] ?? 0) > 0)
    .map((it) => `• ${it.n} × ${d.qty[it.id]} · ${(d.qty[it.id] ?? 0) * it.price} ₪`);
  if (d.cat === 'schn') {
    for (const r of d.rolls) {
      const tops = r.tops.length ? ` (${r.tops.join(', ')})` : '';
      out.push(`• ${ROLL[r.type].n}${tops} · ${ROLL[r.type].price} ₪`);
    }
  }
  return out;
}

/** גוף ההודעה · אותו טקסט שנשלח ללקוח */
export function manualOrderText(d: NewOrderDraft): string {
  const parts = [GREETING, ''];
  const name = trim(d.name);
  if (name) parts[0] = `היי ${name}, תודה על ההזמנה!`;

  parts.push(...lines(d));
  if (shipFee(d) > 0) parts.push(`• ${SHIP_LABEL} · ${shipFee(d)} ₪`);
  parts.push('', `${TOTAL_LABEL}: ${total(d)} ₪`, '');

  parts.push(`${HOW_LABEL}: ${d.ship === 'deliv' ? DELIV_TEXT : PICKUP_TEXT}`);
  if (trim(d.time)) parts.push(`${TIME_LABEL}: ${trim(d.time)}`);
  if (d.ship === 'deliv' && trim(d.addr)) parts.push(`${ADDR_LABEL}: ${trim(d.addr)}, ${d.area}`);

  parts.push('', CONFIRM);
  return parts.join('\n');
}

/** הקישור שפותח את וואטסאפ עם ההודעה בפנים */
export function manualOrderLink(d: NewOrderDraft): string {
  return `https://wa.me/${waPhone(d.phone)}?text=${encodeURIComponent(manualOrderText(d))}`;
}

/** האם בכלל יש מה לשלוח · בלי טלפון ובלי פריטים אין אישור */
export const canNotify = (d: NewOrderDraft) => waPhone(d.phone).length > 5 && itemsSum(d) > 0;
