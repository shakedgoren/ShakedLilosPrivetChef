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
};

export function authError(code: string): string {
  if (code === 'invalid_credentials' || code === 'unauthorized') return COPY.authFail;
  if (code === 'email_taken' || code === 'phone_taken') return COPY.taken;
  if (code === 'invalid_who') return COPY.whoInvalid;
  if (code === 'google_not_configured') return COPY.google;
  if (code === 'google_token_required' || code === 'invalid_google_token') return COPY.google;
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
