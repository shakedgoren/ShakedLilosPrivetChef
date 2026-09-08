/**
 * לקוחות · הנתונים חולצו אוטומטית מ-AdminCustomers.dc.html בקנבס.
 * לעדכון: node scripts/extract-admin-customers.mjs && node scripts/emit-admin-customers.mjs
 */

export type CustomerCatKey = 'cous' | 'schn' | 'box' | 'fruit' | 'chef';
export type Hue = { n: string; hue: string; deep: string; rgb: string };
export const HUES: Record<CustomerCatKey, Hue> = {
  "cous": {
    "n": "קוסקוס",
    "hue": "#7B5CBC",
    "deep": "#43307A",
    "rgb": "123,92,188"
  },
  "schn": {
    "n": "שישניצל",
    "hue": "#416D9E",
    "deep": "#2B4A6E",
    "rgb": "65,109,158"
  },
  "box": {
    "n": "ספיישל",
    "hue": "#437C59",
    "deep": "#2C5A3E",
    "rgb": "67,124,89"
  },
  "fruit": {
    "n": "פירות",
    "hue": "#B04A76",
    "deep": "#7A2E4E",
    "rgb": "176,74,118"
  },
  "chef": {
    "n": "שף",
    "hue": "#A85A28",
    "deep": "#7A3D18",
    "rgb": "168,90,40"
  }
};

export type Person = {
  name: string;
  phone: string;
  /** לקוחה מאז · חודש ושנה */
  since: string;
  orders: number;
  spent: number;
  addr: string;
  last: string;
  /** הקטגוריות שהיא מזמינה */
  likes: CustomerCatKey[];
  note: string;
};
/** ⚠ לקוחות הדגמה · נכתבו על ידי Claude בקנבס */
export const PEOPLE: Person[] = [
  {
    "name": "דנה כהן",
    "phone": "050-1234567",
    "since": "מרץ 2026",
    "orders": 14,
    "spent": 2180,
    "addr": "הרצל 14, יבנה",
    "last": "שלישי, 1.9 · 3 מנות קוסקוס",
    "likes": [
      "cous",
      "schn"
    ],
    "note": "אלרגית לשומשום"
  },
  {
    "name": "מיכל אברהם",
    "phone": "052-7654321",
    "since": "ינואר 2026",
    "orders": 23,
    "spent": 4310,
    "addr": "ויצמן 8, רחובות",
    "last": "שלישי, 1.9 · 4 מנות קוסקוס",
    "likes": [
      "cous",
      "fruit",
      "box"
    ],
    "note": ""
  },
  {
    "name": "יעל לוי",
    "phone": "054-9988776",
    "since": "אוגוסט 2026",
    "orders": 2,
    "spent": 220,
    "addr": "בילו 3, גדרה",
    "last": "שישי, 4.9 · 2 חלות שישניצל",
    "likes": [
      "schn"
    ],
    "note": ""
  },
  {
    "name": "רונית שגב",
    "phone": "053-4455667",
    "since": "מאי 2026",
    "orders": 9,
    "spent": 3050,
    "addr": "הבנים 2, נס ציונה",
    "last": "רביעי, 27.8 · מגש פירות בינוני",
    "likes": [
      "fruit",
      "box"
    ],
    "note": "מזמינה לאירועים"
  },
  {
    "name": "אורית ברק",
    "phone": "058-3322110",
    "since": "אוגוסט 2026",
    "orders": 1,
    "spent": 115,
    "addr": "רוטשילד 21, ראשון לציון",
    "last": "שלישי, 25.8 · 2 מנות קוסקוס",
    "likes": [
      "cous"
    ],
    "note": ""
  },
  {
    "name": "שירה מזרחי",
    "phone": "050-7778899",
    "since": "פברואר 2026",
    "orders": 31,
    "spent": 6740,
    "addr": "נופר 25, יבנה",
    "last": "שלישי, 1.9 · 4 מנות קוסקוס",
    "likes": [
      "cous",
      "schn",
      "chef"
    ],
    "note": "לקוחה קבועה של שלישי"
  },
  {
    "name": "טל אבידן",
    "phone": "050-1112223",
    "since": "יולי 2026",
    "orders": 5,
    "spent": 890,
    "addr": "הפרחים 9, יבנה",
    "last": "שלישי, 25.8 · 4 מנות קוסקוס",
    "likes": [
      "cous"
    ],
    "note": ""
  }
];

