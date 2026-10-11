import assert from 'node:assert/strict';
import { test } from 'node:test';
import { impliedWeekdayRecord, mergeWeekdayDays } from '../../../mobile/src/data/adminDays.ts';
import { nextSaleDate, saleWindow, upcomingSale, weekdaySale } from '../../../mobile/src/data/saleWeek.ts';

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

/**
 * ⚠ **החוק של שקד · 18 בספטמבר 2026** · בלשונה: ״מיום שבת בשעה
 * 07:00 בבוקר עד רביעי ב-07:00 יופיע המכירה של הקוסקוס… מיום
 * רביעי ב-07:00 בבוקר ועד שבת ב-07:00 בבוקר יופיע המכירה של
 * השניצל״.
 */
test('חלון המכירה · שבת 07:00 עד רביעי 07:00 קוסקוס, ומשם שניצל', () => {
  const at = (d: number, h: number, m = 0) => new Date(2026, 8, d, h, m);

  /* --- גבול שבת 07:00 · 19.9.2026 --- */
  /* רגע לפני · עדיין הזנב של השניצל של שישי שעבר */
  assert.deepEqual(upcomingSale(at(19, 6, 59)), { cat: 'schn', date: '2026-09-18' });
  /* בדיוק ב-07:00 · עובר לקוסקוס של שלישי הבא */
  assert.deepEqual(upcomingSale(at(19, 7, 0)), { cat: 'cous', date: '2026-09-22' });

  /* --- כל חלון הקוסקוס · שבת → רביעי --- */
  for (const [d, h] of [[19, 12], [20, 9], [21, 23], [22, 6], [22, 20], [23, 6]] as const) {
    assert.deepEqual(upcomingSale(at(d, h)), { cat: 'cous', date: '2026-09-22' }, `${d}/9 ${h}:00`);
  }

  /* --- גבול רביעי 07:00 · 23.9.2026 --- */
  assert.deepEqual(upcomingSale(at(23, 6, 59)), { cat: 'cous', date: '2026-09-22' });
  assert.deepEqual(upcomingSale(at(23, 7, 0)), { cat: 'schn', date: '2026-09-25' });

  /* --- כל חלון השניצל · רביעי → שבת --- */
  for (const [d, h] of [[23, 8], [24, 15], [25, 6], [25, 22], [26, 6]] as const) {
    assert.deepEqual(upcomingSale(at(d, h)), { cat: 'schn', date: '2026-09-25' }, `${d}/9 ${h}:00`);
  }

  /* ⚠ הזנב · אחרי המכירה ולפני גבול החלון התאריך הוא **אתמול** */
  assert.deepEqual(upcomingSale(at(26, 6, 30)), { cat: 'schn', date: '2026-09-25' });
  assert.deepEqual(upcomingSale(at(23, 6, 30)), { cat: 'cous', date: '2026-09-22' });
});

test('גבולות החלון · תחילה וסוף', () => {
  const w1 = saleWindow(new Date(2026, 8, 20, 10, 0));
  assert.deepEqual(w1, { cat: 'cous', date: '2026-09-22', start: '2026-09-19', end: '2026-09-23' });
  const w2 = saleWindow(new Date(2026, 8, 24, 10, 0));
  assert.deepEqual(w2, { cat: 'schn', date: '2026-09-25', start: '2026-09-23', end: '2026-09-26' });
});

/**
 * ⚠ **מה זה שומר · 11 באוקטובר 2026** · מסכי הקוסקוס והשניצל
 * הציגו תאריך קבוע מהקנבס (״שלישי · 25 באוגוסט״, ״שישי · 28
 * באוגוסט״), ולקוחה באוקטובר ראתה תאריך מלפני חודשיים. במקומו
 * נכנס `nextSaleDate`, והמלכודת בו היא שהוא **אינו** `upcomingSale`:
 * ביום חמישי החלון הוא של השניצל, אבל מסך הקוסקוס עדיין צריך
 * לומר ״שלישי הבא״ ולא ״שישי״.
 */
test('יום המכירה הקרוב של כל קטגוריה · גם כשהחלון של השנייה', () => {
  const at = (d: number, h: number) => new Date(2026, 8, d, h);

  /* ראשון 20.9 · בתוך החלון של הקוסקוס (שלישי 22.9) */
  assert.equal(nextSaleDate('cous', at(20, 10)), '2026-09-22');
  /* ובאותו רגע · השניצל הקרוב הוא שישי 25.9 */
  assert.equal(nextSaleDate('schn', at(20, 10)), '2026-09-25');

  /* חמישי 24.9 · בתוך החלון של השניצל (שישי 25.9) */
  assert.equal(nextSaleDate('schn', at(24, 10)), '2026-09-25');
  /* ⚠ כאן נופל `upcomingSale` · הוא היה עונה ״שישי״ גם לקוסקוס */
  assert.deepEqual(upcomingSale(at(24, 10)), { cat: 'schn', date: '2026-09-25' });
  assert.equal(nextSaleDate('cous', at(24, 10)), '2026-09-29');

  /* רביעי 23.9 ב-06:59 · עוד החלון של הקוסקוס, ובשבע כבר שניצל */
  assert.equal(nextSaleDate('cous', new Date(2026, 8, 23, 6, 59)), '2026-09-22');
  assert.equal(nextSaleDate('cous', new Date(2026, 8, 23, 7, 0)), '2026-09-29');
});

test('שני הצדדים תמיד ביום הנכון בשבוע', () => {
  for (let d = 1; d <= 30; d += 1) {
    for (const h of [0, 6, 7, 13, 23]) {
      const now = new Date(2026, 8, d, h);
      assert.equal(weekdaySale(nextSaleDate('cous', now)), 'cous', `cous ${d}/${h}`);
      assert.equal(weekdaySale(nextSaleDate('schn', now)), 'schn', `schn ${d}/${h}`);
    }
  }
});
