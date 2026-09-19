/**
 * תיחום רשימות.
 *
 * ⚠ **נוסף ב-19 בספטמבר 2026 · ממצא מסקירת השרת** · 26 שאילתות
 * `findMany` רצו בלי שום גבול. עם 45 הזמנות ו-10 לקוחות זה לא
 * מורגש; עם אלפי הזמנות זה מפיל את השרת ואת המכשיר גם יחד.
 *
 * ⚠ **תקרה, לא עימוד מלא** · מי שצריך דפים מקבל `limit`/`skip`
 * ו-`total` ויודע להמשיך. התקרה קיימת כדי שבקשה בלי פרמטרים
 * לא תשלוף את כל ההיסטוריה.
 */

/** ברירת מחדל כשלא ביקשו כלום · מה שמסך סביר מציג בפועל */
export const PAGE_DEFAULT = 100;
/** התקרה הקשיחה · גם `limit=99999` לא יעבור אותה */
export const PAGE_MAX = 200;

export type Page = { take: number; skip: number };

/** קורא `limit` ו-`skip` מהשאילתה ומחזיר ערכים בטוחים תמיד */
export function readPage(
  query: Record<string, unknown>,
  fallback = PAGE_DEFAULT,
): Page {
  const raw = Number(query.limit);
  const take = Number.isFinite(raw) && raw > 0 ? Math.min(raw, PAGE_MAX) : fallback;
  const skipRaw = Number(query.skip);
  const skip = Number.isFinite(skipRaw) && skipRaw > 0 ? Math.floor(skipRaw) : 0;
  return { take: Math.floor(take), skip };
}
