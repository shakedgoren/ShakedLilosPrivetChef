/**
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
export const FIELDS_IN: LoginField[] = [
  {
    "id": "who",
    "label": "טלפון או אימייל",
    "placeholder": "050-0000000",
    "type": "text",
    "hint": "צריך טלפון או אימייל תקינים"
  },
  {
    "id": "pass",
    "label": "סיסמה",
    "placeholder": "לפחות 8 תווים",
    "type": "password",
    "hint": "הסיסמה קצרה מדי"
  }
];
export const FIELDS_UP: LoginField[] = [
  {
    "id": "name",
    "label": "שם מלא",
    "placeholder": "שם ושם משפחה",
    "type": "text",
    "hint": ""
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
  },
  {
    "id": "pass",
    "label": "סיסמה",
    "placeholder": "לפחות 8 תווים",
    "type": "password",
    "hint": "הסיסמה קצרה מדי"
  },
  {
    "id": "pass2",
    "label": "אימות הסיסמה",
    "placeholder": "שוב, בדיוק אותו דבר",
    "type": "password",
    "hint": "שתי הסיסמאות לא זהות"
  }
];

export const PASS_MIN = 8;

export const BRAND = "BITE & TELL";
export const BRAND_SUB = "שף פרטית · יבנה והשפלה";
export const TAB_IN = "כניסה";
export const TAB_UP = "הרשמה";
export const LEDE_IN = "טוב לראות אתכם שוב. נכנסים וממשיכים מאיפה שעצרתם.";
export const LEDE_UP = "עוד רגע ואתם בפנים. הפרטים נשמרים כדי שההזמנה הבאה תהיה מהירה.";
export const GOOGLE_LABEL = "המשך עם Google";
export const OR_LABEL = "או";
export const FORGOT_LABEL = "שכחתי סיסמה";
export const CTA_IN = "כניסה";
export const CTA_UP = "יצירת חשבון";
export const GUEST_LABEL = "להסתכל בלי חשבון";
