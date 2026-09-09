import fs from 'fs';

/** חילוץ הטקסטים של מסך מארזי הספיישל · המארזים עצמם ב-extract-boxes. */
const SRC = '/Users/shakedgoren/Downloads/files/design/app/Boxes.dc.html';
const OUT = process.env.SP + '/boxes-copy.json';

const src = fs.readFileSync(SRC, 'utf8');
const markup = src.replace(/<script data-dc-script[\s\S]*?<\/script>/, '');
const js = /<script data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(src)[1];

const one = (re, label) => {
  const hits = [...markup.matchAll(new RegExp(re, 'g'))];
  if (hits.length !== 1) throw new Error(label + ': ' + hits.length + ' התאמות במקום אחת');
  return hits[0][1].replace(/<br>/g, '\n').trim();
};

const out = {};
out.introTitle = one('>(✨ יש רגעים[^<]*)</div>', 'כותרת הפתיח');
out.introBody = one('>(לא עוד מתנה[\\s\\S]*?)</div>', 'גוף הפתיח');
out.introCta = one('>(בוחרים את הספיישל שלכם)</div>', 'שורת הבחירה');

/* כותרת המסך · מגיעה מ-renderVals ותלויה במארז הפתוח */
const head = /headTitle: [^']*'([^']*)'/.exec(js);
out.listTitle = head ? head[1] : null;
if (!out.listTitle) throw new Error('כותרת הרשימה: לא נמצאה');

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log('כותרת:', out.listTitle);
console.log('פתיח:', out.introTitle);
console.log('גוף:', out.introBody.replace(/\n/g, ' / '));
console.log('שורת בחירה:', out.introCta);
