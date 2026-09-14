/**
 * לוח השנה של טופס יצירת הקשר · `isCal` ב-Chef.dc.html.
 *
 * ⚠ **התאריכים החסומים זמניים** · הועתקו מהשאלון הישן ולא אושרו על ידי
 * שקד. הוחלט ב-31.8.26 שהם ייקבעו בלוח שנה בדשבורד הניהולי ולא יהיו
 * מקודדים כאן. הרשימה נשארת רק כדי שהלוח יראה משהו.
 */
export const BLOCKED_RANGES: readonly (readonly [string, string])[] = [
  ['2026-09-10', '2026-09-14'],
  ['2026-09-20', '2026-09-21'],
  ['2026-09-25', '2026-10-02'],
];

export const MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
] as const;

/** ראשי הימים · ראשון עד שבת, כמו בקנבס */
export const DOWS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'] as const;

const pad2 = (n: number) => String(n).padStart(2, '0');

/** מפתח יום · `YYYY-MM-DD`, ולכן השוואת מחרוזות היא גם השוואת תאריכים */
export const dayKey = (y: number, m: number, d: number) => `${y}-${pad2(m + 1)}-${pad2(d)}`;

export const todayKey = () => {
  const n = new Date();
  return dayKey(n.getFullYear(), n.getMonth(), n.getDate());
};

const isBlocked = (k: string) => BLOCKED_RANGES.some(([from, to]) => k >= from && k <= to);

/** יום השבוע של מפתח · 0 ראשון … 5 שישי · 6 שבת */
export const dowOf = (k: string) => new Date(`${k}T00:00:00`).getDay();

const FRIDAY = 5;
const SATURDAY = 6;

/**
 * יום פתוח בלוח.
 * ⚠ **שונה מהקנבס** · שם `dateOpen` חוסם את **כל** השבת. שקד ביקשה
 * ״שישי ערב חסום, שבת בוקר וצהריים חסומים״ — כלומר שבת בערב **פתוחה**,
 * ולכן החסימה ירדה לרמת חלק היום ב-`dayPartOpen`. יום שכולו חסום
 * (טווח חג) או שכבר עבר — עדיין אפור ולא לחיץ.
 */
export const dateOpen = (k: string) => !isBlocked(k) && k >= todayKey();

/** שלושת חלקי היום · `DAYPART` בקנבס */
export const DAYPARTS = ['בוקר', 'צהריים', 'ערב'] as const;
export type DayPart = (typeof DAYPARTS)[number];

/**
 * חלק יום פתוח בתאריך נתון · הכלל של שקד:
 * שישי בערב חסום · שבת בבוקר ובצהריים חסומה · שבת בערב פתוחה.
 * בלי תאריך שום דבר לא נחסם, כדי שהאפשרויות ייראו לפני הבחירה.
 */
export const dayPartOpen = (dateKey: string | undefined, part: string): boolean => {
  if (!dateKey) return true;
  const dow = dowOf(dateKey);
  if (dow === FRIDAY) return part !== 'ערב';
  if (dow === SATURDAY) return part === 'ערב';
  return true;
};

/** ההסבר מתחת ללוח · ⚠ הנוסח בקנבס הוא ״שבתות וחגים סגורים״ */
export const CAL_HINT = 'שישי ערב, שבת בוקר וצהריים, וחגים — סגורים';
