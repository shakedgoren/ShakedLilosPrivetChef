import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appliesTo, monthsToFill, nextPeriod, sourceOf, startPeriod, MAX_BACKFILL } from './fixedExpenses.ts';

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
