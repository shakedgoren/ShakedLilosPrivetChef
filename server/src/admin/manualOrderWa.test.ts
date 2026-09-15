import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  canNotify,
  manualOrderLink,
  manualOrderText,
  waPhone,
} from '../../../mobile/src/admin/manualOrderWa.ts';
import { EMPTY_DRAFT } from '../../../mobile/src/admin/orderMath.ts';

test('מספר הטלפון מומר לפורמט של וואטסאפ', () => {
  assert.equal(waPhone('050-1234567'), '972501234567');
  assert.equal(waPhone('0501234567'), '972501234567');
  assert.equal(waPhone('972501234567'), '972501234567');
  assert.equal(waPhone('+972 50 123 4567'), '972501234567');
});

test('הודעת האישור נושאת את הפריטים, הסה״כ ואופן המסירה', () => {
  const draft = {
    ...EMPTY_DRAFT,
    name: 'דנה כהן',
    phone: '050-1234567',
    cat: 'cous' as const,
    qty: { veg: 2, chick: 1 },
    ship: 'deliv' as const,
    area: 'יבנה',
    addr: 'הרצל 5',
    time: '12:30',
  };
  const text = manualOrderText(draft);

  assert.match(text, /^היי דנה כהן, תודה על ההזמנה!/);
  assert.match(text, /× 2/);
  assert.match(text, /× 1/);
  assert.match(text, /סה״כ: \d+ ₪/);
  assert.match(text, /מסירה: משלוח/);
  assert.match(text, /שעה: 12:30/);
  assert.match(text, /כתובת: הרצל 5, יבנה/);

  /* ⚠ המחיר בהודעה חייב להיות אותו מספר שבחלונית */
  const shown = Number(/סה״כ: (\d+) ₪/.exec(text)?.[1]);
  assert.equal(shown, 2 * 45 + 55 + 20);
});

test('באיסוף עצמי אין כתובת ואין דמי משלוח', () => {
  const text = manualOrderText({
    ...EMPTY_DRAFT,
    name: 'יעל',
    phone: '0501234567',
    qty: { veg: 1 },
    ship: 'pickup',
    time: '11:00',
  });
  assert.match(text, /מסירה: איסוף עצמי/);
  assert.doesNotMatch(text, /כתובת:/);
  assert.doesNotMatch(text, /משלוח ·/);
});

test('בלי טלפון או בלי פריטים אין מה לשלוח', () => {
  assert.equal(canNotify({ ...EMPTY_DRAFT, phone: '', qty: { veg: 1 } }), false);
  assert.equal(canNotify({ ...EMPTY_DRAFT, phone: '0501234567', qty: {} }), false);
  assert.equal(canNotify({ ...EMPTY_DRAFT, phone: '0501234567', qty: { veg: 1 } }), true);
});

test('הקישור מקודד את ההודעה ופונה למספר של הלקוח', () => {
  const link = manualOrderLink({
    ...EMPTY_DRAFT,
    name: 'דנה',
    phone: '050-1234567',
    qty: { veg: 1 },
    time: '12:00',
  });
  assert.ok(link.startsWith('https://wa.me/972501234567?text='));
  assert.ok(!link.includes('\n'));
});
