/**
 * תפריט · חולץ מ-AdminMenu.dc.html בקנבס.
 * המחירים מהמסכים של הלקוחה. העלות מגיעה ממסך העלויות כשיש API.
 */

export type MenuCat = { id: string; n: string; hue: string; deep: string; rgb: string };
export const MENU_CATS: MenuCat[] = [
  { id: 'cous', n: 'קוסקוס', hue: '#7B5CBC', deep: '#43307A', rgb: '123,92,188' },
  { id: 'schn', n: 'שישניצל', hue: '#416D9E', deep: '#2B4A6E', rgb: '65,109,158' },
  { id: 'box', n: 'ספיישל', hue: '#437C59', deep: '#2C5A3E', rgb: '67,124,89' },
  { id: 'chef', n: 'שף', hue: '#A85A28', deep: '#7A3D18', rgb: '168,90,40' },
];

export type MenuRow = { c: string; name: string; price: number; cost: number };
/** תצוגת הדגמה כשאין שרת · העלויות מחושבות במסך העלויות בקנבס */
export const MENU_ROWS: MenuRow[] = [
  { c: 'cous', name: 'קוסקוס צמחוני', price: 45, cost: 13.8 },
  { c: 'cous', name: 'קוסקוס עם עוף', price: 55, cost: 22.9 },
  { c: 'cous', name: 'קוסקוס עם מפרום', price: 65, cost: 30.8 },
  { c: 'cous', name: 'תוספת ירקות', price: 10, cost: 2.5 },
  { c: 'cous', name: 'תוספת עוף', price: 15, cost: 7.1 },
  { c: 'cous', name: 'תוספת מפרום', price: 20, cost: 10.8 },
  { c: 'schn', name: 'חלת שניצל דק', price: 50, cost: 19.7 },
  { c: 'schn', name: 'חלת פילה עוף טמפורה', price: 60, cost: 27.6 },
  { c: 'schn', name: 'מארז שניצל דק', price: 200, cost: 64.7 },
  { c: 'schn', name: 'מארז פילה עוף טמפורה', price: 250, cost: 79.0 },
  { c: 'schn', name: 'קוקוט רוטב', price: 3, cost: 1.4 },
  { c: 'box', name: 'חלת שישי משפחתית', price: 25, cost: 2.1 },
  { c: 'box', name: 'חלה לכל אירוע', price: 12, cost: 1.0 },
  { c: 'box', name: 'סלטים · ק״ג', price: 89, cost: 19.9 },
  { c: 'box', name: 'חגיגה בשולחן · סלטים', price: 179, cost: 30.8 },
  { c: 'box', name: 'חגיגה בשולחן · עיקרית', price: 339, cost: 182.5 },
  { c: 'box', name: 'הכל עלינו', price: 499, cost: 213.3 },
  { c: 'box', name: 'טעם של שנה טובה', price: 49, cost: 10.5 },
  { c: 'chef', name: 'ארוחת שף · לסועד', price: 250, cost: 148.0 },
  { c: 'chef', name: 'עמדת טאבון · לסועד', price: 220, cost: 95.0 },
];

export const MENU_TITLE = 'תפריט';
export const MENU_SUB = 'מחירים, עלויות ורווחיות';
export const MENU_PRICE = 'מחיר';
export const MENU_COST = 'עלות';
export const MENU_PROFIT = 'רווח';
export const MENU_KPI_ITEMS = 'פריטים';
export const MENU_KPI_MARGIN = 'רווחיות ממוצעת';
export const MENU_KPI_AVG = 'עלות ממוצעת';