export type PastOrder = { d: string; k: CustomerCatKey; t: string; v: number; s: string };
/** ⚠ היסטוריית ההזמנות · נתוני הדגמה שנכתבו על ידי Claude בקנבס */
export const HISTORY: Record<string, PastOrder[]> = {
  "דנה כהן": [
    {
      "d": "1.9.26",
      "k": "cous",
      "t": "3 מנות קוסקוס · 2 צמחוני, 1 עם עוף",
      "v": 155,
      "s": "נמסרה"
    },
    {
      "d": "25.8.26",
      "k": "cous",
      "t": "2 מנות קוסקוס עם עוף",
      "v": 110,
      "s": "נמסרה"
    },
    {
      "d": "21.8.26",
      "k": "schn",
      "t": "2 חלות שניצל דק · קוקוט טחינה",
      "v": 103,
      "s": "נמסרה"
    },
    {
      "d": "11.8.26",
      "k": "cous",
      "t": "3 מנות קוסקוס · תוספת ירקות",
      "v": 175,
      "s": "בוטלה"
    }
  ],
  "מיכל אברהם": [
    {
      "d": "1.9.26",
      "k": "cous",
      "t": "4 מנות קוסקוס עם מפרום",
      "v": 260,
      "s": "נמסרה"
    },
    {
      "d": "28.8.26",
      "k": "fruit",
      "t": "מגש פירות גדול",
      "v": 400,
      "s": "נמסרה"
    },
    {
      "d": "18.8.26",
      "k": "box",
      "t": "10 חלות לכל אירוע · סלטים",
      "v": 229,
      "s": "נמסרה"
    }
  ],
  "יעל לוי": [
    {
      "d": "4.9.26",
      "k": "schn",
      "t": "2 חלות שישניצל",
      "v": 110,
      "s": "נמסרה"
    },
    {
      "d": "21.8.26",
      "k": "schn",
      "t": "חלת פילה עוף · קוקוט עמבה",
      "v": 63,
      "s": "נמסרה"
    }
  ],
  "רונית שגב": [
    {
      "d": "27.8.26",
      "k": "fruit",
      "t": "מגש פירות בינוני",
      "v": 300,
      "s": "נמסרה"
    },
    {
      "d": "14.8.26",
      "k": "box",
      "t": "מארז ספיישל לאירוע",
      "v": 890,
      "s": "נמסרה"
    },
    {
      "d": "2.8.26",
      "k": "fruit",
      "t": "מגש פירות גדול",
      "v": 400,
      "s": "נמסרה"
    }
  ],
  "אורית ברק": [
    {
      "d": "25.8.26",
      "k": "cous",
      "t": "2 מנות קוסקוס צמחוני",
      "v": 115,
      "s": "נמסרה"
    }
  ],
  "שירה מזרחי": [
    {
      "d": "1.9.26",
      "k": "cous",
      "t": "4 מנות קוסקוס · 2 עם מפרום",
      "v": 240,
      "s": "נמסרה"
    },
    {
      "d": "29.8.26",
      "k": "chef",
      "t": "ארוחת שף · 8 סועדים",
      "v": 2000,
      "s": "נמסרה"
    },
    {
      "d": "25.8.26",
      "k": "cous",
      "t": "3 מנות קוסקוס עם עוף",
      "v": 165,
      "s": "נמסרה"
    },
    {
      "d": "18.8.26",
      "k": "schn",
      "t": "מארז שניצל דק",
      "v": 200,
      "s": "נמסרה"
    }
  ],
  "טל אבידן": [
    {
      "d": "25.8.26",
      "k": "cous",
      "t": "4 מנות קוסקוס צמחוני",
      "v": 180,
      "s": "נמסרה"
    },
    {
      "d": "11.8.26",
      "k": "cous",
      "t": "2 מנות קוסקוס עם עוף",
      "v": 110,
      "s": "נמסרה"
    }
  ]
};

export const STATE_TONE: Record<string, { bg: string; fg: string }> = {
  "נמסרה": {
    "bg": "rgba(130,112,162,0.10)",
    "fg": "#8A8194"
  },
  "בוטלה": {
    "bg": "rgba(185,83,73,0.12)",
    "fg": "#B95349"
  }
};

/** מכאן ומעלה נחשבת לקוחה קבועה */
export const REGULAR = 5;

export const FILTERS: { id: 'all' | 'reg' | 'new'; name: string }[] = [
  {
    "id": "all",
    "name": "הכל"
  },
  {
    "id": "reg",
    "name": "קבועות"
  },
  {
    "id": "new",
    "name": "חדשות"
  }
];

/* ── כותרות ── */
export const CUSTOMERS_TITLE = "לקוחות";
export const SUB_MIDDLE = " לקוחות · ";
export const SUB_SUFFIX = " ₪ מצטבר";
export const SEARCH_PLACEHOLDER = "חיפוש לפי שם או טלפון";
export const EMPTY_LABEL = "לא נמצאה לקוחה";
export const CALL_LABEL = "חיוג";
export const HIST_LABEL = "הזמנות קודמות";
export const ORDER_LABEL = "הזמנה ידנית";
export const NOTE_LABEL = "הערה";
export const NOTE_PLACEHOLDER = "למשל: מגיע פיצוי על ההזמנה שבוטלה";
export const TAG_REGULAR = "קבועה";
export const TAG_NEW = "חדשה";
export const HIST_TITLE_PREFIX = "";
export const HIST_SUB_SUFFIX = " הזמנות";
export const DETAIL_KEYS = [
  "טלפון",
  "כתובת",
  "הזמנה אחרונה",
  "ממוצע להזמנה"
] as const;
