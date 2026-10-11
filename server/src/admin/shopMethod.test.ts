import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { readCloseMethod } from './shopMethod.ts';
import { EXPENSE_METHODS } from '../../../mobile/src/data/adminMoney.ts';

/**
 * ⚠ **למה זה נבדק · 11 באוקטובר 2026** · סגירת רשימת קניות היא
 * מה שיוצר את רשומות ההוצאה של הקנייה. עד היום הן נולדו תמיד
 * בלי אמצעי תשלום, ולכן המעקב שביקשה ב-23 בספטמבר עבד רק על
 * הוצאות שהוקלדו ביד.
 */

test('שלוש האפשרויות · בדיוק אלה של מסך ההוצאות', () => {
  assert.deepEqual([...EXPENSE_METHODS], ['מזומן', 'אשראי', 'העברה']);
  for (const m of EXPENSE_METHODS) assert.equal(readCloseMethod({ method: m }), m);
});

test('לא חובה · ריק, חסר, או בלי גוף בכלל', () => {
  assert.equal(readCloseMethod({ method: '' }), '');
  assert.equal(readCloseMethod({}), '');
  assert.equal(readCloseMethod(undefined), '');
  assert.equal(readCloseMethod(null), '');
});

test('אמצעי שאינו ברשימה · נדחה ולא נשמר בשקט', () => {
  for (const bad of ['ביט', 'צ׳ק', 'cash', 1, true]) {
    assert.throws(() => readCloseMethod({ method: bad }), `עבר: ${String(bad)}`);
  }
});

test('הנתיב באמת כותב את האמצעי לרשומת ההוצאה', () => {
  const src = readFileSync(new URL('../routes/adminShop.ts', import.meta.url).pathname, 'utf8');
  assert.match(src, /readCloseMethod/, 'הנתיב אינו קורא את אמצעי התשלום');
  /* ⚠ בלי זה ההוצאה נוצרת בלי `method` וכל התיקון חסר משמעות */
  const create = src.slice(src.indexOf('prisma.expense.create'));
  assert.match(create.slice(0, 400), /\bmethod,/, 'ההוצאה נוצרת בלי אמצעי תשלום');
});

test('הלקוחה שולחת את האמצעי בגוף הבקשה', () => {
  const src = readFileSync(
    new URL('../../../mobile/src/api/admin.ts', import.meta.url).pathname,
    'utf8',
  );
  const fn = src.slice(src.indexOf('export const adminCloseShop'));
  assert.match(fn.slice(0, 300), /method: string/, 'adminCloseShop אינו מקבל אמצעי תשלום');
  assert.match(fn.slice(0, 300), /body,/, 'adminCloseShop אינו שולח גוף');
});
