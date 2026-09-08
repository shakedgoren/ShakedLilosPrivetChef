import fs from 'fs';

/**
 * חילוץ מסך עלויות הייצור מהקנבס · המקור היחיד למחירים ולעלויות.
 * המסך הגדול ביותר בצד הניהול: פנקס מצרכים, מתכונים, ושלושה מצבי חישוב.
 */
const SRC = '/Users/shakedgoren/Downloads/files/design/app/AdminCosts.dc.html';
const OUT = process.env.SP + '/admin-costs.json';

const src = fs.readFileSync(SRC, 'utf8');
const js = /<script data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(src)[1];
const markup = src.replace(/<script data-dc-script[\s\S]*?<\/script>/, '');

const NAMES = ['CATS', 'PANTRY', 'DISHES', 'BUYS', 'TODAY', 'MONTHS'];
const head = js.slice(0, js.indexOf('class Component'));
const mod = head + '\nexport { ' + NAMES.join(', ') + ' };';
const m = await import('data:text/javascript;base64,' + Buffer.from(mod).toString('base64'));
const out = {};
for (const k of NAMES) out[k] = m[k];
/* Date אינו עובר JSON כמו שהוא · שומרים את שלושת החלקים */
out.TODAY = { y: m.TODAY.getFullYear(), m: m.TODAY.getMonth(), d: m.TODAY.getDate() };

/* המחרוזות של המסך יושבות ב-renderVals · המנות למעלה משתמשות באותם שמות
   שדה (note למשל), ולכן מחפשים רק בחלק הזה של הקובץ */
const view = js.slice(js.indexOf('renderVals()'));
const pick = (name) => {
  const hits = [...view.matchAll(new RegExp(name + ":\\s*'([^']*)'", 'g'))];
  if (hits.length !== 1) throw new Error(name + ': ' + hits.length + ' התאמות במקום אחת');
  return hits[0][1];
};
for (const k of [
  'dueTitle', 'dueSub', 'impLabel', 'impTitle', 'impSub', 'autoTag', 'fromLabel',
  'partPh', 'colName', 'colPrice', 'colQty', 'colSum', 'note',
]) out[k] = pick(k);

/* התוויות התלויות במצב · כל אחת שני ענפים */
const pair = (name, re) => {
  const hits = [...js.matchAll(re)];
  if (hits.length !== 1) throw new Error(name + ': ' + hits.length + ' התאמות במקום אחת');
  return { weight: hits[0][1], unit: hits[0][2] };
};
out.yieldLabel = pair('yieldLabel', /yieldLabel: isWeight \? '([^']*)' : '([^']*)'/g);
out.priceLabel = pair('priceLabel', /priceLabel: isWeight \? '([^']*)' : '([^']*)'/g);
out.partsTitle = (() => {
  const h = /partsTitle: isAuto \? '([^']*)' : '([^']*)'/.exec(js);
  if (!h) throw new Error('partsTitle: לא נמצא');
  return { auto: h[1], manual: h[2] };
})();

/* שמות שורות החישוב · שלוש מהן תלויות במצב */
out.ROW_KEYS = {
  partsSum: /k: '([^']*)', v: nf\(this\.partsSum/.exec(js)[1],
  cost: (() => { const h = /k: isWeight \? '([^']*)' : '([^']*)', v: money\(unit\)/.exec(js); return { weight: h[1], unit: h[2] }; })(),
  costKg: /k: 'עלות לק״ג'/.test(js) ? 'עלות לק״ג' : (() => { throw new Error('עלות לק״ג: לא נמצא'); })(),
  profit: (() => { const h = /k: isWeight \? '([^']*)' : '([^']*)', v: money\(profit\)/.exec(js); return { weight: h[1], unit: h[2] }; })(),
  margin: /k: '([^']*)', v: pct \+ '%'/.exec(js)[1],
};

/* הודעות הייבוא */
const imp = /impDone: hit === 0 \? '([^']*)' : '([^']*)' \+ hit \+ '([^']*)'/.exec(js);
if (!imp) throw new Error('הודעות ייבוא: לא נמצאו');
out.impNone = imp[1];
out.impPrefix = imp[2];
out.impSuffix = imp[3];

/* תת-הכותרת · הקידומת שלפני החודש */
out.subPrefix = /sub: '([^']*)' \+ MONTHS/.exec(js)[1];

/* הסף של רווחיות דקה · חייב להיות יחיד */
const thin = [...js.matchAll(/thin = pct < (\d+)/g)];
if (thin.length !== 1) throw new Error('סף רווחיות: ' + thin.length + ' במקום אחת');
out.THIN_MARGIN = Number(thin[0][1]);

/* עומק הרקורסיה המרבי של השאיבה */
out.MAX_DEPTH = Number(/lvl > (\d+)/.exec(js)[1]);

/* השם המוצג של ממוצע הסלטים */
out.saladAvgLabel = /'salads:avg' \? '([^']*)'/.exec(js)[1];

out.startCat = /cat: '(\w+)'/.exec(js)[1];
out.startSub = /sub: '(\w+)'/.exec(js)[1];

const title = [...markup.matchAll(/>(עלויות ייצור)<\/div>/g)];
if (title.length !== 1) throw new Error('כותרת: ' + title.length + ' במקום אחת');
out.title = title[0][1];

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));

const byMode = {};
for (const d of out.DISHES) byMode[d.mode] = (byMode[d.mode] || 0) + 1;
console.log('קטגוריות:', out.CATS.map((c) => c.n + (c.subs ? ' (' + c.subs.map((s) => s.n).join('/') + ')' : '')).join(' · '));
console.log('מנות:', out.DISHES.length, '· לפי מצב:', Object.entries(byMode).map(([k, v]) => k + '=' + v).join(' '));
console.log('פנקס מצרכים:', out.PANTRY.length, '· קניות לייבוא:', out.BUYS.length);
console.log('שאיבה אוטומטית:', out.DISHES.filter((d) => d.from).map((d) => d.name + ' ← ' + d.from.map((f) => f.id + '×' + f.m).join(', ')).join(' | '));
console.log('סף רווחיות:', out.THIN_MARGIN + '%', '· עומק שאיבה:', out.MAX_DEPTH);
console.log('תאריך הדגמה:', out.TODAY.d, out.MONTHS[out.TODAY.m], out.TODAY.y);
