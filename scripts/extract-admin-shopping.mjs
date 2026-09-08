import fs from 'fs';

/**
 * חילוץ רשימת הקניות מהקנבס.
 * הכל ב-JS: הקבוצות, השיוכים, פנקס המצרכים ורשימת ההדגמה.
 */
const SRC = '/Users/shakedgoren/Downloads/files/design/app/AdminShopping.dc.html';
const OUT = process.env.SP + '/admin-shopping.json';

const src = fs.readFileSync(SRC, 'utf8');
const js = /<script data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(src)[1];

const NAMES = ['GROUPS', 'UNITS', 'AREAS', 'PANTRY', 'SEED', 'MONTHS'];
const head = js.slice(0, js.indexOf('class Component'));
const mod = head + '\nexport { ' + NAMES.join(', ') + ' };';
const m = await import('data:text/javascript;base64,' + Buffer.from(mod).toString('base64'));
const out = {};
for (const k of NAMES) out[k] = m[k];

/* מחרוזות מ-renderVals · כל אחת חייבת להימצא בדיוק פעם אחת */
const pick = (name) => {
  const hits = [...js.matchAll(new RegExp(name + ":\\s*'([^']*)'", 'g'))];
  if (hits.length !== 1) throw new Error(name + ': ' + hits.length + ' התאמות במקום אחת');
  return hits[0][1];
};
for (const k of [
  'progLabel', 'estTag', 'actTag', 'colName', 'colPrice', 'colQty', 'colSum',
  'emptyLabel', 'emptySub', 'closeLabel', 'addTitle', 'nameLabel', 'namePh',
  'groupLabel', 'unitLabel', 'qtyLabel', 'totalLabel', 'addCta',
]) out[k] = pick(k);

/* התווית של ״צריך לסמן״ · הענף השני של closeSub */
const closeSub = /closeSub: canClose \? '([^']*)' \+ [^:]*: '([^']*)'/.exec(js);
if (!closeSub) throw new Error('closeSub: לא נמצא');
out.closeSubPrefix = closeSub[1];
out.closeSubNone = closeSub[2];
/* הסיומת שאחרי הסכום */
const closeTail = /nf\(actSum\) \+ '([^']*)'/.exec(js);
if (!closeTail) throw new Error('סיומת closeSub: לא נמצאה');
out.closeSubSuffix = closeTail[1];

/* ברירות המחדל של המצב ההתחלתי */
out.startArea = /area: '(\w+)'/.exec(js)[1];
const nw = /nw: \{ name: '', g: '([^']*)', unit: '([^']*)'/.exec(js);
out.defaultGroup = nw[1];
out.defaultUnit = nw[2];

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));

const done = out.SEED.filter((x) => x.done);
console.log('קבוצות:', out.GROUPS.join(' · '));
console.log('שיוכים:', out.AREAS.map((a) => a.n).join(', '), '· ברירת מחדל:', out.startArea);
console.log('פנקס מצרכים:', out.PANTRY.length, 'פריטים');
console.log('רשימה:', out.SEED.length, 'שורות ·', done.length, 'סומנו כנרכשו');
console.log('מחושב:', out.SEED.reduce((s, x) => s + Number(x.qty) * Number(x.price), 0), '₪');
console.log('שולם בפועל:', done.reduce((s, x) => s + Number(x.actual || 0), 0), '₪');
console.log('יחידות:', out.UNITS.join(', '));
