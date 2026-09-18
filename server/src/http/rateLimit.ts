import rateLimit from 'express-rate-limit';

/**
 * הגבלת קצב.
 *
 * ⚠ **נוסף ב-18 בספטמבר 2026 · ממצא מסקירת השרת** · נקודת האיפוס
 * בסיסמה קיבלה **קוד בן שש ספרות** (`generateOtp`) ושמרה אותו
 * כאסימון ב-`PasswordReset`. `POST /auth/reset-password` חיפש את
 * האסימון ישירות, **בלי מונה ניסיונות ובלי הגבלת קצב** — כלומר
 * מיליון אפשרויות שאפשר לעבור עליהן בלולאה. אימות הטלפון
 * (`PhoneVerification`) כן ספר ניסיונות; מסלול האיפוס לא.
 *
 * ⚠ **הגבלה לפי כתובת, ולא לפי משתמשת** · אי אפשר לדעת של מי
 * הקוד השגוי, ולכן אין ממה לגזור מונה לכל חשבון. ההגבלה על
 * הכתובת היא מה שסוגר את הלולאה.
 *
 * ⚠ **מאחורי פרוקסי צריך `TRUST_PROXY`** · בלעדיו כל הבקשות
 * נראות כמגיעות מאותה כתובת, וההגבלה תחסום את כולן יחד.
 */

/** חלון הספירה · רבע שעה */
const WINDOW_MS = 15 * 60 * 1000;

const message = { error: 'too_many_requests', message: 'יותר מדי ניסיונות · נסי שוב בעוד כמה דקות' };

/** המסלולים הרגישים · התחברות, קודים ואיפוס סיסמה */
export const authLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message,
});

/**
 * רשת ביטחון לכל ה-API.
 * ⚠ **רחבה בכוונה** · מסך הניהול מרענן את עצמו כל 20 שניות
 * (`REFRESH_MS` בלוח יום המכירה), ועוד כמה קריאות בכל מעבר מסך.
 */
export const apiLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message,
});
