import fs from 'fs';
const d = JSON.parse(fs.readFileSync(process.env.SP + '/login.json', 'utf8'));
const j = (v) => JSON.stringify(v, null, 2);
const ts = `/**
 * מסך ההתחברות · חולץ אוטומטית מ-Login.dc.html בקנבס.
 * לעדכון: node scripts/extract-login.mjs && node scripts/emit-login.mjs
 */

export type LoginField = {
  id: string;
  label: string;
  placeholder: string;
  type: 'text' | 'tel' | 'email' | 'password';
  hint: string;
};

/** שני שדות בכניסה · חמישה בהרשמה */
export const FIELDS_IN: LoginField[] = ${j(d.fieldsIn)};
export const FIELDS_UP: LoginField[] = ${j(d.fieldsUp)};

export const PASS_MIN = ${d.passMin};

export const BRAND = ${j(d.brand)};
export const BRAND_SUB = ${j(d.brandSub)};
export const TAB_IN = ${j(d.tabIn)};
export const TAB_UP = ${j(d.tabUp)};
export const LEDE_IN = ${j(d.ledeIn)};
export const LEDE_UP = ${j(d.ledeUp)};
export const GOOGLE_LABEL = ${j(d.googleLabel)};
export const OR_LABEL = ${j(d.orLabel)};
export const FORGOT_LABEL = ${j(d.forgotLabel)};
export const CTA_IN = ${j(d.ctaIn)};
export const CTA_UP = ${j(d.ctaUp)};
export const GUEST_LABEL = ${j(d.guestLabel)};
`;
const OUT = '/Users/shakedgoren/Downloads/files/mobile/src/data/login.ts';
fs.writeFileSync(OUT, ts);
console.log('נכתב', OUT);
