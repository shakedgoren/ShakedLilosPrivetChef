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
`;
const OUT = '/Users/shakedgoren/Downloads/files/mobile/src/data/schnitzelCopy.ts';
fs.writeFileSync(OUT, ts);
console.log('נכתב', OUT);
