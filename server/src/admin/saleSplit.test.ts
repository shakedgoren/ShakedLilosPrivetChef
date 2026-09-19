import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SPLIT_CATS, splitByDish } from './saleSplit.ts';
import type { DishView } from './costsMath.ts';

const dish = (id: string, c: string, name: string, price: number, parts: DishView['parts'] = []): DishView => ({
  id,
  c,
  sub: '',
  name,
  mode: 'unit',
  price,
  yld: 0,
  note: '',
  from: [],
  parts,
});

const MENU: DishView[] = [
  dish('cousVeg', 'cous', 'קוסקוס צמחוני', 60, [{ n: 'ירקות', price: 12, qty: 1 }]),
  dish('cousChick', 'cous', 'קוסקוס עם עוף', 80, [{ n: 'קוסקוס ירקות', price: 0, qty: 1, ref: 'cousVeg' }]),
  dish('schThin', 'schn', 'חלת שניצל דק', 45, [{ n: 'עוף', price: 8, qty: 1 }]),
  dish('boxSalad', 'box', 'סלט', 30),
];

test('הפילוח מחזיר את שתי הקטגוריות שהכפתור מחליף ביניהן, בלי ספיישל ושף', () => {
  const split = splitByDish(MENU, {});
  assert.deepEqual(
    split.map((c) => c.id),
    SPLIT_CATS.map((c) => c.id),
  );
  assert.deepEqual(
    split.flatMap((c) => c.rows.map((r) => r.id)),
    ['cousVeg', 'cousChick', 'schThin'],
  );
});

test('הכנסה היא מחיר המנה כפול הכמות, והוצאה היא עלות הייצור כפול הכמות', () => {
  const [cous] = splitByDish(MENU, { cousVeg: 3 });
  const veg = cous.rows.find((r) => r.id === 'cousVeg');
  assert.equal(veg?.sold, 3);
  assert.equal(veg?.revenue, 180);
  assert.equal(veg?.cost, 36);
});

test('שורת הרכבה מחלחלת · עלות מנת העוף כוללת את הקוסקוס הצמחוני שבתוכה', () => {
  const [cous] = splitByDish(MENU, { cousChick: 2 });
  const chick = cous.rows.find((r) => r.id === 'cousChick');
  assert.equal(chick?.cost, 24);
  assert.equal(chick?.revenue, 160);
});

test('מנה שלא נמכרה נשארת ברשימה עם אפסים', () => {
  const [, schn] = splitByDish(MENU, { cousVeg: 1 });
  assert.deepEqual(
    schn.rows.map((r) => [r.sold, r.revenue, r.cost]),
    [[0, 0, 0]],
  );
});

test('מסד ריק · שתי הקטגוריות חוזרות עם אפסים ולא נעלמות', () => {
  const split = splitByDish(MENU, {});
  assert.equal(split.length, 2);
  assert.ok(split.every((c) => c.rows.every((r) => r.revenue === 0 && r.cost === 0)));
});
