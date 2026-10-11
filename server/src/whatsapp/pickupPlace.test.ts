import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { setWhatsAppFetch } from './client.ts';
import { pickupMapUrl, sendPickupPlace } from './pickupPlace.ts';
import { notifyOrderConfirmed } from './notify.ts';
import { confirmPickupText } from './messages.ts';
import { PICKUP } from '../../../mobile/src/data/categories.ts';

/**
 * ⚠ **מה הבדיקות האלה שומרות · 11 באוקטובר 2026** · הצירוף של
 * מפת ההגעה לאישור איסוף עצמי נוגע בשלושה דברים רגישים:
 *
 * · **הנוסח שאושר** · `confirmPickupText` חייב לצאת כפי שהוא,
 *   ראשון, ובהודעה נפרדת. המפה היא תוספת, לא שינוי.
 * · **הכיתוב הוא טקסט של שקד** · `PICKUP.note` מגיע מאותו מקום
 *   שממנו האפליקציה קוראת אותו, כדי שלא ייווצר כאן עותק שמתפצל.
 * · **סיכה בלי קואורדינטות** · אפס-אפס הוא מקום אמיתי. בלי
 *   משתנים מוגדרים אסור שתצא סיכה בכלל.
 */

const KEYS = [
  'GREENAPI_ID_INSTANCE',
  'GREENAPI_API_TOKEN',
  'SITE_URL',
  'PICKUP_LAT',
  'PICKUP_LNG',
] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of KEYS) saved[k] = process.env[k];
  process.env.GREENAPI_ID_INSTANCE = '1101234567';
  process.env.GREENAPI_API_TOKEN = 'test-token';
  delete process.env.SITE_URL;
  delete process.env.PICKUP_LAT;
  delete process.env.PICKUP_LNG;
});

afterEach(() => {
  setWhatsAppFetch(null);
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k] as string;
  }
});

type Call = { method: string; body: Record<string, unknown> };

/** אוסף את מה שנשלח · שם השיטה מהנתיב, והגוף */
function capture(): Call[] {
  const calls: Call[] = [];
  setWhatsAppFetch(async (url, init) => {
    const method = url.split('/waInstance')[1]?.split('/')[1] ?? '';
    calls.push({ method, body: JSON.parse(String(init?.body ?? '{}')) });
    return new Response(JSON.stringify({ idMessage: 'id-1' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });
  return calls;
}

const ORDER = {
  phone: '050-1234567',
  status: 'new',
  ship: 'self',
  name: 'דנה כהן',
  total: 110,
  time: '12:30',
  city: '',
  address: '',
} as Parameters<typeof notifyOrderConfirmed>[0];

test('כתובת התמונה · יציבה, ציבורית, ומתוך SITE_URL', () => {
  assert.equal(pickupMapUrl(), 'https://bite-and-tell.com/img/pickup-map.jpg');
  process.env.SITE_URL = 'https://staging.example.com/';
  assert.equal(pickupMapUrl(), 'https://staging.example.com/img/pickup-map.jpg');
});

test('הכיתוב הוא הטקסט של שקד · בלי עותק משלנו', async () => {
  const calls = capture();
  await sendPickupPlace('0501234567');
  assert.equal(calls.length, 1, 'נשלחה סיכה בלי קואורדינטות');
  assert.equal(calls[0]?.method, 'sendFileByUrl');
  assert.equal(calls[0]?.body.caption, PICKUP.note);
  assert.equal(calls[0]?.body.fileName, 'pickup-map.jpg');
  assert.equal(calls[0]?.body.chatId, '972501234567@c.us');
});

test('בלי קואורדינטות · אין סיכה בכלל', async () => {
  const calls = capture();
  await sendPickupPlace('0501234567');
  assert.equal(calls.filter((c) => c.method === 'sendLocation').length, 0);
});

test('עם קואורדינטות · סיכה עם הכתובת של שקד', async () => {
  process.env.PICKUP_LAT = '31.8701';
  process.env.PICKUP_LNG = '34.7388';
  const calls = capture();
  await sendPickupPlace('0501234567');
  const pin = calls.find((c) => c.method === 'sendLocation');
  assert.ok(pin, 'לא נשלחה סיכה למרות שהוגדרו קואורדינטות');
  assert.equal(pin.body.address, PICKUP.address);
  assert.equal(pin.body.latitude, 31.8701);
  assert.equal(pin.body.longitude, 34.7388);
});

test('אישור איסוף · הנוסח ראשון, כפי שהוא, ואז המפה', async () => {
  const calls = capture();
  const r = await notifyOrderConfirmed(ORDER);

  assert.equal(r.ok, true);
  assert.equal(calls.length, 2);
  assert.equal(calls[0]?.method, 'sendMessage');
  /* ⚠ מילה במילה · הנוסח אושר ב-8 באוקטובר וחל עליו כלל הברזל */
  assert.equal(calls[0]?.body.message, confirmPickupText(ORDER));
  assert.equal(calls[1]?.method, 'sendFileByUrl');
});

test('משלוח · בלי מפת הגעה', async () => {
  const calls = capture();
  await notifyOrderConfirmed({ ...ORDER, ship: 'deliv', city: 'יבנה', address: 'נופר 25' });
  assert.deepEqual(calls.map((c) => c.method), ['sendMessage']);
});

test('נכשל האישור · לא נשלחת מפה אחריו', async () => {
  const calls: Call[] = [];
  setWhatsAppFetch(async (url, init) => {
    const method = url.split('/waInstance')[1]?.split('/')[1] ?? '';
    calls.push({ method, body: JSON.parse(String(init?.body ?? '{}')) });
    /* ⚠ 200 בלי idMessage · הכישלון השקט של Green API */
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });
  const r = await notifyOrderConfirmed(ORDER);
  assert.equal(r.ok, false);
  assert.deepEqual(calls.map((c) => c.method), ['sendMessage']);
});
