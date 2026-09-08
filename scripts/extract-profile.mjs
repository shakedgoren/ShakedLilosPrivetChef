import fs from 'fs';

/** חילוץ מסך האזור האישי מהקנבס. */
const SRC = '/Users/shakedgoren/Downloads/files/design/app/Profile.dc.html';
const OUT = process.env.SP + '/profile.json';

const src = fs.readFileSync(SRC, 'utf8');
const js = /<script data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(src)[1];
const markup = src.replace(/<script data-dc-script[\s\S]*?<\/script>/, '');

const NAMES = ['SHIP_CITIES', 'STREETS', 'SEED', 'PASS_MIN'];
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
for (const k of [
  'sinceLabel', 'personalLabel', 'addrLabel', 'addrNote', 'addrPh', 'addrHint',
  'noShipLabel', 'saveLabel', 'savedLabel', 'securityLabel', 'passTitle', 'passSub',
  'passCta', 'outTitle', 'outBody', 'outCancel', 'outConfirm',
]) out[k] = pick(k);

/* שם ברירת המחדל כשאין שם · הענף השני של displayName */
out.noName = /displayName: trim\(f\.name\) \|\| '([^']*)'/.exec(view)[1];

/* שלושת שדות הפרטים · תווית, מציין מקום, סוג והודעת שגיאה */
out.PERSONAL = [...view.matchAll(/field\('(\w+)',\s*'([^']*)',\s*'([^']*)',\s*'(\w+)',\s*e\.\w+,\s*'([^']*)'\)/g)]
  .map((h) => ({ id: h[1], label: h[2], placeholder: h[3], type: h[4], hint: h[5] }));
if (out.PERSONAL.length !== 3) throw new Error('שדות אישיים: ' + out.PERSONAL.length + ' במקום 3');

/* שלושת שדות הסיסמה */
out.PASS_FIELDS = [...view.matchAll(/pf\('(\w+)',\s*'([^']*)',\s*('[^']*'|'[^']*' \+ PASS_MIN \+ '[^']*'),\s*(?:false|pe\.\w+),\s*'([^']*)'\)/g)]
  .map((h) => ({ id: h[1], label: h[2], placeholderRaw: h[3], hint: h[4] }));
if (out.PASS_FIELDS.length !== 3) throw new Error('שדות סיסמה: ' + out.PASS_FIELDS.length + ' במקום 3');

/* הכללים שמורכבים מ-PASS_MIN */
out.passRuleParts = (() => {
  const h = /passRule: '([^']*)' \+ PASS_MIN \+ '([^']*)'/.exec(view);
  return h ? { before: h[1], after: h[2] } : null;
})();
if (!out.passRuleParts) throw new Error('כלל הסיסמה: לא נמצא');

const one = (re, label) => {
  const hits = [...markup.matchAll(new RegExp(re, 'g'))];
  if (hits.length !== 1) throw new Error(label + ': ' + hits.length + ' התאמות במקום אחת');
  return hits[0][1];
};
/* ״אזור אישי״ מופיע פעמיים · ככותרת המסך וכלשונית בנאב-בר */
const titles = [...markup.matchAll(/>(אזור אישי)<\/div>/g)];
if (titles.length !== 2) throw new Error('כותרת: ' + titles.length + ' במקום 2');
out.title = titles[0][1];

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
const places = Object.values(out.STREETS).reduce((s, v) => s + v.length, 0);
console.log('ערים עם משלוח:', out.SHIP_CITIES.join(', '));
console.log('מסד כתובות:', Object.keys(out.STREETS).length, 'ערים ·', places, 'צירופי רחוב-עיר');
console.log('שדות אישיים:', out.PERSONAL.map((f) => f.label).join(', '));
console.log('שדות סיסמה:', out.PASS_FIELDS.map((f) => f.label).join(', '), '· מינימום', out.PASS_MIN);
