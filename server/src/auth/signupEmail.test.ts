import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signupEmail } from './signupEmail.ts';

const byPhone = { kind: 'phone', phone: '0501234567' } as const;
const byMail = { kind: 'email', email: 'a@b.com' } as const;

test('הרשמה בטלפון שומרת את המייל שהוקלד בטופס', () => {
  assert.equal(signupEmail(byPhone, 'shaked@mail.com', false), 'shaked@mail.com');
});

test('רווחים מסביב למייל נגזרים', () => {
  assert.equal(signupEmail(byPhone, '  shaked@mail.com  ', false), 'shaked@mail.com');
});

test('בלי מייל בטופס · החשבון נפתח בלי מייל ולא נכשל', () => {
  assert.equal(signupEmail(byPhone, '', false), null);
  assert.equal(signupEmail(byPhone, null, false), null);
  assert.equal(signupEmail(byPhone, '   ', false), null);
});

test('מייל תפוס אינו מפיל את ההרשמה · הוא פשוט לא נשמר', () => {
  assert.equal(signupEmail(byPhone, 'shaked@mail.com', true), null);
});

test('בהרשמה באימייל · המזהה גובר על מה שהגיע בגוף הבקשה', () => {
  assert.equal(signupEmail(byMail, 'other@mail.com', false), 'a@b.com');
  assert.equal(signupEmail(byMail, null, true), 'a@b.com');
});
