import fs from 'fs';

/**
 * חילוץ מסך הלקוחות מהקנבס · פנקס הלקוחות והיסטוריית ההזמנות שלהן.
 */
const SRC = '/Users/shakedgoren/Downloads/files/design/app/AdminCustomers.dc.html';
const OUT = process.env.SP + '/admin-customers.json';

const src = fs.readFileSync(SRC, 'utf8');
const js = /<script data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(src)[1];
const markup = src.replace(/<script data-dc-script[\s\S]*?<\/script>/, '');

const NAMES = ['HUES', 'PEOPLE', 'HISTORY', 'STATE_TONE', 'REGULAR'];
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
for (const k of [
  'searchPh', 'emptyLabel', 'callLabel', 'histLabel', 'orderLabel', 'noteLabel', 'notePh',
]) out[k] = pick(k);

/* התוויות התלויות במצב · הזוגות של קבועה/חדשה */
const tag = /tag: reg \? '([^']*)' : '([^']*)'/.exec(js);
if (!tag) throw new Error('תווית קבועה/חדשה: לא נמצאה');
out.tagRegular = tag[1];
out.tagNew = tag[2];

/* המסננים */
out.FILTERS = [...js.matchAll(/\{ id: '(\w+)', n: '([^']*)' \}/g)].map((h) => ({ id: h[1], name: h[2] }));
if (out.FILTERS.length !== 3) throw new Error('מסננים: ' + out.FILTERS.length + ' במקום 3');

/* חלקי תת-הכותרת שסביב המספרים */
/* nf(...) מכיל סוגריים מקוננים · לכן דילוג עצל עד המחרוזת האחרונה */
const sub = /sub: PEOPLE\.length \+ '([^']*)'[\s\S]*?\+ '([^']*)',/.exec(js);
if (!sub) throw new Error('תת-כותרת: לא נמצאה');
out.subMiddle = sub[1];
out.subSuffix = sub[2];

/* כותרות חלונית ההזמנות */
out.histTitlePrefix = /histTitle:[^']*'([^']*)'/.exec(js)[1];
out.histSubSuffix = /histSub:[^+]*\+ '([^']*)'/.exec(js)[1];

/* שמות שורות הפירוט */
out.DETAIL_KEYS = [...js.matchAll(/\{ k: '([^']*)', v:/g)].map((h) => h[1]);
if (out.DETAIL_KEYS.length !== 4) throw new Error('שורות פירוט: ' + out.DETAIL_KEYS.length + ' במקום 4');

const title = [...markup.matchAll(/>(לקוחות)<\/div>/g)];
if (title.length !== 1) throw new Error('כותרת: ' + title.length + ' במקום אחת');
out.title = title[0][1];

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));

const reg = out.PEOPLE.filter((p) => p.orders >= out.REGULAR);
console.log('לקוחות:', out.PEOPLE.length, '· מצטבר:', out.PEOPLE.reduce((s, p) => s + p.spent, 0), '₪');
console.log('קבועות (>=' + out.REGULAR + ' הזמנות):', reg.length, '·', reg.map((p) => p.name).join(', '));
console.log('חדשות:', out.PEOPLE.length - reg.length);
console.log('עם הערה:', out.PEOPLE.filter((p) => p.note).map((p) => p.name + ' — ' + p.note).join(' · '));
console.log('היסטוריה:', Object.entries(out.HISTORY).map(([k, v]) => k + '=' + v.length).join(' · '));
console.log('מסננים:', out.FILTERS.map((f) => f.name).join(', '), '· שורות פירוט:', out.DETAIL_KEYS.join(', '));
