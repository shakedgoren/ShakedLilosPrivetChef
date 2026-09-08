/**
 * לקוחות · חולץ מ-AdminCustomers.dc.html בקנבס.
 * נתוני ההדגמה משמשים כשאין שרת. כשיש API הסטטיסטיקה מגיעה מההזמנות.
 */

import { HUES, type AdminCatKey } from './adminOrders';

export const PEOPLE_HUES = HUES;

export type DemoPerson = {
  name: string;
  phone: string;
  since: string;
  orders: number;
  spent: number;
  addr: string;
  last: string;
  likes: AdminCatKey[];
  note: string;
};

/** ⚠ לקוחות הדגמה · נכתבו על ידי Claude בקנבס */
export const PEOPLE: DemoPerson[] = [
  {
    name: 'דנה כהן',
    phone: '050-1234567',
    since: 'מרץ 2026',
    orders: 14,
    spent: 2180,
    addr: 'הרצל 14, יבנה',
    last: 'שלישי, 1.9 · 3 מנות קוסקוס',
    likes: ['cous', 'schn'],
    note: 'אלרגית לשומשום',
  },
  {
    name: 'מיכל אברהם',
    phone: '052-7654321',
    since: 'ינואר 2026',
    orders: 23,
    spent: 4310,
    addr: 'ויצמן 8, רחובות',
    last: 'שלישי, 1.9 · 4 מנות קוסקוס',
    likes: ['cous', 'fruit', 'box'],
    note: '',
  },
  {
    name: 'יעל לוי',
    phone: '054-9988776',
    since: 'אוגוסט 2026',
    orders: 2,
    spent: 220,
    addr: 'בילו 3, גדרה',
    last: 'שישי, 4.9 · 2 חלות שישניצל',
    likes: ['schn'],
    note: '',
  },
  {
    name: 'רונית שגב',
    phone: '053-4455667',
    since: 'מאי 2026',
    orders: 9,
    spent: 3050,
    addr: 'הבנים 2, נס ציונה',
    last: 'רביעי, 27.8 · מגש פירות בינוני',
    likes: ['fruit', 'box'],
    note: 'מזמינה לאירועים',
  },
  {
    name: 'אורית ברק',
    phone: '058-3322110',
    since: 'אוגוסט 2026',
    orders: 1,
    spent: 115,
    addr: 'רוטשילד 21, ראשון לציון',
    last: 'שלישי, 25.8 · 2 מנות קוסקוס',
    likes: ['cous'],
    note: '',
  },
  {
    name: 'שירה מזרחי',
    phone: '050-7778899',
    since: 'פברואר 2026',
    orders: 31,
    spent: 6740,
    addr: 'נופר 25, יבנה',
    last: 'שלישי, 1.9 · 4 מנות קוסקוס',
    likes: ['cous', 'schn', 'chef'],
    note: 'לקוחה קבועה של שלישי',
  },
  {
    name: 'טל אבידן',
    phone: '050-1112223',
    since: 'יולי 2026',
    orders: 5,
    spent: 890,
    addr: 'הפרחים 9, יבנה',
    last: 'שלישי, 25.8 · 4 מנות קוסקוס',
    likes: ['cous'],
    note: '',
  },
];

export const REGULAR_MIN = 5;
export const CUSTOMERS_TITLE = 'לקוחות';
export const SEARCH_PH = 'חיפוש לפי שם או טלפון';
export const EMPTY_CUSTOMER = 'לא נמצאה לקוחה';
export const CALL_LABEL = 'חיוג';
export const HIST_LABEL = 'הזמנות קודמות';
export const ORDER_LABEL = 'הזמנה ידנית';
export const NOTE_LABEL = 'הערה';
export const NOTE_PH = 'למשל: מגיע פיצוי על ההזמנה שבוטלה';
export const SPENT_TAG = 'סה״כ';
export const TAG_REG = 'קבועה';
export const TAG_NEW = 'חדשה';
export const FILTERS: { id: 'all' | 'reg' | 'new'; n: string }[] = [
  { id: 'all', n: 'הכל' },
  { id: 'reg', n: 'קבועות' },
  { id: 'new', n: 'חדשות' },
];
