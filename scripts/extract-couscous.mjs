import fs from 'fs';

/** חילוץ הטקסטים והמידות של מסך הקוסקוס. */
const SRC = '/Users/shakedgoren/Downloads/files/design/app/Order.dc.html';
const OUT = process.env.SP + '/couscous.json';

const src = fs.readFileSync(SRC, 'utf8');
const markup = src.replace(/<script data-dc-script[\s\S]*?<\/script>/, '');

const one = (re, label) => {
  const hits = [...markup.matchAll(new RegExp(re, 'g'))];
  if (hits.length !== 1) throw new Error(label + ': ' + hits.length + ' התאמות במקום אחת');
  return hits[0][1].replace(/<br>/g, '\n').trim();
};

const out = {};
out.title = one('>(שלישי של קוסקוס)</div>', 'כותרת');
/* התאריך מופיע פעמיים · בכותרת ובחלונית, ושניהם זהים */
const dates = [...markup.matchAll(/>(שלישי · [^<]*)<\/div>/g)].map((h) => h[1]);
if (dates.length !== 2 || dates[0] !== dates[1])
  throw new Error('תאריך: ' + dates.length + ' התאמות, ' + (dates[0] === dates[1] ? 'זהות' : 'שונות'));
out.saleDate = dates[0];
out.intro = one('>(הטעם שכולם מחכים לו[\\s\\S]*?)</div>', 'פסקת הפתיח');
out.pickleNote = one('>(\\* כל מנה מגיעה[^<]*)</div>', 'הערת הסלט');
out.addonsLabel = one('>(תוספות)</div>', 'כותרת התוספות');

/* תווית מונה המנות · שני הענפים, מ-renderVals */
const js = /<script data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(src)[1];
const cnt = /countLabel: meals === 1 \? '([^']*)' : meals \+ '([^']*)'/.exec(js);
if (!cnt) throw new Error('מונה המנות: לא נמצא');
out.countOne = cnt[1];
out.countMany = cnt[2];
out.totalLabel = one('>(סה״כ :)</div>', 'תווית הסכום');

/* שורת המנה · גובה ומידות התמונה */
const row = /height: (\d+)px; box-sizing: border-box; border-radius: (\d+)px; padding: (\d+)px (\d+)px/.exec(markup);
out.rowHeight = Number(row[1]);
out.rowRadius = Number(row[2]);
const shot = /width: (\d+)px; height: (\d+)px; flex-shrink: 0; border-radius: (\d+)px; border: 1\.5px dashed/.exec(markup);
out.shotSize = Number(shot[1]);
out.shotRadius = Number(shot[3]);

/* רשת התוספות · שלוש עמודות */
const grid = /--g: (\d+)px; --opt-basis: calc\(\(100% - 2 \* var\(--g\)\) \/ 3\)/.exec(markup);
if (!grid) throw new Error('רשת התוספות: לא נמצאה');
out.addonGap = Number(grid[1]);
const addon = /border-radius: (\d+)px; padding: (\d+)px /.exec(markup.slice(markup.indexOf('--opt-basis: calc((100% - 2')));
out.addonRadius = Number(addon[1]);
out.addonPad = Number(addon[2]);

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log('כותרת:', out.title, '·', out.saleDate);
console.log('פתיח:', out.intro.replace(/\n/g, ' / '));
console.log('הערה:', out.pickleNote);
console.log('שורת מנה: גובה', out.rowHeight, 'פינה', out.rowRadius, '· תמונה', out.shotSize + 'x' + out.shotSize, 'פינה', out.shotRadius);
console.log('מונה:', out.countOne, '/ N' + out.countMany, '·', out.totalLabel);
console.log('תוספות: 3 עמודות · רווח', out.addonGap, '· כרטיס פינה', out.addonRadius, 'ריפוד', out.addonPad);
