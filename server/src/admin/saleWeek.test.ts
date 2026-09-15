import assert from 'node:assert/strict';
import { test } from 'node:test';
import { impliedWeekdayRecord, mergeWeekdayDays } from '../../../mobile/src/data/adminDays.ts';
import { upcomingSale, weekdaySale } from '../../../mobile/src/data/saleWeek.ts';

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

test('חלון יום המכירה · שישי 18:00 עד שלישי 18:00 קוסקוס, ומשם שניצל', () => {
  /* שלישי 15.9.2026 · לפני 18:00 עדיין קוסקוס, והתאריך הוא היום */
  assert.deepEqual(upcomingSale(new Date(2026, 8, 15, 17, 59)), { cat: 'cous', date: '2026-09-15' });
  /* אותו שלישי אחרי 18:00 · כבר שניצל של יום שישי */
  assert.deepEqual(upcomingSale(new Date(2026, 8, 15, 18, 0)), { cat: 'schn', date: '2026-09-18' });
  /* שישי לפני 18:00 · עדיין השניצל של היום */
  assert.deepEqual(upcomingSale(new Date(2026, 8, 18, 17, 30)), { cat: 'schn', date: '2026-09-18' });
  /* שישי אחרי 18:00 · הקוסקוס של שלישי הבא */
  assert.deepEqual(upcomingSale(new Date(2026, 8, 18, 18, 1)), { cat: 'cous', date: '2026-09-22' });
  /* שבת, ראשון ושני · כולם בחלון הקוסקוס */
  assert.deepEqual(upcomingSale(new Date(2026, 8, 19, 9, 0)), { cat: 'cous', date: '2026-09-22' });
  assert.deepEqual(upcomingSale(new Date(2026, 8, 21, 23, 0)), { cat: 'cous', date: '2026-09-22' });
  /* רביעי · בחלון השניצל */
  assert.deepEqual(upcomingSale(new Date(2026, 8, 16, 8, 0)), { cat: 'schn', date: '2026-09-18' });
});
