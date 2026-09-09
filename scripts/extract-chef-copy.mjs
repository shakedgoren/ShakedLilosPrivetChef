import fs from 'fs';

/** חילוץ הטקסטים והמידות של מסך פינת השף. */
const SRC = '/Users/shakedgoren/Downloads/files/design/app/Chef.dc.html';
const OUT = process.env.SP + '/chef-copy.json';

const src = fs.readFileSync(SRC, 'utf8');
const markup = src.replace(/<script data-dc-script[\s\S]*?<\/script>/, '');
const js = /<script data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(src)[1];

const one = (re, label) => {
  const hits = [...markup.matchAll(new RegExp(re, 'g'))];
  if (hits.length !== 1) throw new Error(label + ': ' + hits.length + ' התאמות במקום אחת');
  return hits[0][1].replace(/<br>/g, '\n').trim();
};

const out = {};
out.introTitle = one('>(כשהאוכל הופך[^<]*)</div>', 'כותרת הפתיח');
out.introBody = one('>(יש אירועים שנהנים[\\s\\S]*?)</div>', 'גוף הפתיח');
out.introCta = one('>(בוחרים את המסלול שלכם)</div>', 'שורת הבחירה');

/* כותרת המסך ברשימה */
const head = /headTitle: st\.view === 'menu' \? '([^']*)'/.exec(js);
if (!head) throw new Error('כותרת התפריט: לא נמצאה');
out.menuTitle = head[1];

/* גובה הקרוסלה */
const caro = /width: 100%; height: (\d+)px; border-radius: (\d+)px/.exec(markup);
out.caroHeight = Number(caro[1]);
out.caroRadius = Number(caro[2]);

/* כפתור הבחירה */
out.pickCta = one('>(בחר מסלול)</div>', 'כפתור הבחירה');

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log('כותרת:', out.menuTitle);
console.log('פתיח:', out.introTitle);
console.log('גוף:', out.introBody.replace(/\n/g, ' / '));
console.log('בחירה:', out.introCta, '· כפתור:', out.pickCta);
console.log('קרוסלה: גובה', out.caroHeight, 'פינה', out.caroRadius);
