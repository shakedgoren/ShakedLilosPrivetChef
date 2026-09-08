import fs from 'fs';
const d = JSON.parse(fs.readFileSync(process.env.SP + '/fruit.json', 'utf8'));
const j = (v) => JSON.stringify(v, null, 2);

const ts = `import { buildSlots } from '../order/types';

/**
 * מגשי פירות · הנתונים חולצו אוטומטית מ-Fruit.dc.html בקנבס.
 * לעדכון: node scripts/extract-fruit.mjs && node scripts/emit-fruit.mjs
 *
 * כל מגשי הפירות נעשים על ידי מיכל גורן.
 */

export type Tray = {
  name: string;
  price: number;
  /** התיאור · מה שלפני הנקודה המפרידה */
  desc: string;
  /** כמות הסועדים · מה שאחריה, בשורה נפרדת בכרטיס */
  serves: string;
};

const RAW = ${j(d.ITEMS)};

/** התיאור וכמות הסועדים מוצגים בשתי שורות · הקנבס מפצל על ״ • ״ */
export const FRUIT_TRAYS: Tray[] = RAW.map((it) => {
  const [desc, serves = ''] = it.desc.split(' • ');
  return { name: it.name, price: it.price, desc, serves };
});

/* ── טקסטים ── */
export const FRUIT_TITLE = ${j(d.title)};
export const FRUIT_HOURS = ${j(d.hours)};
export const BY_APPOINTMENT = ${j(d.byAppointment)};
export const INTRO_TITLE = ${j(d.introTitle)};
export const INTRO_BODY = ${j(d.introBody)};
export const DISCLAIMER = ${j(d.disclaimer)};
export const PHONE_LABEL = ${j(d.phoneLabel)};
export const PHONE_HREF = ${j('tel:' + d.phoneHref)};

/* ── מידות הכרטיס · מהקנבס ── */
export const CARD = {
  radius: ${d.cardRadius},
  padding: ${d.cardPad},
  /** הרווח בין שורות בתוך הכרטיס */
  inner: ${d.cardGap},
  shotHeight: ${d.shotHeight},
  shotRadius: ${d.shotRadius},
  gap: ${d.gridGap},
} as const;

const PICKUP_FROM = ${d.PICK_FROM};
const PICKUP_TO = ${d.PICK_TO};
const DELIVERY_STEP_MINUTES = ${d.DELIV_STEP};

export const FRUIT_FULFILLMENT = {
  pickupFrom: PICKUP_FROM,
  pickupTo: PICKUP_TO,
  deliverySlots: buildSlots(${d.DELIV_FROM}, ${d.DELIV_TO}, DELIVERY_STEP_MINUTES),
} as const;
`;
const OUT = '/Users/shakedgoren/Downloads/files/mobile/src/data/fruit.ts';
fs.writeFileSync(OUT, ts);
console.log('נכתב', OUT, '·', ts.split('\n').length, 'שורות');
