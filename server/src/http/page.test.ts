import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PAGE_DEFAULT, PAGE_MAX, readPage } from './page.ts';

test('תיחום רשימות · ברירת מחדל, תקרה וקלט זבל', () => {
  assert.deepEqual(readPage({}), { take: PAGE_DEFAULT, skip: 0 });
  assert.deepEqual(readPage({ limit: '20', skip: '40' }), { take: 20, skip: 40 });
  /* ⚠ התקרה קשיחה · זו כל הנקודה */
  assert.equal(readPage({ limit: '99999' }).take, PAGE_MAX);
  /* קלט זבל לא מפיל ולא פותח את הגבול */
  for (const bad of ['', 'abc', '-5', '0', 'NaN', undefined]) {
    assert.equal(readPage({ limit: bad }).take, PAGE_DEFAULT, String(bad));
  }
  for (const bad of ['-9', 'abc', undefined]) {
    assert.equal(readPage({ skip: bad }).skip, 0, String(bad));
  }
  /* ברירת מחדל אחרת למי שצריך */
  assert.equal(readPage({}, 50).take, 50);
});
