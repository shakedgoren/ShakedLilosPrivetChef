import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quoteCustomer, quoteAdminDraft } from './quote.ts';

test('couscous · 2 צמחוני + 1 עוף', () => {
  const q = quoteCustomer({ category: 'cous', qty: [2, 1, 0, 0, 0, 0] });
  assert.equal(q.itemsTotal, 2 * 45 + 55);
  assert.equal(q.meals, 3);
  assert.equal(q.shippingFee, 0);
  assert.equal(q.total, 145);
});

test('schnitzel · חלה דקה + קוקוט', () => {
  const q = quoteCustomer({
    category: 'schn',
    mode: 'unit',
    rolls: [{ type: 0, tops: ['טחינה'] }],
    box: null,
    cocottes: [0, 1, 0],
  });
  assert.equal(q.total, 50 + 3);
});

test('fruit · מגש מרובע', () => {
  const q = quoteCustomer({ category: 'fruit', qty: [1, 0, 0, 0] });
  assert.equal(q.total, 300);
});

test('box · חלה בודדת במארז החופשי', () => {
  const q = quoteCustomer({
    category: 'box',
    key: 'free',
    picks: { coats: { שומשום: 1 }, salads: {} },
  });
  assert.equal(q.total, 25);
});

test('admin couscous · משלוח יבנה גובה דמי משלוח', () => {
  const q = quoteAdminDraft({
    category: 'cous',
    qty: { veg: 4 },
    rolls: [],
    ship: 'deliv',
    area: 'יבנה',
    address: 'הרצל 14',
    time: '13:00',
    applyShipping: true,
  });
  assert.equal(q.itemsTotal, 180);
  assert.equal(q.shippingFee, 20);
  assert.equal(q.total, 200);
});
