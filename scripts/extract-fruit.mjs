import fs from 'fs';

/** חילוץ מסך מגשי הפירות · הטקסטים והמגשים. */
const SRC = '/Users/shakedgoren/Downloads/files/design/app/Fruit.dc.html';
const OUT = process.env.SP + '/fruit.json';

const src = fs.readFileSync(SRC, 'utf8');
const js = /<script data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(src)[1];
const markup = src.replace(/<script data-dc-script[\s\S]*?<\/script>/, '');

const head = js.slice(0, js.indexOf('class Component'));
const mod = head + '\nexport { ITEMS, PICK_FROM, PICK_TO, DELIV_FROM, DELIV_TO, DELIV_STEP, PAYS, CITIES };';
const m = await import('data:text/javascript;base64,' + Buffer.from(mod).toString('base64'));
const out = { ITEMS: m.ITEMS, PICK_FROM: m.PICK_FROM, PICK_TO: m.PICK_TO,
  DELIV_FROM: m.DELIV_FROM, DELIV_TO: m.DELIV_TO, DELIV_STEP: m.DELIV_STEP };

/* טקסטים שיושבים במרקאפ · כל אחד חייב להימצא בדיוק פעם אחת */
const one = (re, label) => {
  const hits = [...markup.matchAll(new RegExp(re, 'g'))];
  if (hits.length !== 1) throw new Error(label + ': ' + hits.length + ' התאמות במקום אחת');
  return hits[0][1].replace(/<br>/g, '\n').trim();
};
out.title = one('>(מגשי פירות)</div>', 'כותרת');
out.hours = one('>(א׳–ה׳[^<]*)</div>', 'שעות');
out.byAppointment = one('>(בתיאום והזמנה מראש בלבד\\.)</div>', 'בתיאום');
out.introTitle = one('>(כשטריות פוגשת אמנות[^<]*)</div>', 'כותרת הפתיח');
out.introBody = one('>(כל מגש נוצר בעבודת יד[\\s\\S]*?)</div>', 'גוף הפתיח');
out.disclaimer = one('>(העיצוב בתמונה להמחשה[^<]*)</div>', 'הערת ההמחשה');
out.phoneLabel = one('>(לפרטים נוספים: [\\d-]+)</div>', 'טלפון');
out.phoneHref = one('href="tel:(\\d+)"', 'קישור הטלפון');

/* המידות של כרטיס המגש · מהמרקאפ ולא מהעין */
const card = /border-radius: (\d+)px; padding: (\d+)px; display: flex; flex-direction: column; gap: (\d+)px/.exec(markup);
out.cardRadius = Number(card[1]);
out.cardPad = Number(card[2]);
out.cardGap = Number(card[3]);
const shot = /width: 100%; height: (\d+)px; border-radius: (\d+)px; border: 1\.5px dashed/.exec(markup);
out.shotHeight = Number(shot[1]);
out.shotRadius = Number(shot[2]);
const grid = /--g: (\d+)px; --opt-basis/.exec(markup);
out.gridGap = Number(grid[1]);

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log('מגשים:', out.ITEMS.length);
for (const it of out.ITEMS) {
  const [d, s] = it.desc.split(' • ');
  console.log('  ', it.name, '·', it.price, '₪ ·', s || '(אין סועדים)');
}
console.log('כרטיס: פינה', out.cardRadius, 'ריפוד', out.cardPad, 'רווח פנימי', out.cardGap, '· תמונה גובה', out.shotHeight, 'פינה', out.shotRadius, '· רווח רשת', out.gridGap);
console.log('טלפון:', out.phoneLabel, '→ tel:' + out.phoneHref);
