import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { ZodError } from 'zod';
import { PASS_RULE_TEXT } from '../../../mobile/src/auth/passwordRule.ts';
import { HttpError } from '../errors.ts';
import { readResetBody } from './resetBody.ts';
import { maskWho } from './resetLog.ts';

const who = 'shakedliloz@bite-and-tell.com';

test('סיסמה חלשה נדחית עם נוסח הכלל · זה מה שהמסך חייב להראות', () => {
  for (const password of ['changeme', '12345678', 'Abcdefgh', 'abcdefg1', 'Ab1']) {
    assert.throws(
      () => readResetBody({ who, code: '123456', password }),
      (err: unknown) => {
        assert.ok(err instanceof HttpError);
        assert.equal(err.code, 'weak_password');
        assert.equal(err.message, PASS_RULE_TEXT);
        return true;
      },
    );
  }
});

test('סיסמה חזקה מתקבלת כמו שהוקלדה · בלי חיתוך רווחים', () => {
  const password = '  Secret12  ';
  const body = readResetBody({ who, code: '123456', password });
  assert.equal(body.password, password);
  assert.equal(body.code, '123456');
  assert.equal(body.who, who);
});

test('קוד קצר או חסר אינו נחשב סיסמה חלשה', () => {
  assert.throws(() => readResetBody({ who, code: '12', password: 'Secret12' }), ZodError);
  assert.throws(() => readResetBody({ who, password: 'Secret12' }), ZodError);
});

test('היומן לא שומר את הכתובת המלאה', () => {
  const masked = maskWho('shakedliloz@bite-and-tell.com');
  assert.equal(masked.includes('shakedliloz'), false);
  assert.ok(masked.endsWith('@bite-and-tell.com'));
  assert.equal(maskWho('0525056708').includes('5056708'), false);
});

function handlerOf(src: string, path: string): string {
  const open = src.indexOf(`authRouter.post('${path}'`);
  assert.notEqual(open, -1, path);
  const next = src.indexOf('authRouter.post(', open + 20);
  return src.slice(open, next === -1 ? src.length : next);
}

test('מסלול האיפוס בודק קוד, שומר סיסמה, ומחכה ל-SMTP לפני התשובה', () => {
  const src = readFileSync(new URL('../routes/auth.ts', import.meta.url), 'utf8');
  const reset = handlerOf(src, '/reset-password');
  assert.ok(reset.includes('readResetBody'), 'האיפוס לא עובר דרך בדיקת הסיסמה');
  assert.ok(reset.includes('checkResetCode'), 'האיפוס לא בודק את הקוד');
  assert.ok(reset.includes('hashPassword'), 'האיפוס לא שומר סיסמה');
  assert.ok(!reset.includes('loginBody'), 'האיפוס לא אמור לאמת כמו כניסה');

  const forgot = handlerOf(src, '/forgot-password');
  const sendAt = forgot.indexOf('await sendMail');
  const replyAt = forgot.lastIndexOf('res.json');
  assert.ok(sendAt !== -1 && sendAt < replyAt, 'התשובה יוצאת לפני ש-SMTP מסיים');
  assert.ok(forgot.includes('smtpMs'), 'אין מדידה של זמן ה-SMTP ביומן');
});
