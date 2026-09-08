import fs from 'fs';

/** חילוץ מסך השישניצל · הטקסטים, המידות והתפריט. */
const SRC = '/Users/shakedgoren/Downloads/files/design/app/Schnitzel.dc.html';
const OUT = process.env.SP + '/schnitzel.json';

const src = fs.readFileSync(SRC, 'utf8');
const markup = src.replace(/<script data-dc-script[\s\S]*?<\/script>/, '');

const one = (re, label) => {
  const hits = [...markup.matchAll(new RegExp(re, 'g'))];
  if (hits.length !== 1) throw new Error(label + ': ' + hits.length + ' התאמות במקום אחת');
  return hits[0][1].replace(/<br>/g, '\n').trim();
};

const out = {};
out.title = one('>(שישניצל)</div>', 'כותרת');
out.intro = one('>(שניצל דק וקריספי[\\s\\S]*?)</div>', 'פסקת הפתיח');
out.giftNote = one('>(כנפי עוף במתנה[^<]*)</div>', 'הערת המתנה');
out.pickTypeLabel = one('>(בחר סוג חלה)</div>', 'בחר סוג חלה');
out.saleDate = one('>(שישי · [^<]*)</div>', 'תאריך יום המכירה');

/* מידות כרטיס החלה · מהמרקאפ ולא מהעין */
const card = /border-radius: (\d+)px; padding: (\d+)px (\d+)px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: (\d+)px/.exec(markup);
if (!card) throw new Error('כרטיס החלה: לא נמצא');
out.cardRadius = Number(card[1]);
out.cardPadV = Number(card[2]);
out.cardPadH = Number(card[3]);
out.cardGap = Number(card[4]);

const shot = /width: 100%; height: (\d+)px; border-radius: (\d+)px; border:/.exec(markup);
out.shotHeight = Number(shot[1]);
out.shotRadius = Number(shot[2]);

const grid = /--g: (\d+)px; --opt-basis: calc\(\(100% - 1 \* var\(--g\)\)/.exec(markup);
out.gridGap = Number(grid[1]);

/* הבאנר של המתנה */
const gift = /border-radius: (\d+)px; padding: (\d+)px (\d+)px; dis[^"]*background: ([^;]+);/.exec(markup);
out.giftRadius = gift ? Number(gift[1]) : 18;

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log('כותרת:', out.title, '·', out.saleDate);
console.log('פתיח:', out.intro.replace(/\n/g, ' / '));
console.log('מתנה:', out.giftNote);
console.log('כרטיס חלה: פינה', out.cardRadius, 'ריפוד', out.cardPadV + '/' + out.cardPadH, 'רווח', out.cardGap);
console.log('תמונה: גובה', out.shotHeight, 'פינה', out.shotRadius, '· רווח רשת', out.gridGap);
