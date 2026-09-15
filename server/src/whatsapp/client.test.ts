import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { sendAuthOtp, sendUtility, setWhatsAppFetch } from './client.ts';
import { notifyOrderConfirmed, notifyOrderStatus } from './notify.ts';

const saved = {
  token: process.env.WHATSAPP_TOKEN,
  phone: process.env.WHATSAPP_PHONE_NUMBER_ID,
  otp: process.env.WHATSAPP_TEMPLATE_OTP,
  confirmed: process.env.WHATSAPP_TEMPLATE_ORDER_CONFIRMED,
  status: process.env.WHATSAPP_TEMPLATE_ORDER_STATUS,
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
  restore('WHATSAPP_TEMPLATE_ORDER_CONFIRMED', saved.confirmed);
  restore('WHATSAPP_TEMPLATE_ORDER_STATUS', saved.status);
  restore('WHATSAPP_TEMPLATE_LANG', saved.lang);
  restore('WHATSAPP_GRAPH_VERSION', saved.version);
});

function enableWhatsApp() {
  process.env.WHATSAPP_TOKEN = 'test-token';
  process.env.WHATSAPP_PHONE_NUMBER_ID = '123456789';
  process.env.WHATSAPP_TEMPLATE_OTP = 'bite_otp';
  process.env.WHATSAPP_TEMPLATE_ORDER_CONFIRMED = 'bite_order_confirmed';
  process.env.WHATSAPP_TEMPLATE_ORDER_STATUS = 'bite_order_status';
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
  const result = await notifyOrderConfirmed({
    id: 'ord_1',
    phone: '0501234567',
    total: 145,
    status: 'חדשה',
    ship: 'self',
    time: '12:30',
    city: '',
    address: '',
  });
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

test('עם env נשלח אישור הזמנה עם מזהה, סה״כ וסיכום', async () => {
  enableWhatsApp();
  const calls: Record<string, unknown>[] = [];
  mockFetch((_url, init) => {
    calls.push(JSON.parse(String(init.body)) as Record<string, unknown>);
  });

  const result = await notifyOrderConfirmed({
    id: 'ord_99',
    phone: '0521112233',
    total: 145,
    status: 'חדשה',
    ship: 'self',
    time: '12:30',
    city: '',
    address: '',
  });
  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);
  const template = calls[0].template as { name: string; components: { parameters: { text: string }[] }[] };
  assert.equal(template.name, 'bite_order_confirmed');
  assert.equal(template.components[0].parameters[0].text, 'ord_99');
  assert.equal(template.components[0].parameters[1].text, '145');
  assert.equal(template.components[0].parameters[2].text, 'איסוף עצמי · 12:30');
});

test('עדכון סטטוס נשלח רק כשהתבנית מוגדרת', async () => {
  enableWhatsApp();
  delete process.env.WHATSAPP_TEMPLATE_ORDER_STATUS;
  let called = 0;
  mockFetch(() => {
    called += 1;
  });
  const skipped = await notifyOrderStatus({
    id: 'ord_99',
    phone: '0501234567',
    total: 145,
    status: 'מאושרת',
    ship: 'self',
    time: '12:30',
    city: '',
    address: '',
  });
  assert.deepEqual(skipped, { ok: false, skipped: 'no_template' });
  assert.equal(called, 0);

  process.env.WHATSAPP_TEMPLATE_ORDER_STATUS = 'bite_order_status';
  const sent = await notifyOrderStatus({
    id: 'ord_99',
    phone: '0501234567',
    total: 145,
    status: 'מאושרת',
    ship: 'self',
    time: '12:30',
    city: '',
    address: '',
  });
  assert.equal(sent.ok, true);
  assert.equal(called, 1);
});

test('שגיאת Meta לא זורקת', async () => {
  enableWhatsApp();
  mockFetch(() => {}, false);
  const result = await sendUtility('0501234567', 'bite_order_confirmed', ['a', 'b', 'c']);
  assert.equal(result.ok, false);
  if (!result.ok && 'error' in result) {
    assert.equal(result.error, 'template not found');
    assert.equal(result.status, 400);
  }
});
