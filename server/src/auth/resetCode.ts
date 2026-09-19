import { randomInt } from 'node:crypto';
import { checkCode, MAX_ATTEMPTS, type CodeCheck } from './phoneVerify.ts';

/**
 * קוד איפוס הסיסמה שנשלח במייל.
 *
 * ⚠ **נבנה ב-19 בספטמבר 2026 · החלטה של שקד** · עד היום המייל
 * הכיל **קישור**, והוא היה שבור משורש:
 * · הכתובת נבנתה מ-`APP_URL`, שלא הוגדר — ולכן הצביעה על
 *   `http://localhost:8081`, כתובת שקיימת רק על המחשב של המפתח.
 * · ובאפליקציה לא היה בכלל מסך שמקבל אותה.
 * · וקישור ל-localhost במייל של ״איפוס סיסמה״ הוא בדיוק הדפוס
 *   שגוגל מסמנת כהתחזות, ולכן ההודעה נחתה בספאם.
 *
 * היא בחרה מבין שלוש אפשרויות את **הקוד**: שש ספרות במייל,
 * שמוקלדות באפליקציה. אין קישור, אין דומיין, ואין מה לשבור.
 *
 * ⚠ **אותם חוקים כמו באימות הטלפון** · `checkCode` מ-`phoneVerify`
 * כבר בדוק ומטפל בסדר הנכון — ננעל לפני שפג, ופג לפני השוואה.
 * אין סיבה לכתוב אותו פעמיים, ובוודאי לא בשתי גרסאות שיסתרו.
 */

/**
 * ⚠ **עשר דקות** · החלטה של שקד (16 בספטמבר 2026), ונשארה.
 * ⚠ המספר מופיע גם במייל · `ttlLabel` נגזר מאותו קבוע.
 */
export const RESET_CODE_TTL_MS = 10 * 60 * 1000;

/** כמה ניסיונות הקלדה לפני נעילה · אותו מספר של אימות הטלפון */
export const RESET_MAX_ATTEMPTS = MAX_ATTEMPTS;

/**
 * קוד חדש · שש ספרות, ולעולם לא מתחיל באפס.
 *
 * ⚠ **`randomInt` ולא `Math.random`** · זה מחולל מוצפן. קוד איפוס
 * שאפשר לנחש מסדרה הוא בדיוק הדבר שאסור.
 * ⚠ **בלי אפס מוביל** · אחרת ״012345״ נקרא ונכתב כחמש ספרות,
 * וגם נשמר כמספר בחלק מהמקומות.
 */
export function newResetCode(): string {
  return String(randomInt(100000, 1000000));
}

export type ResetRow = {
  token: string;
  expiresAt: Date;
  attempts: number;
  usedAt: Date | null;
};

/**
 * בדיקת הקוד שהוקלד · ״אין שורה״ ו״נוצל״ מחזירים אותה תשובה,
 * כדי שלא ילמדו מהתשובה האם יש חשבון.
 */
export function checkResetCode(row: ResetRow | null, input: string, now: number): CodeCheck {
  if (!row) return 'none';
  return checkCode(
    {
      code: row.token,
      sentAt: new Date(0),
      expiresAt: row.expiresAt,
      attempts: row.attempts,
      usedAt: row.usedAt,
      verifiedAt: null,
    },
    input,
    now,
  );
}
