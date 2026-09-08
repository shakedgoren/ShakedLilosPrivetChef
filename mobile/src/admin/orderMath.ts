import {
  DELIV_MIN_MEALS,
  MENU,
  ROLL,
  SHIP_FEE,
  type AdminCatKey,
} from '../data/adminOrders';

/** טיוטת ההזמנה הידנית · מה שממולא בחלונית לפני השמירה */
export type NewOrderDraft = {
  name: string;
  phone: string;
  cat: AdminCatKey;
  qty: Record<string, number>;
  rolls: { type: string; tops: string[] }[];
  ship: 'pickup' | 'deliv';
  area: string;
  addr: string;
  time: string;
};

export const EMPTY_DRAFT: NewOrderDraft = {
  name: '',
  phone: '',
  cat: 'cous',
  qty: {},
  rolls: [],
  ship: 'pickup',
  area: 'יבנה',
  addr: '',
  time: '',
};

/* מנות שנספרות למינימום המשלוח · תוספות אינן מנות */
const MEAL_IDS = ['veg', 'chick', 'mafr'];

export const trim = (v: unknown) => String(v ?? '').trim();

export const okPhone = (v: string) => /^0(5\d|[2-4,8-9])-?\d{7}$/.test(trim(v).replace(/\s/g, ''));

/** מספר מנורמל · כדי שכל הצורות של אותו טלפון ייחשבו זהות */
export const norm = (v: string) => trim(v).replace(/[-\s]/g, '').replace(/^\+972/, '0');

export const rollsSum = (d: NewOrderDraft) =>
  d.cat !== 'schn' ? 0 : d.rolls.reduce((s, r) => s + ROLL[r.type].price, 0);

/** הסכום נגזר מהפריטים · אף פעם לא מוקלד */
export const itemsSum = (d: NewOrderDraft) =>
  (MENU[d.cat] ?? []).reduce((s, it) => s + (d.qty[it.id] ?? 0) * it.price, 0) + rollsSum(d);

export const shipFee = (d: NewOrderDraft) => (d.ship === 'deliv' ? SHIP_FEE[d.area] ?? 0 : 0);

export const total = (d: NewOrderDraft) => itemsSum(d) + shipFee(d);

export const meals = (d: NewOrderDraft) =>
  d.cat !== 'cous' ? DELIV_MIN_MEALS : MEAL_IDS.reduce((s, id) => s + (d.qty[id] ?? 0), 0);

export const belowMin = (d: NewOrderDraft) =>
  d.ship === 'deliv' && d.cat === 'cous' && meals(d) < DELIV_MIN_MEALS;

export const isReady = (d: NewOrderDraft) => {
  if (trim(d.name) === '' || !okPhone(d.phone)) return false;
  if (itemsSum(d) <= 0) return false;
  if (d.ship === 'deliv' && trim(d.addr) === '') return false;
  return !belowMin(d);
};

/** שורת הפריטים · בדיוק בניסוח של הזמנה שהלקוחה שלחה */
export const itemsLine = (d: NewOrderDraft) => {
  const rolls =
    d.cat !== 'schn'
      ? []
      : d.rolls.map(
          (r) =>
            ROLL[r.type].s + (r.tops.length ? ` (${r.tops.join(', ')})` : ' (בלי תוספות)'),
        );
  const items = (MENU[d.cat] ?? [])
    .filter((it) => (d.qty[it.id] ?? 0) > 0)
    .map((it) => `${d.qty[it.id]} × ${it.s || it.n}`);
  return rolls.concat(items).join(' · ');
};
