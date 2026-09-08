import fs from 'fs';

/**
 * חילוץ מסך המלאי מהקנבס.
 * שתי טבלאות נפרדות שאסור לערבב: מלאי מכירה (נגזר מיום המכירה)
 * ומלאי לוגיסטי (אריזות, יבשים וציוד · ידני בלבד).
 */
const SRC = '/Users/shakedgoren/Downloads/files/design/app/AdminStock.dc.html';
const OUT = process.env.SP + '/admin-stock.json';

const src = fs.readFileSync(SRC, 'utf8');
const js = /<script data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(src)[1];
const markup = src.replace(/<script data-dc-script[\s\S]*?<\/script>/, '');

const NAMES = ['SALE_DAYS', 'SUPPLY', 'SUP_GROUPS', 'SUP_UNITS', 'PACKED'];
const head = js.slice(0, js.indexOf('class Component'));
const mod = head + '\nexport { ' + NAMES.join(', ') + ' };';
const m = await import('data:text/javascript;base64,' + Buffer.from(mod).toString('base64'));
const out = {};
for (const k of NAMES) out[k] = m[k];

/* מחרוזות שיושבות ב-renderVals · נשלפות מהמקור ונבדקות שהן יחידות */
const pick = (name) => {
  const hits = [...js.matchAll(new RegExp(name + ":\\s*'([^']*)'", 'g'))];
  if (hits.length !== 1) throw new Error(name + ': ' + hits.length + ' התאמות במקום אחת');
  return hits[0][1];
};
for (const k of [
  'noDayLabel', 'noDaySub', 'dropLabel', 'saleNote', 'lowCta',
  'addTitle', 'addSub', 'nameLabel', 'namePh', 'groupLabel', 'unitLabel',
  'qtyLabel', 'minLabel', 'addCta', 'supplyNote',
]) out[k] = pick(k);

/* leftTag מופיע פעמיים בכוונה · פעם על השורה ופעם על הסיכום */
const leftTags = [...js.matchAll(/leftTag: '([^']*)'/g)].map((h) => h[1]);
if (leftTags.length !== 2) throw new Error('leftTag: ' + leftTags.length + ' במקום 2');
out.rowLeftTag = leftTags[0];
out.totalLeftTag = leftTags[1];

/* התוויות התלויות במצב · שתי הצורות של כל אחת */
const pair = (name) => {
  const re = new RegExp(name + ":\\s*isSale \\? '([^']*)' : '([^']*)'", 'g');
  const hits = [...js.matchAll(re)];
  if (hits.length !== 1) throw new Error(name + ': ' + hits.length + ' התאמות במקום אחת');
  return { sale: hits[0][1], supply: hits[0][2] };
};
out.sub = pair('sub');

const dayTag = /dayTag: days\.length > 1 \? '([^']*)' : '([^']*)'/.exec(js);
out.dayTagMany = dayTag[1];
out.dayTagOne = dayTag[2];
out.noOpenDay = /dayName: days\.length \? [^:]*: '([^']*)'/.exec(js)[1];

/* שמות הלשוניות */
out.TABS = [...js.matchAll(/\{ id: '(\w+)', n: '([^']*)' \}/g)].map((h) => ({ id: h[1], name: h[2] }));
if (out.TABS.length !== 2) throw new Error('לשוניות: ' + out.TABS.length + ' במקום 2');

/* מצבי המלאי · הסף לצבע ״כמעט אזל״ */
/* הסף של ״כמעט אזל״ · לא לבלבל עם בדיקת ה-out שהיא left <= 0 */
const lowRe = [...js.matchAll(/low = !out && left <= (\d+)/g)];
if (lowRe.length !== 1) throw new Error('סף נמוך: ' + lowRe.length + ' התאמות במקום אחת');
out.LOW_LEFT = Number(lowRe[0][1]);
out.STATE_LABELS = (() => {
  const h = /out \? '([^']*)' : low \? '([^']*)' : '([^']*)'/.exec(js);
  return { out: h[1], low: h[2], ok: h[3] };
})();

/* הכותרת · יושבת במרקאפ */
const title = [...markup.matchAll(/>(מלאי)<\/div>/g)];
if (title.length !== 2) throw new Error('כותרת: ' + title.length + ' במקום 2 (מסך + נאב)');
out.title = title[0][1];

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));

const open = out.SALE_DAYS.filter((d) => d.open);
console.log('ימי מכירה:', out.SALE_DAYS.map((d) => d.name + (d.open ? ' (פתוח)' : ' (סגור)')).join(' · '));
console.log('פתוחים כרגע:', open.length, '·', open.flatMap((d) => d.items).length, 'מנות');
console.log('לוגיסטי:', out.SUPPLY.length, 'פריטים ·', out.SUP_GROUPS.join(', '));
console.log('מתחת למינימום:', out.SUPPLY.filter((x) => x.n < x.min).map((x) => x.name).join(' · '));
console.log('יחידות:', out.SUP_UNITS.join(', '), '· ארוזות:', out.PACKED.join(', '));
console.log('לשוניות:', out.TABS.map((t) => t.name).join(' | '));
console.log('מצבים:', Object.values(out.STATE_LABELS).join(' / '), '· סף נמוך:', out.LOW_LEFT);
