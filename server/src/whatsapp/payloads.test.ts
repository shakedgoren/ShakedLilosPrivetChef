import assert from 'node:assert/strict';
import { test } from 'node:test';
import { authOtpPayload, sanitizeTemplateParam, utilityTemplatePayload } from './payloads.ts';
import { isWhatsAppPhone, toWhatsAppPhone } from './phone.ts';
import { fulfillmentSummary } from './notify.ts';
import { verifyWebhookChallenge } from './webhook.ts';

test('מספר ישראלי מומר ל-E.164 בלי פלוס', () => {
  assert.equal(toWhatsAppPhone('050-1234567'), '972501234567');
  assert.equal(toWhatsAppPhone('0501234567'), '972501234567');
  assert.equal(toWhatsAppPhone('+972 50 123 4567'), '972501234567');
  assert.equal(toWhatsAppPhone('972501234567'), '972501234567');
  assert.equal(isWhatsAppPhone('0501234567'), true);
  assert.equal(isWhatsAppPhone(''), false);
  assert.equal(isWhatsAppPhone('12'), false);
});

test('תבנית Authentication · הקוד בגוף ובכפתור copy-code', () => {
  const payload = authOtpPayload('972501234567', '123456', 'bite_otp', 'he');
  assert.equal(payload.messaging_product, 'whatsapp');
  assert.equal(payload.to, '972501234567');
  assert.equal(payload.type, 'template');
  assert.equal(payload.template.name, 'bite_otp');
  assert.deepEqual(payload.template.language, { code: 'he' });
  assert.deepEqual(payload.template.components, [
    { type: 'body', parameters: [{ type: 'text', text: '123456' }] },
    { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: '123456' }] },
  ]);
});

test('תבנית Utility · מזהה הזמנה, סה״כ וסיכום מסירה', () => {
  const payload = utilityTemplatePayload('972501234567', 'bite_order_confirmed', 'he', [
    'clxyz',
    '145',
    'איסוף עצמי · 12:30',
  ]);
  const body = payload.template.components[0];
  assert.equal(body.type, 'body');
  if (body.type !== 'body') throw new Error('expected body');
  assert.equal(body.parameters[0].text, 'clxyz');
  assert.equal(body.parameters[1].text, '145');
  assert.equal(body.parameters[2].text, 'איסוף עצמי · 12:30');
});

test('פרמטר תבנית בלי ירידות שורה', () => {
  assert.equal(sanitizeTemplateParam('  שלום\nעולם\t  '), 'שלום עולם');
  assert.equal(sanitizeTemplateParam(''), '—');
});

test('סיכום מסירה להזמנה', () => {
  assert.equal(
    fulfillmentSummary({ ship: 'self', time: '12:30', city: '', address: '' }),
    'איסוף עצמי · 12:30',
  );
  assert.equal(
    fulfillmentSummary({ ship: 'deliv', time: '13:00', city: 'יבנה', address: 'הרצל 5' }),
    'משלוח · הרצל 5, יבנה · 13:00',
  );
});

test('webhook · בלי token מוגדר מחזיר 404', () => {
  const r = verifyWebhookChallenge({ 'hub.mode': 'subscribe', 'hub.verify_token': 'x', 'hub.challenge': '42' }, '');
  assert.equal(r.status, 404);
});

test('webhook · token נכון מחזיר challenge', () => {
  const r = verifyWebhookChallenge(
    { 'hub.mode': 'subscribe', 'hub.verify_token': 'secret', 'hub.challenge': '99' },
    'secret',
  );
  assert.equal(r.status, 200);
  if (r.status === 200) assert.equal(r.body, '99');
});

test('webhook · token שגוי מחזיר 403', () => {
  const r = verifyWebhookChallenge(
    { 'hub.mode': 'subscribe', 'hub.verify_token': 'nope', 'hub.challenge': '99' },
    'secret',
  );
  assert.equal(r.status, 403);
});
