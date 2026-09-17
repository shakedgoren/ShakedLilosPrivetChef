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
