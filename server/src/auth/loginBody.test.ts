import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { loginBody } from './loginBody.ts';

/**
 * ⚠ **למה הבדיקה הזו קיימת** · ב-26 בספטמבר נכנס כלל הסיסמה
 * החזקה, ו-`/auth/login` ירש אותו בטעות: הוא השתמש ב-
 * `whoBody.pick({ who, password })`, ושם `password` הוא
 * `strongPassword`. כלומר השרת פסל סיסמה חלשה **בכניסה**, בשלב
 * הוולידציה, לפני שבכלל הגיע להשוואה מול ה-hash.
 *
 * כל חשבון שנוצר לפני אותו תאריך ננעל בחוץ. שקד דיווחה ב-3
 * באוקטובר ששני החשבונות שלה לא נכנסים, והתשובה שחזרה אפילו לא
 * אמרה ״סיסמה שגויה״. אף אחת מ-205 הבדיקות לא נגעה במסלול הזה.
 *
 * ⚠ **הכלל שהבדיקות כאן שומרות עליו** · מדיניות סיסמה חלה על
 * **יצירה** — הרשמה, איפוס, שינוי סיסמה. על **אימות** לעולם לא.
 */

test('סיסמה חלשה עוברת בכניסה · זה הבאג שנעל את שקד בחוץ', () => {
  /* בדיוק הצורות שהיו נדחות: בלי גדולה, בלי ספרה, קצרה */
  for (const password of ['changeme', 'shaked', 'abc', '1', 'סיסמה']) {
    assert.ok(
      loginBody.safeParse({ who: '0522884992', password }).success,
      `סיסמה חלשה נדחתה בכניסה: ${password}`,
    );
  }
});

test('שדה ריק נדחה · אין טעם לפנות למסד בלי סיסמה', () => {
  assert.equal(loginBody.safeParse({ who: '0522884992', password: '' }).success, false);
  assert.equal(loginBody.safeParse({ who: '0522884992' }).success, false);
});

test('מזהה קצר מדי נדחה', () => {
  assert.equal(loginBody.safeParse({ who: '05', password: 'changeme' }).success, false);
});

test('שני המזהים מתקבלים · טלפון ואימייל', () => {
  assert.ok(loginBody.safeParse({ who: '0525056708', password: 'changeme' }).success);
  assert.ok(loginBody.safeParse({ who: 'shaked@example.com', password: 'changeme' }).success);
});

/**
 * ⚠ **הסיסמה עוברת כמות שהיא** · כל חיתוך או נרמול כאן היה שובר
 * חשבון קיים שסיסמתו מתחילה או נגמרת ברווח — ה-hash נבנה מהמחרוזת
 * המקורית, ולכן מחרוזת ״מנוקה״ לא תתאים לו לעולם.
 */
test('הסיסמה אינה מנורמלת · רווחים נשמרים', () => {
  const password = '  two words  ';
  const parsed = loginBody.parse({ who: '0522884992', password });
  assert.equal(parsed.password, password);
});

/**
 * שמירה על החלוקה בקובץ המסלולים עצמו · אותה שיטה כמו
 * `admin/apiMethods.test.ts`, שסורק מקור כדי לתפוס מה שבדיקת
 * יחידה לא רואה. בלי זה אפשר להחזיר את `strongPassword` ל-
 * `/login` ושום בדיקה לא תצעק.
 */
const ROUTES = new URL('../routes/auth.ts', import.meta.url).pathname;

/** גוף ההנדלר של מסלול · מתחילתו ועד תחילת המסלול הבא */
function handlerOf(src: string, path: string): string {
  const open = src.indexOf(`authRouter.post('${path}'`);
  assert.notEqual(open, -1, `לא נמצא מסלול ${path}`);
  const next = src.indexOf('authRouter.post(', open + 1);
  return src.slice(open, next === -1 ? src.length : next);
}

test('הכניסה אינה משתמשת בכלל הסיסמה החזקה', () => {
  const src = readFileSync(ROUTES, 'utf8');
  const login = handlerOf(src, '/login');
  assert.ok(!login.includes('strongPassword'), '`/login` חזר לבדוק חוזק סיסמה');
  assert.ok(!login.includes('whoBody'), '`/login` חזר לרשת את סכמת ההרשמה');
  assert.ok(login.includes('loginBody.parse'), '`/login` כבר לא משתמש ב-`loginBody`');
});

test('יצירת סיסמה כן בודקת חוזק · בכל שלושת המקומות', () => {
  const src = readFileSync(ROUTES, 'utf8');
  /* הרשמה · דרך `whoBody`, שם `password: strongPassword` */
  assert.ok(/password:\s*strongPassword/.test(src), 'סכמת ההרשמה הפסיקה לדרוש סיסמה חזקה');
  assert.ok(
    handlerOf(src, '/change-password').includes('strongPassword'),
    '/change-password הפסיק לדרוש סיסמה חזקה',
  );
  /**
   * האיפוס עבר ל-`readResetBody` · שם הסיסמה החלשה חוזרת
   * כ-`weak_password` עם הנוסח של ההרשמה, ולא כ-`invalid_body` שקט.
   */
  assert.ok(handlerOf(src, '/reset-password').includes('readResetBody'), 'האיפוס לא בודק את הסיסמה');
  const resetSrc = readFileSync(new URL('./resetBody.ts', import.meta.url), 'utf8');
  assert.ok(resetSrc.includes('isStrongPassword'), 'בדיקת האיפוס הפסיקה לדרוש סיסמה חזקה');
});
