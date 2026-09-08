/**
 * שלישי של קוסקוס · הנתונים הועתקו אחד לאחד מ-Order.dc.html בקנבס.
 * מחירים ושמות מנות הם תוכן של שקד — אין לשנות אותם כאן.
 */

export type MenuItem = { name: string; price: number; meal: boolean };

export const COUSCOUS_MENU: MenuItem[] = [
  { name: 'קוסקוס צמחוני', price: 45, meal: true },
  { name: 'קוסקוס עם עוף', price: 55, meal: true },
  { name: 'קוסקוס עם מפרום', price: 65, meal: true },
  { name: 'תוספת ירקות', price: 10, meal: false },
  { name: 'תוספת עוף', price: 15, meal: false },
  { name: 'תוספת מפרום', price: 20, meal: false },
];

export const PAYMENTS = ['ביט', 'פייבוקס', 'אפל פיי', 'מזומן'] as const;

/** אזור החלוקה · מאשדוד ועד ראשון לציון */
export const CITIES = ['יבנה', 'אשדוד', 'גדרה', 'נס ציונה', 'רחובות', 'ראשון לציון'];

/* חלונות הזמן · בדקות מתחילת היום */
const DELIVERY_FROM = 12 * 60;
const DELIVERY_TO = 14 * 60;
const DELIVERY_STEP_MINUTES = 20;

export const PICKUP_FROM = 11 * 60 + 30;
export const PICKUP_TO = 14 * 60 + 30;

/** מתחת לכמות הזאת של מנות אין משלוח, רק איסוף עצמי */
export const DELIVERY_MIN_MEALS = 4;

export const CLOCK_FALLBACK = '12:00';

export const hhmm = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export const toMinutes = (t: string): number | null => {
  const [h, m] = String(t || '').split(':');
  const hh = parseInt(h, 10);
  const mm = parseInt(m, 10);
  return isNaN(hh) || isNaN(mm) ? null : hh * 60 + mm;
};

export const DELIVERY_SLOTS: string[] = (() => {
  const out: string[] = [];
  for (let m = DELIVERY_FROM; m <= DELIVERY_TO; m += DELIVERY_STEP_MINUTES) out.push(hhmm(m));
  return out;
})();

/** שעת איסוף מחוץ לטווח נתפסת פנימה · 15:00 הופך ל-14:30 */
export const clampPickupClock = (v: string) => {
  const m = toMinutes(v);
  if (m === null) return CLOCK_FALLBACK;
  return hhmm(Math.min(PICKUP_TO, Math.max(PICKUP_FROM, m)));
};

export const countMeals = (qty: number[]) =>
  qty.reduce((s, v, i) => s + (COUSCOUS_MENU[i].meal ? v : 0), 0);

export const orderTotal = (qty: number[]) =>
  qty.reduce((s, v, i) => s + v * COUSCOUS_MENU[i].price, 0);

export type OrderLine = { name: string; qty: number; sum: number };

export const orderLines = (qty: number[]): OrderLine[] =>
  COUSCOUS_MENU.map((it, i) => ({ name: it.name, qty: qty[i], sum: qty[i] * it.price })).filter(
    (l) => l.qty > 0,
  );

/** ״כתובת מלאה״ = רחוב ומספר בית, ולכן נדרשת גם ספרה */
export const isAddressValid = (a: string) => {
  const t = String(a || '').trim();
  return t.length >= 4 && /\d/.test(t);
};
