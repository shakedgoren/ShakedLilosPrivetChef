import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quoteCustomer, quoteAdminDraft, assertFulfillment, assertQuote } from './quote.ts';
import { DAYPARTS, dateOpen, dayPartOpen, dayKey } from '../../../mobile/src/data/calendar.ts';
import { EXTRAS } from '../../../mobile/src/data/chef.ts';

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


/* ── בקשת הצעה · שף וטאבון ── */

/**
 * התאריך הפתוח הבא · הבדיקות לא יכולות לקודד תאריך, כי `dateOpen`
 * חוסם כל מה שעבר. סורקים קדימה עד שנמצא יום פתוח עם חלק יום פתוח.
 */
const nextOpenSlot = (): { date: string; part: string } => {
  const now = new Date();
  for (let i = 0; i < 400; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const k = dayKey(d.getFullYear(), d.getMonth(), d.getDate());
    if (!dateOpen(k)) continue;
    const part = DAYPARTS.find((p) => dayPartOpen(k, p));
    if (part) return { date: k, part };
  }
  throw new Error('לא נמצא תאריך פתוח');
};

const QUOTE = () => {
  const { date, part } = nextOpenSlot();
  return {
    name: 'שקד', phone: '0522958511', date, daypart: part, addr: 'נופר 25, יבנה',
    guests: 6, concept: 'בשרי', style: 'איטלקי', tier: '10 סוגי מנות',
  } as Record<string, unknown>;
};

test('בקשת הצעה · פרטי אירוע מלאים עוברים', () => {
  assert.doesNotThrow(() => assertQuote(QUOTE()));
});

test('בקשת הצעה · שדה חסר נדחה בשמו', () => {
  for (const k of ['name', 'phone', 'date', 'daypart', 'addr']) {
    const picks = { ...QUOTE(), [k]: '' };
    assert.throws(() => assertQuote(picks), (e: any) => e.detail === k || /invalid_order/.test(String(e.code)));
  }
});

test('בקשת הצעה · תאריך חסום נדחה', () => {
  assert.throws(() => assertQuote({ ...QUOTE(), date: '2026-09-21' }));
});

test('בקשת הצעה · שישי בערב נדחה', () => {
  /* השישי הפתוח הבא · מוקדם יותר אי אפשר, כי עבר */
  const now = new Date();
  for (let i = 0; i < 400; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const k = dayKey(d.getFullYear(), d.getMonth(), d.getDate());
    if (d.getDay() !== 5 || !dateOpen(k)) continue;
    assert.throws(() => assertQuote({ ...QUOTE(), date: k, daypart: 'ערב' }));
    return;
  }
  throw new Error('לא נמצא שישי פתוח');
});

test('שף · שורות הסיכום הן הבסיס ואז כל שדרוג בנפרד', () => {
  const q = quoteCustomer({
    category: 'chef',
    key: 'chef',
    picks: { guests: 6, concept: 'בשרי', tier: '10 סוגי מנות', extras: ['שתייה'] },
  });
  assert.ok(q.lines.length >= 2, 'בסיס ועוד שדרוג');
  assert.equal(q.lines[q.lines.length - 1].name.startsWith('שתייה'), true);
  /* סכום השורות שווה לסך ההזמנה */
  assert.equal(q.lines.reduce((s, l) => s + l.sum, 0), q.total);
});

test('שף · עיצוב שולחן חד־פעמי וחבילת שתייה לכל סועד', () => {
  /* ⚠ באג שתוקן · חבילת השתייה קיבלה קודם את מחיר עיצוב השולחן */
  const picks = {
    guests: 6, concept: 'בשרי', tier: '10 סוגי מנות',
    extras: [EXTRAS[0].n, EXTRAS[1].n],
  };
  const q = quoteCustomer({ category: 'chef', key: 'chef', picks });
  const base = 6 * 550;
  const table = 400;       /* מדרגת 5–11 */
  const drink = 120 * 6;   /* לכל סועד */
  assert.equal(q.total, base + table + drink);
  assert.equal(q.lines.find((l) => l.name.startsWith(EXTRAS[1].n))?.sum, drink);
  assert.equal(q.lines.find((l) => l.name.startsWith(EXTRAS[0].n))?.sum, table);
});
