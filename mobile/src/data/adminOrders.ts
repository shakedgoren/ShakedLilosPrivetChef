/**
 * ניהול הזמנות · הנתונים חולצו אוטומטית מ-AdminOrders.dc.html בקנבס,
 * כדי שכל טקסט, מחיר וגוון יהיו זהים בדיוק למה שבעיצוב.
 * לעדכון: node scripts/extract-admin-orders.mjs && node scripts/emit-admin-orders.mjs
 */

export type AdminCatKey = 'cous' | 'schn' | 'box' | 'fruit' | 'chef';

export type Hue = { n: string; hue: string; deep: string; rgb: string };
export const HUES: Record<AdminCatKey, Hue> = {
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
    "n": "שף וטאבון",
    "hue": "#A85A28",
    "deep": "#7A3D18",
    "rgb": "168,90,40"
  }
};

/** בהזמנה ידנית פתוחות רק שתי הקטגוריות שנמכרות בימי מכירה */
export const MANUAL_CATS: AdminCatKey[] = [
  "cous",
  "schn"
];

export type BookEntry = { name: string; phone: string; addr: string };
/** פנקס לקוחות להדגמה · תואם את מסך הלקוחות */
export const BOOK: BookEntry[] = [
  {
    "name": "דנה כהן",
    "phone": "050-1234567",
    "addr": "הרצל 14, יבנה"
  },
  {
    "name": "מיכל אברהם",
    "phone": "052-7654321",
    "addr": "ויצמן 8, רחובות"
  },
  {
    "name": "יעל לוי",
    "phone": "054-9988776",
    "addr": "בילו 3, גדרה"
  },
  {
    "name": "רונית שגב",
    "phone": "053-4455667",
    "addr": "הבנים 2, נס ציונה"
  },
  {
    "name": "אורית ברק",
    "phone": "058-3322110",
    "addr": "רוטשילד 21, ראשון לציון"
  },
  {
    "name": "שירה מזרחי",
    "phone": "050-7778899",
    "addr": "נופר 25, יבנה"
  },
  {
    "name": "טל אבידן",
    "phone": "050-1112223",
    "addr": "הפרחים 9, יבנה"
  }
];

export type MenuItem = { id: string; n: string; s?: string; price: number };
export const MENU: Partial<Record<AdminCatKey, MenuItem[]>> = {
  "cous": [
    {
      "id": "veg",
      "n": "קוסקוס צמחוני",
      "s": "צמחוני",
      "price": 45
    },
    {
      "id": "chick",
      "n": "קוסקוס עם עוף",
      "s": "עם עוף",
      "price": 55
    },
    {
      "id": "mafr",
      "n": "קוסקוס עם מפרום",
      "s": "עם מפרום",
      "price": 65
    },
    {
      "id": "aVeg",
      "n": "תוספת ירקות",
      "price": 10
    },
    {
      "id": "aChick",
      "n": "תוספת עוף",
      "price": 15
    },
    {
      "id": "aMafr",
      "n": "תוספת מפרום",
      "price": 20
    }
  ],
  "schn": [
    {
      "id": "boxThin",
      "n": "מארז שניצל דק",
      "s": "מארז שניצל דק",
      "price": 200
    },
    {
      "id": "boxTemp",
      "n": "מארז פילה עוף טמפורה",
      "s": "מארז פילה עוף",
      "price": 250
    },
    {
      "id": "cocAmba",
      "n": "קוקוט איולי עמבה",
      "s": "קוקוט עמבה",
      "price": 3
    },
    {
      "id": "cocCsbr",
      "n": "קוקוט איולי כוסברה",
      "s": "קוקוט כוסברה",
      "price": 3
    },
    {
      "id": "cocTahn",
      "n": "קוקוט טחינה",
      "s": "קוקוט טחינה",
      "price": 3
    }
  ]
};

export type SchRoll = { type: string; n: string; s: string; price: number; tops: string[] };
export const SCH_ROLLS: SchRoll[] = [
  {
    "type": "thin",
    "n": "חלת שניצל דק",
    "s": "שניצל דק",
    "price": 50,
    "tops": [
      "מטבוחה",
      "טחינה",
      "חציל בטמפורה",
      "כרוב סגול",
      "פלפל חריף"
    ]
  },
  {
    "type": "temp",
    "n": "חלת פילה עוף טמפורה",
    "s": "פילה עוף",
    "price": 60,
    "tops": [
      "איולי עמבה",
      "איולי עשבי תיבול",
      "עלי רוקט",
      "מלפפון חמוץ"
    ]
  }
];

