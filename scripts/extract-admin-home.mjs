import fs from 'fs';

/**
 * חילוץ הדשבורד של הניהול מהקנבס.
 * בשונה משאר המסכים, כאן חלק מהמספרים יושבים במרקאפ ולא ב-JS —
 * הגרפים ציירו אותם ישירות. לכן שני שלבים: קבועי ה-JS, ואז המרקאפ.
 * כל שליפה מהמרקאפ נבדקת שהיא נמצאה בדיוק פעם אחת.
 */
const SRC = '/Users/shakedgoren/Downloads/files/design/app/Admin.dc.html';
const OUT = process.env.SP + '/admin-home.json';

const src = fs.readFileSync(SRC, 'utf8');
const js = /<script data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(src)[1];
const markup = src.replace(/<script data-dc-script[\s\S]*?<\/script>/, '');

/* ── שלב א · קבועי ה-JS ── */
const NAMES = ['TILES', 'STATE', 'QUOTAS', 'QUOTA_STEP', 'AMBER', 'PLUM'];
const head = js.slice(0, js.indexOf('class Component'));
const mod = head + '\nexport { ' + NAMES.join(', ') + ' };';
const m = await import('data:text/javascript;base64,' + Buffer.from(mod).toString('base64'));
const out = {};
for (const k of NAMES) out[k] = m[k];

/* ── שלב ב · מה שיושב במרקאפ ── */
const one = (re, label) => {
  const hits = [...markup.matchAll(new RegExp(re, 'g'))];
  if (hits.length !== 1) throw new Error(label + ': נמצאו ' + hits.length + ' התאמות במקום אחת');
  return hits[0];
};
const all = (re, label, expect) => {
  const hits = [...markup.matchAll(new RegExp(re, 'g'))];
  if (hits.length !== expect) throw new Error(label + ': ' + hits.length + ' במקום ' + expect);
  return hits;
};
const num = (s) => Number(String(s).replace(/,/g, ''));

/* הכרטיסים הקטנים ליד ״הזמנה ידנית״ */
out.todayOrders = num(one('הזמנות היום</div>\\s*<div[^>]*>([\\d,]+)</div>', 'הזמנות היום')[1]);
out.todayRevenue = num(one('מחזור היום</div>\\s*<div[^>]*>\\s*<div[^>]*>([\\d,]+)</div>', 'מחזור היום')[1]);

/* גרף המחזור · שישה חודשים */
out.revenueTitle = 'מחזור · ששת החודשים האחרונים';
out.revenueTotal = num(one('ששת החודשים האחרונים</div>\\s*<div[^>]*>\\s*<div[^>]*>([\\d,]+)</div>', 'סך המחזור')[1]);
out.revenueLine = one('<path d="(M42,58[^"]*?)" fill="none"', 'קו המחזור')[1];
out.revenueArea = one('<path d="(M42,58[^"]*?)" fill="url\\(#revfill\\)"', 'שטח המחזור')[1];
out.revenueDots = all('<circle cx="(\\d+)" cy="(\\d+)" r="[\\d.]+" fill="(?:#FFFFFF|#7B5CBC)"', 'נקודות', 6)
  .map((h) => ({ cx: num(h[1]), cy: num(h[2]) }));
out.revenueAxis = all('text-anchor="end"[^>]*>([^<]+)</text>', 'ציר Y', 4).map((h) => h[1]);
out.revenueTip = one('text-anchor="middle"[^>]*>([^<]+)</text>', 'תווית השיא')[1];
out.revenueMonths = all('<div[^>]*>(מרץ|אפר׳|מאי|יוני|יולי|אוג׳)</div>', 'חודשים', 6).map((h) => h[1]);

/* דונאט הקטגוריות */
out.donutCenter = one('>(\\d+k)</div>', 'מרכז הדונאט')[1];
out.donutArcs = all(
  'r="29" fill="none" stroke="(#[0-9A-F]{6})" stroke-width="9" stroke-dasharray="([\\d. ]+)"(?: stroke-dashoffset="(-?[\\d.]+)")?',
  'קשתות הדונאט', 4,
).map((h) => ({ color: h[1], dash: h[2], offset: h[3] ? Number(h[3]) : 0 }));
out.donutLegend = all(
  'background: (#[0-9A-F]{6}); flex-shrink: 0;"></div>\\s*<div[^>]*>([^<]+)</div>\\s*<div[^>]*>(\\d+)%</div>',
  'מקרא הדונאט', 4,
).map((h) => ({ color: h[1], name: h[2], pct: num(h[3]) }));
out.donutTitle = 'לפי קטגוריה';

/* כרטיס הרווח */
out.profitTitle = 'רווח החודש';
out.profitNet = num(one('רווח החודש</div>[\\s\\S]*?<div[^>]*>([\\d,]+)</div>', 'רווח נטו')[1]);
out.profitNetNote = one('>(לפני מע״מ)</div>', 'הערת הרווח')[1];
out.profitGrossLabel = one('>(כולל מע״מ)</div>', 'תווית ברוטו')[1];
out.profitGross = num(one('כולל מע״מ</div>\\s*<div[^>]*>\\s*<div[^>]*>([\\d,]+)</div>', 'רווח ברוטו')[1]);
out.profitBars = all('<rect x="(\\d+)" y="(\\d+)" width="18" height="(\\d+)"', 'עמודות הרווח', 6)
  .map((h) => ({ x: num(h[1]), y: num(h[2]), h: num(h[3]) }));

/* כותרות ותוויות */
out.title = 'ניהול';
out.subtitle = one('>(שלישי · 25 באוגוסט)</div>', 'תת-כותרת')[1];
out.monthChip = one('>(החודש)</div>', 'צ׳יפ החודש')[1];
out.manualTitle = one('>(הזמנה ידנית)</div>', 'הזמנה ידנית')[1];
out.manualSub = one('>(מוואטסאפ או בטלפון)</div>', 'תת-כותרת ידנית')[1];
out.todayOrdersLabel = 'הזמנות היום';
out.todayRevenueLabel = 'מחזור היום';

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log('אריחים:', out.TILES.length, '·', out.TILES.map((t) => t.name).join(', '));
console.log('מכסות:', out.QUOTAS.map((q) => q.name + ' ' + q.sold + '/' + q.quota + (q.open ? ' (פתוח)' : ' (סגור)')).join(' · '));
console.log('היום:', out.todayOrders, 'הזמנות ·', out.todayRevenue, '₪');
console.log('חצי שנה:', out.revenueTotal, '₪ ·', out.revenueMonths.join(' '), '· שיא', out.revenueTip);
console.log('ציר Y:', out.revenueAxis.join(' '), '· נקודות:', out.revenueDots.map((d) => d.cx + ',' + d.cy).join(' '));
console.log('דונאט:', out.donutLegend.map((d) => d.name + ' ' + d.pct + '%').join(' · '), '· מרכז', out.donutCenter);
console.log('רווח:', out.profitNet, out.profitNetNote, '·', out.profitGross, out.profitGrossLabel, '·', out.profitBars.length, 'עמודות');
