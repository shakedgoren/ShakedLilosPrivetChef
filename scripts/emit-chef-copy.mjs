import fs from 'fs';
const d = JSON.parse(fs.readFileSync(process.env.SP + '/chef-copy.json', 'utf8'));
const j = (v) => JSON.stringify(v, null, 2);
const ts = `/**
 * טקסטים של מסך פינת השף · חולצו אוטומטית מ-Chef.dc.html.
 * לעדכון: node scripts/extract-chef-copy.mjs && node scripts/emit-chef-copy.mjs
 *
 * החבילות והשאלון יושבים ב-chef.ts · כאן רק מה שבמרקאפ.
 */

export const CHEF_MENU_TITLE = ${j(d.menuTitle)};
export const INTRO_TITLE = ${j(d.introTitle)};
export const INTRO_BODY = ${j(d.introBody)};
export const INTRO_CTA = ${j(d.introCta)};
export const PICK_CTA = ${j(d.pickCta)};

/** הקרוסלה בכרטיס המסלול */
export const CARO = { height: ${d.caroHeight}, radius: ${d.caroRadius} } as const;
`;
const OUT = '/Users/shakedgoren/Downloads/files/mobile/src/data/chefCopy.ts';
fs.writeFileSync(OUT, ts);
console.log('נכתב', OUT);
