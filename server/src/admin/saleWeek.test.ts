import assert from 'node:assert/strict';
import { test } from 'node:test';
import { impliedWeekdayRecord, mergeWeekdayDays } from '../../../mobile/src/data/adminDays.ts';
import { weekdaySale } from '../../../mobile/src/data/saleWeek.ts';

test('שלישי = קוסקוס, שישי = שניצל', () => {
  assert.equal(weekdaySale('2026-09-01'), 'cous');
  assert.equal(weekdaySale('2026-09-04'), 'schn');
  assert.equal(weekdaySale('2026-09-11'), 'schn');
  assert.equal(weekdaySale('2026-09-25'), 'schn');
  assert.equal(weekdaySale('2026-09-29'), 'cous');
  assert.equal(weekdaySale('2026-09-02'), null);
  assert.equal(weekdaySale('2026-09-05'), null);
});

test('מיזוג ממלא שלישי ושישי חסרים ולא דורס שורה קיימת', () => {
  const merged = mergeWeekdayDays({ '2026-09-01': { blocked: true } }, '2026-09-01', '2026-09-04');
  assert.equal(merged['2026-09-01']?.blocked, true);
  assert.equal(merged['2026-09-01']?.sale, undefined);
  assert.equal(merged['2026-09-04']?.sale, 'schn');
  assert.equal(merged['2026-09-04']?.open, false);
  assert.equal(merged['2026-09-02'], undefined);
  assert.equal(impliedWeekdayRecord('2026-09-01')?.sale, 'cous');
  assert.equal(impliedWeekdayRecord('2026-09-03'), null);
});
