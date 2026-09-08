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
};

export function authError(code: string): string {
  if (code === 'invalid_credentials' || code === 'unauthorized') return COPY.authFail;
  if (code === 'email_taken' || code === 'phone_taken') return COPY.taken;
  if (code === 'invalid_who') return COPY.whoInvalid;
  if (code === 'google_not_configured') return COPY.google;
  return COPY.net;
}
