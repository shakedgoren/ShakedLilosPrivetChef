import fs from 'fs';
const d = JSON.parse(fs.readFileSync('/private/tmp/claude-501/-Users-shakedgoren-Downloads-files/5277944c-663e-4ec8-97a6-1bc89cfdb41a/scratchpad/chef.json','utf8'));
const j = (v) => JSON.stringify(v, null, 2);
const ts = `import { buildSlots } from '../order/types';

/**
 * שף וטאבון · הנתונים חולצו אוטומטית מ-Chef.dc.html בקנבס,
 * כדי שכל טקסט, מחיר ותפריט יהיו זהים בדיוק למה ששקד כתבה.
 * לעדכון: node scripts/extract-chef.mjs && node scripts/emit-chef.mjs
 */

export type Named = { n: string; d?: string; [k: string]: any };

export const CONCEPTS = ${j(d.CONCEPTS)} as const;
export const CONCEPT_FAM: Record<string, 'meat' | 'milk'> = ${j(d.CONCEPT_FAM)};
export const TIERS: string[] = ${j(d.TIERS)};
export const TIER_LINES = ${j(d.TIER_LINES)} as const;
export const STYLES: string[] = ${j(d.STYLES)};
export const STYLES_ALL: string[] = ${j(d.STYLES_ALL)};

export const CHEF_PRICES: Record<'meat' | 'milk', Record<string, number[]>> = ${j(d.CHEF_PRICES)};

/* טאבון · מחיר לראש יורד ככל שיש יותר סועדים */
export const TABOON_TIERS: number[][] = ${j(d.TABOON_TIERS)};
export const T_TABLE: number[][] = ${j(d.T_TABLE)};
export const T_EXTRAS = ${j(d.T_EXTRAS)} as const;

export const SALAD_BASE = ${d.SALAD_BASE};
export const SALAD_EXTRA = ${d.SALAD_EXTRA};
export const PASTA_BASE = ${d.PASTA_BASE};
export const PASTA_EXTRA = ${d.PASTA_EXTRA};
export const PASTA_UP_EXTRA = ${d.PASTA_UP_EXTRA};
export const DESSERT_BASE = ${d.DESSERT_BASE};
export const DESSERT_EXTRA = ${d.DESSERT_EXTRA};
export const FIRST_EXTRA = ${d.FIRST_EXTRA};

/* שבע צורות הפסטה · כל צורה היא רשימת קווים, הפנימיים דקים יותר.
   מוצגות בחלונית שנפתחת אחרי בחירת רוטב. */
export type PastaShape = { n: string; paths: { d: string; thin?: boolean }[] };
export const PASTA_SHAPES: PastaShape[] = ${j(d.PASTA_SHAPES)};
export const T_PASTA_UPS: string[] = ${j(d.T_PASTA_UPS)};
/* שני השדרוגים של ארוחת השף · עיצוב שולחן וחבילת שתייה */
export const EXTRAS = ${j(d.EXTRAS)} as const;
export const EXTRA_TABLE: Record<string, number> = ${j(d.EXTRA_TABLE)};
export const EXTRA_DRINK = ${d.EXTRA_DRINK};

export type ChefSection = { kind: string; [k: string]: any };
export type ChefPackage = {
  key: 'chef' | 'taboon';
  short: string;
  name: string;
  base: number;
  price: string;
  desc: string;
  title: string;
  intro?: { text: string; w: string; size: string; fg: string }[];
  pages: ChefSection[][];
  pageTitles?: string[];
  [k: string]: any;
};

export const CHEF_PACKAGES: ChefPackage[] = ${j(d.BOXES)};

const DELIVERY_STEP_MINUTES = ${d.DELIV_STEP};

export const CHEF_FULFILLMENT = {
  pickupFrom: ${d.PICK_FROM},
  pickupTo: ${d.PICK_TO},
  deliverySlots: buildSlots(${d.DELIV_FROM}, ${d.DELIV_TO}, DELIVERY_STEP_MINUTES),
  clockFallback: '10:00',
} as const;

const bracketOf = (g: number) => (g <= 4 ? '2-4' : g <= 11 ? '5-11' : '12-16');

/**
 * המחיר לסועד בכל אחת משלוש הדרגות · null כשהציר עוד לא נבחר,
 * ואז הקנבס מציג ״—״. נדרש כדי שכל כרטיס דרגה יציג את מחירו.
 */
export function tierPrices(picks: Record<string, any>): (number | null)[] {
  const fam = CONCEPT_FAM[picks.concept];
  if (!fam) return TIERS.map(() => null);
  return CHEF_PRICES[fam][bracketOf(picks.guests || 2)];
}

/** מחיר לסועד בארוחת שף · לפי ציר, מספר סועדים ומסלול */
export function chefPerGuest(picks: Record<string, any>): number {
  const fam = CONCEPT_FAM[picks.concept];
  const t = TIERS.indexOf(picks.tier);
  if (!fam || t < 0) return 0;
  return CHEF_PRICES[fam][bracketOf(picks.guests || 2)][t];
}

/**
 * מחיר שדרוג · בקנבס (extraPrice) עיצוב השולחן הוא סכום חד־פעמי לפי
 * מדרגת הסועדים, וחבילת השתייה היא 120 ש״ח **לכל סועד**.
 *
 * ⚠ **תוקן באג** · הגרסה הקודמת השוותה את השם ל-״שתייה״ — מחרוזת
 * שלא קיימת באף אפשרות — ולכן חבילת השתייה קיבלה את מחיר עיצוב
 * השולחן, וגם בלי הכפלה במספר הסועדים. ב-6 סועדים זה 400 במקום 720.
 * ההשוואה נעשית עכשיו לשמות עצמם, כמו EXTRAS[0] ו-EXTRAS[1] בקנבס.
 */
const extraPrice = (name: string, guests: number): number => {
  if (name === EXTRAS[0].n) return EXTRA_TABLE[bracketOf(guests)] ?? 0;
  if (name === EXTRAS[1].n) return EXTRA_DRINK * guests;
  return 0;
};

export const extrasTotal = (picks: Record<string, any>): number =>
  ((picks.extras as string[]) || []).reduce((sum, n) => sum + extraPrice(n, picks.guests || 0), 0);

/** מחיר לראש בטאבון · יורד במדרגות לפי מספר הסועדים */
export function taboonPerHead(g: number): number {
  if (!g) return 0;
  for (const [upTo, price] of TABOON_TIERS) if (g <= upTo) return price;
  return TABOON_TIERS[TABOON_TIERS.length - 1][1];
}

const tExtra = (name: string) => (T_EXTRAS as readonly any[]).find((e) => e.n === name);

const taboonTable = (g: number): number => {
  for (const [upTo, price] of T_TABLE) if (g <= upTo) return price;
  return T_TABLE[T_TABLE.length - 1][1];
};

/** תוספות שנספרות לכל ראש · ראשונות, וכל מנה מעבר למכסה הכלולה */
export function taboonAddPerHead(picks: Record<string, any>): number {
  const len = (id: string) => ((picks[id] as unknown[]) || []).length;
  const pastas: { up?: boolean }[] = picks.pastas || [];
  let add = len('firsts') * FIRST_EXTRA;
  add += Math.max(0, len('salads') - SALAD_BASE) * SALAD_EXTRA;
  add += Math.max(0, len('desserts') - DESSERT_BASE) * DESSERT_EXTRA;
  add += Math.max(0, pastas.length - PASTA_BASE) * PASTA_EXTRA;
  add += pastas.filter((x) => x.up).length * PASTA_UP_EXTRA;
  ((picks.textras as string[]) || []).forEach((nm) => {
    const e = tExtra(nm);
    if (e && e.per) add += e.per;
  });
  return add;
}

/** תוספות בתשלום חד־פעמי · שולחן ערוך לפי גודל הקבוצה */
export const taboonFlat = (picks: Record<string, any>): number =>
  ((picks.textras as string[]) || []).reduce((sum, nm) => {
    const e = tExtra(nm);
    return sum + (e && e.tiered ? taboonTable(picks.guests || 0) : 0);
  }, 0);

export function priceOfPackage(pkg: ChefPackage, picks: Record<string, any>): number {
  const g = picks.guests || 0;
  if (pkg.key === 'chef') return g * chefPerGuest(picks) + extrasTotal(picks);
  return g * (taboonPerHead(g) + taboonAddPerHead(picks)) + taboonFlat(picks);
}

/* ── סיכום בקשת ההצעה · מדויק ל-lines ול-recap בקנבס ── */

export type QuoteLine = { name: string; sum: number };
export type RecapRow = { k: string; v: string };

/** שורת התיאור של פסטה · רוטב · צורה · שדרוג */
const pastaLine = (x: { sauce?: string; shape?: string | null; up?: string | null }): string => {
  if (!x.sauce) return '';
  const bits = [x.sauce];
  if (x.shape) bits.push(x.shape);
  if (x.up) bits.push(x.up + ' • שדרוג');
  return bits.join(' · ');
};

/**
 * הפירוט המחירי של בקשת ההצעה · הבסיס ואז כל שדרוג בשורה משלו,
 * כשכל סכום הוא כבר לכל הסועדים. זה מה שהקנבס מציג במסך הסיום,
 * ומה שנשמר בשרת, כדי שהלקוחה והניהול יראו את אותן שורות.
 */
export function quoteLines(pkg: ChefPackage, picks: Record<string, any>): QuoteLine[] {
  const q = picks;
  const g = q.guests || 0;
  const forG = ' עבור ' + g + ' סועדים';

  if (pkg.key === 'chef') {
    const out: QuoteLine[] = [
      { name: pkg.short + (q.tier ? ' ' + q.tier : '') + forG, sum: g * chefPerGuest(q) },
    ];
    ((q.extras as string[]) || []).forEach((n) =>
      out.push({ name: n + forG, sum: extraPrice(n, g) }),
    );
    return out;
  }

  /* טאבון · הבסיס, ואז כל תוספת בשורה משלה */
  const out: QuoteLine[] = [{ name: pkg.short + forG, sum: g * taboonPerHead(g) }];
  const over = (id: string, base: number, price: number, label: string) => {
    const k = Math.max(0, ((q[id] as unknown[]) || []).length - base);
    if (k > 0) out.push({ name: label + ' × ' + k + forG, sum: k * price * g });
  };
  over('salads', SALAD_BASE, SALAD_EXTRA, 'סלט נוסף');
  over('desserts', DESSERT_BASE, DESSERT_EXTRA, 'קינוח נוסף');
  const pastas: { up?: string | null }[] = q.pastas || [];
  const kp = Math.max(0, pastas.length - PASTA_BASE);
  if (kp > 0) out.push({ name: 'פסטה נוספת × ' + kp + forG, sum: kp * PASTA_EXTRA * g });
  const ku = pastas.filter((x) => x.up).length;
  if (ku > 0) out.push({ name: 'שדרוג מנת פסטה × ' + ku + forG, sum: ku * PASTA_UP_EXTRA * g });
  ((q.firsts as string[]) || []).forEach((n) => out.push({ name: n + forG, sum: FIRST_EXTRA * g }));
  ((q.textras as string[]) || []).forEach((n) => {
    const e = tExtra(n);
    if (!e) return;
    if (e.per) out.push({ name: n + forG, sum: e.per * g });
    else out.push({ name: n, sum: taboonTable(g) });
  });
  return out;
}

/** המחיר לסועד בשורת הסיכום · 0 כשאין סועדים */
export const quotePerHead = (pkg: ChefPackage, picks: Record<string, any>): number =>
  (picks.guests || 0) > 0 ? Math.round(priceOfPackage(pkg, picks) / picks.guests) : 0;

/**
 * הסיכום המפורט · כל מה שנבחר, בסדר שבו נשאל.
 * שורות ריקות נשמטות, בדיוק כמו הסינון ב-recap בקנבס.
 */
export function quoteRecap(pkg: ChefPackage, picks: Record<string, any>): RecapRow[] {
  const p = picks;
  const join = (v: unknown) => (Array.isArray(v) ? v.join(', ') : v);

  const rows: [string, unknown][] =
    pkg.key === 'taboon'
      ? [
          ['שם', p.name], ['טלפון', p.phone],
          ['תאריך האירוע', p.date], ['שעות', p.daypart], ['כתובת', p.addr],
          ['סועדים', p.guests],
          ['סלטים', join(p.salads)],
          ['פסטות', ((p.pastas as any[]) || []).map(pastaLine).filter(Boolean).join(' | ')],
          ['קינוחים', join(p.desserts)],
          ['מנות ראשונות', join(p.firsts)],
          ['שדרוגים', join(p.textras)],
          ['אלרגיות', join(p.tAllergy)], ['פירוט האלרגיה', p.tAllergyTxt],
          ['מגבלות תזונה', join(p.tDiet)],
          ['לא על הפיצה', p.tDislike],
          ['מקום העמדה', p.tSpace], ['פירוט המקום', p.tSpaceTxt],
        ]
      : [
          ['שם', p.name], ['טלפון', p.phone],
          ['תאריך האירוע', p.date], ['שעות', p.daypart], ['כתובת', p.addr],
          ['סועדים', p.guests], ['ציר', p.concept], ['סגנון', p.style], ['מסלול', p.tier],
          ['סוג האירוע', p.occasion],
          ['עשיית הבשר', join(p.meatDone)], ['עשיית הדגים', join(p.fishDone)], ['דגים אהובים', join(p.fish)],
          ['חריפות', p.spice], ['הרפתקנות', p.brave], ['טעמים אהובים', p.love],
          ['אלרגיות', join(p.allergy)], ['פירוט האלרגיה', p.allergyTxt],
          ['לא אוהבים', join(p.dislike)], ['עוד לא אוהבים', p.dislikeTxt],
          ['מגבלות תזונה', join(p.diet)],
          ['המטבח במקום', p.kitchen], ['פירוט המטבח', p.kitchenTxt],
          ['בקשה ספציפית', p.wish], ['עוד לדעת', p.notes2],
          ['שדרוגים', join(p.extras)],
        ];

  return rows
    .filter((r) => r[1] !== undefined && r[1] !== null && String(r[1]).trim() !== '')
    .map((r) => ({ k: r[0], v: String(r[1]) }));
}
`;
fs.writeFileSync('/Users/shakedgoren/Downloads/files/mobile/src/data/chef.ts', ts);
console.log('נכתב ·', ts.length, 'תווים');
