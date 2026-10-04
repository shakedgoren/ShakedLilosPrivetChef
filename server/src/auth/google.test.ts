import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { decideGoogleAccount, type GoogleAccount } from './googleAccount.ts';
import { parseTestGoogleToken, type GoogleProfile } from './google.ts';

test('טוקן בדיקה · לא בפורמט', () => {
  assert.equal(parseTestGoogleToken('ya29.real'), null);
  assert.equal(parseTestGoogleToken('test:'), null);
});

test('טוקן בדיקה · googleId + אימייל + שם', () => {
  const p = parseTestGoogleToken('test:gid-1:galia@example.com:גליה כהן');
  assert.ok(p);
  assert.equal(p.googleId, 'gid-1');
  assert.equal(p.email, 'galia@example.com');
  assert.equal(p.name, 'גליה כהן');
});

const profile: GoogleProfile = {
  googleId: 'gid-1',
  email: 'galia@example.com',
  name: 'גליה כהן',
  picture: 'https://example.com/p.png',
};

function account(over: Partial<GoogleAccount> = {}): GoogleAccount {
  return {
    id: 'user-1',
    googleId: null,
    email: 'galia@example.com',
    name: 'גליה',
    avatarUrl: '',
    phone: '0525056708',
    ...over,
  };
}

test('מזהה גוגל קיים · כניסה, בלי חשבון חדש', () => {
  const decision = decideGoogleAccount(profile, account({ googleId: 'gid-1' }), null);
  assert.equal(decision.kind, 'login');
  if (decision.kind !== 'login') return;
  assert.equal(decision.userId, 'user-1');
  assert.equal(decision.patch.googleId, undefined);
  assert.equal('id' in decision, false);
});

test('חשבון טלפון עם אותו אימייל · קישור ולא שכפול', () => {
  const decision = decideGoogleAccount(profile, null, account());
  assert.equal(decision.kind, 'login');
  if (decision.kind !== 'login') return;
  assert.equal(decision.userId, 'user-1');
  assert.equal(decision.patch.googleId, 'gid-1');
  assert.equal(decision.patch.name, undefined);
});

test('אין חשבון · הרשמה, בלי מזהה משתמש', () => {
  const decision = decideGoogleAccount(profile, null, null);
  assert.deepEqual(decision, { kind: 'signup' });
});

test('אימייל שכבר קשור לגוגל אחר · לא נכנסים ולא משכפלים', () => {
  const decision = decideGoogleAccount(profile, null, account({ googleId: 'other-gid' }));
  assert.equal(decision.kind, 'conflict');
});

test('מזהה גוגל קיים לא נמשך לחשבון אחר עם אותו אימייל', () => {
  const decision = decideGoogleAccount(
    profile,
    account({ id: 'google-user', googleId: 'gid-1', email: null, name: '' }),
    account({ id: 'email-user' }),
  );
  assert.equal(decision.kind, 'login');
  if (decision.kind !== 'login') return;
  assert.equal(decision.userId, 'google-user');
  assert.equal(decision.patch.email, undefined);
  assert.equal(decision.patch.name, 'גליה כהן');
});

test('מסלול /google אינו יוצר משתמש לפני אימות טלפון', () => {
  const src = readFileSync(new URL('../routes/auth.ts', import.meta.url), 'utf8');
  const open = src.indexOf("authRouter.post('/google'");
  assert.notEqual(open, -1);
  const next = src.indexOf('authRouter.', open + 20);
  const handler = src.slice(open, next === -1 ? src.length : next);
  assert.equal(handler.includes('user.create'), false);
  assert.ok(handler.includes('needsSignup'));
  assert.ok(handler.includes('matchGoogleAccount'));
});
