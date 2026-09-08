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

/** מחיר לסועד בארוחת שף · לפי ציר, מספר סועדים ומסלול */
export function chefPerGuest(picks: Record<string, any>): number {
  const fam = CONCEPT_FAM[picks.concept];
  const t = TIERS.indexOf(picks.tier);
  if (!fam || t < 0) return 0;
  return CHEF_PRICES[fam][bracketOf(picks.guests || 2)][t];
}

const extraPrice = (name: string, guests: number): number => {
  if (name === 'שתייה') return EXTRA_DRINK;
  const key = bracketOf(guests);
  return EXTRA_TABLE[key] ?? 0;
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
`;
fs.writeFileSync('/Users/shakedgoren/Downloads/files/mobile/src/data/chef.ts', ts);
console.log('נכתב ·', ts.length, 'תווים');
