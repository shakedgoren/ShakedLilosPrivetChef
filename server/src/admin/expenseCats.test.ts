import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXPENSE_CATS, expenseCatOfGroup, splitByExpenseCat } from './expenseCats.ts';

const row = (g: string, qty: string, price: string, actual = '', done = true) => ({ g, qty, price, actual, done });

test('קבוצת האריזות נרשמת ל״אריזות וכלים״ והשאר לחומרי גלם', () => {
  assert.equal(expenseCatOfGroup('אריזות'), 'אריזות וכלים');
  assert.equal(expenseCatOfGroup('ירקות ופירות'), 'חומרי גלם');
  assert.equal(expenseCatOfGroup('בשר עוף ודגים'), 'חומרי גלם');
  assert.equal(expenseCatOfGroup('משהו חדש'), 'חומרי גלם');
});

test('כל קטגוריה שנגזרת מקבוצה קיימת ברשימת ההוצאות של מסך הכספים', () => {
  for (const g of ['אריזות', 'ירקות ופירות', 'יבשים', 'חלב וגבינות', 'בשר עוף ודגים']) {
    assert.ok(EXPENSE_CATS.includes(expenseCatOfGroup(g)), `${g} → קטגוריה שאינה במסך`);
  }
});

test('סגירת קנייה מפצלת לשתי קטגוריות', () => {
  const split = splitByExpenseCat([
    row('ירקות ופירות', '3', '12'),
    row('בשר עוף ודגים', '2', '40'),
    row('אריזות', '5', '7'),
  ]);
  assert.deepEqual(split, { 'חומרי גלם': 116, 'אריזות וכלים': 35 });
});

test('הסכום בפועל גובר על כמות × מחיר, ופריט לא מסומן אינו נספר', () => {
  const split = splitByExpenseCat([
    row('יבשים', '2', '50', '79'),
    row('יבשים', '1', '30', '', false),
  ]);
  assert.deepEqual(split, { 'חומרי גלם': 79 });
});
