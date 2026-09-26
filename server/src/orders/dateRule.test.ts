import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkOrderDate } from './dateRule.ts';
import { dateOpen } from '../../../mobile/src/data/calendar.ts';

/**
 * ⚠ **מה הבדיקות האלה שומרות** · עד 26 בספטמבר 2026 כלל השבת חי
 * רק באפליקציה. השרת קיבל כל תאריך, כולל שבת וכולל תאריכים
 * שעברו. הבדיקות כאן נופלות אם מישהו יסיר את האכיפה.
 */

/** התאריך הבא ביום שבוע מבוקש · תמיד בעתיד, כדי שהבדיקה לא תתיישן */
function nextDow(dow: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  do {
    d.setDate(d.getDate() + 1);
  } while (d.getDay() !== dow);
  const p = (v: number) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const SATURDAY = 6;
const SUNDAY = 0;
const MONDAY = 1;

test('מגש פירות בשבת · נחסם', () => {
  const err = checkOrderDate(nextDow(SATURDAY), 'fruit');
  assert.equal(err?.code, 'day_blocked');
  assert.equal(err?.message, 'שבת סגורה להזמנות');
});

test('מגש פירות ביום חול · מותר', () => {
  assert.equal(checkOrderDate(nextDow(SUNDAY), 'fruit'), null);
  assert.equal(checkOrderDate(nextDow(MONDAY), 'fruit'), null);
});

test('תאריך שעבר · נחסם בכל קטגוריה', () => {
  const past = '2020-01-01';
  for (const cat of ['fruit', 'chef', 'box']) {
    const err = checkOrderDate(past, cat);
    assert.equal(err?.code, 'day_blocked', cat);
    assert.equal(err?.message, 'התאריך הזה כבר עבר', cat);
  }
});

test('שף ומארזים · זהה בדיוק ל-`dateOpen` של הלוח', () => {
  /**
   * ⚠ **לא תאריך קבוע** · גרסה קודמת של הבדיקה בחרה ״יום שני
   * הבא״ והניחה שהוא פתוח. הוא נפל בתוך טווח חג ב-`BLOCKED_RANGES`
   * — כלומר הבדיקה נשברה על התנהגות **נכונה**. מה שחשוב הוא
   * שהשרת והמסך יגידו את אותו דבר, ולא איזה יום זה.
   */
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  for (let i = 1; i <= 60; i++) {
    d.setDate(d.getDate() + 1);
    const p = (v: number) => String(v).padStart(2, '0');
    const key = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    const openInApp = dateOpen(key);
    for (const cat of ['chef', 'box']) {
      const blocked = checkOrderDate(key, cat) !== null;
      assert.equal(blocked, !openInApp, `${key} ${cat} · המסך והשרת חלוקים`);
    }
  }
});

test('נמצא לפחות יום אחד פתוח ואחד חסום · אחרת הבדיקה למעלה ריקה', () => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  let open = 0;
  let shut = 0;
  for (let i = 1; i <= 60; i++) {
    d.setDate(d.getDate() + 1);
    const p = (v: number) => String(v).padStart(2, '0');
    const key = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    if (checkOrderDate(key, 'chef')) shut += 1;
    else open += 1;
  }
  assert.ok(open > 0, 'אין אף יום פתוח בחודשיים הקרובים');
  assert.ok(shut > 0, 'אין אף יום חסום בחודשיים הקרובים');
});

test('קלט שאינו תאריך · לא נחסם כאן', () => {
  /* ⚠ אימות הפורמט שייך ל-zod במסלול · כאן רק חוקי לוח */
  assert.equal(checkOrderDate('', 'fruit'), null);
  assert.equal(checkOrderDate('מחר', 'fruit'), null);
});
