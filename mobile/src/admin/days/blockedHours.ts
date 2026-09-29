/**
 * שעות משלוח חסומות · הגשר בין הצ׳יפים במסך לטווחים שבמסד.
 *
 * ⚠ **בקשת שקד · 26 בספטמבר 2026** · ״אופציה לחסום שעות של
 * משלוחים לפי ימים בצד מנהל״, ובבחירה מפורשת שלה: חסימה **לתאריך
 * מסוים ולשעות מסוימות**.
 *
 * ⚠ **למה שעות עגולות ולא הקלדה** · בטלפון הקלדת ״18:00–21:00״
 * בשני שדות היא ארבע טעויות שמחכות לקרות. לחיצה על שעה היא
 * פעולה אחת, ואי אפשר להקליד בה טווח הפוך או שעה שאינה קיימת.
 *
 * ⚠ **מה נשמר במסד הוא טווחים** · `[{from:'18:00',to:'18:59'}]`.
 * שעות רצופות מתמזגות לטווח אחד, כדי שההודעה ללקוחה תהיה ״אין
 * משלוחים בשעות 18:00–20:59״ ולא שלוש שורות נפרדות.
 *
 * ⚠ **טווח שנכתב ישירות מול ה-API מתעגל** · אם מישהו ישלח
 * `18:00–21:00`, המסך ידליק את השעות 18 עד 21, ובשמירה הבאה
 * הטווח ייכתב כ-`18:00–21:59`. המסך הזה הוא הכותב היחיד בפועל,
 * ולכן זה לא קורה — אבל זה כתוב כאן כדי שלא יפתיע.
 */

export type BlockedRange = { from: string; to: string };

/**
 * השעות שמוצגות · איחוד חלונות המסירה של כל הקטגוריות.
 * מגשי פירות 07:00–20:00 הם הרחב מכולם; מארזים ושף 09:00–15:00,
 * שישניצל 11:00–15:00 וקוסקוס 12:00–14:00 נכנסים בתוכו.
 */
export const HOUR_FROM = 7;
export const HOUR_TO = 20;

/** `[7, 8, … 20]` */
export const HOURS: readonly number[] = Array.from(
  { length: HOUR_TO - HOUR_FROM + 1 },
  (_, i) => HOUR_FROM + i,
);

const pad2 = (n: number) => String(n).padStart(2, '0');

/** `18` → `'18:00'` */
export const hourLabel = (h: number): string => `${pad2(h)}:00`;

/** השעה שבה נופלת מחרוזת `HH:MM` · `null` לקלט פגום */
const hourOf = (hhmm: string): number | null => {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(hhmm).trim());
  return m ? Number(m[1]) : null;
};

/**
 * הטווחים שבמסד → קבוצת השעות שהמסך מדליק.
 * ⚠ הקצה העליון **כלול** · טווח שנגמר ב-21:00 חוסם גם את 21:00
 * עצמה, ולכן השעה 21 נדלקת.
 */
export function hoursOf(ranges: readonly BlockedRange[]): number[] {
  const on = new Set<number>();
  for (const r of ranges) {
    const a = hourOf(r.from);
    const b = hourOf(r.to);
    if (a === null || b === null || a > b) continue;
    for (let h = a; h <= b; h++) on.add(h);
  }
  return [...on].sort((x, y) => x - y);
}

/**
 * קבוצת השעות → טווחים לשמירה · שעות רצופות מתמזגות.
 * ⚠ כל שעה נגמרת ב-`:59` · כך ״לחסום את 18״ חוסם גם 18:40,
 * ו-19:00 נשארת פתוחה אלא אם גם היא נבחרה.
 */
export function rangesOf(hours: readonly number[]): BlockedRange[] {
  const sorted = [...new Set(hours)].sort((a, b) => a - b);
  const out: BlockedRange[] = [];
  let start: number | null = null;
  let prev: number | null = null;

  for (const h of sorted) {
    if (start === null) {
      start = h;
    } else if (prev !== null && h !== prev + 1) {
      out.push({ from: hourLabel(start), to: `${pad2(prev)}:59` });
      start = h;
    }
    prev = h;
  }
  if (start !== null && prev !== null) {
    out.push({ from: hourLabel(start), to: `${pad2(prev)}:59` });
  }
  return out;
}

/** הדלקה וכיבוי של שעה אחת · מחזיר קבוצה חדשה, לא משנה את הקיימת */
export const toggleHourIn = (hours: readonly number[], h: number): number[] =>
  hours.includes(h) ? hours.filter((x) => x !== h) : [...hours, h].sort((a, b) => a - b);

/**
 * שורת הסיכום מתחת לצ׳יפים.
 *
 * ⚠ **נוסח שנכתב כאן · שקד לא כתבה אותו**
 *
 * ⚠ **״בין 18:00 ל-21:00״ ולא ״18:00–20:59״** · חסימת השעות
 * 18, 19 ו-20 פירושה שהמשלוחים חוזרים ב-21:00. ״18:00–21:00״
 * היה נקרא כאילו גם 21:00 חסומה, ו-״20:59״ נראה כמו תקלה.
 */
export function hoursSummary(hours: readonly number[]): string {
  if (hours.length === 0) return 'כל שעות המשלוח פתוחות';
  const list = rangesOf(hours)
    .map((r) => {
      const a = Number(r.from.slice(0, 2));
      const b = Number(r.to.slice(0, 2));
      return a === b ? `ב-${hourLabel(a)}` : `בין ${hourLabel(a)} ל-${hourLabel(b + 1)}`;
    })
    .join(' · ');
  return `אין משלוחים ${list}`;
}
