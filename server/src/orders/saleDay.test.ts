import assert from 'node:assert/strict';
import { test } from 'node:test';
import { qtyOfCustomerDetails } from '../admin/sold.ts';
import {
  evaluateCustomerSaleDay,
  isIsoDate,
  remainingDishes,
  saleDayState,
  soldOutDishes,
} from './saleDay.ts';

const openCous = {
  date: '2026-09-15',
  blocked: false,
  sale: 'cous',
  exceptCat: '',
  open: true,
  opened: true,
  quotas: { veg: 5, chick: 3 },
  waste: { veg: 1 },
  sold: { veg: 3, chick: 3 },
  /* ⚠ נוספו ב-27.9.2026 · מתג המארזים וחסימת שעות המשלוח */
  boxOpen: false,
  blockedHours: [],
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

/**
 * ⚠ **הבאג שדווח ב-18 בספטמבר 2026** · ״המכירה של השניצל סגורה
 * אבל זה נותן להכניס הזמנות של שניצלים״. יום מכירה נשאר `open`
 * במסד גם אחרי שהמכירה נגמרה, ולכן השרת המשיך לקבל הזמנות.
 *
 * הגבול הוא **החלון** של שקד, לא שעון · ראו `saleWindow`.
 */
test('מכירה מחוץ לחלון אינה מקבלת הזמנות', () => {
  const day = { ...openCous, quotas: { veg: 50 }, sold: {}, waste: {} };

  /* בתוך החלון · פתוח */
  assert.equal(
    evaluateCustomerSaleDay({
      rec: day,
      category: 'cous',
      requested: { veg: 1 },
      today: '2026-09-15',
      windowDate: '2026-09-15',
    }),
    null,
  );

  /* החלון כבר על המכירה הבאה · היום הזה נסגר */
  assert.equal(
    evaluateCustomerSaleDay({
      rec: day,
      category: 'cous',
      requested: { veg: 1 },
      today: '2026-09-15',
      windowDate: '2026-09-22',
    })?.code,
    'day_closed',
  );
});

/** שלושת הכיתובים · ראו `SaleState` */
test('טרם נפתחה · החלה · נסגרה', () => {
  const base = { ...openCous, quotas: { veg: 50 }, sold: {}, waste: {} };
  const args = { category: 'cous', today: '2026-09-15', windowDate: '2026-09-15' };

  assert.equal(saleDayState({ ...args, rec: { ...base, open: true } }), 'open');
  /* נסגרה · `opened` מגיע מ-`openedAt` שנכתב בפתיחה הראשונה */
  assert.equal(
    saleDayState({ ...args, rec: { ...base, open: false, opened: true } }),
    'closed',
  );
  /* טרם נפתחה · מעולם לא נפתחה */
  assert.equal(
    saleDayState({ ...args, rec: { ...base, open: false, opened: false } }),
    'pending',
  );
});

/**
 * ⚠ **`remainingDishes` · נוסף ב-11 באוקטובר 2026** · שקד ביקשה
 * שכפתור הפלוס ייעצר במכסה ולא רק בשליחה. שתי הפונקציות חייבות
 * להסכים: מנה ש-`remainingDishes` מחזיר עליה 0 חייבת להופיע
 * ב-`soldOutDishes`, אחרת היא תיראה זמינה ותידחה בשליחה.
 */
test('כמה נשאר · מכסה פחות מה שנמכר ופחת', () => {
  /* veg: מכסה 5, נמכרו 3 ועוד 1 פסולת = 4 · נשארה אחת */
  const left = remainingDishes(openCous, 'cous');
  assert.equal(left.veg, 1);
  assert.equal(left.chick, 0);
});

test('חריגה מעבר למכסה · 0 ולא שלילי, ומוסכם עם soldOutDishes', () => {
  const over = { ...openCous, sold: { chick: 99 } };
  assert.equal(remainingDishes(over, 'cous').chick, 0, 'יתרה שלילית דלפה החוצה');
  assert.ok(soldOutDishes(over, 'cous').includes('chick'), 'שתי הפונקציות חלוקות');
});

test('כל מנה עם 0 נשאר · מופיעה גם ב-soldOutDishes', () => {
  const left = remainingDishes(openCous, 'cous');
  const zero = Object.keys(left).filter((k) => left[k] === 0).sort();
  assert.deepEqual(zero, [...soldOutDishes(openCous, 'cous')].sort());
});

test('בלי שורת יום מכירה · אין יתרות', () => {
  assert.deepEqual(remainingDishes(null, 'cous'), {});
});
