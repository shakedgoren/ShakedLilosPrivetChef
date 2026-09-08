/**
 * לוח מכירה · חולץ מ-AdminBoard.dc.html בקנבס (אייפד 1180×820).
 * עמודות הקוסקוס והזמנות ההדגמה. כשיש API השורות מגיעות מההזמנות.
 */

export type BoardItem = { id: string; t: string; sub: string; price: number; quota?: number };
export const BOARD_CAT = {
  name: 'שלישי של קוסקוס',
  hue: '#7B5CBC',
  deep: '#43307A',
  items: [
    { id: 'veg', t: 'מנה', sub: 'צמחונית', price: 45, quota: 40 },
    { id: 'chick', t: 'מנה', sub: 'עוף', price: 55, quota: 30 },
    { id: 'mafr', t: 'מנה', sub: 'מפרום', price: 65, quota: 30 },
    { id: 'aVeg', t: 'תוספת', sub: 'ירקות', price: 10 },
    { id: 'aChick', t: 'תוספת', sub: 'עוף', price: 15 },
    { id: 'aMafr', t: 'תוספת', sub: 'מפרום', price: 20 },
  ] as BoardItem[],
};

export const BOARD_FLOW = ['חדשה', 'מוכנה', 'נמסרה'] as const;
export const BOARD_STEPS = [
  { id: 'חדשה', label: 'התקבלה' },
  { id: 'מוכנה', label: 'מוכנה' },
  { id: 'נמסרה', label: 'נמסרה' },
] as const;

export const BOARD_BAND: Record<string, { row: string; edge: string; ink: string; muted: string }> = {
  חדשה: { row: 'rgba(199,125,62,0.13)', edge: '#C77D3E', ink: '#7A4A18', muted: '#9A6B3C' },
  מוכנה: { row: 'rgba(78,138,100,0.13)', edge: '#4E8A64', ink: '#2F5C42', muted: '#5C8A6E' },
  נמסרה: { row: 'rgba(130,112,162,0.08)', edge: '#B3ABBD', ink: '#8A8194', muted: '#A79FB2' },
};

export type BoardSeed = {
  hrs: number;
  who: string;
  phone?: string;
  time: string;
  ship: 'pickup' | 'deliv';
  pay: string;
  status: string;
  note: string;
  q: Record<string, number>;
};

/** ⚠ הזמנות הדגמה · נכתבו על ידי Claude בקנבס */
export const BOARD_SEED: BoardSeed[] = [
  { hrs: 1.5, who: 'דנה כהן', time: '11:40', ship: 'pickup', pay: 'ביט', status: 'מוכנה', note: '', q: { veg: 2, chick: 0, mafr: 1, aVeg: 1, aChick: 0, aMafr: 0 } },
  { hrs: 2, who: 'מיכל אברהם', time: '12:00', ship: 'pickup', pay: 'ביט', status: 'חדשה', note: 'וואטסאפ', q: { veg: 0, chick: 2, mafr: 2, aVeg: 1, aChick: 0, aMafr: 0 } },
  { hrs: 2.5, who: 'יעל לוי', time: '12:20', ship: 'pickup', pay: 'אפל פיי', status: 'חדשה', note: '', q: { veg: 3, chick: 0, mafr: 0, aVeg: 0, aChick: 0, aMafr: 0 } },
  { hrs: 3, who: 'אורית ברק', time: '12:40', ship: 'pickup', pay: 'מזומן', status: 'נמסרה', note: '', q: { veg: 1, chick: 1, mafr: 0, aVeg: 0, aChick: 1, aMafr: 0 } },
  { hrs: 3.5, who: 'שירה מזרחי', time: '13:10', ship: 'pickup', pay: 'ביט', status: 'חדשה', note: '', q: { veg: 0, chick: 4, mafr: 0, aVeg: 2, aChick: 0, aMafr: 1 } },
  { hrs: 2, who: 'רונית שגב', time: '12:00', ship: 'deliv', pay: 'מזומן', status: 'חדשה', note: 'ויצמן 8, רחובות', q: { veg: 2, chick: 2, mafr: 0, aVeg: 0, aChick: 0, aMafr: 0 } },
  { hrs: 2.5, who: 'נועה פרץ', time: '12:20', ship: 'deliv', pay: 'פייבוקס', status: 'מוכנה', note: 'הרצל 14, יבנה', q: { veg: 0, chick: 0, mafr: 4, aVeg: 1, aChick: 0, aMafr: 2 } },
  { hrs: 3, who: 'טל אבידן', time: '13:00', ship: 'deliv', pay: 'ביט', status: 'חדשה', note: 'בילו 3, גדרה', q: { veg: 4, chick: 0, mafr: 0, aVeg: 0, aChick: 2, aMafr: 0 } },
  { hrs: 4, who: 'ליאת דוד', time: '13:40', ship: 'deliv', pay: 'ביט', status: 'נמסרה', note: 'הבנים 2, נס ציונה', q: { veg: 1, chick: 1, mafr: 1, aVeg: 1, aChick: 1, aMafr: 1 } },
];

export const BOARD_MODES: { id: 'all' | 'pickup' | 'deliv'; n: string }[] = [
  { id: 'all', n: 'הכל' },
  { id: 'pickup', n: 'איסוף' },
  { id: 'deliv', n: 'משלוחים' },
];

export const BOARD_COL_TIME = 'שעת איסוף';
export const BOARD_COL_WHO = 'שם מלא';
export const BOARD_COL_SUM = 'סה״כ';
export const BOARD_COL_PAY = 'תשלום';
export const BOARD_COL_STATUS = 'סטטוס';
export const BOARD_EMPTY = 'אין הזמנות בטאב הזה';
export const BOARD_TOTAL = 'סה״כ בטאב';
export const BOARD_LIVE = 'ניהול בזמן אמת';
export const BOARD_GONE = 'בוטלו';
