import fs from 'fs';

/**
 * חילוץ לוח המכירה מהקנבס · הארטבורד היחיד שאינו במידות טלפון (1180×820).
 */
const SRC = '/Users/shakedgoren/Downloads/files/design/app/AdminBoard.dc.html';
const OUT = process.env.SP + '/admin-board.json';

const src = fs.readFileSync(SRC, 'utf8');
const js = /<script data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(src)[1];
const markup = src.replace(/<script data-dc-script[\s\S]*?<\/script>/, '');

const NAMES = ['CATS', 'FLOW', 'STEPS', 'BAND', 'SEED', 'LATE_HOURS', 'LATE_FEE', 'REASONS'];
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
  'emptyLabel', 'totalLabel', 'cancelTitle', 'reasonLabel', 'noteLabel',
  'notePh', 'keepLabel', 'cancelCta',
]) out[k] = pick(k);

/* sub חוזר גם בהגדרות העמודות · שם הוא ריק או נגזר, ולכן מחפשים ערך לא ריק */
const subs = [...view.matchAll(/sub: '([^']+)'/g)].map((h) => h[1]);
if (subs.length !== 1) throw new Error('תת-כותרת: ' + subs.length + ' התאמות במקום אחת');
out.sub = subs[0];

/* שלושת הטאבים */
out.MODES = [...view.matchAll(/\{ id: '(\w+)', name: '([^']*)' \}/g)].map((h) => ({ id: h[1], name: h[2] }));
if (out.MODES.length !== 3) throw new Error('טאבים: ' + out.MODES.length + ' במקום 3');

/* רוחבי העמודות · נשלפים מהקוד ולא נמדדים בעין */
const colDefs = /const cols = \[([\s\S]*?)\]\);/.exec(view)[1];
out.COL_W = {
  time: Number(/t: 'שעת איסוף', w: '(\d+)px'/.exec(colDefs)[1]),
  who: Number(/t: 'שם מלא',\s+w: '(\d+)px'/.exec(colDefs)[1]),
  item: Number(/cat\.items\.map\(\(it\) => \(\{[^}]*w: '(\d+)px'/.exec(colDefs)[1]),
  sum: Number(/t: 'סה״כ',\s+w: '(\d+)px'/.exec(colDefs)[1]),
  pay: Number(/t: 'תשלום', w: '(\d+)px'/.exec(colDefs)[1]),
  status: Number(/t: 'סטטוס', w: '(\d+)px'/.exec(colDefs)[1]),
};
/* שמות שלוש עמודות הזנב */
out.TAIL_COLS = { sum: 'סה״כ', pay: 'תשלום', status: 'סטטוס' };
out.HEAD_COLS = { time: 'שעת איסוף', who: 'שם מלא' };

/* הסף שמתחתיו המונה נצבע · מלאי נמוך */
out.LOW_STOCK = Number(/low = leftN <= (\d+)/.exec(view)[1]);

/* המידות של הארטבורד · הוא לאייפד ולא לטלפון */
const root = /width: (\d+)px; height: (\d+)px/.exec(markup);
out.BOARD_W = Number(root[1]);
out.BOARD_H = Number(root[2]);

/* התווית של המבוטלות · הקידומת שלפני המספר */
out.gonePrefix = /<div[^>]*>(בוטלו) \{\{ goneLabel \}\}<\/div>/.exec(markup)[1];

out.startMode = /mode: '(\w+)'/.exec(js)[1];

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));

const cat = out.CATS.cous;
const live = out.SEED;
console.log('קטגוריה:', cat.name, '·', cat.items.length, 'עמודות פריטים');
console.log('מכסות:', cat.items.filter((i) => i.quota).map((i) => i.sub + ' ' + i.quota).join(' · '));
console.log('הזמנות הדגמה:', live.length,
  '· איסוף', live.filter((o) => o.ship === 'pickup').length,
  '· משלוח', live.filter((o) => o.ship === 'deliv').length);
for (const st of out.FLOW) console.log('  ', st + ':', live.filter((o) => o.status === st).length);
const sumOf = (o) => cat.items.reduce((s, it) => s + (o.q[it.id] || 0) * it.price, 0);
console.log('סה״כ כל ההזמנות:', live.reduce((s, o) => s + sumOf(o), 0), '₪');
console.log('רוחבי עמודות:', JSON.stringify(out.COL_W), '· סה״כ',
  out.COL_W.time + out.COL_W.who + out.COL_W.item * cat.items.length + out.COL_W.sum + out.COL_W.pay + out.COL_W.status);
console.log('ארטבורד:', out.BOARD_W + '×' + out.BOARD_H, '· סף מלאי נמוך:', out.LOW_STOCK);
