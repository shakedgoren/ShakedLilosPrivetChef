import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  appliesTo, monthsToFill, nextPeriod, nextYearPeriod, nextOf,
  sourceOf, startPeriod, MAX_BACKFILL,
} from './fixedExpenses.ts';

const fixed = (over = {}) => ({ id: 'f1', fromPeriod: '2026-09', untilPeriod: '', lastPeriod: '', ...over });

test('חלה מהחודש שהוגדר והלאה', () => {
  assert.equal(appliesTo(fixed(), '2026-09'), true);
  assert.equal(appliesTo(fixed(), '2026-12'), true);
  assert.equal(appliesTo(fixed(), '2027-03'), true);
});

test('לא חלה על חודשים שלפני ההגדרה', () => {
  assert.equal(appliesTo(fixed(), '2026-08'), false);
  assert.equal(appliesTo(fixed(), '2025-12'), false);
});

test('חודש סיום חוסם את מה שאחריו · וכולל את עצמו', () => {
  const f = fixed({ untilPeriod: '2026-11' });
  assert.equal(appliesTo(f, '2026-11'), true);
  assert.equal(appliesTo(f, '2026-12'), false);
});

test('החודשים שצריך למלא · מההתחלה ועד החודש הנוכחי, כולל', () => {
  assert.deepEqual(monthsToFill('2026-09', '2026-12'), ['2026-09', '2026-10', '2026-11', '2026-12']);
});

test('אותו חודש · חודש אחד', () => {
  assert.deepEqual(monthsToFill('2026-09', '2026-09'), ['2026-09']);
});

test('חוצה שנה', () => {
  assert.deepEqual(monthsToFill('2026-11', '2027-02'), ['2026-11', '2026-12', '2027-01', '2027-02']);
});

test('התחלה בעתיד · אין מה למלא', () => {
  assert.deepEqual(monthsToFill('2027-01', '2026-12'), []);
});

test('לא ממלא אחורה בלי גבול · תקרה', () => {
  const list = monthsToFill('2000-01', '2026-12');
  assert.equal(list.length, MAX_BACKFILL);
  assert.equal(list[list.length - 1], '2026-12');
});

test('המקור מזהה את התבנית שיצרה את השורה', () => {
  assert.equal(sourceOf('f1'), 'fixed:f1');
  assert.notEqual(sourceOf('f1'), sourceOf('f2'));
});

test('החודש שאחרי · כולל מעבר שנה', () => {
  assert.equal(nextPeriod('2026-09'), '2026-10');
  assert.equal(nextPeriod('2026-12'), '2027-01');
});

test('בלי סמן · מתחילים מהחודש שהוגדר', () => {
  assert.equal(startPeriod(fixed()), '2026-09');
});

test('עם סמן · מתחילים מהחודש שאחריו · מחיקה ידנית נשארת מחוקה', () => {
  assert.equal(startPeriod(fixed({ lastPeriod: '2026-11' })), '2026-12');
});

/* ==========================================================================
   הוצאה שנתית · בקשת שקד מ-23 בספטמבר 2026
   ⚠ הסכנה היחידה כאן היא שתבנית שנתית תירשם שתים־עשרה פעמים בשנה.
   ========================================================================== */

const yearly = (over = {}) => ({
  id: 'y1', fromPeriod: '2026-03', untilPeriod: '', lastPeriod: '', every: 'year' as const, ...over,
});

test('שנתי · אותו חודש בשנה הבאה', () => {
  assert.equal(nextYearPeriod('2026-03'), '2027-03');
  assert.equal(nextYearPeriod('2026-12'), '2027-12');
});

test('שנתי · המחזור הבא מדלג שנה, חודשי מדלג חודש', () => {
  assert.equal(nextOf('2026-03', 'year'), '2027-03');
  assert.equal(nextOf('2026-03', 'month'), '2026-04');
});

test('שנתי · חל רק על חודש המחזור', () => {
  assert.equal(appliesTo(yearly(), '2026-03'), true);
  assert.equal(appliesTo(yearly(), '2027-03'), true);
  assert.equal(appliesTo(yearly(), '2026-04'), false);
  assert.equal(appliesTo(yearly(), '2026-12'), false);
});

test('שנתי · לא חל לפני חודש ההתחלה גם באותו חודש־שנה קודם', () => {
  assert.equal(appliesTo(yearly(), '2025-03'), false);
});

test('שנתי · מכבד את חודש הסיום', () => {
  assert.equal(appliesTo(yearly({ untilPeriod: '2027-01' }), '2027-03'), false);
  assert.equal(appliesTo(yearly({ untilPeriod: '2027-06' }), '2027-03'), true);
});

test('שנתי · הרשימה למילוי כוללת רק את חודש המחזור', () => {
  const list = monthsToFill('2026-03', '2028-05', 'year');
  assert.deepEqual(list, ['2026-03', '2027-03', '2028-03']);
});

test('חודשי · ההתנהגות לא השתנתה', () => {
  const list = monthsToFill('2026-09', '2026-12');
  assert.deepEqual(list, ['2026-09', '2026-10', '2026-11', '2026-12']);
});

test('שנתי · הסמן מקדם שנה ולא חודש', () => {
  assert.equal(startPeriod(yearly({ lastPeriod: '2026-03' })), '2027-03');
});

test('בלי every · מתנהג כחודשי · תבניות קיימות לא נשברות', () => {
  const legacy = { id: 'f1', fromPeriod: '2026-09', untilPeriod: '', lastPeriod: '2026-09' };
  assert.equal(startPeriod(legacy), '2026-10');
  assert.equal(appliesTo(legacy, '2026-10'), true);
});
