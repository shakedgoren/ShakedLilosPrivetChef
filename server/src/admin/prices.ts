import { MENU, ROLL, type AdminCatKey } from '../../../mobile/src/data/adminOrders.ts';

/**
 * מחיר לכל מזהה מנה בקטגוריה · מקור יחיד לכל חישוב הכנסות.
 *
 * ⚠ **חלות השניצל אינן ב-`MENU`** · `MENU.schn` מחזיק רק את
 * המארזים והקוקוטים. ״חלת שניצל דק״ ו״חלת פילה עוף טמפורה״
 * יושבות ב-`ROLL`, לפי מפתח הסוג (`thin`, `temp`) — בדיוק
 * המזהים שבהם משתמש `CATS.schn.dishes`. חישוב שהסתמך על `MENU`
 * לבדו תמחר אותן ב-0, ולכן ״הכנסות עבור היום״ לא זזו כששקד
 * עדכנה 30 שניצלים ו-20 פילה (נמדד 15 בספטמבר 2026: 4,000 ₪
 * במקום 6,700 ₪).
 */
export function dishPrices(cat: AdminCatKey): Record<string, number> {
  const out: Record<string, number> = {};
  for (const it of MENU[cat] ?? []) out[it.id] = it.price;
  if (cat === 'schn') for (const [id, roll] of Object.entries(ROLL)) out[id] = roll.price;
  return out;
}
