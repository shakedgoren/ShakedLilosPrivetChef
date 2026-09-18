import assert from 'node:assert/strict';
import { test } from 'node:test';
import { qtyOfCustomerDetails } from '../admin/sold.ts';
import { evaluateCustomerSaleDay, isIsoDate, soldOutDishes } from './saleDay.ts';

const openCous = {
  date: '2026-09-15',
  blocked: false,
  sale: 'cous',
  exceptCat: '',
  open: true,
  quotas: { veg: 5, chick: 3 },
  waste: { veg: 1 },
  sold: { veg: 3, chick: 3 },
};

test('ISO date', () => {
  assert.equal(isIsoDate('2026-09-15'), true);
  assert.equal(isIsoDate('שלישי · 25 באוגוסט'), false);
});

test('יום סגור / חסום / קטגוריה', () => {
  assert.equal(
    evaluateCustomerSaleDay({
      rec: { ...openCous, open: false },
      category: 'cous',
      requested: { veg: 1 },
      today: '2026-09-09',
    })?.code,
    'day_closed',
  );
  assert.equal(
    evaluateCustomerSaleDay({
      rec: { ...openCous, blocked: true, exceptCat: '' },
      category: 'cous',
      requested: { veg: 1 },
      today: '2026-09-09',
    })?.code,
    'day_blocked',
  );
  assert.equal(
    evaluateCustomerSaleDay({
      rec: openCous,
      category: 'schn',
      requested: { thin: 1 },
      today: '2026-09-09',
    })?.code,
    'category_closed',
  );
  assert.equal(
    evaluateCustomerSaleDay({
      rec: null,
      category: 'cous',
      requested: { veg: 1 },
      today: '2026-09-09',
    })?.code,
    'day_closed',
  );
});

test('שף ביום קוסקוס פתוח מותר, ביום חסום לא', () => {
  assert.equal(
    evaluateCustomerSaleDay({
      rec: openCous,
      category: 'chef',
      requested: {},
      today: '2026-09-09',
    }),
    null,
  );
  assert.equal(
    evaluateCustomerSaleDay({
      rec: { ...openCous, blocked: true, exceptCat: 'fruit', open: true },
      category: 'chef',
      requested: {},
      today: '2026-09-09',
    })?.code,
    'day_blocked',
  );
});

test('מכסה כוללת מכירות ומנות שירדו', () => {
  const over = evaluateCustomerSaleDay({
    rec: openCous,
    category: 'cous',
    requested: { veg: 2 },
    today: '2026-09-09',
  });
  assert.equal(over?.code, 'quota_exceeded');
  assert.equal(over?.dishId, 'veg');

  const ok = evaluateCustomerSaleDay({
    rec: openCous,
    category: 'cous',
    requested: { veg: 1 },
    today: '2026-09-09',
  });
  assert.equal(ok, null);

  const chick = evaluateCustomerSaleDay({
    rec: openCous,
    category: 'cous',
    requested: { chick: 1 },
    today: '2026-09-09',
  });
  assert.equal(chick?.code, 'quota_exceeded');
});

test('יום שעבר נסגר לקוסקוס/שניצל', () => {
  assert.equal(
    evaluateCustomerSaleDay({
      rec: { ...openCous, date: '2026-09-01' },
      category: 'cous',
      requested: { veg: 1 },
      today: '2026-09-09',
    })?.code,
    'day_closed',
  );
});

test('qty של לקוחה · קוסקוס ושניצל', () => {
  assert.deepEqual(qtyOfCustomerDetails({ category: 'cous', qty: [2, 1, 0, 0, 0, 0] }), {
    veg: 2,
    chick: 1,
  });
  assert.deepEqual(
    qtyOfCustomerDetails({
      category: 'schn',
      mode: 'unit',
      rolls: [
        { type: 0, tops: [] },
        { type: 0, tops: [] },
        { type: 1, tops: [] },
      ],
      boxes: [],
      cocottes: [0, 0, 0],
    }),
    { thin: 2, temp: 1 },
  );
  assert.deepEqual(
    qtyOfCustomerDetails({
      category: 'schn',
      mode: 'box',
      rolls: [],
      boxes: [{ type: 1, tops: [] }],
      cocottes: [0, 0, 0],
    }),
    { boxTemp: 1 },
  );
});

/**
 * ⚠ **המנות שאזלו · 18 בספטמבר 2026** · הבדיקה שומרת על שני דברים
 * ששקד ביקשה במפורש: שהחסימה תתפוס, ושהתשובה **לא תסגיר מספרים**.
 */
test('מנות שאזלו · מזהים בלבד', () => {
  /* veg: מכסה 5, נמכרו 3 ועוד 1 פסולת = 4 · עוד אחת פנויה */
  assert.deepEqual(soldOutDishes(openCous, 'cous'), ['chick']);

  /* הפסולת נספרת · עוד פסולת אחת סוגרת גם את veg */
  assert.deepEqual(
    soldOutDishes({ ...openCous, waste: { veg: 2 } }, 'cous').sort(),
    ['chick', 'veg'],
  );

  /* חריגה מעבר למכסה נשארת ״אזל״ ולא הופכת למשהו אחר */
  assert.deepEqual(soldOutDishes({ ...openCous, sold: { chick: 99 } }, 'cous'), ['chick']);

  /* בלי רשומת יום אין מה לחסום */
  assert.deepEqual(soldOutDishes(null, 'cous'), []);

  /* ⚠ מזהים בלבד · אין בתשובה שום מספר */
  for (const id of soldOutDishes(openCous, 'cous')) assert.equal(typeof id, 'string');
});