/** אותה חלה לפי מפתח הסוג · נגזר מ-SCH_ROLLS, לא כפול */
export const ROLL: Record<string, SchRoll> = Object.fromEntries(
  SCH_ROLLS.map((r) => [r.type, r]),
);

export const SHIP_FEE: Record<string, number> = {
  "יבנה": 20,
  "אחר": 60
};
export const DELIV_MIN_MEALS = 4;

/** מסלול המצבים · כל הזמנה מתקדמת בסדר הזה */
export const FLOW: string[] = [
  "חדשה",
  "בהכנה",
  "מוכנה",
  "נמסרה"
];
/** ״בוטלה״ אינו חלק מהמסלול · אפשר להגיע אליו מכל מצב שטרם נמסר */
export const CANCELLED = "בוטלה";

export const TONE: Record<string, { bg: string; fg: string }> = {
  ...{
  "חדשה": {
    "bg": "rgba(123,92,188,0.12)",
    "fg": "#43307A"
  },
  "בהכנה": {
    "bg": "rgba(199,125,62,0.14)",
    "fg": "#A65E2A"
  },
  "מוכנה": {
    "bg": "rgba(78,138,100,0.14)",
    "fg": "#4E8A64"
  },
  "נמסרה": {
    "bg": "rgba(130,112,162,0.10)",
    "fg": "#8A8194"
  },
  "בוטלה": {
    "bg": "rgba(185,83,73,0.12)",
    "fg": "#B95349"
  }
},
  /* ⚠ לא מהקנבס · מצב שהשרת מחזיר ואין לו גוון בעיצוב.
     יושב כאן ולא בקובץ שנוצר, כדי שהרצה מחדש של הסקריפט לא תמחק אותו. */
  'מאושרת': { bg: 'rgba(65,109,158,0.12)', fg: '#2B4A6E' },
};

/** ביטול מאוחר · פחות מ-12 שעות לפני האיסוף מחייב 30% מהעסקה */
export const LATE_HOURS = 12;
export const LATE_FEE = 0.3;
export const REASONS: string[] = [
  "הלקוחה ביטלה",
  "אני ביטלתי",
  "לא הגיעה לאיסוף",
  "אחר"
];

export type AdminOrder = {
  /** ⚠ לא מהקנבס · מזהה מהשרת */
  id?: string;
  key: AdminCatKey;
  status: string;
  who: string;
  phone: string;
  time: string;
  items: string;
  sum: number;
  ship: string;
  pay: string;
  via: string;
  /** שעות שנותרו עד האיסוף · שלילי אם עבר */
  hrs: number;
  /** ⚠ לא מהקנבס · תיעוד הביטול שמגיע מהשרת */
  cancelReason?: string;
  cancelNote?: string;
};

/** הזמנות הדגמה · נכתבו על ידי Claude בקנבס */
export const ORDERS: AdminOrder[] = [
  {
    "key": "cous",
    "status": "בהכנה",
    "who": "דנה כהן",
    "phone": "050-1234567",
    "time": "12:30",
    "items": "2 × צמחוני · 1 × עם 2 יח׳ מפרום",
    "sum": 145,
    "ship": "איסוף",
    "pay": "ביט",
    "via": "",
    "hrs": 2.5
  },
  {
    "key": "cous",
    "status": "חדשה",
    "who": "מיכל אברהם",
    "phone": "052-7654321",
    "time": "13:00",
    "items": "4 × עם ירך עוף מתוק",
    "sum": 220,
    "ship": "משלוח · הרצל 14, יבנה",
    "pay": "ביט",
    "via": "וואטסאפ",
    "hrs": 3
  },
  {
    "key": "schn",
    "status": "מוכנה",
    "who": "יעל לוי",
    "phone": "054-9988776",
    "time": "11:40",
    "items": "2 חלות · שניצל דק",
    "sum": 110,
    "ship": "איסוף",
    "pay": "אפל פיי",
    "via": "",
    "hrs": 30
  },
  {
    "key": "fruit",
    "status": "נמסרה",
    "who": "רונית שגב",
    "phone": "053-4455667",
    "time": "09:20",
    "items": "מגש בינוני",
    "sum": 300,
    "ship": "משלוח · ויצמן 8, רחובות",
    "pay": "מזומן",
    "via": "וואטסאפ",
    "hrs": -1
  }
];

/** תאריך יום המכירה שמוצג תחת הכותרת */
export const ORDERS_SUBTITLE = 'שלישי · 25 באוגוסט';

/** הכפתור שמוביל ללוח המכירה */
export const BOARD_LABEL = "לוח מכירה";
