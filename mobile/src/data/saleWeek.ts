/** ימי מכירה קבועים: שלישי = קוסקוס, שישי = שניצל בחלה. */
export const WEEKDAY_SALE: Record<number, 'cous' | 'schn'> = {
  2: 'cous',
  5: 'schn',
};

/** ISO `YYYY-MM-DD` לפי UTC — בלי הזזת יום מקומית. */
export function weekdaySale(iso: string): 'cous' | 'schn' | null {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return WEEKDAY_SALE[wd] ?? null;
}

export function addDaysIso(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  const mm = String(t.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(t.getUTCDate()).padStart(2, '0');
  return `${t.getUTCFullYear()}-${mm}-${dd}`;
}

export function eachIsoDate(from: string, to: string): string[] {
  if (!from || !to || from > to) return [];
  const out: string[] = [];
  for (let d = from; d <= to; d = addDaysIso(d, 1)) out.push(d);
  return out;
}

/**
 * חלון המכירה · **שבת 07:00 ורביעי 07:00 הם הגבולות**.
 *
 * ⚠ **חוק של שקד (18 בספטמבר 2026)** · בלשונה: ״מיום שבת בשעה
 * 07:00 בבוקר עד רביעי ב-07:00 יופיע המכירה של הקוסקוס… מיום
 * רביעי ב-07:00 בבוקר ועד שבת ב-07:00 בבוקר יופיע המכירה של
 * השניצל״.
 *
 * ⚠ **החליף את המודל הקודם** · קודם הגבול היה 18:00 בשלישי
 * ובשישי — כלומר **יום המכירה עצמו**. לכן ברגע שהמכירה נגמרה
 * החלון כבר קפץ לקטגוריה הבאה, ולא נשאר זמן להציג ״המכירה
 * נסגרה״. עכשיו לכל מכירה יש זנב: מרגע הסגירה ועד גבול החלון.
 *
 * ⚠ **שעון מקומי** · הגבול הוא 07:00 אצל שקד, ולא ב-UTC. שאר
 * הקובץ עובד ב-UTC כי שם מדובר בתאריכים בלבד.
 */
export const SALE_SWITCH_HOUR = 7;

/** דקות מתחילת השבוע · ראשון ב-00:00 הוא אפס */
const weekMinutes = (d: Date) => d.getDay() * 1440 + d.getHours() * 60 + d.getMinutes();

const WED = 3;
const SAT = 6;
const SWITCH_WED = WED * 1440 + SALE_SWITCH_HOUR * 60;
const SWITCH_SAT = SAT * 1440 + SALE_SWITCH_HOUR * 60;

/** כמה ימים מתחילת החלון ועד יום המכירה · שבת→שלישי, רביעי→שישי */
const LEAD = { cous: 3, schn: 2 } as const;
/** כמה ימים מתחילת החלון ועד סופו · שבת→רביעי, רביעי→שבת */
const SPAN = { cous: 4, schn: 3 } as const;

const isoOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export type SaleWindow = {
  cat: 'cous' | 'schn';
  /** יום המכירה עצמו · שלישי לקוסקוס, שישי לשניצל */
  date: string;
  /** תחילת החלון · שבת או רביעי ב-07:00 */
  start: string;
  /** סוף החלון · היום שבו החלון מתחלף, ב-07:00 */
  end: string;
};

/**
 * החלון שבו אנחנו נמצאים עכשיו.
 *
 * ⚠ **`date` יכול להיות אתמול** · וזה בכוונה. שישי בערב, ושבת עד
 * 07:00, עדיין שייכים לחלון של השניצל — שם מוצג ״המכירה נסגרה״
 * על המכירה שכבר הייתה.
 */
export function saleWindow(now: Date): SaleWindow {
  const t = weekMinutes(now);
  const day = now.getDay();
  const schn = t >= SWITCH_WED && t < SWITCH_SAT;
  const cat: 'cous' | 'schn' = schn ? 'schn' : 'cous';
  /* כמה ימים אחורה מהיום ועד תחילת החלון · ראו טבלת הימים בהערה */
  const back = schn ? day - WED : day === SAT ? 0 : day + 1;
  const start = addDaysIso(isoOf(now), -back);
  return { cat, date: addDaysIso(start, LEAD[cat]), start, end: addDaysIso(start, SPAN[cat]) };
}

/**
 * יום המכירה של החלון הנוכחי · הקטגוריה והתאריך.
 * ⚠ נשאר בשם הזה כי הוא קרוא בכל האפליקציה · ראו `saleWindow`.
 */
export function upcomingSale(now: Date): { cat: 'cous' | 'schn'; date: string } {
  const w = saleWindow(now);
  return { cat: w.cat, date: w.date };
}

/** האם החלון של התאריך הזה כבר נגמר · לפי השעון של עכשיו */
export function saleWindowEnded(saleDate: string, now: Date): boolean {
  const w = saleWindow(now);
  return saleDate !== w.date;
}
