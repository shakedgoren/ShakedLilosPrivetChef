import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { sendText, isWhatsAppEnabled, setWhatsAppFetch } from './client.ts';

/**
 * ⚠ **מה הבדיקות האלה שומרות · 8 באוקטובר 2026** · המעבר מ-Meta
 * ל-Green API החליף את כל שכבת התעבורה. שתי התנהגויות כאן הן
 * מלכודות אמיתיות של הספק הזה:
 *
 * · **200 אינו הצלחה.** Green API מכניס לתור ועונה 200 גם כשהיא
 *   לא נשלחה. רק `idMessage` בגוף מעיד על קבלה.
 * · **הטוקן יושב בנתיב.** טעות בהרכבת הכתובת שולחת את הסוד
 *   למקום הלא נכון, ולכן נבדק שהוא במקומו.
 */

const KEYS = ['GREENAPI_ID_INSTANCE', 'GREENAPI_API_TOKEN', 'GREENAPI_API_URL'] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of KEYS) saved[k] = process.env[k];
  process.env.GREENAPI_ID_INSTANCE = '1101234567';
  process.env.GREENAPI_API_TOKEN = 'test-token';
  delete process.env.GREENAPI_API_URL;
});

afterEach(() => {
  setWhatsAppFetch(null);
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k] as string;
  }
});

/** fetch מזויף · אוסף את הקריאה ומחזיר תשובה נתונה */
function fakeFetch(status: number, body: unknown) {
  const calls: { url: string; init?: RequestInit }[] = [];
  setWhatsAppFetch(async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  });
  return calls;
}

test('בלי אינסטנס או טוקן · לא שולחים בכלל', async () => {
  delete process.env.GREENAPI_ID_INSTANCE;
  const calls = fakeFetch(200, { idMessage: 'x' });
  assert.equal(isWhatsAppEnabled(), false);
  const r = await sendText('0501234567', 'otp', 'שלום');
  assert.deepEqual(r, { ok: false, skipped: 'disabled' });
  assert.equal(calls.length, 0, 'פנינו לספק למרות שהוא כבוי');
});

test('הכתובת, ה-chatId וההודעה · כפי ש-Green API מצפה', async () => {
  const calls = fakeFetch(200, { idMessage: 'BAE5F4886F6F2D05' });
  const r = await sendText('050-1234567', 'otp', 'קוד: 123456');

  assert.deepEqual(r, { ok: true, id: 'BAE5F4886F6F2D05', to: '972501234567@c.us' });
  assert.equal(calls.length, 1);
  assert.equal(
    calls[0]?.url,
    'https://api.green-api.com/waInstance1101234567/sendMessage/test-token',
    'הטוקן והאינסטנס לא במקומם בנתיב',
  );
  assert.equal(calls[0]?.init?.method, 'POST');
  const body = JSON.parse(String(calls[0]?.init?.body));
  assert.equal(body.chatId, '972501234567@c.us');
  assert.equal(body.message, 'קוד: 123456');
});

test('כתובת אינסטנס משלו · גוברת על ברירת המחדל, בלי לוכסן כפול', async () => {
  process.env.GREENAPI_API_URL = 'https://7105.api.greenapi.com/';
  const calls = fakeFetch(200, { idMessage: 'a' });
  await sendText('0501234567', 'otp', 'שלום');
  assert.equal(calls[0]?.url, 'https://7105.api.greenapi.com/waInstance1101234567/sendMessage/test-token');
});

test('⚠ 200 בלי idMessage אינו הצלחה', async () => {
  fakeFetch(200, { ok: true });
  const r = await sendText('0501234567', 'otp', 'שלום');
  assert.equal(r.ok, false);
  assert.equal((r as { error: string }).error, 'no_id_message');
});

test('שגיאת HTTP · מוחזרת עם הקוד', async () => {
  fakeFetch(401, { message: 'instance not authorized' });
  const r = await sendText('0501234567', 'otp', 'שלום');
  assert.equal(r.ok, false);
  assert.equal((r as { error: string }).error, 'instance not authorized');
  assert.equal((r as { status: number }).status, 401);
});

test('מספר לא תקין או טקסט ריק · דילוג, בלי לפנות לספק', async () => {
  const calls = fakeFetch(200, { idMessage: 'x' });
  assert.deepEqual(await sendText('123', 'otp', 'שלום'), { ok: false, skipped: 'no_phone' });
  assert.deepEqual(await sendText('0501234567', 'otp', '   '), { ok: false, skipped: 'no_text' });
  assert.equal(calls.length, 0);
});

test('תקלת רשת · נתפסת ולא זורקת', async () => {
  setWhatsAppFetch(async () => {
    throw new Error('connect ETIMEDOUT');
  });
  const r = await sendText('0501234567', 'otp', 'שלום');
  assert.equal(r.ok, false);
  assert.equal((r as { error: string }).error, 'connect ETIMEDOUT');
});
