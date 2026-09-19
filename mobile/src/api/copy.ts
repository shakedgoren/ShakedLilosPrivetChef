/**
 * טקסטים חדשים · נכתבו עבור שגיאות רשת/שרת. לא קיימים בקנבס.
 * שקד לא כתבה אותם.
 */
export const COPY = {
  authFail: 'אימייל, טלפון או סיסמה לא נכונים',
  taken: 'כבר יש חשבון עם הפרטים האלה',
  net: 'לא ניתן להתחבר כרגע',
  google: 'התחברות עם גוגל עדיין לא פעילה',
  orderFail: 'לא הצלחנו לשמור את ההזמנה · נסי שוב',
  whoInvalid: 'צריך אימייל או מספר טלפון תקין',
  adminOnly: 'הניהול פתוח רק למנהלת',
  shopHome: 'לחנות',
  saveFail: 'לא הצלחנו לשמור · נסי שוב',
  passWrong: 'הסיסמה הנוכחית לא נכונה',
  /* חדש · לא בקנבס · שגיאות יום מכירה / מכסה / שכפול */
  dayClosed: 'היום סגור להזמנות',
  dayBlocked: 'היום חסום להזמנות',
  categoryClosed: 'הקטגוריה לא פתוחה ביום הזה',
  quotaExceeded: 'אין מספיק מלאי לאחת המנות',
  reorderFail: 'לא הצלחנו לשכפל את ההזמנה · נסי שוב',
  reorderUnavailable: 'אי אפשר להזמין שוב את ההזמנה הזו',
  /* חדש · לא בקנבס · וואטסאפ / קוד חד-פעמי */
  whatsappOptIn: 'קוד אימות ואישור הזמנה עשויים להישלח בוואטסאפ למספר שבחשבון.',
  resetSentTitle: 'שלחנו קוד לאיפוס',
  /* ⚠ עודכן · שקד קבעה (16.9.2026) שהאיפוס נשלח למייל, לא בוואטסאפ */
  resetSentBody: 'אם יש חשבון עם הכתובת הזו, הקישור לאיפוס נשלח אליה · תקף ל-10 דקות.',
  otpInvalid: 'הקוד לא תקין או שפג תוקפו',
  /* ⚠ **חדש · נכתב על ידי Claude ב-19 בספטמבר 2026** · שקד לא כתבה
     את הנוסח הזה. הוא מופיע רק כששרת המייל עצמו לא הצליח לשלוח. */
  mailFailed: 'שרת המייל לא הצליח לשלוח כרגע · נסי שוב עוד מעט',
  /* ⚠ **שלוש אלה נכתבו על ידי Claude ב-19.9.2026** · שלב הקוד
     באיפוס הסיסמה · שקד לא כתבה אותן. */
  resetWrong: 'הקוד לא נכון · אפשר לנסות שוב',
  resetExpired: 'הקוד פג · אפשר לשלוח קוד חדש',
  resetLocked: 'יותר מדי ניסיונות · אפשר לשלוח קוד חדש',
};

/**
 * ⚠ **קודי האימות הטלפוני נושאים הודעה מהשרת** · ״נשארו 4 ניסיונות״,
 * ״אפשר לשלוח שוב בעוד 30 שניות״. הודעה גנרית כאן הייתה מוחקת בדיוק
 * את המידע שהמשתמשת צריכה, ולכן היא מועברת כמו שהיא.
 */
const SERVER_SAYS = new Set([
  'too_soon',
  'otp_expired',
  'otp_locked',
  'phone_unverified',
  'invalid_phone',
]);

export function authError(code: string, serverMessage?: string): string {
  if (SERVER_SAYS.has(code) && serverMessage) return serverMessage;
  if (code === 'otp_invalid' && serverMessage) return serverMessage;
  if (code === 'invalid_credentials' || code === 'unauthorized') return COPY.authFail;
  if (code === 'email_taken' || code === 'phone_taken') return COPY.taken;
  if (code === 'invalid_who') return COPY.whoInvalid;
  if (code === 'google_not_configured') return COPY.google;
  if (code === 'google_token_required' || code === 'invalid_google_token') return COPY.google;
  if (code === 'otp_invalid') return COPY.otpInvalid;
  if (code === 'mail_failed') return COPY.mailFailed;
  if (code === 'reset_wrong') return COPY.resetWrong;
  if (code === 'reset_expired') return COPY.resetExpired;
  if (code === 'reset_locked') return COPY.resetLocked;
  if (code === 'reset_invalid') return COPY.resetExpired;
  return COPY.net;
}

export function orderError(code: string, serverMessage?: string): string {
  if (code === 'quota_exceeded') return serverMessage || COPY.quotaExceeded;
  if (code === 'day_closed') return serverMessage || COPY.dayClosed;
  if (code === 'day_blocked') return COPY.dayBlocked;
  if (code === 'category_closed') return COPY.categoryClosed;
  if (code === 'reorder_unavailable') return COPY.reorderUnavailable;
  if (code === 'login_required') return COPY.authFail;
  return COPY.orderFail;
}
