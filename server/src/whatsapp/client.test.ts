import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { sendAuthOtp, sendUtility, setWhatsAppFetch } from './client.ts';
import { notifyOrderConfirmed, notifyOrderStatus } from './notify.ts';

const saved = {
  token: process.env.WHATSAPP_TOKEN,
  phone: process.env.WHATSAPP_PHONE_NUMBER_ID,
  otp: process.env.WHATSAPP_TEMPLATE_OTP,
  pickup: process.env.WHATSAPP_TEMPLATE_ORDER_CONFIRMED_PICKUP,
  delivery: process.env.WHATSAPP_TEMPLATE_ORDER_CONFIRMED_DELIVERY,
  ready: process.env.WHATSAPP_TEMPLATE_ORDER_READY_PICKUP,
  delivered: process.env.WHATSAPP_TEMPLATE_ORDER_DELIVERED,
  lang: process.env.WHATSAPP_TEMPLATE_LANG,
  version: process.env.WHATSAPP_GRAPH_VERSION,
};

afterEach(() => {
  setWhatsAppFetch(null);
  const restore = (key: string, v: string | undefined) => {
    if (v === undefined) delete process.env[key];
    else process.env[key] = v;
  };
  restore('WHATSAPP_TOKEN', saved.token);
  restore('WHATSAPP_PHONE_NUMBER_ID', saved.phone);
  restore('WHATSAPP_TEMPLATE_OTP', saved.otp);
  restore('WHATSAPP_TEMPLATE_ORDER_CONFIRMED_PICKUP', saved.pickup);
  restore('WHATSAPP_TEMPLATE_ORDER_CONFIRMED_DELIVERY', saved.delivery);
  restore('WHATSAPP_TEMPLATE_ORDER_READY_PICKUP', saved.ready);
  restore('WHATSAPP_TEMPLATE_ORDER_DELIVERED', saved.delivered);
  restore('WHATSAPP_TEMPLATE_LANG', saved.lang);
  restore('WHATSAPP_GRAPH_VERSION', saved.version);
});

function enableWhatsApp() {
  process.env.WHATSAPP_TOKEN = 'test-token';
  process.env.WHATSAPP_PHONE_NUMBER_ID = '123456789';
  process.env.WHATSAPP_TEMPLATE_OTP = 'bite_otp';
  delete process.env.WHATSAPP_TEMPLATE_ORDER_CONFIRMED_PICKUP;
  delete process.env.WHATSAPP_TEMPLATE_ORDER_CONFIRMED_DELIVERY;
  delete process.env.WHATSAPP_TEMPLATE_ORDER_READY_PICKUP;
  delete process.env.WHATSAPP_TEMPLATE_ORDER_DELIVERED;
  process.env.WHATSAPP_TEMPLATE_LANG = 'he';
  process.env.WHATSAPP_GRAPH_VERSION = 'v21.0';
}

function disableWhatsApp() {
  delete process.env.WHATSAPP_TOKEN;
  delete process.env.WHATSAPP_PHONE_NUMBER_ID;
}

function mockFetch(onCall: (url: string, init: RequestInit) => void, ok = true) {
  setWhatsAppFetch(async (url, init) => {
    onCall(url, init ?? {});
    if (!ok) {
      return new Response(JSON.stringify({ error: { message: 'template not found' } }), { status: 400 });
    }
    return new Response(JSON.stringify({ messages: [{ id: 'wamid.ABC' }] }), { status: 200 });
  });
}

const pickupOrder = {
  id: 'ord_99',
  name: 'דנה כהן',
  phone: '0501234567',
  total: 145,
  status: 'חדשה',
  ship: 'self',
  time: '12:30',
  city: '',
  address: '',
};

const deliveryOrder = {
  ...pickupOrder,
  ship: 'deliv',
  time: '13:00',
  city: 'יבנה',
  address: 'הרצל 5',
};

test('בלי env לא קוראים ל-Meta ב-OTP', async () => {
  disableWhatsApp();
  let called = 0;
  mockFetch(() => {
    called += 1;
  });
  const result = await sendAuthOtp('0501234567', '123456');
  assert.deepEqual(result, { ok: false, skipped: 'disabled' });
  assert.equal(called, 0);
});

