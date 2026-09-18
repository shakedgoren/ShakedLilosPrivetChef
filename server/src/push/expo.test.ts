import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isExpoToken } from './expo.ts';

/**
 * ⚠ **השומר הזה אינו קוסמטי** · Expo מחזיר 400 על **כל הקבוצה**
 * כשאסימון אחד בה פגום, ואז אף אחת מהלקוחות לא מקבלת התראה.
 */
test('אסימון דחיפה · רק הצורה של Expo מתקבלת', () => {
  assert.equal(isExpoToken('ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'), true);
  assert.equal(isExpoToken('ExpoPushToken[xxxxxxxxxxxxxxxxxxxxxx]'), true);
  assert.equal(isExpoToken('  ExponentPushToken[abc]  '), true);

  assert.equal(isExpoToken(''), false);
  assert.equal(isExpoToken('ExponentPushToken[]'), false);
  assert.equal(isExpoToken('ExponentPushToken abc'), false);
  /* אסימון גולמי של אפל · תקין כשלעצמו, אבל לא מה ש-Expo מקבל */
  assert.equal(isExpoToken('740f4707bebcf74f9b7c25d48e3358945f6aa01da5ddb387462c7eaf61bb78ad'), false);
});
