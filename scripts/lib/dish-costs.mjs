import fs from 'fs';

/**
 * עלויות המנות · המקור היחיד הוא עץ המתכונים של AdminCosts.
 *
 * ⚠ לא מהקנבס · המודול הזה נכתב על ידי Claude כדי שמסך התפריט יפסיק
 * להקליד את העלויות ביד. AdminMenu.dc.html מחזיק אותן כמספרים קבועים,
 * והם נעו מ-AdminCosts (19.9 מול 21.3 וכו׳). כאן מחשבים אותן פעם אחת
 * מ-DISHES ומזינים מכאן גם את מסך התפריט.
 *
 * הפונקציות הן נמל אחד לאחד של unitCost/saladAvg100/partsSum
 * שב-AdminCosts.dc.html. כל שינוי בהן שם חייב להיות משוקף כאן.
 */
const SRC = '/Users/shakedgoren/Downloads/files/design/app/AdminCosts.dc.html';

/** עומק רקורסיה מרבי · זהה למגן שבקנבס */
const MAX_DEPTH = 4;
/** עלות הסלטים מחושבת ל-100 גרם */
const SALAD_UNIT_G = 100;
/** העומק שבו נקראים הסלטים לחישוב הממוצע · כמו בקנבס */
const SALAD_DEPTH = 3;

/** טוען את DISHES מתוך המרקאפ של AdminCosts */
export async function loadDishes() {
  const src = fs.readFileSync(SRC, 'utf8');
  const js = /<script data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(src)[1];
  const head = js.slice(0, js.indexOf('class Component'));
  const mod = head + '\nexport { DISHES };';
  const m = await import('data:text/javascript;base64,' + Buffer.from(mod).toString('base64'));
  return m.DISHES;
}

/** סה״כ המצרכים · מחיר כפול כמות בכל שורה */
const partsSum = (d) => (d.parts || []).reduce((s, p) => s + p.price * p.qty, 0);

/**
 * מחשב את העלות ליחידה של כל מנה.
 * מחזיר מפה משם המנה לעלות — השם הוא המפתח שמסך התפריט משתמש בו.
 */
export function unitCosts(dishes) {
  return buildCosts(dishes).costs;
}

/** עלות קילו סלט · ממוצע הסלטים ל-100 גרם, כפול עשרה */
export function saladCostPerKg(dishes) {
  return Math.round(buildCosts(dishes).saladAvg100() * 10 * 10) / 10;
}

function buildCosts(dishes) {
  const byId = (id) => dishes.find((d) => d.id === id);

  const saladAvg100 = () => {
    const list = dishes.filter((d) => d.sub === 'salads');
    if (!list.length) return 0;
    return list.reduce((s, d) => s + unitCost(d, SALAD_DEPTH), 0) / list.length;
  };

  function unitCost(d, depth = 0) {
    if (depth > MAX_DEPTH) return 0;

    let base = 0;
    for (const f of d.from || []) {
      if (f.id === 'salads:avg') {
        base += saladAvg100() * f.m;
        continue;
      }
      const src = byId(f.id);
      if (src) base += unitCost(src, depth + 1) * f.m;
    }

    const own = partsSum(d);
    const yld = d.yld === undefined ? 0 : d.yld;

    if (d.mode === 'weight') return yld > 0 ? own / (yld / SALAD_UNIT_G) : 0;
    if (own > 0 && yld > 0) base += own / yld;
    else if (own > 0 && yld === 0) base += own;
    return base;
  }

  const costs = new Map();
  for (const d of dishes) {
    if (costs.has(d.name)) throw new Error(`שם מנה כפול ב-AdminCosts: ${d.name}`);
    costs.set(d.name, Math.round(unitCost(d) * 10) / 10);
  }
  return { costs, saladAvg100 };
}
