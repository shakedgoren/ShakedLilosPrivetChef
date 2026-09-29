import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  HOURS,
  hourLabel,
  hoursOf,
  hoursSummary,
  rangesOf,
  toggleHourIn,
} from '../../../mobile/src/admin/days/blockedHours.ts';
import {
  isHourBlocked,
  parseBlockedHours,
  validateBlockedHours,
} from '../orders/deliveryHours.ts';

/**
 * ⚠ **מה הבדיקות האלה שומרות · 29 בספטמבר 2026** · מסך הניהול
 * מדבר בשעות עגולות (צ׳יפים), והמסד מדבר בטווחים. הקובץ שביניהם
 * הוא `blockedHours.ts` באפליקציה, והבדיקות כאן מוודאות שמה
 * שהמסך מראה הוא בדיוק מה שהשרת יאכוף — משני הכיוונים.
 */

test('שעות רצופות מתמזגות לטווח אחד', () => {
  assert.deepEqual(rangesOf([18, 19, 20]), [{ from: '18:00', to: '20:59' }]);
  assert.deepEqual(rangesOf([18]), [{ from: '18:00', to: '18:59' }]);
  assert.deepEqual(rangesOf([]), []);
});

test('שעות מפוצלות נשמרות כשני טווחים', () => {
  assert.deepEqual(rangesOf([9, 18, 19]), [
    { from: '09:00', to: '09:59' },
    { from: '18:00', to: '19:59' },
  ]);
});

test('סדר ההקשות אינו משנה · והכפילות נבלעת', () => {
  assert.deepEqual(rangesOf([20, 18, 19, 18]), [{ from: '18:00', to: '20:59' }]);
});

test('הלוך ושוב · מה שנשמר חוזר לאותם צ׳יפים', () => {
  for (const hours of [[], [7], [18, 19, 20], [9, 12, 13, 20]]) {
    assert.deepEqual(hoursOf(rangesOf(hours)), hours, JSON.stringify(hours));
  }
});

test('⚠ **ההסכמה עם השרת** · מה שהמסך מדליק הוא מה שייחסם', () => {
  /**
   * ⚠ **זו הבדיקה שבאמת חשובה** · המסך והשרת הם שני קבצים נפרדים
   * עם שני ייצוגים שונים. כאן ההמרה של המסך עוברת דרך `JSON`
   * ודרך `parseBlockedHours` של השרת, בדיוק כמו במציאות, ואז
   * נשאלת `isHourBlocked` על כל חצי שעה ביום.
   */
  const picked = [18, 19, 20];
  const stored = JSON.stringify(rangesOf(picked));
  const ranges = parseBlockedHours(stored);

  for (let h = 0; h < 24; h++) {
    for (const mm of ['00', '30', '59']) {
      const t = `${String(h).padStart(2, '0')}:${mm}`;
      assert.equal(isHourBlocked(t, ranges), picked.includes(h), `${t} · המסך והשרת חלוקים`);
    }
  }
});

test('שעה בודדת חוסמת את כל השעה ולא את הבאה', () => {
  const ranges = parseBlockedHours(JSON.stringify(rangesOf([18])));
  assert.equal(isHourBlocked('18:00', ranges), true);
  assert.equal(isHourBlocked('18:40', ranges), true);
  assert.equal(isHourBlocked('18:59', ranges), true);
  assert.equal(isHourBlocked('19:00', ranges), false, 'החסימה דלפה לשעה הבאה');
  assert.equal(isHourBlocked('17:59', ranges), false);
});

test('הקשה מדליקה ומכבה · בלי לשנות את הקיים', () => {
  const before = [18, 19];
  assert.deepEqual(toggleHourIn(before, 20), [18, 19, 20]);
  assert.deepEqual(toggleHourIn(before, 18), [19]);
  assert.deepEqual(before, [18, 19], 'המערך המקורי השתנה');
});

test('טווח שנכתב מול ה-API מתורגם לשעות שלמות', () => {
  /* ⚠ ההתעגלות מתועדת ב-`blockedHours.ts` · 21:00 חסומה, ולכן
     השעה 21 נדלקת במסך */
  assert.deepEqual(hoursOf([{ from: '18:00', to: '21:00' }]), [18, 19, 20, 21]);
  assert.deepEqual(hoursOf([{ from: '25:00', to: '26:00' }]), [], 'קלט פגום הדליק שעות');
  assert.deepEqual(hoursOf([{ from: '21:00', to: '18:00' }]), [], 'סוף לפני התחלה');
});

test('רשימת השעות מכסה את כל חלונות המסירה', () => {
  /**
   * ⚠ מגשי פירות נמסרים 07:00–20:00, וזה הרחב מכולם. מארזים ושף
   * 09:00–15:00, שישניצל 11:00–15:00, קוסקוס 12:00–14:00.
   */
  assert.equal(HOURS[0], 7);
  assert.equal(HOURS[HOURS.length - 1], 20);
  assert.equal(HOURS.length, 14);
  assert.equal(hourLabel(7), '07:00');
  assert.equal(hourLabel(20), '20:00');
});

test('שורת הסיכום אומרת מתי המשלוחים חוזרים', () => {
  assert.equal(hoursSummary([]), 'כל שעות המשלוח פתוחות');
  assert.equal(hoursSummary([18]), 'אין משלוחים ב-18:00');
  assert.equal(hoursSummary([18, 19, 20]), 'אין משלוחים בין 18:00 ל-21:00');
  assert.equal(hoursSummary([9, 18, 19]), 'אין משלוחים ב-09:00 · בין 18:00 ל-20:00');
});

test('⚠ **המסלול מקבל את מה שהמסך שולח** · לכל צירוף שעות', () => {
  /**
   * ⚠ **הפער שזה סוגר** · `PUT /admin/days/:date` מאמת דרך
   * `validateBlockedHours`, שהוא **לא** אותו קוד של
   * `parseBlockedHours`. הוא **דוחה** קלט פגום במקום לדלג עליו,
   * ולכן די בטווח אחד שהוא לא אוהב כדי שכל השמירה מהמסך תיפול
   * עם ״טווח שעות לא תקין״ — והמסך יראה כאילו כלום לא קרה.
   *
   * כאן עוברים על **כל** תת-קבוצה אפשרית של שעות (16,384 צירופים)
   * ומוודאים ששלוש הדרישות מתקיימות: המסלול מקבל, המסד מחזיר,
   * והצ׳יפים חוזרים בדיוק כפי שנלחצו.
   */
  const n = HOURS.length;
  for (let mask = 0; mask < 1 << n; mask++) {
    const picked = HOURS.filter((_, i) => mask & (1 << i));
    const sent = rangesOf(picked);
    const ok = validateBlockedHours(sent);
    assert.ok(ok, `המסלול דחה: ${JSON.stringify(sent)}`);
    assert.deepEqual(hoursOf(parseBlockedHours(JSON.stringify(ok))), picked);
  }
});
