/**
 * אימות טלפון לפני הרשמה.
 *
 * ⚠ **למה זה קיים בנפרד מ-`whatsapp/otp.ts`** · הקודים שם נשמרים
 * ב-`PasswordReset`, שמחייבת `userId` — הצמדה למשתמש קיים. בהרשמה
 * מאמתים טלפון של מי שעדיין **אין לה חשבון**, ולכן אין לאן לשמור
 * שם את הקוד. הטבלה כאן מוצמדת למספר הטלפון ולא למשתמש.
 *
 * הזרימה שקבעה שקד (16 בספטמבר 2026): ״לפני שממלאים בכלל פרטים
 * אנחנו רוצים לבדוק שהטלפון תקין״.
 *
 * ⚠ **ההחלטות כאן טהורות** · כל מה שנוגע במסד יושב בנתיבים עצמם,
 * וכאן רק חוקים — תוקף, קירור, וניסיונות. כך אפשר לבדוק אותם.
 */

/**
 * ⚠ **שתי דקות** · החלטה של שקד (16 בספטמבר 2026). היה דקה אחת,
 * והיא העלתה — הגעת הודעת וואטסאפ לבדה לוקחת לפעמים 10–30 שניות,
 * ואז צריך לעבור לאפליקציה, לקרוא ולהקליד.
 *
 * ⚠ **המספר הזה מופיע גם ללקוחה** · `otpBody` ב-`mobile/src/screens/loginCopy.ts`
 * אומר לה כמה זמן יש לה. שינוי כאן מחייב שינוי שם, אחרת המסך משקר.
 */
export const VERIFY_TTL_MS = 2 * 60 * 1000;
/** ⚠ בלם עלות · כל הודעת וואטסאפ עולה כסף, ובלי זה אפשר לשרוף אותו */
export const RESEND_COOLDOWN_MS = 30 * 1000;
/** ⚠ בלם ניחוש · שש ספרות זה מיליון אפשרויות, אבל בלי תקרה אפשר לסרוק */
export const MAX_ATTEMPTS = 5;
/** כמה זמן אימות מוצלח תקף להשלמת ההרשמה */
export const VERIFIED_WINDOW_MS = 15 * 60 * 1000;

export type VerifyRow = {
  code: string;
  sentAt: Date;
  expiresAt: Date;
  attempts: number;
  usedAt: Date | null;
  verifiedAt: Date | null;
};

export type SendGate = { ok: true } | { ok: false; waitMs: number };

/** האם מותר לשלוח קוד עכשיו · ואם לא, בעוד כמה */
export function canSend(row: VerifyRow | null, now: number): SendGate {
  if (!row) return { ok: true };
  const since = now - row.sentAt.getTime();
  if (since >= RESEND_COOLDOWN_MS) return { ok: true };
  return { ok: false, waitMs: RESEND_COOLDOWN_MS - since };
}

export type CodeCheck = 'ok' | 'wrong' | 'expired' | 'locked' | 'none';

/**
 * בדיקת הקוד שהוקלד.
 *
 * ⚠ **הסדר חשוב** · ננעל לפני שפג, ופג לפני השוואה. אחרת אפשר
 * ללמוד מהתשובה אם הקוד היה נכון גם כשהוא כבר לא תקף.
 */
export function checkCode(row: VerifyRow | null, input: string, now: number): CodeCheck {
  if (!row || row.usedAt) return 'none';
  if (row.attempts >= MAX_ATTEMPTS) return 'locked';
  if (row.expiresAt.getTime() <= now) return 'expired';
  return input.trim() === row.code ? 'ok' : 'wrong';
}

/** האם הטלפון אומת לאחרונה · זה מה שמתיר להשלים הרשמה */
export function verifiedRecently(row: VerifyRow | null, now: number): boolean {
  if (!row?.verifiedAt) return false;
  return now - row.verifiedAt.getTime() <= VERIFIED_WINDOW_MS;
}
