import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  activeCatOf,
  defaultQuota,
  nextQuotas,
  nextWaste,
  shownQuota,
} from '../../../mobile/src/admin/days/quotaMath.ts';
import { CATS } from '../../../mobile/src/data/adminDays.ts';

/**
 * ⚠ **מה הבדיקות האלה שומרות · 29 בספטמבר 2026** · כפתורי המכסה
 * וההורדה חישבו את הערך הבא מתוך הרינדור, ולכן שתי הקשות מהירות
 * חישבו שתיהן מאותו בסיס והשנייה דרסה את הראשונה. החשבון עבר
 * לכאן — פונקציות טהורות שמקבלות את **השורה** ומחזירות מפה חדשה,
 * כדי שאפשר יהיה להפעיל אותן בתוך עדכון המצב ולשרשר.
 */

/** מנה אמיתית מהקוסקוס · המזהים מגיעים מהקנבס */
const DISH = CATS.cous.dishes[0];
const DAY = { sale: 'cous' as const, q: { [DISH.id]: 40 } };

test('הקטגוריה הפעילה · חריגה ביום חסום, אחרת יום המכירה', () => {
  assert.equal(activeCatOf({ sale: 'cous' }), 'cous');
  assert.equal(activeCatOf({ blocked: true, sale: 'cous', except: 'schn' }), 'schn');
  assert.equal(activeCatOf({ blocked: true, sale: 'cous' }), null);
  assert.equal(activeCatOf({}), null);
});

test('⚠ **הקשה ראשונה ממשיכה מהמספר שמוצג** · ולא מאפס', () => {
  /**
   * ⚠ **זו הייתה תקלה אמיתית** · המסך מציג `q[id] ?? ברירת המנה`,
   * אבל החשבון עשה `q[id] ?? 0`. יום שהגיע מהשרת בלי מכסות שמורות
   * הציג 40, ולחיצה אחת על מינוס קפצה ל-0. עכשיו שני הצדדים
   * קוראים את אותו מספר.
   */
  const empty = { sale: 'cous' as const };
  assert.equal(shownQuota(empty, DISH.id), DISH.q);
  assert.equal(nextQuotas(empty, DISH.id, -1)[DISH.id], DISH.q - 1);
  assert.equal(nextQuotas(empty, DISH.id, +1)[DISH.id], DISH.q + 1);
});

test('מכסה · עולה, יורדת, ולא מתחת לאפס', () => {
  assert.equal(nextQuotas(DAY, DISH.id, +5)[DISH.id], 45);
  assert.equal(nextQuotas(DAY, DISH.id, -5)[DISH.id], 35);
  assert.equal(nextQuotas({ ...DAY, q: { [DISH.id]: 0 } }, DISH.id, -1)[DISH.id], 0);
});

test('⚠ **שרשור** · שלוש הקשות רצופות מגיעות ל-43, לא ל-41', () => {
  /**
   * ⚠ **זה מה שנשבר במסך** · כל הקשה מקבלת את התוצאה של הקודמת,
   * בדיוק כמו בתוך עדכון מצב. קודם כל הקשה חישבה מ-40.
   */
  let rec = DAY;
  for (let i = 0; i < 3; i++) rec = { ...rec, q: nextQuotas(rec, DISH.id, +1) };
  assert.equal(rec.q[DISH.id], 43);
});

test('מנה אחת אינה נוגעת באחרות', () => {
  const two = { sale: 'cous' as const, q: { a: 10, b: 20 } };
  assert.deepEqual(nextQuotas(two, 'a', +1), { a: 11, b: 20 });
  assert.deepEqual(two.q, { a: 10, b: 20 }, 'המפה המקורית השתנתה');
});

test('הורדה · לא יורדים מתחת למה שכבר נמכר', () => {
  /* ⚠ 40 במכסה, 35 נמכרו · אפשר להוריד 5 לכל היותר */
  const rec = { ...DAY, sold: { [DISH.id]: 35 } };
  assert.equal(nextWaste(rec, DISH.id, +1)[DISH.id], 1);
  assert.equal(nextWaste({ ...rec, waste: { [DISH.id]: 5 } }, DISH.id, +1)[DISH.id], 5);
  assert.equal(nextWaste({ ...rec, waste: { [DISH.id]: 3 } }, DISH.id, -1)[DISH.id], 2);
  assert.equal(nextWaste({ ...rec, waste: { [DISH.id]: 0 } }, DISH.id, -1)[DISH.id], 0);
});

test('הורדה · שרשור עד התקרה ולא מעבר', () => {
  let rec: Parameters<typeof nextWaste>[0] = { ...DAY, sold: { [DISH.id]: 38 } };
  for (let i = 0; i < 6; i++) rec = { ...rec, waste: nextWaste(rec, DISH.id, +1) };
  assert.equal(rec.waste?.[DISH.id], 2, 'הפער בין 40 ל-38 הוא 2');
});

test('מנה שאינה בקטגוריה · ברירת מחדל אפס ולא קריסה', () => {
  assert.equal(defaultQuota({ sale: 'cous' }, 'אין-מנה-כזו'), 0);
  assert.equal(defaultQuota({}, DISH.id), 0);
  assert.equal(nextQuotas({}, 'אין-מנה-כזו', +1)['אין-מנה-כזו'], 1);
});
