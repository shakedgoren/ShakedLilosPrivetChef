import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quoteCustomer, quoteAdminDraft, assertFulfillment } from './quote.ts';

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
    boxes: [],
    cocottes: [0, 1, 0],
  });
  assert.equal(q.total, 50 + 3);
});

test('schnitzel · שני מארזים באותה הזמנה מסתכמים יחד', () => {
  const q = quoteCustomer({
    category: 'schn',
    mode: 'box',
    rolls: [],
    boxes: [
      { type: 0, tops: ['טחינה'] },
      { type: 1, tops: ['עלי רוקט'] },
    ],
    cocottes: [0, 0, 0],
  });
  assert.equal(q.total, 200 + 250);
  assert.equal(q.lines.length, 2);
  assert.equal(q.lines[0].name, 'מארז 1 · שניצל דק');
  assert.equal(q.lines[1].name, 'מארז 2 · פילה עוף');
});

/** משלוח תקין לשניצל · רק מניין המנות משתנה בין המקרים */
const DELIV = { ship: 'deliv' as const, time: '12:00', city: 'יבנה', address: 'נופר 25', pay: 'מזומן' };

test('schnitzel · מארזים ובודדים נספרים יחד בהזמנה אחת', () => {
  const q = quoteCustomer({
    category: 'schn',
    mode: 'unit',
    rolls: [
      { type: 0, tops: [] },
      { type: 1, tops: [] },
    ],
    boxes: [{ type: 0, tops: [] }],
    cocottes: [0, 0, 0],
  });
  assert.equal(q.total, 50 + 60 + 200);
  assert.equal(q.lines.length, 3);
  assert.equal(q.lines[0].name, 'חלה 1 · שניצל דק');
  assert.equal(q.lines[2].name, 'מארז 1 · שניצל דק');
});

test('schnitzel · ארבע חלות בלי מארז לא פותחות משלוח', () => {
  const four = {
    category: 'schn' as const,
    mode: 'unit' as const,
    rolls: [0, 1, 0, 1].map((type) => ({ type, tops: [] })),
    boxes: [],
    cocottes: [0, 0, 0],
  };
  assert.equal(quoteCustomer(four).meals, 4);
  assert.throws(() => assertFulfillment('schn', quoteCustomer(four).meals, DELIV));
});

test('schnitzel · חמש חלות פותחות משלוח', () => {
  const five = {
    category: 'schn' as const,
    mode: 'unit' as const,
    rolls: [0, 1, 0, 1, 0].map((type) => ({ type, tops: [] })),
    boxes: [],
    cocottes: [0, 0, 0],
  };
  assert.equal(quoteCustomer(five).meals, 5);
  assert.doesNotThrow(() => assertFulfillment('schn', quoteCustomer(five).meals, DELIV));
});

test('schnitzel · מארז אחד לבדו פותח משלוח', () => {
  const one = {
    category: 'schn' as const,
    mode: 'box' as const,
    rolls: [],
    boxes: [{ type: 0, tops: [] }],
    cocottes: [0, 0, 0],
  };
  assert.equal(quoteCustomer(one).meals, 5);
  assert.doesNotThrow(() => assertFulfillment('schn', quoteCustomer(one).meals, DELIV));
});

test('schnitzel · מצב מארז בלי מארז נדחה', () => {
  assert.throws(() =>
    quoteCustomer({ category: 'schn', mode: 'box', rolls: [], boxes: [], cocottes: [0, 0, 0] }),
  );
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
