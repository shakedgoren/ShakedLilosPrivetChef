import fs from 'fs';

/**
 * חילוץ מסך ימי המכירה מהקנבס · אותה שיטה כמו שאר מסכי הניהול.
 * כאן הכל יושב ב-JS, כולל זרע התאריכים החסומים.
 */
const SRC = '/Users/shakedgoren/Downloads/files/design/app/AdminDays.dc.html';
const OUT = process.env.SP + '/admin-days.json';

const src = fs.readFileSync(SRC, 'utf8');
const js = /<script data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(src)[1];
const markup = src.replace(/<script data-dc-script[\s\S]*?<\/script>/, '');

const NAMES = ['MONTHS', 'DOWS', 'DAYNAM', 'CATS', 'CAT_KEYS', 'SEED'];
const head = js.slice(0, js.indexOf('class Component'));
const mod = head + '\nexport { ' + NAMES.join(', ') + ' };';
const m = await import('data:text/javascript;base64,' + Buffer.from(mod).toString('base64'));
const out = {};
for (const k of NAMES) out[k] = m[k];

/* מחרוזות שיושבות ב-renderVals ולא בקבועים · נשלפות מהמקור עצמו */
const pick = (name) => {
  const re = new RegExp(name + ":\\s*'([^']*)'");
  const hits = [...js.matchAll(new RegExp(re.source, 'g'))];
  if (hits.length !== 1) throw new Error(name + ': ' + hits.length + ' התאמות במקום אחת');
  return hits[0][1];
};
out.sub = pick('sub');
out.exceptTitle = pick('exceptTitle');
out.exceptSub = pick('exceptSub');
out.saleTitle = pick('saleTitle');
out.totalLabel = pick('totalLabel');

/* מקרא הלוח · שלוש שורות עם הצבע שלהן */
out.legend = [...js.matchAll(/\{ t: '([^']*)', c: '(#[0-9A-F]{6})' \}/g)].map((h) => ({
  text: h[1],
  color: h[2],
}));
if (out.legend.length !== 3) throw new Error('מקרא: ' + out.legend.length + ' במקום 3');

/* הכותרת · יושבת במרקאפ */
const title = [...markup.matchAll(/>(ימי מכירה)<\/div>/g)];
if (title.length !== 1) throw new Error('כותרת: ' + title.length + ' במקום אחת');
out.title = title[0][1];

/* ימי המכירה שאפשר לקבוע · בקנבס רק שתי הקטגוריות של ימי המכירה */
const sales = /sales: \[([^\]]*)\]/.exec(js)[1];
out.SALE_KEYS = [...sales.matchAll(/'(\w+)'/g)].map((h) => h[1]);

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));

const seed = Object.entries(out.SEED);
console.log('קטגוריות:', out.CAT_KEYS.map((k) => out.CATS[k].short).join(', '));
console.log('ימי מכירה שאפשר לקבוע:', out.SALE_KEYS.map((k) => out.CATS[k].n).join(' · '));
console.log('מנות:', out.CAT_KEYS.map((k) => out.CATS[k].short + '=' + out.CATS[k].dishes.length).join(' '));
console.log('זרע:', seed.length, 'תאריכים ·',
  seed.filter(([, v]) => v.sale).length, 'ימי מכירה ·',
  seed.filter(([, v]) => v.blocked).length, 'חסומים ·',
  seed.filter(([, v]) => v.except).length, 'עם חריגה');
console.log('פתוחים להזמנות:', seed.filter(([, v]) => v.open).map(([k]) => k).join(', '));
console.log('מקרא:', out.legend.map((l) => l.text).join(' · '));
