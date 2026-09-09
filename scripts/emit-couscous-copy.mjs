import fs from 'fs';
const d = JSON.parse(fs.readFileSync(process.env.SP + '/couscous.json', 'utf8'));
const j = (v) => JSON.stringify(v, null, 2);

const ts = `/**
 * טקסטים ומידות של מסך הקוסקוס · חולצו אוטומטית מ-Order.dc.html.
 * לעדכון: node scripts/extract-couscous.mjs && node scripts/emit-couscous-copy.mjs
 *
 * המנות והמחירים יושבים ב-couscous.ts · כאן רק מה שבמרקאפ.
 */

export const COUSCOUS_TITLE = ${j(d.title)};
export const COUSCOUS_DATE = ${j(d.saleDate)};
export const COUSCOUS_INTRO = ${j(d.intro)};
export const PICKLE_NOTE = ${j(d.pickleNote)};
export const ADDONS_LABEL = ${j(d.addonsLabel)};
export const TOTAL_LABEL = ${j(d.totalLabel)};

/** מונה המנות בסרגל התחתון · יחיד ורבים */
export const COUNT_ONE = ${j(d.countOne)};
export const COUNT_MANY = ${j(d.countMany)};
export const mealsLabel = (n: number) => (n === 1 ? COUNT_ONE : n + COUNT_MANY);

/** שורת המנה · מהמרקאפ של הקנבס */
export const DISH_ROW = {
  height: ${d.rowHeight},
  radius: ${d.rowRadius},
  shotSize: ${d.shotSize},
  shotRadius: ${d.shotRadius},
} as const;

/** כרטיס התוספת · שלוש עמודות, בלי תמונה */
export const ADDON_CARD = {
  radius: ${d.addonRadius},
  padding: ${d.addonPad},
  gap: ${d.addonGap},
  columns: 3,
} as const;
`;
const OUT = '/Users/shakedgoren/Downloads/files/mobile/src/data/couscousCopy.ts';
fs.writeFileSync(OUT, ts);
console.log('נכתב', OUT);
