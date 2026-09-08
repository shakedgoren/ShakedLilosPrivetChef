/**
 * היסטוריית קניות · חולץ מ-AdminHistory.dc.html בקנבס.
 * כשיש API הרשימה מגיעה מהקניות שנסגרו. כאן נתוני הדגמה.
 */

export type HistArea = { id: string; n: string; hue: string; deep: string };
export const HIST_AREAS: HistArea[] = [
  { id: 'all', n: 'הכל', hue: '#7B5CBC', deep: '#43307A' },
  { id: 'cous', n: 'קוסקוס', hue: '#7B5CBC', deep: '#43307A' },
  { id: 'schn', n: 'שניצלים', hue: '#416D9E', deep: '#2B4A6E' },
  { id: 'box', n: 'מארזים', hue: '#437C59', deep: '#2C5A3E' },
  { id: 'chef', n: 'שף', hue: '#A85A28', deep: '#7A3D18' },
  { id: 'tabun', n: 'טאבון', hue: '#B04A76', deep: '#7A2E4E' },
  { id: 'gen', n: 'כללי', hue: '#8A8194', deep: '#4A4254' },
];

export type HistRow = { n: string; p: number; q: number; u: string };
export type HistBuy = { area: string; d: string; t: string; rows: HistRow[] };

/** ⚠ היסטוריית הדגמה · נכתבה על ידי Claude בקנבס */
export const HIST_BUYS: HistBuy[] = [
  {
    area: 'cous',
    d: '1 בספטמבר',
    t: '07:40',
    rows: [
      { n: 'עגבניות', p: 9, q: 8, u: 'ק״ג' },
      { n: 'בצל', p: 6, q: 5, u: 'ק״ג' },
      { n: 'גזר', p: 6, q: 4, u: 'ק״ג' },
      { n: 'ירך עוף', p: 40, q: 12, u: 'ק״ג' },
      { n: 'קוסקוס', p: 16, q: 10, u: 'ק״ג' },
      { n: 'חומוס יבש', p: 15, q: 3, u: 'ק״ג' },
    ],
  },
  {
    area: 'schn',
    d: '30 באוגוסט',
    t: '08:15',
    rows: [
      { n: 'חזה עוף', p: 46, q: 14, u: 'ק״ג' },
      { n: 'פילה עוף', p: 58, q: 8, u: 'ק״ג' },
      { n: 'פירורי לחם', p: 12, q: 4, u: 'ק״ג' },
      { n: 'קמח טמפורה', p: 18, q: 3, u: 'ק״ג' },
      { n: 'קוקוטים', p: 60, q: 1, u: 'קרטון' },
    ],
  },
  {
    area: 'box',
    d: '28 באוגוסט',
    t: '09:00',
    rows: [
      { n: 'קמח', p: 5, q: 25, u: 'ק״ג' },
      { n: 'שמרים', p: 22, q: 2, u: 'ק״ג' },
      { n: 'שומשום', p: 18, q: 2, u: 'ק״ג' },
      { n: 'קופסאות אישיות', p: 75, q: 3, u: 'קרטון' },
    ],
  },
  {
    area: 'chef',
    d: '26 באוגוסט',
    t: '11:20',
    rows: [
      { n: 'סלמון', p: 89, q: 6, u: 'ק״ג' },
      { n: 'ירקות שורש', p: 7, q: 12, u: 'ק״ג' },
      { n: 'שמן זית', p: 48, q: 3, u: 'ק״ג' },
    ],
  },
  {
    area: 'gen',
    d: '24 באוגוסט',
    t: '17:05',
    rows: [
      { n: 'מגשי אלומיניום', p: 90, q: 2, u: 'קרטון' },
      { n: 'שקיות נשיאה', p: 40, q: 1, u: 'קרטון' },
    ],
  },
  {
    area: 'tabun',
    d: '20 באוגוסט',
    t: '10:30',
    rows: [
      { n: 'גז לטאבון', p: 240, q: 2, u: 'יח׳' },
      { n: 'גבינות', p: 55, q: 5, u: 'ק״ג' },
    ],
  },
];

export const HIST_TITLE = 'היסטוריית קניות';
export const HIST_EMPTY = 'אין קניות בשיוך הזה';
export const HIST_COLS = { name: 'מוצר', price: 'מחיר', qty: 'כמות', sum: 'סה״כ' } as const;
export const HIST_TOTAL = 'סה״כ הקנייה';
