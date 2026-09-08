import fs from 'fs';

/**
 * חילוץ הנתונים של מסך ניהול ההזמנות מהקנבס.
 * אותה שיטה כמו extract-boxes / extract-chef: חותכים בהגדרת המחלקה,
 * כל הקבועים יושבים לפניה, ומייבאים את החתיכה כמודול.
 */
const SRC = '/Users/shakedgoren/Downloads/files/design/app/AdminOrders.dc.html';
const OUT = '/private/tmp/claude-501/-Users-shakedgoren-Downloads-files/51bba7d1-c035-48ce-ad36-342e2d8c1dcf/scratchpad/admin-orders.json';

const src = fs.readFileSync(SRC, 'utf8');
const js = /<script data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(src)[1];
const head = js.slice(0, js.indexOf('class Component'));

const NAMES = [
  'HUES', 'MANUAL_CATS', 'BOOK', 'MENU', 'SCH_ROLLS', 'ROLL',
  'SHIP_FEE', 'DELIV_MIN_MEALS', 'FLOW', 'CANCELLED', 'TONE',
  'LATE_HOURS', 'LATE_FEE', 'REASONS', 'ORDERS'
];
const mod = head + '\nexport { ' + NAMES.join(', ') + ' };';
const m = await import('data:text/javascript;base64,' + Buffer.from(mod).toString('base64'));

const out = {};
for (const k of NAMES) out[k] = m[k];

/* תוויות שיושבות ב-renderVals · נשלפות מהמקור ונבדקות שהן יחידות */
const pick = (name) => {
  const hits = [...js.matchAll(new RegExp(name + ":\\s*'([^']*)'", 'g'))];
  if (hits.length !== 1) throw new Error(name + ': ' + hits.length + ' התאמות במקום אחת');
  return hits[0][1];
};
out.boardLabel = pick('boardLabel');
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));

console.log('כפתור הלוח:', out.boardLabel);
console.log('הזמנות הדגמה:', m.ORDERS.length, '· פנקס:', m.BOOK.length);
console.log('מסלול:', m.FLOW.join(' → '), '+', m.CANCELLED);
console.log('קטגוריות ידניות:', m.MANUAL_CATS.map((k) => m.HUES[k].n).join(', '));
console.log('פריטים בתפריט:', Object.entries(m.MENU).map(([k, v]) => k + '=' + v.length).join(' · '));
