import assert from 'node:assert/strict';
import { test } from 'node:test';
import { authOtpPayload, sanitizeTemplateParam, utilityTemplatePayload } from './payloads.ts';
import { isWhatsAppPhone, toWhatsAppPhone } from './phone.ts';
import { verifyWebhookChallenge } from './webhook.ts';
import {
  confirmTemplateKind,
  orderUtilityBodyParams,
  statusTemplateKind,
  timeOrAddress,
  UTILITY_BODY_KEYS,
} from './vars.ts';

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

test('תבנית Utility · פרמטרים לפי סדר ה-keys', () => {
  const payload = utilityTemplatePayload('972501234567', 'bite_order_confirmed_pickup', 'he', [
    'דנה',
    'clxyz',
    '145',
    '12:30',
  ]);
  const body = payload.template.components[0];
  assert.equal(body.type, 'body');
  if (body.type !== 'body') throw new Error('expected body');
  assert.equal(body.parameters[0].text, 'דנה');
  assert.equal(body.parameters[3].text, '12:30');
});

test('פרמטר תבנית בלי ירידות שורה', () => {
  assert.equal(sanitizeTemplateParam('  שלום\nעולם\t  '), 'שלום עולם');
  assert.equal(sanitizeTemplateParam(''), '—');
});

test('סדר {{n}} הזמני · name, orderId, total, timeOrAddress', () => {
  assert.deepEqual([...UTILITY_BODY_KEYS], ['name', 'orderId', 'total', 'timeOrAddress']);
  const pickup = {
    name: 'דנה כהן',
    id: 'ord_99',
    total: 145,
    ship: 'self',
    time: '12:30',
    city: '',
    address: '',
  };
  assert.deepEqual(orderUtilityBodyParams(pickup), ['דנה כהן', 'ord_99', '145', '12:30']);
  assert.equal(timeOrAddress(pickup), '12:30');
  assert.equal(
    timeOrAddress({ ship: 'deliv', time: '13:00', city: 'יבנה', address: 'הרצל 5' }),
    'הרצל 5, יבנה · 13:00',
  );
  assert.equal(confirmTemplateKind('self'), 'confirmPickup');
  assert.equal(confirmTemplateKind('deliv'), 'confirmDelivery');
  assert.equal(statusTemplateKind('מוכנה', 'self'), 'readyPickup');
  assert.equal(statusTemplateKind('מוכנה', 'deliv'), null);
  assert.equal(statusTemplateKind('נמסרה', 'deliv'), 'delivered');
  assert.equal(statusTemplateKind('נמסרה', 'self'), null);
  assert.equal(statusTemplateKind('מאושרת', 'self'), null);
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
