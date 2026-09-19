import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newResetCode, RESET_CODE_TTL_MS, checkResetCode } from './resetCode.ts';

const row = (over: Partial<Parameters<typeof checkResetCode>[0]> = {}) => ({
  token: '123456',
  expiresAt: new Date(1_000_000 + RESET_CODE_TTL_MS),
  attempts: 0,
  usedAt: null as Date | null,
  ...over,
});
const NOW = 1_000_000;

test('הקוד הוא שש ספרות, ולא מתחיל באפס', () => {
  for (let i = 0; i < 200; i += 1) {
    const c = newResetCode();
    assert.match(c, /^[1-9][0-9]{5}$/);
  }
});

test('קוד נכון · עובר', () => {
  assert.equal(checkResetCode(row(), '123456', NOW), 'ok');
});

test('רווחים מסביב לקוד נגזרים', () => {
  assert.equal(checkResetCode(row(), ' 123456 ', NOW), 'ok');
});

test('קוד שגוי · נדחה', () => {
  assert.equal(checkResetCode(row(), '999999', NOW), 'wrong');
});

test('אין שורה בכלל · אותה תשובה כמו קוד שנוצל', () => {
  assert.equal(checkResetCode(null, '123456', NOW), 'none');
  assert.equal(checkResetCode(row({ usedAt: new Date(NOW) }), '123456', NOW), 'none');
});

test('חמישה ניסיונות שנכשלו · ננעל', () => {
  assert.equal(checkResetCode(row({ attempts: 5 }), '123456', NOW), 'locked');
});

test('הנעילה גוברת על קוד נכון · אחרת אפשר לסרוק', () => {
  assert.equal(checkResetCode(row({ attempts: 9 }), '123456', NOW), 'locked');
});

test('פג תוקף · נדחה עוד לפני ההשוואה', () => {
  const past = row({ expiresAt: new Date(NOW - 1) });
  assert.equal(checkResetCode(past, '123456', NOW), 'expired');
  assert.equal(checkResetCode(past, '000000', NOW), 'expired');
});
