/**
 * אזור אישי · הנתונים חולצו אוטומטית מ-Profile.dc.html בקנבס.
 * לעדכון: node scripts/extract-profile.mjs && node scripts/emit-profile.mjs
 */

/** הערים שיש אליהן משלוח · אותן ערים של מסכי ההזמנה */
export const SHIP_CITIES: string[] = [
  "יבנה",
  "אשדוד",
  "גדרה",
  "נס ציונה",
  "רחובות",
  "ראשון לציון"
];

/**
 * ⚠ הדגמה בלבד · מסד הכתובות האמיתי יגיע מ-Google Places או מ-data.gov.il.
 * להחלפה צריך רק להחליף את STREETS במקור אמיתי.
 */
export const STREETS: Record<string, string[]> = {
  "יבנה": [
    "הרצל",
    "ויצמן",
    "הדקל",
    "נופר",
    "שדרות דואני",
    "הפרחים"
  ],
  "אשדוד": [
    "רוגוזין",
    "הבנים",
    "שבי ציון",
    "הרצל"
  ],
  "גדרה": [
    "הרצל",
    "בילו",
    "ויצמן"
  ],
  "נס ציונה": [
    "הבנים",
    "ויצמן",
    "הרצל"
  ],
  "רחובות": [
    "הרצל",
    "ויצמן",
    "בילו",
    "רוטשילד"
  ],
  "ראשון לציון": [
    "רוטשילד",
    "הרצל",
    "ז׳בוטינסקי"
  ],
  "תל אביב": [
    "דיזנגוף",
    "אלנבי",
    "רוטשילד",
    "הרצל"
  ],
  "ירושלים": [
    "יפו",
    "קינג ג׳ורג׳",
    "הרצל"
  ],
  "חיפה": [
    "הרצל",
    "מוריה",
    "הנשיא"
  ],
  "באר שבע": [
    "הרצל",
    "רגר",
    "העצמאות"
  ]
};

/** כל צירופי רחוב·עיר · המקור להשלמה */
export const PLACES: { street: string; city: string }[] = Object.entries(STREETS).flatMap(
  ([city, streets]) => streets.map((street) => ({ street, city })),
);

/** ⚠ ערכי הדגמה · נכתבו על ידי Claude כדי שהמסך לא יהיה ריק */
export const SEED = {
  "name": "דנה כהן",
  "phone": "050-1234567",
  "mail": "dana@example.com",
  "addr": "הרצל 14, יבנה"
};

export const PASS_MIN = 8;

export type ProfileField = {
  id: 'name' | 'phone' | 'mail';
  label: string;
  placeholder: string;
  type: string;
  hint: string;
};
export const PERSONAL: ProfileField[] = [
  {
    "id": "name",
    "label": "שם מלא",
    "placeholder": "שם ושם משפחה",
    "type": "text",
    "hint": "צריך שם כדי שאדע למי לקרוא"
  },
  {
    "id": "phone",
    "label": "טלפון",
    "placeholder": "050-0000000",
    "type": "tel",
    "hint": "מספר טלפון לא תקין"
  },
  {
    "id": "mail",
    "label": "אימייל",
    "placeholder": "name@mail.com",
    "type": "email",
    "hint": "כתובת אימייל לא תקינה"
  }
];

export type PassField = { id: 'cur' | 'next' | 'again'; label: string; hint: string };
export const PASS_FIELDS: PassField[] = [
  {
    "id": "cur",
    "label": "הסיסמה הנוכחית",
    "hint": ""
  },
  {
    "id": "next",
    "label": "סיסמה חדשה",
    "hint": "הסיסמה קצרה מדי"
  },
  {
    "id": "again",
    "label": "אימות הסיסמה החדשה",
    "hint": "שתי הסיסמאות לא זהות"
  }
];
/** מציין המקום של שדה הסיסמה החדשה מורכב מהמינימום · לכן הוא נבנה ולא קבוע */
export const PASS_RULE = "לפחות " + PASS_MIN + " תווים";
export const PASS_PLACEHOLDERS = {
  cur: "הסיסמה שאיתה נכנסת",
  next: PASS_RULE,
  again: "שוב, בדיוק אותו דבר",
} as const;

/* ── כותרות ── */
export const PROFILE_TITLE = "אזור אישי";
export const NO_NAME = "ללא שם";
export const SINCE_LABEL = "לקוחה מאז אוגוסט 2026";
export const PERSONAL_LABEL = "פרטים אישיים";
export const ADDR = {
  label: "כתובת מגורים",
  note: "לשימוש במשלוחים",
  placeholder: "רחוב, מספר ועיר",
  hint: "יש להזין כתובת מלאה",
  noShip: "אין משלוחים לאיזור הזה",
} as const;
export const SAVE_LABEL = "שמור";
export const SAVED_LABEL = "הפרטים נשמרו";
export const SECURITY_LABEL = "אבטחה";
export const PASS = {
  title: "שינוי סיסמה",
  sub: "מומלץ להחליף מדי כמה חודשים",
  cta: "עדכון הסיסמה",
} as const;
export const SIGN_OUT = {
  title: "להתנתק מהחשבון?",
  body: "ההזמנות והפרטים שלך יישמרו. תוכלי להיכנס שוב מתי שתרצי.",
  cancel: "ביטול",
  confirm: "התנתקות",
} as const;
