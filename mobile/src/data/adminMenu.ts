/**
 * תפריט · הנתונים חולצו אוטומטית מ-AdminMenu.dc.html בקנבס.
 * לעדכון: node scripts/extract-admin-menu.mjs && node scripts/emit-admin-menu.mjs
 *
 * ⚠ המסך לקריאה בלבד. המחיר והעלות מגיעים ממסך עלויות הייצור,
 * ושם גם מעדכנים אותם פעם בחודש. כאן רק רואים מה יוצא מזה.
 */

export type MenuCatKey = 'cous' | 'schn' | 'box' | 'chef';
export type MenuCat = { id: MenuCatKey; n: string; hue: string; deep: string; rgb: string };

/** מגשי הפירות אינם כאן · הם לא בניהול הכספי של שקד */
export const CATS: MenuCat[] = [
  {
    "id": "cous",
    "n": "קוסקוס",
    "hue": "#7B5CBC",
    "deep": "#43307A",
    "rgb": "123,92,188"
  },
  {
    "id": "schn",
    "n": "שישניצל",
    "hue": "#416D9E",
    "deep": "#2B4A6E",
    "rgb": "65,109,158"
  },
  {
    "id": "box",
    "n": "ספיישל",
    "hue": "#437C59",
    "deep": "#2C5A3E",
    "rgb": "67,124,89"
  },
  {
    "id": "chef",
    "n": "שף",
    "hue": "#A85A28",
    "deep": "#7A3D18",
    "rgb": "168,90,40"
  }
];

export type MenuRow = { c: MenuCatKey; name: string; price: number; cost: number };
export const MENU: MenuRow[] = [
  {
    "c": "cous",
    "name": "קוסקוס צמחוני",
    "price": 45,
    "cost": 13.8
  },
  {
    "c": "cous",
    "name": "קוסקוס עם עוף",
    "price": 55,
    "cost": 22.9
  },
  {
    "c": "cous",
    "name": "קוסקוס עם מפרום",
    "price": 65,
    "cost": 30.8
  },
  {
    "c": "cous",
    "name": "תוספת ירקות",
    "price": 10,
    "cost": 2.5
  },
  {
    "c": "cous",
    "name": "תוספת עוף",
    "price": 15,
    "cost": 7.1
  },
  {
    "c": "cous",
    "name": "תוספת מפרום",
    "price": 20,
    "cost": 10.8
  },
  {
    "c": "schn",
    "name": "חלת שניצל דק",
    "price": 50,
    "cost": 19.7
  },
  {
    "c": "schn",
    "name": "חלת פילה עוף טמפורה",
    "price": 60,
    "cost": 27.6
  },
  {
    "c": "schn",
    "name": "מארז שניצל דק",
    "price": 200,
    "cost": 64.7
  },
  {
    "c": "schn",
    "name": "מארז פילה עוף טמפורה",
    "price": 250,
    "cost": 79
  },
  {
    "c": "schn",
    "name": "קוקוט רוטב",
    "price": 3,
    "cost": 1.4
  },
  {
    "c": "box",
    "name": "חלת שישי משפחתית",
    "price": 25,
    "cost": 2.1
  },
  {
    "c": "box",
    "name": "חלה לכל אירוע",
    "price": 12,
    "cost": 1
  },
  {
    "c": "box",
    "name": "סלטים · ק״ג",
    "price": 89,
    "cost": 21.3
  },
  {
    "c": "box",
    "name": "חגיגה בשולחן · סלטים",
    "price": 179,
    "cost": 43.8
  },
  {
    "c": "box",
    "name": "חגיגה בשולחן · עיקרית",
    "price": 339,
    "cost": 182.5
  },
  {
    "c": "box",
    "name": "הכל עלינו",
    "price": 499,
    "cost": 244.3
  },
  {
    "c": "box",
    "name": "טעם של שנה טובה",
    "price": 49,
    "cost": 10.5
  },
  {
    "c": "chef",
    "name": "ארוחת שף · לסועד",
    "price": 250,
    "cost": 148
  },
  {
    "c": "chef",
    "name": "עמדת טאבון · לסועד",
    "price": 220,
    "cost": 95
  }
];

/** מתחת לאחוז הזה הרווחיות נחשבת דקה ונצבעת בענבר */
export const THIN_MARGIN = 40;

export const START_CAT: MenuCatKey = "cous";

/* ── כותרות ── */
export const MENU_TITLE = "תפריט";
export const MENU_SUB = "מחירים, עלויות ורווחיות";
export const PRICE_LABEL = "מחיר";
export const COST_LABEL = "עלות";
export const PROFIT_LABEL = "רווח";
export const MARGIN_PREFIX = "רווחיות ";
export const KPI_KEYS = [
  "פריטים",
  "רווחיות ממוצעת",
  "עלות ממוצעת"
] as const;

/** אחוז הרווחיות של פריט · מעוגל, כמו בקנבס */
export const marginPct = (x: { price: number; cost: number }) =>
  x.price > 0 ? Math.round(((x.price - x.cost) / x.price) * 100) : 0;
