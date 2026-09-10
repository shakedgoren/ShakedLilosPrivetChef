import fs from 'fs';
const d = JSON.parse(fs.readFileSync(process.env.SP + '/schnitzel.json', 'utf8'));
const j = (v) => JSON.stringify(v, null, 2);

const ts = `/**
 * טקסטים ומידות של מסך השישניצל · חולצו אוטומטית מ-Schnitzel.dc.html.
 * לעדכון: node scripts/extract-schnitzel.mjs && node scripts/emit-schnitzel-copy.mjs
 *
 * המנות והמחירים יושבים ב-schnitzel.ts · כאן רק מה שבמרקאפ.
 */

export const SCHNITZEL_TITLE = ${j(d.title)};
export const SCHNITZEL_INTRO = ${j(d.intro)};
export const SCHNITZEL_DATE = ${j(d.saleDate)};
export const GIFT_NOTE = ${j(d.giftNote)};
export const PICK_TYPE_LABEL = ${j(d.pickTypeLabel)};

/** מידות כרטיס החלה · מהמרקאפ של הקנבס */
export const TYPE_CARD = {
  radius: ${d.cardRadius},
  padV: ${d.cardPadV},
  padH: ${d.cardPadH},
  gap: ${d.cardGap},
  shotHeight: ${d.shotHeight},
  shotRadius: ${d.shotRadius},
  gridGap: ${d.gridGap},
} as const;

export const GIFT_RADIUS = ${d.giftRadius};

/**
 * כרטיס צורת המארז · המידות נקראו מהמרקאפ של Schnitzel.dc.html
 * (גוש \`forms\`) · גובה 76, פינה 16, ריפוד 10, מרווח 7, אייקון 22.
 */
export const FORM_CARD = {
  height: 76,
  radius: 16,
  padding: 10,
  gap: 7,
  glyph: 22,
  gridGap: 9,
} as const;

/** הלוח שעוטף כל גוש בחירה במצב מארז · radius 22, padding 14 */
export const PANEL = { radius: 22, padding: 14, gap: 11, stackGap: 12 } as const;

/**
 * הרווח סביב כרטיס המתנה · בקנבס יש 36 לפניו ו-18 אחריו.
 * ⚠ לא מהקנבס · שקד ביקשה להוריד אותו עוד מעט ולקרב אליו את מה
 * שאחריו, כי הרווח שנפתח בין השניים היה גדול מדי.
 */
export const GIFT_SPACE = { before: 14, after: 6 } as const;

/**
 * שורת הרטב בקוקוט · ⚠ לא מהקנבס · שקד ביקשה שורות צרות יותר.
 * בקנבס השורה משתמשת באותו ריפוד של שורת החלה.
 */
export const COCOTTE_ROW = { padV: 7, padH: 12, radius: 16 } as const;

/** כרטיס התוספת בחלונית · שלוש עמודות, השורה האחרונה ממורכזת */
export const TOP_CARD = { columns: 3, boxColumns: 2, gap: 8, minHeight: 58, radius: 16 } as const;
`;
const OUT = '/Users/shakedgoren/Downloads/files/mobile/src/data/schnitzelCopy.ts';
fs.writeFileSync(OUT, ts);
console.log('נכתב', OUT);
