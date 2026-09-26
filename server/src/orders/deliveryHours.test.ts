import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  blockedHoursMessage,
  isHourBlocked,
  minutesOf,
  parseBlockedHours,
  validateBlockedHours,
} from './deliveryHours.ts';

test('שעה לדקות · ופסילת קלט פגום', () => {
  assert.equal(minutesOf('00:00'), 0);
  assert.equal(minutesOf('18:30'), 1110);
  assert.equal(minutesOf('23:59'), 1439);
  for (const bad of ['24:00', '18:60', '7:30', '', 'ערב', '18-30']) {
    assert.equal(minutesOf(bad), null, bad);
  }
});

test('הקצוות כלולים · ״18:00 עד 21:00״ חוסם את שניהם', () => {
  const r = [{ from: '18:00', to: '21:00' }];
  assert.equal(isHourBlocked('18:00', r), true);
  assert.equal(isHourBlocked('19:40', r), true);
  assert.equal(isHourBlocked('21:00', r), true);
  assert.equal(isHourBlocked('17:59', r), false);
  assert.equal(isHourBlocked('21:01', r), false);
});

test('כמה טווחים באותו יום', () => {
  const r = [
    { from: '09:00', to: '10:00' },
    { from: '18:00', to: '21:00' },
  ];
  assert.equal(isHourBlocked('09:30', r), true);
  assert.equal(isHourBlocked('12:00', r), false);
  assert.equal(isHourBlocked('20:00', r), true);
});

test('בלי טווחים · שום שעה לא חסומה', () => {
  assert.equal(isHourBlocked('12:00', []), false);
});

test('קלט פגום במסד מדולג ולא חוסם הכול', () => {
  /**
   * ⚠ **זו ההתנהגות החשובה** · שורת JSON מקולקלת לא תסגור את כל
   * המשלוחים של אותו יום בלי שאיש יבין למה.
   */
  assert.deepEqual(parseBlockedHours('לא JSON'), []);
  assert.deepEqual(parseBlockedHours('{}'), []);
  assert.deepEqual(parseBlockedHours('[]'), []);
  assert.deepEqual(parseBlockedHours('[{"from":"25:00","to":"26:00"}]'), []);
  assert.deepEqual(parseBlockedHours('[{"from":"21:00","to":"18:00"}]'), [], 'סוף לפני התחלה');
  assert.deepEqual(parseBlockedHours('[{"from":"18:00","to":"21:00"},{"zzz":1}]'), [
    { from: '18:00', to: '21:00' },
  ]);
});

test('אימות קלט מהניהול · דוחה במקום לדלג', () => {
  assert.deepEqual(validateBlockedHours([]), []);
  assert.deepEqual(validateBlockedHours([{ from: '18:00', to: '21:00' }]), [
    { from: '18:00', to: '21:00' },
  ]);
  assert.equal(validateBlockedHours('לא מערך'), null);
  assert.equal(validateBlockedHours([{ from: '18:00' }]), null);
  assert.equal(validateBlockedHours([{ from: '25:00', to: '26:00' }]), null);
  assert.equal(validateBlockedHours([{ from: '21:00', to: '18:00' }]), null, 'סוף לפני התחלה');
});

test('הנוסח מונה את הטווחים', () => {
  assert.equal(
    blockedHoursMessage([{ from: '18:00', to: '21:00' }]),
    'אין משלוחים בשעות 18:00–21:00 בתאריך הזה',
  );
  assert.ok(blockedHoursMessage([]).length > 0, 'גם בלי טווחים יש מה להגיד');
});
