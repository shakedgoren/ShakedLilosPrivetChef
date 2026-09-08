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
  /** כמה מנות יש כרגע בהזמנה · נדרש רק כשיש מינימום */
  meals?: number;
  clockFallback?: string;
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
