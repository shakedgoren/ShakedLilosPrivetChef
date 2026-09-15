import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mailConfigured, sendMail } from './mailer.ts';

/**
 * ⚠ **הבדיקה רצה בלי הגדרות SMTP** · זה בדיוק המצב שצריך להיות
 * בטוח: בקשת איפוס סיסמה לא תיפול ולא תסגיר דבר רק מפני שהשרת
 * לא הוגדר. אין כאן שליחה אמיתית ואין פנייה לרשת.
 */

const msg = { to: 'x@example.com', subject: 'נושא', text: 'גוף', html: '<p>גוף</p>' };

test('בלי הגדרות SMTP המערכת אינה מוגדרת', () => {
  assert.equal(mailConfigured(), false);
});

test('שליחה בלי הגדרות מחזירה not_configured ואינה זורקת', async () => {
  const res = await sendMail(msg);
  assert.deepEqual(res, { sent: false, reason: 'not_configured' });
});
