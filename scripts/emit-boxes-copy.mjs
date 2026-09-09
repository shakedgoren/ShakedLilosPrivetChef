import fs from 'fs';
const d = JSON.parse(fs.readFileSync(process.env.SP + '/boxes-copy.json', 'utf8'));
const j = (v) => JSON.stringify(v, null, 2);
const ts = `/**
 * טקסטים של מסך מארזי הספיישל · חולצו אוטומטית מ-Boxes.dc.html.
 * לעדכון: node scripts/extract-boxes-copy.mjs && node scripts/emit-boxes-copy.mjs
 *
 * המארזים והסעיפים יושבים ב-boxes.ts · כאן רק מה שבמרקאפ.
 */

export const BOXES_TITLE = ${j(d.listTitle)};
export const INTRO_TITLE = ${j(d.introTitle)};
export const INTRO_BODY = ${j(d.introBody)};
export const INTRO_CTA = ${j(d.introCta)};
`;
const OUT = '/Users/shakedgoren/Downloads/files/mobile/src/data/boxesCopy.ts';
fs.writeFileSync(OUT, ts);
console.log('נכתב', OUT);
