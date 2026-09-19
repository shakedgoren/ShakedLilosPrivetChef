import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildResetEmail, ttlLabel, RESET_TTL_MINUTES } from './resetEmail.ts';
import { RESET_CODE_TTL_MS } from '../auth/resetCode.ts';

/**
 * מייל איפוס הסיסמה · החלטה של שקד (19 בספטמבר 2026): קוד בן שש
 * ספרות במייל, בלי שום קישור. ראו `auth/resetCode.ts`.
 */
const CODE = '481902';

test('הנושא בעברית, מזכיר איפוס, ואינו נושא את הקוד', () => {
  const mail = buildResetEmail({ name: 'שקד', code: CODE });
  assert.match(mail.subject, /איפוס/);
  assert.ok(!mail.subject.includes(CODE), 'הקוד דלף לשורת הנושא');
});

test('הקוד מופיע בגוף הטקסט וגם ב-HTML', () => {
  const mail = buildResetEmail({ name: 'שקד', code: CODE });
  assert.ok(mail.text.includes(CODE), 'הקוד חסר בגוף הטקסט');
  assert.ok(mail.html.includes(CODE), 'הקוד חסר בגוף ה-HTML');
});

test('אין שום קישור בהודעה · זה מה שהוציא אותה מהספאם', () => {
  const mail = buildResetEmail({ name: 'שקד', code: CODE });
  assert.ok(!mail.html.includes('href='), 'נשאר קישור ב-HTML');
  assert.ok(!/https?:\/\//.test(mail.text), 'נשארה כתובת בגוף הטקסט');
  assert.ok(!/https?:\/\//.test(mail.html), 'נשארה כתובת ב-HTML');
});

test('משך התוקף מופיע בשני הגופים', () => {
  const mail = buildResetEmail({ name: 'שקד', code: CODE });
  assert.ok(mail.text.includes(ttlLabel()), `משך התוקף (${ttlLabel()}) חסר בגוף`);
  assert.ok(mail.html.includes(ttlLabel()), 'משך התוקף חסר ב-HTML');
});

test('גוף ה-HTML הוא RTL', () => {
  assert.match(buildResetEmail({ name: 'שקד', code: CODE }).html, /dir="rtl"/);
});

test('פנייה בשם כשיש שם, ובלי שם כשאין · בלי ״שלום undefined״', () => {
  const withName = buildResetEmail({ name: 'שקד', code: CODE });
  assert.match(withName.text, /שקד/);
  const noName = buildResetEmail({ name: '', code: CODE });
  assert.ok(!noName.text.includes('undefined'), noName.text);
  assert.ok(!noName.text.includes('null'), noName.text);
});

test('שם עם תווי HTML אינו נשבר לתוך ה-HTML', () => {
  const mail = buildResetEmail({ name: '<script>x</script>', code: CODE });
  assert.ok(!mail.html.includes('<script>'), 'שם לא עבר בריחה ונכנס כתגית');
});

test('תוקף הקוד הוא עשר דקות · ההחלטה של שקד, ממקור אחד', () => {
  assert.equal(RESET_TTL_MINUTES, 10);
  assert.equal(ttlLabel(), '10 דקות');
  assert.equal(RESET_CODE_TTL_MS, 10 * 60 * 1000);
});
