import fs from 'fs';

/** חילוץ מסך ״ההזמנות שלי״ מהקנבס. */
const SRC = '/Users/shakedgoren/Downloads/files/design/app/MyOrders.dc.html';
const OUT = process.env.SP + '/my-orders.json';

const src = fs.readFileSync(SRC, 'utf8');
const js = /<script data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(src)[1];
const markup = src.replace(/<script data-dc-script[\s\S]*?<\/script>/, '');

const NAMES = ['HUES', 'ORDERS'];
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
for (const k of ['outTitle', 'outBody', 'outCancel', 'outConfirm', 'pastLabel', 'emptyCta'])
  out[k] = pick(k);

/* שמות שורות הפירוט */
/* חמש שורות · ארבע קבועות, והחמישית היא דמי הביטול שנוספת רק בהזמנה שבוטלה */
const keys = [...view.matchAll(/\{ k: '([^']*)', v: o\./g)].map((h) => h[1]);
if (keys.length !== 5) throw new Error('שורות פירוט: ' + keys.length + ' במקום 5');
out.ROW_KEYS = keys.slice(0, 4);
out.feeKey = keys[4];
if (out.feeKey !== /\{ k: '([^']*)', v: o\.fee/.exec(view)[1])
  throw new Error('השורה החמישית אינה דמי הביטול');

/* תווית המונה · שני הענפים */
const cnt = /countLabel: live\.length\s*\? live\.length \+ '([^']*)' \+ past\.length \+ '([^']*)'\s*: past\.length \+ '([^']*)'/.exec(view);
if (!cnt) throw new Error('תווית המונה: לא נמצאה');
out.countLive = cnt[1];
out.countPast = cnt[2];
out.countOnlyPast = cnt[3];

/* טקסטים שיושבים במרקאפ */
const one = (re, label) => {
  const hits = [...markup.matchAll(new RegExp(re, 'g'))];
  if (hits.length !== 1) throw new Error(label + ': ' + hits.length + ' התאמות במקום אחת');
  return hits[0][1];
};
out.title = one('>(ההזמנות שלי)</div>', 'כותרת');
out.emptyText = one('>(עוד לא הוזמנה[^<]*)</div>', 'טקסט ריק');
out.againLabel = one('>(להזמין שוב)</div>', 'להזמין שוב');

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log('הזמנות:', out.ORDERS.length,
  '· פעילות', out.ORDERS.filter((o) => o.live).length,
  '· קודמות', out.ORDERS.filter((o) => !o.live).length,
  '· מבוטלות', out.ORDERS.filter((o) => o.cancelled).length);
console.log('שורות פירוט:', out.ROW_KEYS.join(', '), '+', out.feeKey);
console.log('מצב ריק:', out.emptyText, '·', out.emptyCta);
