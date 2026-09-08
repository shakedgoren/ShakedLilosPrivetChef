import fs from 'fs';
import path from 'path';

/**
 * מוודא שכל תמונה בתיקייה נמצאת בשימוש, ושכל שם שהקוד מבקש קיים.
 * הרשימות מגיעות מ-photos.ts עצמו · אין רשימות מוקלדות כאן.
 */
const M = '/Users/shakedgoren/Downloads/files/mobile';
const photos = fs.readFileSync(M + '/src/data/photos.ts', 'utf8');

const known = new Set([...photos.matchAll(/^  '([^']+)': require/gm)].map((h) => h[1]));

/* הקבוצות המיוצאות · שם הקבוצה והשמות שבתוכה */
const groups = {};
for (const h of photos.matchAll(/export const (\w+)[^=]*= (\[[\s\S]*?\]|\{[\s\S]*?\n\})/g))
  groups[h[1]] = [...h[2].matchAll(/['"]([\w-]+)['"]/g)].map((x) => x[1]).filter((n) => known.has(n));

/* כל קוד האפליקציה חוץ מקובץ המפה */
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return /\.tsx?$/.test(e.name) && !p.endsWith('data/photos.ts') ? [p] : [];
  });
const code = walk(M + '/src').map((p) => fs.readFileSync(p, 'utf8')).join('\n') +
  fs.readFileSync(M + '/App.tsx', 'utf8');

const used = new Set();
/* שמות שנכתבו ישירות במחרוזת */
for (const n of known) if (new RegExp(`['"\`]${n}['"\`]`).test(code)) used.add(n);
/* שמות שמגיעים דרך קבוצה שנמצאת בשימוש */
for (const [g, names] of Object.entries(groups))
  if (new RegExp(`\\b${g}\\b`).test(code)) names.forEach((n) => used.add(n));

const unused = [...known].filter((n) => !used.has(n)).sort();
console.log('תמונות בתיקייה:', known.size, '· בשימוש:', used.size);
console.log('קבוצות:', Object.entries(groups).map(([g, v]) => g + '(' + v.length + ')').join(' · '));
if (unused.length) {
  console.log('לא בשימוש:', unused.length);
  for (const n of unused) console.log('   ', n);
} else console.log('✅ כל התמונות בשימוש');
