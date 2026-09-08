import fs from 'fs';

/**
 * חילוץ מסך הכספים מהקנבס.
 * ⚠ אין פיצול מע״מ · שקד עוסקת פטורה, כל הסכומים כפי שנגבו ושולמו.
 */
const SRC = '/Users/shakedgoren/Downloads/files/design/app/AdminMoney.dc.html';
const OUT = process.env.SP + '/admin-money.json';

const src = fs.readFileSync(SRC, 'utf8');
const js = /<script data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(src)[1];
const markup = src.replace(/<script data-dc-script[\s\S]*?<\/script>/, '');

const NAMES = ['CATS', 'PERIODS', 'EXPENSES'];
const head = js.slice(0, js.indexOf('class Component'));
const mod = head + '\nexport { ' + NAMES.join(', ') + ' };';
const m = await import('data:text/javascript;base64,' + Buffer.from(mod).toString('base64'));
const out = {};
for (const k of NAMES) out[k] = m[k];

const view = js.slice(js.indexOf('renderVals()'));
const pick = (name) => {
  const hits = [...view.matchAll(new RegExp(name + ":\\s*'([^']*)'", 'g'))];
  if (hits.length !== 1) throw new Error(name + ': ' + hits.length + ' התאמות במקום אחת');
  return hits[0][1];
};
for (const k of ['revLabel', 'catTitle', 'expTitle']) out[k] = pick(k);

/* הקידומת של תווית הרווחיות */
out.marginPrefix = /revSub: '([^']*)' \+ margin/.exec(view)[1];

/* שמות שני האריחים */
out.TILE_KEYS = [...view.matchAll(/\{ k: '([^']*)', v: nf\(/g)].map((h) => h[1]);
if (out.TILE_KEYS.length !== 2) throw new Error('אריחים: ' + out.TILE_KEYS.length + ' במקום 2');

out.startPeriod = /period: '(\w+)'/.exec(js)[1];

const title = [...markup.matchAll(/>(כספים)<\/div>/g)];
if (title.length !== 2) throw new Error('כותרת: ' + title.length + ' במקום 2 (מסך + נאב)');
out.title = title[0][1];

/* אימות · חלקי הקטגוריות חייבים להסתכם ב-100% */
const share = out.CATS.reduce((s, c) => s + c.share, 0);
if (Math.abs(share - 1) > 1e-9) throw new Error('חלקי הקטגוריות מסתכמים ב-' + share + ' ולא ב-1');

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));

const expBase = out.EXPENSES.reduce((s, e) => s + e.gross, 0);
console.log('קטגוריות:', out.CATS.map((c) => c.n + ' ' + Math.round(c.share * 100) + '%').join(' · '));
console.log('הוצאות בסיס:', expBase, '₪ ·', out.EXPENSES.length, 'סעיפים');
for (const [k, p] of Object.entries(out.PERIODS)) {
  const exp = Math.round(expBase * p.factor);
  console.log(' ', p.n, '(' + p.label + '):', 'מחזור', p.gross, '· הוצאות', exp, '· רווח', p.gross - exp,
    '· רווחיות', Math.round((p.gross - exp) / p.gross * 100) + '%');
}
console.log('ברירת מחדל:', out.startPeriod, '· אריחים:', out.TILE_KEYS.join(', '));
