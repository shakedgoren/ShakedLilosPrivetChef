/**
 * חסימת שעות משלוח לתאריך מסוים.
 *
 * ⚠ **בקשת שקד · 27 בספטמבר 2026** · ״אופציה לחסום שעות של
 * משלוחים לפי ימים בצד מנהל״, ובבחירה מפורשת: **חסימה לתאריך
 * מסוים ולשעות מסוימות** — ולא חוק קבוע לפי יום בשבוע.
 *
 * ⚠ **משלוחים בלבד** · ״שעות של משלוחים״. איסוף עצמי אינו נחסם,
 * כי שם היא ממילא קובעת מתי היא בבית.
 *
 * ⚠ **נשמר כ-JSON על שורת יום המכירה** · `SaleDay` כבר מוקש
 * לפי תאריך ומחזיק שלושה שדות JSON דומים (`quotasJson`,
 * `wasteJson`, `soldJson`). טבלה נפרדת לא הייתה מוסיפה כלום.
 */

/** טווח שעות חסום · כולל את שני הקצוות */
export type BlockedRange = { from: string; to: string };

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** `"18:30"` → 1110 · דקות מתחילת היום. `null` לקלט פגום */
export function minutesOf(hhmm: string): number | null {
  const m = HHMM.exec(String(hhmm).trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * קריאת הטווחים מהעמודה.
 *
 * ⚠ **קלט פגום אינו חוסם** · העמודה היא JSON חופשי, ושורה
 * מקולקלת לא תסגור את כל המשלוחים של אותו יום בלי שאיש יבין
 * למה. טווח שאינו תקין פשוט מדולג.
 */
export function parseBlockedHours(json: string): BlockedRange[] {
  let raw: unknown;
  try {
    raw = JSON.parse(json || '[]');
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];
  const out: BlockedRange[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const { from, to } = item as { from?: unknown; to?: unknown };
    if (typeof from !== 'string' || typeof to !== 'string') continue;
    const a = minutesOf(from);
    const b = minutesOf(to);
    if (a === null || b === null || a > b) continue;
    out.push({ from, to });
  }
  return out;
}

/**
 * האם השעה הזו חסומה.
 *
 * ⚠ **הקצוות כלולים** · ״לחסום 18:00 עד 21:00״ בעברית פשוטה
 * כולל את 18:00 ואת 21:00. חצי־פתוח היה מפתיע.
 */
export function isHourBlocked(time: string, ranges: readonly BlockedRange[]): boolean {
  const t = minutesOf(time);
  if (t === null) return false;
  return ranges.some((r) => {
    const a = minutesOf(r.from);
    const b = minutesOf(r.to);
    return a !== null && b !== null && t >= a && t <= b;
  });
}

/** ⚠ הנוסח נכתב על ידי Claude · שקד לא כתבה אותו */
export function blockedHoursMessage(ranges: readonly BlockedRange[]): string {
  const list = ranges.map((r) => `${r.from}–${r.to}`).join(', ');
  return list ? `אין משלוחים בשעות ${list} בתאריך הזה` : 'אין משלוחים בשעה הזו';
}

/**
 * אימות קלט מהניהול · מחזיר את הטווחים התקינים בלבד.
 * ⚠ נפרד מ-`parseBlockedHours` בכוונה: שם מדלגים בשקט על זבל
 * שכבר במסד, כאן רוצים לדעת שהקלט נדחה.
 */
export function validateBlockedHours(input: unknown): BlockedRange[] | null {
  if (!Array.isArray(input)) return null;
  const out: BlockedRange[] = [];
  for (const item of input) {
    if (!item || typeof item !== 'object') return null;
    const { from, to } = item as { from?: unknown; to?: unknown };
    if (typeof from !== 'string' || typeof to !== 'string') return null;
    const a = minutesOf(from);
    const b = minutesOf(to);
    if (a === null || b === null) return null;
    if (a > b) return null;
    out.push({ from, to });
  }
  return out;
}
