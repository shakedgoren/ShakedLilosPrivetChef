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

/**
 * שורת המנה · הפינה מהקנבס.
 * ⚠ לא מהקנבס · שקד ביקשה תמונות גדולות יותר וצמודות לקצוות.
 * בקנבס: תמונה ${d.shotSize}, גובה ${d.rowHeight}, ריפוד 14.
 */
export const DISH_ROW = {
  height: 88,
  radius: ${d.rowRadius},
  shotSize: 70,
  shotRadius: 18,
  padding: 9,
} as const;

/**
 * כרטיס התוספת · שלוש עמודות.
 * ⚠ לא מהקנבס · שקד ביקשה תמונה מעל שם התוספת בתוך הכרטיס.
 * בקנבס הכרטיס ריק מתמונה.
 */
export const ADDON_CARD = {
  radius: ${d.addonRadius},
  padding: ${d.addonPad},
  gap: ${d.addonGap},
  columns: 3,
  /* ריבועית · תמונות התוספות הן צילומי קערה מלמעלה במסגרת ריבועית,
     וחיתוך לפס נמוך הראה רק את השולחן מסביב */
  shotAspect: 1,
  shotRadius: 12,
} as const;

/**
 * הרווח בין התיאור לרשימת המנות · מרווח של 16 בקנבס.
 * הכותרת מרחפת ב-top 30 ואזור הגלילה מתחיל ב-88.
 */
export const INTRO_GAP = 16;
export const LIST_GAP = 10;
`;
const OUT = '/Users/shakedgoren/Downloads/files/mobile/src/data/couscousCopy.ts';
fs.writeFileSync(OUT, ts);
console.log('נכתב', OUT);