test('בלי env לא קוראים ל-Meta באישור הזמנה', async () => {
  disableWhatsApp();
  let called = 0;
  mockFetch(() => {
    called += 1;
  });
  const result = await notifyOrderConfirmed(pickupOrder);
  assert.deepEqual(result, { ok: false, skipped: 'disabled' });
  assert.equal(called, 0);
});

test('עם env נשלח OTP עם גוף וכפתור copy-code', async () => {
  enableWhatsApp();
  const calls: { url: string; body: Record<string, unknown>; auth: string }[] = [];
  mockFetch((url, init) => {
    calls.push({
      url,
      body: JSON.parse(String(init.body)) as Record<string, unknown>,
      auth: String((init.headers as Record<string, string>).authorization),
    });
  });

  const result = await sendAuthOtp('050-1234567', '654321');
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.id, 'wamid.ABC');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://graph.facebook.com/v21.0/123456789/messages');
  assert.equal(calls[0].auth, 'Bearer test-token');
  const payload = calls[0].body as {
    to: string;
    type: string;
    template: { name: string; components: unknown[] };
  };
  assert.equal(payload.to, '972501234567');
  assert.equal(payload.type, 'template');
  assert.equal(payload.template.name, 'bite_otp');
  assert.deepEqual(payload.template.components, [
    { type: 'body', parameters: [{ type: 'text', text: '654321' }] },
    { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: '654321' }] },
  ]);
});

test('אישור הזמנה · איסוף מול משלוח לפי ship', async () => {
  enableWhatsApp();
  const names: string[] = [];
  const bodies: string[][] = [];
  mockFetch((_url, init) => {
    const parsed = JSON.parse(String(init.body)) as {
      template: { name: string; components: { parameters: { text: string }[] }[] };
    };
    names.push(parsed.template.name);
    bodies.push(parsed.template.components[0].parameters.map((p) => p.text));
  });

  const pickup = await notifyOrderConfirmed(pickupOrder);
  const delivery = await notifyOrderConfirmed(deliveryOrder);
  assert.equal(pickup.ok, true);
  assert.equal(delivery.ok, true);
  assert.deepEqual(names, ['order_pickup_confirmed', 'order_delivary_confirmed']);
  assert.deepEqual(bodies[0], ['דנה כהן']);
  assert.deepEqual(bodies[1], ['דנה כהן']);
});

test('סטטוס · מוכנה לאיסוף ונמסרה במשלוח בלבד', async () => {
  enableWhatsApp();
  const names: string[] = [];
  mockFetch((_url, init) => {
    const parsed = JSON.parse(String(init.body)) as { template: { name: string } };
    names.push(parsed.template.name);
  });

  const readyPickup = await notifyOrderStatus({ ...pickupOrder, status: 'מוכנה' });
  const readyDelivery = await notifyOrderStatus({ ...deliveryOrder, status: 'מוכנה' });
  const deliveredDelivery = await notifyOrderStatus({ ...deliveryOrder, status: 'נמסרה' });
  const deliveredPickup = await notifyOrderStatus({ ...pickupOrder, status: 'נמסרה' });
  const confirmed = await notifyOrderStatus({ ...pickupOrder, status: 'מאושרת' });

  assert.equal(readyPickup.ok, true);
  assert.deepEqual(readyDelivery, { ok: false, skipped: 'no_template' });
  assert.equal(deliveredDelivery.ok, true);
  assert.deepEqual(deliveredPickup, { ok: false, skipped: 'no_template' });
  assert.deepEqual(confirmed, { ok: false, skipped: 'no_template' });
  assert.deepEqual(names, ['order_pick_up', 'order_dalivery']);
});

test('תבנית סטטוס כבויה במחרוזת ריקה', async () => {
  enableWhatsApp();
  process.env.WHATSAPP_TEMPLATE_ORDER_READY_PICKUP = '';
  let called = 0;
  mockFetch(() => {
    called += 1;
  });
  const skipped = await notifyOrderStatus({ ...pickupOrder, status: 'מוכנה' });
  assert.deepEqual(skipped, { ok: false, skipped: 'no_template' });
  assert.equal(called, 0);
});

test('שגיאת Meta לא זורקת', async () => {
  enableWhatsApp();
  mockFetch(() => {}, false);
  const result = await sendUtility('0501234567', 'order_pickup_confirmed', ['דנה']);
  assert.equal(result.ok, false);
  if (!result.ok && 'error' in result) {
    assert.equal(result.error, 'template not found');
    assert.equal(result.status, 400);
  }
});
