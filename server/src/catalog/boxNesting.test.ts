import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  HIDDEN,
  LISTED_BOXES,
  NESTED,
  boxExists,
  canReopen,
  childrenOf,
  parentOf,
} from '../../../mobile/src/screens/boxes/catalog.ts';
import { BOXES, priceOfBox } from '../../../mobile/src/data/boxes.ts';
import { SOON_TABS } from '../../../mobile/src/screens/chef/soon.ts';
import { CHEF_PACKAGES } from '../../../mobile/src/data/chef.ts';

/**
 * ⚠ **מה הבדיקות האלה שומרות · 26 בספטמבר 2026** · שקד ביקשה שני
 * שינויי סידור: ״טעם של שנה טובה״ עובר לתוך ״חלה לכל אירוע״,
 * וכרטיסיית ״סדנאות״ נוספת לפינת השף עם COMING SOON. שני השינויים
 * יושבים בשכבת הרחבה מחוץ לקבצים שנחצבים מהקנבס, ולכן צריך מי
 * שישמור על הכללים שלהם.
 */

test('הבקשה · ״טעם של שנה טובה״ ירד מרשימת הספיישלים', () => {
  assert.equal(parentOf('shana'), 'challah');
  assert.ok(
    !LISTED_BOXES.some((b) => b.key === 'shana'),
    '״טעם של שנה טובה״ עדיין מופיע ברשימה',
  );
});

test('המוצר לא נמחק · הוא עדיין קיים, עדיין 49 ש״ח ועדיין מתומחר', () => {
  /**
   * ⚠ **זו הבדיקה החשובה כאן** · הקריאה האחרת של הבקשה — למזג את
   * המארז לתוך ״סוג האירוע״ — הייתה מוחקת מוצר ומשנה את המחיר
   * מ-49 ש״ח למארז ל-20 ש״ח ליחידה במינימום 25. הבדיקה נופלת אם
   * מישהו יעשה את זה בלי בקשה מפורשת ממנה.
   */
  const shana = BOXES.find((b) => b.key === 'shana');
  assert.ok(shana, '״טעם של שנה טובה״ נעלם מ-`BOXES`');
  assert.equal(shana.price, '49 ש״ח');
  assert.equal(priceOfBox(shana, {}), 49);
  assert.ok(boxExists('shana'));
});

test('הכרטיס נפתח מתוך ״חלה לכל אירוע״', () => {
  const kids = childrenOf('challah');
  assert.deepEqual(
    kids.map((b) => b.key),
    ['shana'],
  );
  /* ⚠ הכרטיס מציג את השם, התיאור והמחיר מהקנבס · לא נוסח חדש */
  assert.equal(kids[0].name, 'טעם של שנה טובה');
  assert.ok(kids[0].desc.length > 0);
});

test('כל מארז מקונן ניתן להגעה · ההורה קיים ומוצג בעצמו', () => {
  /**
   * ⚠ **זו המלכודת** · מארז מקונן נפתח **רק** מתוך ההורה שלו. אם
   * ההורה לא קיים, הוסתר, או הוא עצמו מקונן — המארז הפך בלתי נגיש
   * מכל מסך באפליקציה, בלי שום שגיאה.
   */
  for (const [child, parent] of Object.entries(NESTED)) {
    assert.ok(boxExists(child), `מקונן שלא קיים: ${child}`);
    assert.ok(boxExists(parent), `הורה שלא קיים: ${parent}`);
    assert.ok(!HIDDEN.includes(parent), `ההורה מוסתר · ${child} בלתי נגיש`);
    assert.ok(!NESTED[parent], `קינון בשתי שכבות · ${child} בתוך ${parent}`);
    assert.ok(
      LISTED_BOXES.some((b) => b.key === parent),
      `ההורה אינו ברשימה · ${child} בלתי נגיש`,
    );
  }
});

test('הרשימה לא התרוקנה ולא איבדה את השאר', () => {
  const keys = LISTED_BOXES.map((b) => b.key);
  assert.deepEqual(keys, ['free', 'celebSalads', 'celebMain', 'all', 'challah']);
});

test('לשונית ״סדנאות״ קיימת עם COMING SOON', () => {
  assert.deepEqual(
    SOON_TABS.map((t) => t.name),
    ['סדנאות'],
  );
  assert.equal(SOON_TABS[0].badge, 'COMING SOON');
});

test('לשונית שעוד לא נפתחה אינה חבילה · ואין התנגשות מפתחות', () => {
  /**
   * ⚠ **אינדקס הלשונית** · המסך סופר את הלשוניות האלה **אחרי**
   * החבילות האמיתיות, ולכן `tab` נשאר אינדקס חוקי ל-`openPackage`.
   * מפתח שמופיע בשני הצדדים היה שובר גם את זה וגם את `key` של
   * הרשימה.
   */
  const pkgKeys = CHEF_PACKAGES.map((p) => p.key);
  for (const t of SOON_TABS) {
    assert.ok(!pkgKeys.includes(t.key as never), `מפתח כפול: ${t.key}`);
  }
});

test('״להזמין שוב״ · מקונן נפתח, מוסתר לא, ושטות לא מפילה', () => {
  /**
   * ⚠ **הפרש שנוצר כאן** · ״מוסתר״ ו״מקונן״ הם שני דברים שונים.
   * המוסתר ירד מהמכירה; המקונן עדיין נמכר, רק ממקום אחר. הזמנה
   * ישנה של מקונן חייבת להיפתח.
   */
  assert.equal(canReopen('shana'), true, 'הזמנה ישנה של מקונן לא נפתחת');
  assert.equal(canReopen('challah'), true);
  assert.equal(canReopen('premium'), false, 'מארז מוסתר נפתח');
  assert.equal(canReopen(''), false);
  assert.equal(canReopen('אין-דבר-כזה'), false);
});
