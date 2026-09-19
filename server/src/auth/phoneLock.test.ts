import { test } from 'node:test';
import assert from 'node:assert/strict';
import { phoneChangeBlocked } from './phoneLock.ts';

test('אותו מספר · לא נחסם', () => {
  assert.equal(phoneChangeBlocked('+972501234567', '+972501234567'), false);
});

test('אותו מספר בכתיב אחר · לא נחסם', () => {
  assert.equal(phoneChangeBlocked('+972501234567', '050-123-4567'), false);
  assert.equal(phoneChangeBlocked('+972501234567', '0501234567'), false);
});

test('מספר אחר · נחסם', () => {
  assert.equal(phoneChangeBlocked('+972501234567', '0529770915'), true);
});

test('ניסיון למחוק את המספר · נחסם', () => {
  assert.equal(phoneChangeBlocked('+972501234567', ''), true);
  assert.equal(phoneChangeBlocked('+972501234567', '   '), true);
});

test('חשבון בלי מספר · מותר להוסיף אחד', () => {
  assert.equal(phoneChangeBlocked(null, '0501234567'), false);
  assert.equal(phoneChangeBlocked('', '0501234567'), false);
});
