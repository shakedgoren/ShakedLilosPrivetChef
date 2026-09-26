import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PASS_MIN,
  PASS_RULE_TEXT,
  isStrongPassword,
  passwordProblems,
} from '../../../mobile/src/auth/passwordRule.ts';

/**
 * ⚠ **למה הבדיקה הזו קיימת** · הכלל היה כתוב פעמיים ולא אותו דבר:
 * באפליקציה שמונה תווים, בשרת שישה. כלומר סיסמה בת שבעה תווים
 * נדחתה במסך ונכתבה למסד דרך ה-API. עכשיו שני הצדדים מייבאים את
 * אותו קובץ, והבדיקות כאן שומרות על ההתנהגות שלו.
 */

test('הדרישה של שקד · שמונה תווים, גדולה, קטנה וספרה', () => {
  assert.equal(PASS_MIN, 8);
  assert.ok(isStrongPassword('Shaked12'));
  assert.ok(isStrongPassword('aB3aaaaa'));
});

test('כל דרישה חסרה מדווחת בנפרד', () => {
  assert.deepEqual(passwordProblems('Shaked12'), []);
  assert.deepEqual(passwordProblems('shaked12'), ['אות גדולה באנגלית']);
  assert.deepEqual(passwordProblems('SHAKED12'), ['אות קטנה באנגלית']);
  assert.deepEqual(passwordProblems('ShakedAb'), ['ספרה אחת']);
  assert.deepEqual(passwordProblems('Sh1'), [`לפחות ${PASS_MIN} תווים`]);
});

test('סיסמה ריקה מדווחת על הכול', () => {
  assert.deepEqual(passwordProblems(''), [
    `לפחות ${PASS_MIN} תווים`,
    'אות גדולה באנגלית',
    'אות קטנה באנגלית',
    'ספרה אחת',
  ]);
});

test('שבעה תווים נדחים · זו הפרצה שהייתה בין המסך לשרת', () => {
  assert.equal(isStrongPassword('Shaked1'), false);
  assert.equal(isStrongPassword('Shaked12'), true);
});

test('עברית לבדה אינה עומדת בכלל', () => {
  /* ⚠ ראו הפתק ב-`passwordRule` · ״אות קטנה בעברית״ אינה ניתנת
     לבדיקה, ולכן הכלל דורש אותיות אנגליות. סיסמה עברית בלבד
     נופלת על שתי הדרישות האלה — וזו התנהגות מכוונת. */
  assert.deepEqual(passwordProblems('שקדגורן12'), [
    'אות גדולה באנגלית',
    'אות קטנה באנגלית',
  ]);
});

test('נוסח הכלל מזכיר את כל הדרישות', () => {
  for (const bit of [String(PASS_MIN), 'גדולה', 'קטנה', 'ספרה']) {
    assert.ok(PASS_RULE_TEXT.includes(bit), `חסר ב-PASS_RULE_TEXT: ${bit}`);
  }
});
