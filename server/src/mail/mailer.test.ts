import { test } from 'node:test';
import assert from 'node:assert/strict';

/**
 * ⚠ **הבדיקה מנקה את הגדרות ה-SMTP בעצמה · 19 בספטמבר 2026** ·
 * קודם היא פשוט הניחה שאין הגדרות במכונה, ולכן **נשברה ברגע
 * ששקד הגדירה SMTP אמיתי ב-`.env`** — בדיקה שנכשלת מפני שהפרויקט
 * התקדם אינה בודקת כלום.
 *
 * ⚠ **מחרוזת ריקה ולא `delete`** · `env.ts` קורא ל-`dotenv`, והוא
 * ממלא רק מפתחות **שאינם קיימים**. מחיקה הייתה מחזירה את הערכים
 * מהקובץ; ערך ריק חוסם אותו.
 *
 * ⚠ **הייבוא חייב להיות דינמי** · ייבוא רגיל מורם לראש הקובץ ורץ
 * לפני השורות האלה, ואז `env` כבר נקרא עם הערכים האמיתיים.
 */
for (const k of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM']) {
  process.env[k] = '';
}

const { mailConfigured, sendMail } = await import('./mailer.ts');

const msg = { to: 'x@example.com', subject: 'נושא', text: 'גוף', html: '<p>גוף</p>' };

test('בלי הגדרות SMTP המערכת אינה מוגדרת', () => {
  assert.equal(mailConfigured(), false);
});

test('שליחה בלי הגדרות מחזירה not_configured ואינה זורקת', async () => {
  const res = await sendMail(msg);
  assert.deepEqual(res, { sent: false, reason: 'not_configured' });
});
