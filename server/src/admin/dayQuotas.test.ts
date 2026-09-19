import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayQuotas } from './dayQuotas.ts';

const dishes = [
  { id: 'cus-chicken', q: 40 },
  { id: 'cus-veg', q: 25 },
] as const;

test('מכסה שהוזנה ביום המכירה גוברת על ברירת המחדל', () => {
  assert.deepEqual(dayQuotas(dishes, { 'cus-chicken': 12 }), {
    'cus-chicken': 12,
    'cus-veg': 25,
  });
});

test('בלי שום מכסה שמורה · נשארת המכסה של יום המכירה', () => {
  assert.deepEqual(dayQuotas(dishes, {}), { 'cus-chicken': 40, 'cus-veg': 25 });
});

test('אפס שהוזן במפורש נשמר · הוא אינו ״חסר״', () => {
  assert.deepEqual(dayQuotas(dishes, { 'cus-chicken': 0 }), {
    'cus-chicken': 0,
    'cus-veg': 25,
  });
});

test('מנה שאינה בקטגוריה אינה נכנסת לתשובה', () => {
  assert.deepEqual(dayQuotas(dishes, { 'schnitzel-thin': 99 }), {
    'cus-chicken': 40,
    'cus-veg': 25,
  });
});

test('בלי מנות · אובייקט ריק ולא נפילה', () => {
  assert.deepEqual(dayQuotas([], { a: 1 }), {});
});
