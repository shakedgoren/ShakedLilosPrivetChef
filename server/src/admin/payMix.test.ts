import { test } from 'node:test';
import assert from 'node:assert/strict';
import { payMix, payMixTotal, PAY_UNSET } from './payMix.ts';

const o = (pay: string, total: number) => ({ pay, total });

test('הדוגמה של שקד · 10,000 מתפצלים לשלושה אמצעים', () => {
  const mix = payMix([
    o('ביט', 1500),
    o('ביט', 1000),
    o('פייבוקס', 2500),
    o('מזומן', 3000),
    o('מזומן', 2000),
  ]);
  assert.deepEqual(mix, [
    { pay: 'ביט', amount: 2500 },
    { pay: 'פייבוקס', amount: 2500 },
    { pay: 'מזומן', amount: 5000 },
  ]);
  assert.equal(payMixTotal(mix), 10_000);
});

test('הפיצול תמיד שווה לסכום ההכנסה', () => {
  const orders = [o('ביט', 120), o('מזומן', 45), o('', 300), o('פייבוקס', 35)];
  const total = orders.reduce((t, x) => t + x.total, 0);
  assert.equal(payMixTotal(payMix(orders)), total);
});

test('אמצעי שלא נעשה בו שימוש אינו מופיע · בלי אפסים', () => {
  const mix = payMix([o('מזומן', 200)]);
  assert.deepEqual(mix, [{ pay: 'מזומן', amount: 200 }]);
});

test('הזמנה בלי אמצעי תשלום נספרת בנפרד ולא נעלמת', () => {
  const mix = payMix([o('ביט', 100), o('', 400)]);
  assert.deepEqual(mix, [
    { pay: 'ביט', amount: 100 },
    { pay: PAY_UNSET, amount: 400 },
  ]);
});

test('רווחים בלבד נחשבים כלא צוין', () => {
  assert.deepEqual(payMix([o('   ', 50)]), [{ pay: PAY_UNSET, amount: 50 }]);
});

test('״לא צוין״ תמיד אחרון', () => {
  const mix = payMix([o('', 10), o('מזומן', 10), o('ביט', 10)]);
  assert.equal(mix[mix.length - 1]?.pay, PAY_UNSET);
});

test('הסדר קבוע ואינו תלוי בסדר ההזמנות', () => {
  const a = payMix([o('מזומן', 1), o('ביט', 1), o('פייבוקס', 1)]);
  const b = payMix([o('פייבוקס', 1), o('מזומן', 1), o('ביט', 1)]);
  assert.deepEqual(a, b);
});

test('בלי הזמנות · רשימה ריקה, לא קריסה', () => {
  assert.deepEqual(payMix([]), []);
  assert.equal(payMixTotal([]), 0);
});

test('אמצעי לא מוכר לא נבלע בשקט', () => {
  const mix = payMix([o('ביט', 10), o('צ׳ק', 90)]);
  assert.equal(payMixTotal(mix), 100);
  assert.ok(mix.some((m) => m.pay === 'צ׳ק'));
});
