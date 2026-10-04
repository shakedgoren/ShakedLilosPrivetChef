import { createTransport, type Transporter } from 'nodemailer';
import { maskWho } from '../auth/resetLog.ts';
import { env } from '../env.ts';

/**
 * שליחת מייל · SMTP.
 *
 * ⚠ **בלי הגדרות — לא נשלח כלום, ולא נופלים** · אם חסרים פרטי
 * ה-SMTP הפונקציה מחזירה `{ sent: false, reason: 'not_configured' }`
 * ורושמת אזהרה ביומן. זה מכוון: בקשת איפוס סיסמה לא אמורה להחזיר
 * שגיאה למשתמשת רק בגלל שהשרת לא הוגדר, וגם לא אמורה להסגיר
 * האם החשבון קיים.
 *
 * ⚠ **הסיסמה של תיבת הדואר מגיעה רק ממשתנה סביבה** · היא לא
 * נכתבת בקוד ולא נשמרת בגיט.
 */

export type MailResult = { sent: boolean; reason?: 'not_configured' | 'failed' };

export type Mail = { to: string; subject: string; text: string; html: string };

export const mailConfigured = (): boolean =>
  Boolean(env.smtpHost && env.smtpUser && env.smtpPass && env.mailFrom);

let cached: Transporter | null = null;

function transport(): Transporter {
  if (cached) return cached;
  cached = createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    /* 465 הוא SMTPS · כל שאר היציאות עולות ל-TLS דרך STARTTLS */
    secure: env.smtpPort === 465,
    auth: { user: env.smtpUser, pass: env.smtpPass },
  });
  return cached;
}

function missingSmtp(): string[] {
  const keys = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM'] as const;
  return keys.filter((key) => !(process.env[key] ?? '').trim());
}

export async function sendMail(mail: Mail): Promise<MailResult> {
  const to = maskWho(mail.to);
  if (!mailConfigured()) {
    const missing = missingSmtp();
    console.warn(`[מייל] לא נשלח · אל=${to} · חסרים=${missing.join(',') || 'SMTP'}`);
    return { sent: false, reason: 'not_configured' };
  }
  const started = Date.now();
  try {
    const info = await transport().sendMail({
      from: env.mailFrom,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
    console.info(
      `[מייל] נשלח · אל=${to} · host=${env.smtpHost} · port=${env.smtpPort} · ms=${Date.now() - started} · id=${info.messageId ?? ''}`,
    );
    return { sent: true };
  } catch (err) {
    /* ⚠ בלי הסיסמה ובלי גוף המייל · רק למה SMTP נכשל */
    const message = err instanceof Error ? err.message : 'unknown';
    console.error(
      `[מייל] נכשל · אל=${to} · host=${env.smtpHost} · port=${env.smtpPort} · ms=${Date.now() - started} · ${message}`,
    );
    return { sent: false, reason: 'failed' };
  }
}

/** ניקוי המטמון · לבדיקות ולשינוי הגדרות בזמן ריצה */
export function resetTransport(): void {
  cached = null;
}
