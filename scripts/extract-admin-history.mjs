import fs from 'fs';

/**
 * חילוץ היסטוריית הקניות מהקנבס.
 * כל קנייה שנסגרה במסך הקניות נשמרת כאן עם השיוך, התאריך והשעה.
 */
const SRC = '/Users/shakedgoren/Downloads/files/design/app/AdminHistory.dc.html';
const OUT = process.env.SP + '/admin-history.json';

const src = fs.readFileSync(SRC, 'utf8');
const js = /<script data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(src)[1];
const markup = src.replace(/<script data-dc-script[\s\S]*?<\/script>/, '');

const NAMES = ['AREAS', 'BUYS'];
const head = js.slice(0, js.indexOf('class Component'));
const mod = head + '\nexport { ' + NAMES.join(', ') + ' };';
const m = await import('data:text/javascript;base64,' + Buffer.from(mod).toString('base64'));
const out = {};
for (const k of NAMES) out[k] = m[k];

const pick = (name) => {
  const hits = [...js.matchAll(new RegExp(name + ":\\s*'([^']*)'", 'g'))];
  if (hits.length !== 1) throw new Error(name + ': ' + hits.length + ' התאמות במקום אחת');
  return hits[0][1];
};
for (const k of ['colName', 'colPrice', 'colQty', 'colSum', 'totalLabel', 'emptyLabel'])
  out[k] = pick(k);

/* תת-הכותרת מורכבת · שני החלקים שסביב הסכום */
const sub = /sub: BUYS\.length \+ '([^']*)' \+ nf\(total\) \+ '([^']*)'/.exec(js);
if (!sub) throw new Error('תת-כותרת: לא נמצאה');
out.subMiddle = sub[1];
out.subSuffix = sub[2];

/* הכותרת · יושבת במרקאפ */
const title = [...markup.matchAll(/>(היסטוריית קניות)<\/div>/g)];
if (title.length !== 1) throw new Error('כותרת: ' + title.length + ' במקום אחת');
out.title = title[0][1];

/* ברירת המחדל של המסנן */
out.startFilter = /filter: '(\w+)'/.exec(js)[1];

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));

const sumOf = (b) => b.rows.reduce((s, r) => s + r.p * r.q, 0);
console.log('שיוכים:', out.AREAS.map((a) => a.n).join(', '), '· ברירת מחדל:', out.startFilter);
console.log('קניות:', out.BUYS.length, '· מצטבר:', out.BUYS.reduce((s, b) => s + sumOf(b), 0), '₪');
for (const b of out.BUYS) console.log('  ', b.d, b.t, '·', b.area, '·', b.rows.length, 'פריטים ·', sumOf(b), '₪');
