import { config } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, '../.env') });

const required = (key: string, fallback?: string): string => {
  const v = process.env[key] ?? fallback;
  if (v === undefined || v === '') {
    throw new Error(`חסר משתנה סביבה: ${key}`);
  }
  return v;
};

const node = process.env.NODE_ENV ?? 'development';
const isProd = node === 'production';

export const env = {
  node,
  port: Number(process.env.PORT ?? 3001),
  host: process.env.HOST ?? '0.0.0.0',
  databaseUrl: required('DATABASE_URL', 'file:./dev.db'),
  jwtSecret: isProd ? required('JWT_SECRET') : (process.env.JWT_SECRET || 'dev-change-me-bite-and-tell'),
  jwtExpiresHours: Number(process.env.JWT_EXPIRES_HOURS ?? 168),
  adminEmail: (process.env.ADMIN_EMAIL ?? 'shaked@localhost').toLowerCase(),
  adminPhone: process.env.ADMIN_PHONE ?? '0500000000',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'changeme',
  adminName: process.env.ADMIN_NAME ?? 'שקד לילוז',
  get googleClientIds(): string[] {
    return (process.env.GOOGLE_CLIENT_ID ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  },
  get googleClientId(): string {
    return (process.env.GOOGLE_CLIENT_ID ?? '').split(',')[0]?.trim() ?? '';
  },
  /**
   * ⚠ **כבוי בכוח בפרודקשן · 19 בספטמבר 2026** · הדגל הזה מחזיר
   * את **אסימון איפוס הסיסמה בגוף התשובה** של
   * `POST /auth/forgot-password`. הוא נועד לפיתוח, אבל `.env`
   * אחד ששרד לפרודקשן היה הופך כל בקשת איפוס להשתלטות על חשבון.
   * הגנה בקוד עדיפה על הבטחה לזכור.
   */
  resetDebug: !isProd && process.env.RESET_DEBUG === '1',
  /**
   * כמה שכבות פרוקסי לסמוך עליהן · `1` מאחורי nginx/Render/Fly.
   * ⚠ ריק = בלי אמון · ראו `http/rateLimit`.
   */
  trustProxy: Number(process.env.TRUST_PROXY ?? 0) || 0,
  /**
   * המקורות שמותר להם לפנות מדפדפן · מופרדים בפסיק.
   *
   * ⚠ **לא נוגע לאפליקציה** · אפליקציה נייטיבית אינה שולחת כותרת
   * `Origin` ואינה כפופה ל-CORS כלל. הרשימה הזו נוגעת לגרסת
   * הווב ולכל דפדפן אחר.
   *
   * ⚠ **בפיתוח ריק = הכול פתוח** · כדי ש-Expo Web ובדיקות מהרשת
   * המקומית ימשיכו לעבוד. בפרודקשן ריק = **שום דפדפן**.
   */
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean),

  /* שליחת מייל · איפוס סיסמה. בלי אלה לא נשלח כלום (ראו mail/mailer.ts) */
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPass: process.env.SMTP_PASS ?? '',
  mailFrom: process.env.MAIL_FROM ?? '',
  uploadDir: process.env.UPLOAD_DIR || resolve(here, '../uploads'),
  /**
   * Green API · נקרא בזמן אמת כדי שבדיקות יוכלו לשנות env.
   *
   * ⚠ **החליף את WhatsApp Cloud API של Meta · 8 באוקטובר 2026** ·
   * נעלמו `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`,
   * `WHATSAPP_WABA_ID`, `WHATSAPP_GRAPH_VERSION` וכל ששת משתני
   * התבניות — אין יותר תבניות, והנוסח יושב ב-`whatsapp/messages.ts`.
   *
   * ⚠ **שלושת אלה חייבים להימחק מ-Render** · טוקן של Meta שנשאר
   * מוגדר אינו עושה נזק, אבל הוא סוד חי שאיש כבר לא משתמש בו.
   */
  get whatsapp() {
    const idInstance = (process.env.GREENAPI_ID_INSTANCE ?? '').trim();
    const apiToken = (process.env.GREENAPI_API_TOKEN ?? '').trim();
    /* ⚠ לכל אינסטנס יש כתובת משלו בקונסולה · לא תמיד api.green-api.com */
    const apiUrl = ((process.env.GREENAPI_API_URL ?? '').trim() || 'https://api.green-api.com').replace(/\/+$/, '');
    return {
      idInstance,
      apiToken,
      apiUrl,
      /** סוד משותף לאימות הוובהוק הנכנס · ריק = הוובהוק כבוי */
      webhookToken: (process.env.GREENAPI_WEBHOOK_TOKEN ?? '').trim(),
      enabled: Boolean(idInstance && apiToken),
    };
  },
};

export { isProd };
