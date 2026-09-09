import fs from 'fs';
import { loadDishes, unitCosts, saladCostPerKg } from './lib/dish-costs.mjs';

/**
 * חילוץ מסך התפריט מהקנבס.
 * ⚠ המסך לקריאה בלבד · המחיר והעלות מגיעים ממסך עלויות הייצור.
 *
 * ⚠ לא מהקנבס · העלויות אינן נלקחות מ-MENU שבמרקאפ אלא מחושבות מעץ
 * המתכונים של AdminCosts. הן נכתבו שם ביד ונעו מהמקור (19.9 מול 21.3,
 * 30.8 מול 43.8, 213.3 מול 244.3). שקד ביקשה שהתפריט יתעדכן אוטומטית.
 */

/* שני פריטים בתפריט נקראים אחרת ממה שהם נקראים בעלויות הייצור */
const COST_ALIASES = {
  'חלה לכל אירוע': 'חלה לכל אירוע · הבסיס',
};
/* פריט שאינו מנה יחידה אלא ממוצע · קילו סלט */
const SALAD_PER_KG = 'סלטים · ק״ג';
const SRC = '/Users/shakedgoren/Downloads/files/design/app/AdminMenu.dc.html';
const OUT = process.env.SP + '/admin-menu.json';

const src = fs.readFileSync(SRC, 'utf8');
const js = /<script data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(src)[1];
const markup = src.replace(/<script data-dc-script[\s\S]*?<\/script>/, '');

const NAMES = ['CATS', 'MENU'];
const head = js.slice(0, js.indexOf('class Component'));
const mod = head + '\nexport { ' + NAMES.join(', ') + ' };';
const m = await import('data:text/javascript;base64,' + Buffer.from(mod).toString('base64'));
const out = {};
for (const k of NAMES) out[k] = m[k];

/* ── העלויות · מעץ המתכונים, לא מהמרקאפ ── */
const dishes = await loadDishes();
const costs = unitCosts(dishes);
const saladKg = saladCostPerKg(dishes);

out.MENU = out.MENU.map((item) => {
  const cost = item.name === SALAD_PER_KG
    ? saladKg
    : costs.get(COST_ALIASES[item.name] || item.name);
  if (cost === undefined) {
    throw new Error(`${item.name}: אין מנה תואמת בעלויות הייצור`);
  }
  return { ...item, cost };
});

const pick = (name) => {
  const hits = [...js.matchAll(new RegExp(name + ":\\s*'([^']*)'", 'g'))];
  if (hits.length !== 1) throw new Error(name + ': ' + hits.length + ' התאמות במקום אחת');
  return hits[0][1];
};
for (const k of ['sub', 'priceLabel', 'costLabel', 'profitLabel']) out[k] = pick(k);

/* תווית הרווחיות · הקידומת שלפני האחוז */
const margin = /marginLabel: '([^']*)' \+ pct/.exec(js);
if (!margin) throw new Error('תווית רווחיות: לא נמצאה');
out.marginPrefix = margin[1];

/* הסף שמתחתיו הרווחיות נחשבת דקה · חייב להיות מוגדר פעם אחת */
const thin = [...js.matchAll(/thin = pct < (\d+)/g)];
if (thin.length !== 1) throw new Error('סף רווחיות: ' + thin.length + ' התאמות במקום אחת');
out.THIN_MARGIN = Number(thin[0][1]);
/* אותו סף חוזר גם על הרווחיות הממוצעת · מאמתים שהוא זהה */
const avgThin = [...js.matchAll(/avg < (\d+)/g)];
if (avgThin.length !== 1 || Number(avgThin[0][1]) !== out.THIN_MARGIN)
  throw new Error('סף הרווחיות הממוצעת שונה מסף הפריט');

/* שמות שלושת הסיכומים */
out.KPI_KEYS = [...js.matchAll(/\{ k: '([^']*)', v:/g)].map((h) => h[1]);
if (out.KPI_KEYS.length !== 3) throw new Error('סיכומים: ' + out.KPI_KEYS.length + ' במקום 3');

out.startCat = /cat: '(\w+)'/.exec(js)[1];

const title = [...markup.matchAll(/>(תפריט)<\/div>/g)];
if (title.length !== 1) throw new Error('כותרת: ' + title.length + ' במקום אחת');
out.title = title[0][1];

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));

console.log('קטגוריות:', out.CATS.map((c) => c.n).join(', '), '· ברירת מחדל:', out.startCat);
console.log('פריטים:', out.MENU.length);
for (const c of out.CATS) {
  const list = out.MENU.filter((x) => x.c === c.id);
  const tp = list.reduce((s, x) => s + x.price, 0);
  const tc = list.reduce((s, x) => s + x.cost, 0);
  const avg = Math.round(((tp - tc) / tp) * 100);
  const thinOnes = list.filter((x) => Math.round(((x.price - x.cost) / x.price) * 100) < out.THIN_MARGIN);
  console.log(' ', c.n + ':', list.length, 'פריטים · רווחיות ממוצעת', avg + '%',
    '· עלות ממוצעת', (tc / list.length).toFixed(1), '₪',
    thinOnes.length ? '· דקים: ' + thinOnes.map((x) => x.name).join(', ') : '');
}
console.log('סף רווחיות דקה:', out.THIN_MARGIN + '%', '· סיכומים:', out.KPI_KEYS.join(', '));
