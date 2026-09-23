/**
 * מה Meta ענתה בשליחה האחרונה שנכשלה.
 *
 * ⚠ **למה זה נחוץ · 23 בספטמבר 2026** · שקד דיווחה שקוד אימות
 * ההרשמה לא מגיע בוואטסאפ. הסיבה לא הייתה בקוד אלא ב**שקט**:
 * `notifyOtp` מחזיר `{ ok:false, error }` ואינו זורק, והמסלול
 * התעלם מהערך המוחזר והחזיר `{ ok:true }` ללקוחה בכל מקרה.
 * כלומר האפליקציה אמרה ״נשלח״, Meta אמרה ״לא״, ואף אחד לא ראה
 * את זה חוץ מיומן השרת.
 *
 * ⚠ **הסיבה נשמרת בזיכרון בלבד** · היא אבחון תפעולי ולא נתון
 * עסקי. אין טעם לשמור אותה במסד, והיא מתאפסת בכל פריסה — וזה
 * בסדר, כי היא רלוונטית רק לניסיון האחרון.
 *
 * ⚠ **לעולם לא חוזרת ללקוחה** · התשובה של Meta יכולה לכלול
 * מזהים פנימיים ושמות תבניות. רק מסלול ניהול מאומת קורא אותה.
 */

export type WhatsAppFailure = {
  /** מתי · ISO */
  at: string;
  /** מה ניסינו לשלוח · 'otp' | שם תבנית */
  kind: string;
  /** ההודעה של Meta כלשונה */
  error: string;
  /** קוד HTTP שחזר, אם חזר */
  status?: number;
};

let last: WhatsAppFailure | null = null;
let failures = 0;
let sent = 0;

export function noteWhatsAppFailure(kind: string, error: string, status?: number): void {
  failures += 1;
  last = { at: new Date().toISOString(), kind, error, status };
}

export function noteWhatsAppSent(): void {
  sent += 1;
}

export function whatsAppStats(): { sent: number; failures: number; last: WhatsAppFailure | null } {
  return { sent, failures, last };
}
