/**
 * רשימת קניות · הנתונים חולצו אוטומטית מ-AdminShopping.dc.html בקנבס.
 * לעדכון: node scripts/extract-admin-shopping.mjs && node scripts/emit-admin-shopping.mjs
 */

export const GROUPS: string[] = [
  "ירקות ופירות",
  "בשר עוף ודגים",
  "יבשים",
  "חלב וגבינות",
  "אריזות",
  "כללי"
];
export const UNITS: string[] = [
  "ק״ג",
  "יח׳",
  "קרטון"
];

/** לכל קנייה יש שיוך · הוא נכנס לשם הקנייה ולהיסטוריה */
export type Area = { id: string; n: string; hue: string; deep: string };
export const AREAS: Area[] = [
  {
    "id": "cous",
    "n": "קוסקוס",
    "hue": "#7B5CBC",
    "deep": "#43307A"
  },
  {
    "id": "schn",
    "n": "שניצלים",
    "hue": "#416D9E",
    "deep": "#2B4A6E"
  },
  {
    "id": "box",
    "n": "מארזים",
    "hue": "#437C59",
    "deep": "#2C5A3E"
  },
  {
    "id": "chef",
    "n": "שף",
    "hue": "#A85A28",
    "deep": "#7A3D18"
  },
  {
    "id": "tabun",
    "n": "טאבון",
    "hue": "#B04A76",
    "deep": "#7A2E4E"
  },
  {
    "id": "gen",
    "n": "כללי",
    "hue": "#8A8194",
    "deep": "#4A4254"
  }
];
export const AREA: Record<string, Area> = Object.fromEntries(AREAS.map((a) => [a.id, a]));
export const START_AREA = "cous";

export type PantryItem = { name: string; g: string; unit: string; price: number };
/**
 * ⚠ פנקס המצרכים · נבנה מהקניות הקודמות. מה שנקנה פעם אחת
 * חוזר כאן עם הקבוצה, היחידה והמחיר האחרון ששולם עליו.
 */
export const PANTRY: PantryItem[] = [
  {
    "name": "עגבניות",
    "g": "ירקות ופירות",
    "unit": "ק״ג",
    "price": 9
  },
  {
    "name": "בצל",
    "g": "ירקות ופירות",
    "unit": "ק״ג",
    "price": 6
  },
  {
    "name": "גזר",
    "g": "ירקות ופירות",
    "unit": "ק״ג",
    "price": 6
  },
  {
    "name": "כוסברה",
    "g": "ירקות ופירות",
    "unit": "יח׳",
    "price": 4
  },
  {
    "name": "פטרוזיליה",
    "g": "ירקות ופירות",
    "unit": "יח׳",
    "price": 4
  },
  {
    "name": "קישואים",
    "g": "ירקות ופירות",
    "unit": "ק״ג",
    "price": 8
  },
  {
    "name": "תפוחי אדמה",
    "g": "ירקות ופירות",
    "unit": "ק״ג",
    "price": 5
  },
  {
    "name": "ירך עוף",
    "g": "בשר עוף ודגים",
    "unit": "ק״ג",
    "price": 40
  },
  {
    "name": "חזה עוף",
    "g": "בשר עוף ודגים",
    "unit": "ק״ג",
    "price": 46
  },
  {
    "name": "פילה עוף",
    "g": "בשר עוף ודגים",
    "unit": "ק״ג",
    "price": 58
  },
  {
    "name": "בשר טחון למפרום",
    "g": "בשר עוף ודגים",
    "unit": "ק״ג",
    "price": 65
  },
  {
    "name": "קוסקוס",
    "g": "יבשים",
    "unit": "ק״ג",
    "price": 16
  },
  {
    "name": "חומוס יבש",
    "g": "יבשים",
    "unit": "ק״ג",
    "price": 15
  },
  {
    "name": "פירורי לחם",
    "g": "יבשים",
    "unit": "ק״ג",
    "price": 12
  },
  {
    "name": "קמח טמפורה",
    "g": "יבשים",
    "unit": "ק״ג",
    "price": 18
  },
  {
    "name": "חמאה",
    "g": "חלב וגבינות",
    "unit": "ק״ג",
    "price": 45
  },
  {
    "name": "גבינת פטה",
    "g": "חלב וגבינות",
    "unit": "ק״ג",
    "price": 38
  },
  {
    "name": "מגשי אלומיניום",
    "g": "אריזות",
    "unit": "קרטון",
    "price": 90
  },
  {
    "name": "קופסאות אישיות",
    "g": "אריזות",
    "unit": "קרטון",
    "price": 75
  },
  {
    "name": "קוקוטים",
    "g": "אריזות",
    "unit": "קרטון",
    "price": 60
  }
];

