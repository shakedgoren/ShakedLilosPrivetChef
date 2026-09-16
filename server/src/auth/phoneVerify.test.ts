import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canSend,
  checkCode,
  MAX_ATTEMPTS,
  RESEND_COOLDOWN_MS,
  VERIFIED_WINDOW_MS,
  VERIFY_TTL_MS,
  verifiedRecently,
  type VerifyRow,
} from './phoneVerify.ts';

/**
 * אימות טלפון **לפני** שיש חשבון · הזרימה שקבעה שקד:
 * ״לפני שממלאים בכלל פרטים אנחנו רוצים לבדוק שהטלפון תקין״.
 */

const NOW = new Date('2026-09-16T10:00:00Z').getTime();
const row = (over: Partial<VerifyRow> = {}): VerifyRow => ({
  code: '492705',
  sentAt: new Date(NOW - 60_000),
  expiresAt: new Date(NOW + 30_000),
  attempts: 0,
  usedAt: null,
  verifiedAt: null,
  ...over,
});

test('תוקף הקוד הוא דקה אחת · ההחלטה של שקד', () => {
  assert.equal(VERIFY_TTL_MS, 60_000);
});

test('אפשר לשלוח כשאין עדיין קוד', () => {
  assert.deepEqual(canSend(null, NOW), { ok: true });
});

test('שליחה חוזרת מיד נחסמת · ומחזירה כמה להמתין', () => {
  const res = canSend(row({ sentAt: new Date(NOW - 5_000) }), NOW);
  assert.equal(res.ok, false);
  assert.ok(res.ok === false && res.waitMs > 0 && res.waitMs <= RESEND_COOLDOWN_MS);
});

test('אחרי ההמתנה אפשר לשלוח שוב', () => {
  assert.deepEqual(canSend(row({ sentAt: new Date(NOW - RESEND_COOLDOWN_MS - 1) }), NOW), { ok: true });
});

test('קוד נכון בתוך הזמן · תקין', () => {
  assert.equal(checkCode(row(), '492705', NOW), 'ok');
});

test('רווחים סביב הקוד אינם פוסלים אותו', () => {
  assert.equal(checkCode(row(), '  492705 ', NOW), 'ok');
});

test('קוד שגוי · נדחה', () => {
  assert.equal(checkCode(row(), '000000', NOW), 'wrong');
});

test('אין בקשה קודמת · אין מה לאמת', () => {
  assert.equal(checkCode(null, '492705', NOW), 'none');
});

test('קוד שפג תוקפו נדחה גם אם הוא הנכון', () => {
  assert.equal(checkCode(row({ expiresAt: new Date(NOW - 1) }), '492705', NOW), 'expired');
});

test('אחרי חמישה ניסיונות הקוד ננעל · גם לקוד הנכון', () => {
  const locked = row({ attempts: MAX_ATTEMPTS });
  assert.equal(checkCode(locked, '492705', NOW), 'locked');
});

test('ניסיון אחד לפני הנעילה עדיין עובד', () => {
  assert.equal(checkCode(row({ attempts: MAX_ATTEMPTS - 1 }), '492705', NOW), 'ok');
});

test('קוד שכבר נוצל אינו תקף שוב', () => {
  assert.equal(checkCode(row({ usedAt: new Date(NOW - 1000) }), '492705', NOW), 'none');
});

test('אימות טרי מאפשר להשלים הרשמה', () => {
  assert.equal(verifiedRecently(row({ verifiedAt: new Date(NOW - 60_000) }), NOW), true);
});

test('אימות ישן פג · צריך לאמת שוב', () => {
  assert.equal(verifiedRecently(row({ verifiedAt: new Date(NOW - VERIFIED_WINDOW_MS - 1) }), NOW), false);
});

test('בלי אימות כלל · אי אפשר להירשם', () => {
  assert.equal(verifiedRecently(row(), NOW), false);
  assert.equal(verifiedRecently(null, NOW), false);
});
