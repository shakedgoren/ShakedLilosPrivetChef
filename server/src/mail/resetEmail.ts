/**
 * מייל איפוס הסיסמה.
 *
 * ⚠ **החלטה של שקד** (16 בספטמבר 2026) · לשאלה ״לאן האיפוס נשלח?״
 * היא ענתה: ״שיישלח קישור לאיפוס למייל״.
 *
 * ⚠ **כל הנוסח כאן נכתב על ידי קלוד ולא על ידי שקד** · הוא אינו
 * מהקנבס, ואין לו מקור בשום מסך קיים. אם היא רוצה ניסוח אחר —
 * זה הקובץ היחיד שצריך לגעת בו.
 *
 * ⚠ **האסימון לעולם לא בשורת הנושא** · שורות נושא נשמרות ביומנים,
 * בהתראות של המכשיר ובתצוגה המקדימה של תיבת הדואר. הוא רק בקישור.
 */

/**
 * תוקף האסימון · חייב להיות זהה למה ש-`/auth/forgot-password` כותב.
 * ⚠ עשר דקות · החלטה של שקד (16 בספטמבר 2026).
 */
export const RESET_TTL_MINUTES = 10;

export type ResetMail = { subject: string; text: string; html: string; link: string };

/** ״10 דקות״ / ״שעה אחת״ · נגזר מהקבוע, כדי שלא ייווצר פער בין הטקסט למציאות */
export const ttlLabel = (): string =>
  RESET_TTL_MINUTES % 60 === 0
    ? (RESET_TTL_MINUTES === 60 ? 'שעה אחת' : `${RESET_TTL_MINUTES / 60} שעות`)
    : `${RESET_TTL_MINUTES} דקות`;

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * הקישור שנשלח · נופל על מסך האיפוס באפליקציה.
 * חנות הניווט קוראת `?screen=` מכתובת הדפדפן, ולכן זה הפרמטר.
 */
export function resetLink(appUrl: string, token: string): string {
  const base = appUrl.trim().replace(/\/+$/, '');
  const url = new URL(`${base}/`);
  url.searchParams.set('screen', 'reset');
  url.searchParams.set('token', token);
  return url.toString();
}

export function buildResetEmail(opts: { name: string; token: string; appUrl: string }): ResetMail {
  const link = resetLink(opts.appUrl, opts.token);
  const name = opts.name.trim();
  const hello = name ? `שלום ${name},` : 'שלום,';
  const ttl = ttlLabel();

  const subject = 'איפוס הסיסמה שלך · BITE & TELL';

  const text = [
    hello,
    '',
    'קיבלנו בקשה לאפס את הסיסמה לחשבון שלך ב-BITE & TELL.',
    'כדי לבחור סיסמה חדשה אפשר להיכנס לקישור הזה:',
    '',
    link,
    '',
    `הקישור תקף ${ttl} מרגע השליחה, ואפשר להשתמש בו פעם אחת בלבד.`,
    'אם לא ביקשת לאפס סיסמה אפשר פשוט להתעלם מההודעה — הסיסמה הנוכחית נשארת כמו שהיא.',
    '',
    'BITE & TELL · שף פרטית · יבנה והשפלה',
  ].join('\n');

  const html = `<div dir="rtl" lang="he" style="font-family:Assistant,Arial,sans-serif;background:#FCFBFB;padding:28px 18px;color:#2A2430">
  <div style="max-width:520px;margin:0 auto;background:#FFFFFF;border:1px solid rgba(130,112,162,0.16);border-radius:22px;padding:26px 24px">
    <div style="font-size:19px;font-weight:700;letter-spacing:.5px;color:#43307A">BITE &amp; TELL</div>
    <div style="font-size:12.5px;color:#8A8194;margin-top:2px">שף פרטית · יבנה והשפלה</div>
    <hr style="border:0;border-top:1px solid rgba(130,112,162,0.16);margin:18px 0">
    <p style="font-size:15px;margin:0 0 10px">${esc(hello)}</p>
    <p style="font-size:14px;line-height:1.6;color:#4A4254;margin:0 0 18px">
      קיבלנו בקשה לאפס את הסיסמה לחשבון שלך. הכפתור למטה מוביל למסך שבו בוחרים סיסמה חדשה.
    </p>
    <p style="margin:0 0 18px">
      <a href="${link}" style="display:inline-block;background:#BCA7E6;color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;padding:13px 26px;border-radius:999px">בחירת סיסמה חדשה</a>
    </p>
    <p style="font-size:12.5px;line-height:1.6;color:#7D7488;margin:0 0 6px">
      הקישור תקף ${ttl} מרגע השליחה, ואפשר להשתמש בו פעם אחת בלבד.
    </p>
    <p style="font-size:12.5px;line-height:1.6;color:#7D7488;margin:0">
      אם לא ביקשת לאפס סיסמה אפשר להתעלם מההודעה — הסיסמה הנוכחית נשארת כמו שהיא.
    </p>
  </div>
</div>`;

  return { subject, text, html, link };
}