export type ShopItem = {
  g: string;
  name: string;
  unit: string;
  qty: string;
  price: string;
  done: boolean;
  /** מה שולם בפועל · מגיע מהקנייה, אין לו עריכה במסך */
  actual: string;
};
/** ⚠ רשימת הדגמה · נכתבה על ידי Claude בקנבס */
export const SEED: ShopItem[] = [
  {
    "g": "ירקות ופירות",
    "name": "עגבניות",
    "unit": "ק״ג",
    "qty": "8",
    "price": "9",
    "done": true,
    "actual": "68"
  },
  {
    "g": "ירקות ופירות",
    "name": "בצל",
    "unit": "ק״ג",
    "qty": "5",
    "price": "6",
    "done": true,
    "actual": "34"
  },
  {
    "g": "ירקות ופירות",
    "name": "גזר",
    "unit": "ק״ג",
    "qty": "4",
    "price": "6",
    "done": false,
    "actual": ""
  },
  {
    "g": "ירקות ופירות",
    "name": "כוסברה",
    "unit": "יח׳",
    "qty": "10",
    "price": "4",
    "done": false,
    "actual": ""
  },
  {
    "g": "בשר עוף ודגים",
    "name": "ירך עוף",
    "unit": "ק״ג",
    "qty": "12",
    "price": "40",
    "done": true,
    "actual": "505"
  },
  {
    "g": "בשר עוף ודגים",
    "name": "בשר טחון למפרום",
    "unit": "ק״ג",
    "qty": "6",
    "price": "65",
    "done": false,
    "actual": ""
  },
  {
    "g": "יבשים",
    "name": "קוסקוס",
    "unit": "ק״ג",
    "qty": "10",
    "price": "16",
    "done": true,
    "actual": "160"
  },
  {
    "g": "יבשים",
    "name": "חומוס יבש",
    "unit": "ק״ג",
    "qty": "3",
    "price": "15",
    "done": false,
    "actual": ""
  },
  {
    "g": "חלב וגבינות",
    "name": "חמאה",
    "unit": "ק״ג",
    "qty": "2",
    "price": "45",
    "done": false,
    "actual": ""
  },
  {
    "g": "אריזות",
    "name": "מגשי אלומיניום",
    "unit": "קרטון",
    "qty": "1",
    "price": "90",
    "done": false,
    "actual": ""
  },
  {
    "g": "אריזות",
    "name": "קופסאות אישיות",
    "unit": "קרטון",
    "qty": "2",
    "price": "75",
    "done": false,
    "actual": ""
  }
];

/** שמות החודשים בצורת ״ב-״ · לשם הקנייה */
export const MONTHS: string[] = [
  "בינואר",
  "בפברואר",
  "במרץ",
  "באפריל",
  "במאי",
  "ביוני",
  "ביולי",
  "באוגוסט",
  "בספטמבר",
  "באוקטובר",
  "בנובמבר",
  "בדצמבר"
];

export const DEFAULT_GROUP = "ירקות ופירות";
export const DEFAULT_UNIT = "ק״ג";

/* ── כותרות ── */
export const PROG_LABEL = "התקדמות הקנייה";
export const EST_TAG = "מחושב";
export const ACT_TAG = "שולם בפועל";
export const COLS = {
  name: "מוצר",
  price: "מחיר",
  qty: "כמות",
  sum: "סה״כ",
} as const;
export const EMPTY_LABEL = "הרשימה ריקה";
export const EMPTY_SUB = "הוסיפי פריט ראשון לקנייה הבאה";
export const CLOSE_LABEL = "סגירת הרשימה";
export const CLOSE_SUB_PREFIX = "תיווצר הוצאה על ";
export const CLOSE_SUB_SUFFIX = " ₪ ותיפתח רשימה ריקה";
export const CLOSE_SUB_NONE = "צריך לסמן לפחות פריט אחד";

/* ── חלונית ההוספה ── */
export const ADD = {
  title: "הוספת פריט",
  nameLabel: "מה קונים",
  namePlaceholder: "למשל: פטרוזיליה",
  groupLabel: "קבוצה",
  unitLabel: "יחידת מידה",
  qtyLabel: "כמות",
  totalLabel: "סה״כ לשורה",
  cta: "הוספה לרשימה",
} as const;
