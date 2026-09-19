/**
 * מייל איפוס הסיסמה · **קוד בן שש ספרות, בלי שום קישור**.
 *
 * ⚠ **החלטה של שקד · 19 בספטמבר 2026** · היא בחרה מבין שלוש
 * אפשרויות את הקוד. מה שהיה כאן קודם — כפתור עם קישור — היה שבור
 * משורש, וההסבר המלא נמצא ב-`auth/resetCode.ts`: הכתובת נבנתה
 * מ-`APP_URL` שלא הוגדר ולכן הצביעה על `localhost`, באפליקציה לא
 * היה מסך שמקבל אותה, וגוגל סימנה את ההודעה כספאם בדיוק בגללה.
 *
 * ⚠ **בלי קישורים בכלל** · זו גם הסיבה שההודעה כבר לא נראית
 * כהתחזות: אין למה ללחוץ, ולכן אין מה לזייף.
 *
 * ⚠ **כל הנוסח כאן נכתב על ידי Claude ולא על ידי שקד** · הוא אינו
 * מהקנבס. אם היא רוצה ניסוח אחר — זה הקובץ היחיד שצריך לגעת בו.
 *
 * ⚠ **הקוד לעולם לא בשורת הנושא** · שורות נושא נשמרות ביומנים,
 * בהתראות של המכשיר ובתצוגה המקדימה של תיבת הדואר.
 */
import { RESET_CODE_TTL_MS } from '../auth/resetCode.ts';

/** תוקף הקוד בדקות · נגזר מהמקור היחיד ולא נכתב פעמיים */
export const RESET_TTL_MINUTES = RESET_CODE_TTL_MS / 60000;

export type ResetMail = { subject: string; text: string; html: string; code: string };

/** ״10 דקות״ / ״שעה אחת״ · נגזר מהקבוע, כדי שלא ייווצר פער בין הטקסט למציאות */
export const ttlLabel = (): string =>
  RESET_TTL_MINUTES % 60 === 0
    ? RESET_TTL_MINUTES === 60
      ? 'שעה אחת'
      : `${RESET_TTL_MINUTES / 60} שעות`
    : `${RESET_TTL_MINUTES} דקות`;

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function buildResetEmail(opts: { name: string; code: string }): ResetMail {
  const name = opts.name.trim();
  const hello = name ? `שלום ${name},` : 'שלום,';
  const ttl = ttlLabel();
  const code = opts.code;

  const subject = 'קוד לאיפוס הסיסמה · BITE & TELL';

  const text = [
    hello,
    '',
    'קיבלנו בקשה לאפס את הסיסמה לחשבון שלך ב-BITE & TELL.',
    'הקוד לאיפוס הוא:',
    '',
    code,
    '',
    `הקוד תקף ${ttl} מרגע השליחה, ואפשר להשתמש בו פעם אחת בלבד.`,
    'מקלידים אותו באפליקציה, במסך ״שכחתי סיסמה״, ובוחרים סיסמה חדשה.',
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
      קיבלנו בקשה לאפס את הסיסמה לחשבון שלך. זה הקוד להקלדה באפליקציה:
    </p>
    <div style="font-size:34px;font-weight:700;letter-spacing:10px;color:#43307A;background:rgba(130,112,162,0.08);border-radius:16px;padding:16px 10px;text-align:center;margin:0 0 18px" dir="ltr">${esc(code)}</div>
    <p style="font-size:12.5px;line-height:1.6;color:#7D7488;margin:0 0 6px">
      הקוד תקף ${ttl} מרגע השליחה, ואפשר להשתמש בו פעם אחת בלבד.
    </p>
    <p style="font-size:12.5px;line-height:1.6;color:#7D7488;margin:0">
      אם לא ביקשת לאפס סיסמה אפשר להתעלם מההודעה — הסיסמה הנוכחית נשארת כמו שהיא.
    </p>
  </div>
</div>`;

  return { subject, text, html, code };
}
