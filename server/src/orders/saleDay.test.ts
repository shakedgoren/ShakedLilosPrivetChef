import assert from 'node:assert/strict';
import { test } from 'node:test';
import { qtyOfCustomerDetails } from '../admin/sold.ts';
import { evaluateCustomerSaleDay, isIsoDate } from './saleDay.ts';

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
      box: null,
      cocottes: [0, 0, 0],
    }),
    { thin: 2, temp: 1 },
  );
  assert.deepEqual(
    qtyOfCustomerDetails({
      category: 'schn',
      mode: 'box',
      rolls: [],
      box: { type: 1, tops: [] },
      cocottes: [0, 0, 0],
    }),
    { boxTemp: 1 },
  );
});
