import fs from 'fs';
const d = JSON.parse(fs.readFileSync(process.env.SP + '/profile.json', 'utf8'));
const j = (v) => JSON.stringify(v, null, 2);

const ts = `/**
 * אזור אישי · הנתונים חולצו אוטומטית מ-Profile.dc.html בקנבס.
 * לעדכון: node scripts/extract-profile.mjs && node scripts/emit-profile.mjs
 */

/** הערים שיש אליהן משלוח · אותן ערים של מסכי ההזמנה */
export const SHIP_CITIES: string[] = ${j(d.SHIP_CITIES)};

/**
 * ⚠ הדגמה בלבד · מסד הכתובות האמיתי יגיע מ-Google Places או מ-data.gov.il.
 * להחלפה צריך רק להחליף את STREETS במקור אמיתי.
 */
export const STREETS: Record<string, string[]> = ${j(d.STREETS)};

/** כל צירופי רחוב·עיר · המקור להשלמה */
export const PLACES: { street: string; city: string }[] = Object.entries(STREETS).flatMap(
  ([city, streets]) => streets.map((street) => ({ street, city })),
);

/** ⚠ ערכי הדגמה · נכתבו על ידי Claude כדי שהמסך לא יהיה ריק */
export const SEED = ${j(d.SEED)};

export const PASS_MIN = ${d.PASS_MIN};

export type ProfileField = {
  id: 'name' | 'phone' | 'mail';
  label: string;
  placeholder: string;
  type: string;
  hint: string;
};
export const PERSONAL: ProfileField[] = ${j(d.PERSONAL)};

export type PassField = { id: 'cur' | 'next' | 'again'; label: string; hint: string };
export const PASS_FIELDS: PassField[] = ${j(d.PASS_FIELDS.map(({ id, label, hint }) => ({ id, label, hint })))};
/** מציין המקום של שדה הסיסמה החדשה מורכב מהמינימום · לכן הוא נבנה ולא קבוע */
export const PASS_RULE = ${j(d.passRuleParts.before)} + PASS_MIN + ${j(d.passRuleParts.after)};
export const PASS_PLACEHOLDERS = {
  cur: ${j(d.PASS_FIELDS[0].placeholderRaw.replace(/^'|'$/g, ''))},
  next: PASS_RULE,
  again: ${j(d.PASS_FIELDS[2].placeholderRaw.replace(/^'|'$/g, ''))},
} as const;

/* ── כותרות ── */
export const PROFILE_TITLE = ${j(d.title)};
export const NO_NAME = ${j(d.noName)};
export const SINCE_LABEL = ${j(d.sinceLabel)};
export const PERSONAL_LABEL = ${j(d.personalLabel)};
export const ADDR = {
  label: ${j(d.addrLabel)},
  note: ${j(d.addrNote)},
  placeholder: ${j(d.addrPh)},
  hint: ${j(d.addrHint)},
  noShip: ${j(d.noShipLabel)},
} as const;
export const SAVE_LABEL = ${j(d.saveLabel)};
export const SAVED_LABEL = ${j(d.savedLabel)};
export const SECURITY_LABEL = ${j(d.securityLabel)};
export const PASS = {
  title: ${j(d.passTitle)},
  sub: ${j(d.passSub)},
  cta: ${j(d.passCta)},
} as const;
export const SIGN_OUT = {
  title: ${j(d.outTitle)},
  body: ${j(d.outBody)},
  cancel: ${j(d.outCancel)},
  confirm: ${j(d.outConfirm)},
} as const;
`;
const OUT = '/Users/shakedgoren/Downloads/files/mobile/src/data/profile.ts';
fs.writeFileSync(OUT, ts);
console.log('נכתב', OUT, '·', ts.split('\n').length, 'שורות');
