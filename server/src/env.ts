import { config } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { META_UTILITY_TEMPLATES } from './whatsapp/vars.ts';

const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, '../.env') });

const required = (key: string, fallback?: string): string => {
  const v = process.env[key] ?? fallback;
  if (v === undefined || v === '') {
    throw new Error(`חסר משתנה סביבה: ${key}`);
  }
  return v;
};

/** תבנית אופציונלית · לא מוגדר = ברירת מחדל · מחרוזת ריקה = כבוי */
function optionalTemplate(key: string, fallback: string): string {
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  return raw.trim();
}

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
  resetDebug: process.env.RESET_DEBUG === '1',

  /* שליחת מייל · איפוס סיסמה. בלי אלה לא נשלח כלום (ראו mail/mailer.ts) */
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPass: process.env.SMTP_PASS ?? '',
  mailFrom: process.env.MAIL_FROM ?? '',
  /** הכתובת שאליה מפנה הקישור במייל · בפיתוח זה שרת ה-Expo בדפדפן */
  appUrl: process.env.APP_URL ?? 'http://localhost:8081',
  uploadDir: process.env.UPLOAD_DIR || resolve(here, '../uploads'),
  /** WhatsApp Cloud API · נקרא בזמן אמת כדי שבדיקות יוכלו לשנות env */
  get whatsapp() {
    const token = (process.env.WHATSAPP_TOKEN ?? '').trim();
    const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID ?? '').trim();
    const graphVersion = (process.env.WHATSAPP_GRAPH_VERSION ?? 'v21.0').trim() || 'v21.0';
    return {
      token,
      phoneNumberId,
      wabaId: (process.env.WHATSAPP_WABA_ID ?? '').trim(),
      graphVersion,
      templateOtp: (process.env.WHATSAPP_TEMPLATE_OTP ?? 'bite_otp').trim() || 'bite_otp',
      templateOrderConfirmedPickup: optionalTemplate(
        'WHATSAPP_TEMPLATE_ORDER_CONFIRMED_PICKUP',
        META_UTILITY_TEMPLATES.confirmPickup,
      ),
      templateOrderConfirmedDelivery: optionalTemplate(
        'WHATSAPP_TEMPLATE_ORDER_CONFIRMED_DELIVERY',
        META_UTILITY_TEMPLATES.confirmDelivery,
      ),
      templateOrderReadyPickup: optionalTemplate(
        'WHATSAPP_TEMPLATE_ORDER_READY_PICKUP',
        META_UTILITY_TEMPLATES.readyPickup,
      ),
      templateOrderDelivered: optionalTemplate(
        'WHATSAPP_TEMPLATE_ORDER_DELIVERED',
        META_UTILITY_TEMPLATES.delivered,
      ),
      templateLang: (process.env.WHATSAPP_TEMPLATE_LANG ?? 'he').trim() || 'he',
      webhookVerifyToken: (process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? '').trim(),
      enabled: Boolean(token && phoneNumberId),
    };
  },
};

export { isProd };
