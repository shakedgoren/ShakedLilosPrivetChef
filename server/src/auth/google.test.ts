import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseTestGoogleToken } from './google.ts';

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
