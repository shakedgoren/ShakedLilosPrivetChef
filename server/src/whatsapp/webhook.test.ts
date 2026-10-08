import assert from 'node:assert/strict';
import { test } from 'node:test';
import { authorizeWebhook, readWebhook, noteWebhook, FAILED_STATUSES } from './webhook.ts';

/**
 * ⚠ **למה הוובהוק הזה קריטי · 8 באוקטובר 2026** · תשובת ה-HTTP
 * של Green API חוזרת 200 כשההודעה נכנסה לתור, ולא כשהיא נשלחה.
 * כישלון אמיתי — מספר בלי וואטסאפ, אינסטנס מנותק — מגיע **רק**
 * דרך `outgoingMessageStatus`. בלי הבדיקות כאן אין מי שישמור על
 * המסלול היחיד שמגלה שההודעה לא הגיעה.
 */

test('בלי טוקן · הוובהוק כבוי ומחזיר 404', () => {
  assert.deepEqual(authorizeWebhook('Bearer abc', ''), {
    ok: false,
    status: 404,
    error: 'whatsapp_webhook_disabled',
  });
});

test('טוקן תואם · עם Bearer ובלעדיו', () => {
  assert.deepEqual(authorizeWebhook('Bearer s3cret', 's3cret'), { ok: true });
  assert.deepEqual(authorizeWebhook('s3cret', 's3cret'), { ok: true });
  assert.deepEqual(authorizeWebhook('  Bearer   s3cret  ', 's3cret'), { ok: true });
});

test('טוקן שגוי או חסר · 401', () => {
  for (const given of ['Bearer wrong', '', '   ', 'Bearer ']) {
    const r = authorizeWebhook(given, 's3cret');
    assert.equal(r.ok, false, `התקבל טוקן שלא היה אמור לעבור: ${JSON.stringify(given)}`);
    assert.equal((r as { status: number }).status, 401);
  }
});

test('סטטוס יוצא · נקרא נכון', () => {
  const note = readWebhook({
    typeWebhook: 'outgoingMessageStatus',
    idMessage: 'BAE5F4886F6F2D05',
    status: 'delivered',
  });
  assert.deepEqual(note, {
    kind: 'status',
    id: 'BAE5F4886F6F2D05',
    status: 'delivered',
    failed: false,
  });
});

test('שלושת מצבי הכישלון · מסומנים ככאלה', () => {
  assert.deepEqual([...FAILED_STATUSES].sort(), ['failed', 'noAccount', 'notInGroup']);
  for (const status of FAILED_STATUSES) {
    const note = readWebhook({ typeWebhook: 'outgoingMessageStatus', idMessage: 'x', status });
    assert.equal(note.kind === 'status' && note.failed, true, status);
    assert.equal(noteWebhook(note), true, `${status} לא נרשם ככישלון`);
  }
});

test('סוג אחר · נבלע ולא נרשם', () => {
  for (const body of [
    { typeWebhook: 'incomingMessageReceived' },
    { typeWebhook: 'stateInstanceChanged' },
    {},
    null,
    'לא JSON',
  ]) {
    const note = readWebhook(body);
    assert.equal(note.kind, 'other');
    assert.equal(noteWebhook(note), false);
  }
});

test('סטטוס מוצלח · לא נרשם ככישלון', () => {
  for (const status of ['sent', 'delivered', 'read']) {
    const note = readWebhook({ typeWebhook: 'outgoingMessageStatus', idMessage: 'x', status });
    assert.equal(noteWebhook(note), false, status);
  }
});
