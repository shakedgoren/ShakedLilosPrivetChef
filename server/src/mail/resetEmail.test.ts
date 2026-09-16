import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildResetEmail, resetLink, ttlLabel, RESET_TTL_MINUTES } from './resetEmail.ts';

/**
 * מייל איפוס הסיסמה · החלטה של שקד (16 בספטמבר 2026):
 * ״שיישלח קישור לאיפוס למייל״.
 */

const TOKEN = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6';

test('הקישור מפנה למסך האיפוס ונושא את האסימון', () => {
  const link = resetLink('https://bite.example', TOKEN);
  const url = new URL(link);
  assert.equal(url.searchParams.get('screen'), 'reset');
  assert.equal(url.searchParams.get('token'), TOKEN);
});

test('לוכסן מיותר בכתובת הבסיס אינו יוצר // בקישור', () => {
  const link = resetLink('https://bite.example/', TOKEN);
  assert.ok(!link.includes('example//'), link);
  assert.equal(new URL(link).searchParams.get('token'), TOKEN);
});

test('אסימון עם תווים מיוחדים מקודד ונפתח בחזרה זהה', () => {
  const odd = 'ab+cd/ef=gh&ij';
  const link = resetLink('https://bite.example', odd);
  assert.equal(new URL(link).searchParams.get('token'), odd);
});

test('הנושא בעברית, מזכיר איפוס, ואינו נושא את האסימון', () => {
  const mail = buildResetEmail({ name: 'שקד', token: TOKEN, appUrl: 'https://bite.example' });
  assert.match(mail.subject, /איפוס/);
  assert.ok(!mail.subject.includes(TOKEN), 'האסימון דלף לשורת הנושא');
});

test('גוף הטקסט נושא את הקישור ואת משך התוקף', () => {
  const mail = buildResetEmail({ name: 'שקד', token: TOKEN, appUrl: 'https://bite.example' });
  assert.ok(mail.text.includes(mail.link), 'הקישור חסר בגוף הטקסט');
  assert.ok(mail.text.includes(ttlLabel()), `משך התוקף (${ttlLabel()}) חסר בגוף`);
});

test('גוף ה-HTML הוא RTL והקישור מופיע בו כ-href', () => {
  const mail = buildResetEmail({ name: 'שקד', token: TOKEN, appUrl: 'https://bite.example' });
  assert.match(mail.html, /dir="rtl"/);
  assert.ok(mail.html.includes(`href="${mail.link}"`), 'הקישור אינו href תקין');
});

test('פנייה בשם כשיש שם, ובלי שם כשאין · בלי ״שלום undefined״', () => {
  const withName = buildResetEmail({ name: 'שקד', token: TOKEN, appUrl: 'https://bite.example' });
  assert.match(withName.text, /שקד/);
  const noName = buildResetEmail({ name: '', token: TOKEN, appUrl: 'https://bite.example' });
  assert.ok(!noName.text.includes('undefined'), noName.text);
  assert.ok(!noName.text.includes('null'), noName.text);
});

test('שם עם תווי HTML אינו נשבר לתוך ה-HTML', () => {
  const mail = buildResetEmail({ name: '<script>x</script>', token: TOKEN, appUrl: 'https://bite.example' });
  assert.ok(!mail.html.includes('<script>'), 'שם לא עבר בריחה ונכנס כתגית');
});

test('תוקף הקישור הוא עשר דקות · ההחלטה של שקד', () => {
  assert.equal(RESET_TTL_MINUTES, 10);
  assert.equal(ttlLabel(), '10 דקות');
  const mail = buildResetEmail({ name: 'שקד', token: TOKEN, appUrl: 'https://bite.example' });
  assert.match(mail.text, /10 דקות/);
  assert.match(mail.html, /10 דקות/);
});

test('תוקף האיפוס במסד זהה למה שהמייל מבטיח · מקור אמת אחד', async () => {
  const { RESET_TTL_MS } = await import('../whatsapp/otp.ts');
  assert.equal(RESET_TTL_MS, RESET_TTL_MINUTES * 60 * 1000);
});
