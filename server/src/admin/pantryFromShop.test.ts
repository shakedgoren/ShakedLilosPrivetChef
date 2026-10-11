import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pantryFromShop, unitPriceOf } from './pantryFromShop.ts';

/**
 * ⚠ **מה הבדיקות האלה שומרות · 11 באוקטובר 2026** · הייבוא לעלויות
 * מזין מחיר ישירות לתוך מתכון, ושם הוא מוכפל בכמות. מחיר לשורה
 * במקום מחיר ליחידה מנפח עלות מנה פי עשרות בשקט, ואין מי שיתפוס
 * את זה בעין.
 */

test('מחיר ליחידה · הסכום בפועל מחולק בכמות', () => {
  /* ‎12 ק״ג ירך עוף, ‎40 ₪ לק״ג, שולם 480 */
  assert.equal(unitPriceOf({ name: 'ירך עוף', qty: '12', price: '40', actual: '480' }), 40);
  /* שולם פחות ממה שהוערך · המחיר האמיתי הוא ששולם */
  assert.equal(unitPriceOf({ name: 'ירך עוף', qty: '12', price: '40', actual: '420' }), 35);
});

test('בלי סכום בפועל · המחיר המוערך ליחידה', () => {
  assert.equal(unitPriceOf({ name: 'בצל', qty: '5', price: '6' }), 6);
  assert.equal(unitPriceOf({ name: 'בצל', qty: '5', price: '6', actual: '   ' }), 6);
});

test('כמות אפס · לא מחלקים באפס', () => {
  assert.equal(unitPriceOf({ name: 'x', qty: '0', price: '7', actual: '70' }), 7);
  assert.equal(unitPriceOf({ name: 'x', qty: '', price: '7', actual: '70' }), 7);
});

const closed = (iso: string) => new Date(iso);

test('רק מה שנסמן כנקנה · כוונה אינה קנייה', () => {
  const out = pantryFromShop([
    {
      closedAt: closed('2026-10-01T10:00:00Z'),
      items: [
        { name: 'בצל', qty: '5', price: '6', done: true },
        { name: 'גזר', qty: '4', price: '6', done: false },
      ],
    },
  ]);
  assert.deepEqual(out.map((x) => x.name), ['בצל']);
});

test('אותו שם בשתי קניות · המחיר החדש גובר', () => {
  const out = pantryFromShop([
    {
      closedAt: closed('2026-10-08T10:00:00Z'),
      items: [{ name: 'קוסקוס', qty: '10', price: '18', done: true }],
    },
    {
      closedAt: closed('2026-09-01T10:00:00Z'),
      items: [{ name: 'קוסקוס', qty: '10', price: '16', done: true }],
    },
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0]?.price, 18);
  assert.equal(out[0]?.at, '2026-10-08T10:00:00.000Z');
});

test('רשימה פתוחה · חדשה מכולן, ובלי תאריך', () => {
  const out = pantryFromShop([
    {
      closedAt: closed('2026-10-08T10:00:00Z'),
      items: [{ name: 'חמאה', qty: '2', price: '45', done: true }],
    },
    { closedAt: null, items: [{ name: 'חמאה', qty: '2', price: '49', done: true }] },
  ]);
  assert.equal(out[0]?.price, 49);
  assert.equal(out[0]?.at, '');
});

test('בלי שם או בלי מחיר · לא נכנס', () => {
  const out = pantryFromShop([
    {
      closedAt: null,
      items: [
        { name: '   ', qty: '1', price: '9', done: true },
        { name: 'מלח', qty: '1', price: '0', done: true },
        { name: 'פלפל', qty: '1', done: true },
      ],
    },
  ]);
  assert.deepEqual(out, []);
});

test('מסודר לפי קבוצה ואז שם · כמו שקונים', () => {
  const out = pantryFromShop([
    {
      closedAt: null,
      items: [
        { name: 'עגבניות', g: 'ירקות ופירות', qty: '1', price: '9', done: true },
        { name: 'מגשי אלומיניום', g: 'אריזות', qty: '1', price: '90', done: true },
        { name: 'בצל', g: 'ירקות ופירות', qty: '1', price: '6', done: true },
      ],
    },
  ]);
  assert.deepEqual(out.map((x) => x.name), ['מגשי אלומיניום', 'בצל', 'עגבניות']);
});

test('אגורות · מחיר ליחידה מעוגל לשתי ספרות', () => {
  const out = pantryFromShop([
    { closedAt: null, items: [{ name: 'יוגורט', qty: '3', price: '0', actual: '10', done: true }] },
  ]);
  assert.equal(out[0]?.price, 3.33);
});
