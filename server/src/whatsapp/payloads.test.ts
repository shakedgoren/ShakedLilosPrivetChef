import assert from 'node:assert/strict';
import { test } from 'node:test';
import { authOtpPayload, sanitizeTemplateParam, utilityTemplatePayload } from './payloads.ts';
import { isWhatsAppPhone, toWhatsAppPhone } from './phone.ts';
import { verifyWebhookChallenge } from './webhook.ts';
import {
  confirmTemplateKind,
  deliveryAddress,
  META_UTILITY_TEMPLATES,
  orderUtilityBodyParams,
  statusTemplateKind,
  UTILITY_BODY_KEYS,
  type UtilityKind,
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

test('תבנית Utility · פרמטרי גוף לפי סוג', () => {
  const cases: { kind: UtilityKind; params: string[] }[] = [
    { kind: 'confirmPickup', params: ['דנה', '145', '12:30'] },
    { kind: 'confirmDelivery', params: ['דנה', 'הרצל 5, יבנה', '145', '13:00'] },
    { kind: 'readyPickup', params: ['דנה'] },
    { kind: 'delivered', params: ['דנה', 'הרצל 5, יבנה'] },
  ];
  for (const { kind, params } of cases) {
    const payload = utilityTemplatePayload('972501234567', META_UTILITY_TEMPLATES[kind], 'he', params);
    const body = payload.template.components[0];
    assert.equal(body.type, 'body');
    if (body.type !== 'body') throw new Error('expected body');
    assert.equal(payload.template.name, META_UTILITY_TEMPLATES[kind]);
    assert.deepEqual(
      body.parameters.map((p) => p.text),
      params,
    );
    assert.equal(body.parameters.length, UTILITY_BODY_KEYS[kind].length);
  }
});

test('פרמטר תבנית בלי ירידות שורה', () => {
  assert.equal(sanitizeTemplateParam('  שלום\nעולם\t  '), 'שלום עולם');
  assert.equal(sanitizeTemplateParam(''), '—');
});

test('שמות Meta · כולל שגיאות הכתיב', () => {
  assert.equal(META_UTILITY_TEMPLATES.confirmPickup, 'order_pickup_confirmed');
  assert.equal(META_UTILITY_TEMPLATES.confirmDelivery, 'order_delivary_confirmed');
  assert.equal(META_UTILITY_TEMPLATES.readyPickup, 'order_pick_up');
  assert.equal(META_UTILITY_TEMPLATES.delivered, 'order_dalivery');
});

test('פרמטרי גוף · ארבע תבניות Utility בסדר Meta', () => {
  assert.deepEqual([...UTILITY_BODY_KEYS.confirmPickup], ['name', 'total', 'time']);
  assert.deepEqual([...UTILITY_BODY_KEYS.confirmDelivery], ['name', 'address', 'total', 'time']);
  assert.deepEqual([...UTILITY_BODY_KEYS.readyPickup], ['name']);
  assert.deepEqual([...UTILITY_BODY_KEYS.delivered], ['name', 'address']);

  const pickup = {
    name: 'דנה כהן',
    id: 'ord_99',
    total: 145,
    ship: 'self',
    time: '12:30',
    city: '',
    address: '',
  };
  const delivery = {
    ...pickup,
    ship: 'deliv',
    time: '13:00',
    city: 'יבנה',
    address: 'הרצל 5',
  };

  assert.deepEqual(orderUtilityBodyParams(pickup, 'confirmPickup'), ['דנה כהן', '145', '12:30']);
  assert.deepEqual(orderUtilityBodyParams(delivery, 'confirmDelivery'), [
    'דנה כהן',
    'הרצל 5, יבנה',
    '145',
    '13:00',
  ]);
  assert.deepEqual(orderUtilityBodyParams(pickup, 'readyPickup'), ['דנה כהן']);
  assert.deepEqual(orderUtilityBodyParams(delivery, 'delivered'), ['דנה כהן', 'הרצל 5, יבנה']);

  assert.equal(deliveryAddress({ address: 'הרצל 5', city: 'יבנה' }), 'הרצל 5, יבנה');
  assert.equal(deliveryAddress({ address: 'הרצל 5', city: '' }), 'הרצל 5');
  assert.equal(deliveryAddress({ address: '', city: 'יבנה' }), 'יבנה');
  assert.deepEqual(
    orderUtilityBodyParams({ ...delivery, name: '  ', address: '', city: '', time: '  ' }, 'confirmDelivery'),
    ['—', '—', '145', '—'],
  );
  assert.deepEqual(orderUtilityBodyParams({ ...pickup, total: 0, time: '' }, 'confirmPickup'), [
    'דנה כהן',
    '0',
    '—',
  ]);

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
