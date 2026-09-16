import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  LAUNCH_PAYMENTS,
  isCustomerPay,
  isRejectedPay,
} from '../../../mobile/src/order/payments.ts';
import {
  assertAdminPay,
  assertCustomerPay,
  parsePaymentStatus,
  paymentPatch,
} from './payment.ts';

test('השקה · שלושה אמצעים בלבד', () => {
  assert.deepEqual([...LAUNCH_PAYMENTS], ['ביט', 'פייבוקס', 'מזומן']);
  for (const p of LAUNCH_PAYMENTS) assert.equal(isCustomerPay(p), true);
});

test('לקוחה · ביט פייבוקס ומזומן מתקבלים', () => {
  assert.doesNotThrow(() => assertCustomerPay('ביט'));
  assert.doesNotThrow(() => assertCustomerPay('פייבוקס'));
  assert.doesNotThrow(() => assertCustomerPay('מזומן'));
  assert.doesNotThrow(() => assertCustomerPay('  ביט  '));
});

test('לקוחה · אפל פיי ואשראי נדחים', () => {
  for (const p of ['אפל פיי', 'Apple Pay', 'אשראי', 'כרטיס אשראי', 'visa', 'credit card']) {
    assert.equal(isRejectedPay(p), true, p);
    assert.throws(() => assertCustomerPay(p), (e: { code?: string }) => e.code === 'invalid_order');
  }
});

test('לקוחה · אמצעי ריק או לא מוכר נדחה', () => {
  assert.throws(() => assertCustomerPay(''));
  assert.throws(() => assertCustomerPay('paypal'));
  assert.throws(() => assertCustomerPay('טרם שולם'));
});

test('ניהול · טרם שולם וריק מותרים, אשראי לא', () => {
  assert.doesNotThrow(() => assertAdminPay(''));
  assert.doesNotThrow(() => assertAdminPay('טרם שולם'));
  assert.doesNotThrow(() => assertAdminPay('ביט'));
  assert.throws(() => assertAdminPay('אפל פיי'));
  assert.throws(() => assertAdminPay('אשראי'));
});

test('סטטוס תשלום · paid / pending / waived', () => {
  assert.equal(parsePaymentStatus('paid'), 'paid');
  assert.equal(parsePaymentStatus('שולם'), 'paid');
  assert.equal(parsePaymentStatus('unpaid'), 'pending');
  assert.equal(parsePaymentStatus('pending'), 'pending');
  assert.equal(parsePaymentStatus('waived'), 'waived');
  assert.equal(parsePaymentStatus('ויתור'), 'waived');
  assert.throws(() => parsePaymentStatus('cleared'));
});

test('סימון שולם · paidAt מתמלא, ומתרוקן בחזרה ל-pending', () => {
  const now = new Date('2026-09-16T12:00:00Z');
  const paid = paymentPatch('paid', now);
  assert.equal(paid.paymentStatus, 'paid');
  assert.equal(paid.paidAt?.toISOString(), now.toISOString());

  const pending = paymentPatch('pending', now);
  assert.equal(pending.paymentStatus, 'pending');
  assert.equal(pending.paidAt, null);

  const waived = paymentPatch('waived', now);
  assert.equal(waived.paymentStatus, 'waived');
  assert.equal(waived.paidAt?.toISOString(), now.toISOString());
});
