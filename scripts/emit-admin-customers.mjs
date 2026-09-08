import fs from 'fs';

const d = JSON.parse(fs.readFileSync(process.env.SP + '/admin-customers.json', 'utf8'));
const j = (v) => JSON.stringify(v, null, 2);

const ts = `/**
 * לקוחות · הנתונים חולצו אוטומטית מ-AdminCustomers.dc.html בקנבס.
 * לעדכון: node scripts/extract-admin-customers.mjs && node scripts/emit-admin-customers.mjs
 */

export type CustomerCatKey = 'cous' | 'schn' | 'box' | 'fruit' | 'chef';
export type Hue = { n: string; hue: string; deep: string; rgb: string };
export const HUES: Record<CustomerCatKey, Hue> = ${j(d.HUES)};

export type Person = {
  name: string;
  phone: string;
  /** לקוחה מאז · חודש ושנה */
  since: string;
  orders: number;
  spent: number;
  addr: string;
  last: string;
  /** הקטגוריות שהיא מזמינה */
  likes: CustomerCatKey[];
  note: string;
};
/** ⚠ לקוחות הדגמה · נכתבו על ידי Claude בקנבס */
export const PEOPLE: Person[] = ${j(d.PEOPLE)};

export type PastOrder = { d: string; k: CustomerCatKey; t: string; v: number; s: string };
/** ⚠ היסטוריית ההזמנות · נתוני הדגמה שנכתבו על ידי Claude בקנבס */
export const HISTORY: Record<string, PastOrder[]> = ${j(d.HISTORY)};

export const STATE_TONE: Record<string, { bg: string; fg: string }> = ${j(d.STATE_TONE)};

/** מכאן ומעלה נחשבת לקוחה קבועה */
export const REGULAR = ${d.REGULAR};

export const FILTERS: { id: 'all' | 'reg' | 'new'; name: string }[] = ${j(d.FILTERS)};

/* ── כותרות ── */
export const CUSTOMERS_TITLE = ${j(d.title)};
export const SUB_MIDDLE = ${j(d.subMiddle)};
export const SUB_SUFFIX = ${j(d.subSuffix)};
export const SEARCH_PLACEHOLDER = ${j(d.searchPh)};
export const EMPTY_LABEL = ${j(d.emptyLabel)};
export const CALL_LABEL = ${j(d.callLabel)};
export const HIST_LABEL = ${j(d.histLabel)};
export const ORDER_LABEL = ${j(d.orderLabel)};
export const NOTE_LABEL = ${j(d.noteLabel)};
export const NOTE_PLACEHOLDER = ${j(d.notePh)};
export const TAG_REGULAR = ${j(d.tagRegular)};
export const TAG_NEW = ${j(d.tagNew)};
export const HIST_TITLE_PREFIX = ${j(d.histTitlePrefix)};
export const HIST_SUB_SUFFIX = ${j(d.histSubSuffix)};
export const DETAIL_KEYS = ${j(d.DETAIL_KEYS)} as const;
`;

const OUT = '/Users/shakedgoren/Downloads/files/mobile/src/data/adminCustomers.ts';
fs.writeFileSync(OUT, ts);
console.log('נכתב', OUT, '·', ts.split('\n').length, 'שורות');
