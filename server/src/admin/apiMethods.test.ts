import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

/**
 * שמירה על שיטת הבקשה בקריאות של צד הלקוח.
 *
 * ⚠ **באג אמיתי שנתפס מאוחר מדי** · `api()` שולח GET כשאין גוף
 * לבקשה. `adminCloseShop` לא העביר לא גוף ולא `method`, ולכן
 * ״סגירת הרשימה״ יצאה כ-GET אל נתיב שרשום כ-POST — אקספרס החזיר
 * 404, ושקד ראתה ״אין רשימת קניות פתוחה לסגירה״ מול רשימה פתוחה.
 *
 * בדיקת העשן לא תפסה את זה כי היא קראה לנתיב ישירות עם POST
 * משלה, ולא דרך הפונקציה שהאפליקציה משתמשת בה. הבדיקה כאן סורקת
 * את קובץ הלקוח ומוודאת שכל נתיב שהשרת רושם כ-POST/PATCH/DELETE
 * נקרא עם `method` מפורש או עם גוף.
 */
const ADMIN_API = new URL('../../../mobile/src/api/admin.ts', import.meta.url).pathname;
const ROUTE_FILES = ['admin.ts', 'adminShop.ts', 'adminStock.ts', 'adminDays.ts', 'adminFinance.ts'];

/**
 * נתיבי השרת לפי שיטה · שם הראוטר קובע את הקידומת.
 *
 * ⚠ **נתיב שיש לו גם GET אינו נחשב** · `/admin/stock/supply`
 * רשום גם כ-GET (שליפה) וגם כ-POST (הוספה), ולכן קריאה בלי
 * `method` היא שליפה לגיטימית ולא באג.
 */
function routesBy(method: 'get' | 'write'): string[] {
  const prefix: Record<string, string> = {
    'admin.ts': '/admin',
    'adminShop.ts': '/admin/shop',
    'adminStock.ts': '/admin/stock',
    'adminDays.ts': '/admin/days',
    'adminFinance.ts': '/admin',
  };
  const out: string[] = [];
  for (const f of ROUTE_FILES) {
    const src = readFileSync(new URL(`../routes/${f}`, import.meta.url).pathname, 'utf8');
    const re = method === 'get' ? /Router\.get\(\s*'([^']+)'/g : /Router\.(?:post|patch|put|delete)\(\s*'([^']+)'/g;
    for (const m of src.matchAll(re)) {
      out.push((prefix[f] + m[1]).replace(/\/$/, ''));
    }
  }
  return out;
}

test('כל קריאה לנתיב כותב נושאת method או גוף', () => {
  const client = readFileSync(ADMIN_API, 'utf8');
  const gets = new Set(routesBy('get'));
  /* רק נתיבים שאין להם GET כלל · אחרת קריאה בלי method היא שליפה */
  const writes = routesBy('write').filter((r) => !gets.has(r));
  const bad: string[] = [];

  /* כל קריאת api בקובץ הלקוח · הנתיב והאפשרויות שאחריו */
  for (const m of client.matchAll(/api<[^>]*>\(\s*(`[^`]*`|'[^']*')\s*(,\s*\{[\s\S]*?\})?\s*\)/g)) {
    const path = m[1].slice(1, -1).replace(/\$\{[^}]*\}/g, ':p').split('?')[0].replace(/\/$/, '');
    const opts = m[2] ?? '';
    const isWrite = writes.some((r) => {
      const pattern = '^' + r.replace(/:[^/]+/g, '[^/]+') + '$';
      return new RegExp(pattern).test(path.replace(/:p/g, 'x'));
    });
    if (!isWrite) continue;
    if (!/method\s*:/.test(opts) && !/body\s*:/.test(opts)) bad.push(path);
  }

  assert.deepEqual(bad, [], `נתיבים שנשלחים כ-GET בטעות: ${bad.join(', ')}`);
});

test('הבדיקה באמת מזהה נתיב כותב', () => {
  /* ⚠ שמירה על הבדיקה עצמה · אם רשימת הנתיבים תתרוקן היא תעבור לשווא */
  const gets = new Set(routesBy('get'));
  const writes = routesBy('write').filter((r) => !gets.has(r));
  assert.ok(writes.length > 5, `נמצאו ${writes.length} נתיבים כותבים בלבד`);
  assert.ok(writes.includes('/admin/shop/active/close'), 'נתיב סגירת הרשימה לא נמצא');
});
