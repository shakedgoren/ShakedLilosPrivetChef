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
 * חלון יום המכירה שמוצג בדף הניהול.
 *
 * ⚠ **חוק של שקד (15 בספטמבר 2026)** · משישי ב-18:00 ועד שלישי
 * ב-18:00 מוצג יום המכירה של הקוסקוס, ומשלישי ב-18:00 ועד שישי
 * ב-18:00 מוצג יום המכירה של השניצל. כלומר ברגע שיום מכירה נסגר
 * בערב, הדף כבר מצביע על הבא אחריו.
 *
 * ⚠ **שעון מקומי** · הגבול הוא 18:00 אצל שקד, ולא ב-UTC. שאר
 * הקובץ עובד ב-UTC כי שם מדובר בתאריכים בלבד.
 */
export const SALE_SWITCH_HOUR = 18;

/** דקות מתחילת השבוע · ראשון ב-00:00 הוא אפס */
const weekMinutes = (d: Date) => d.getDay() * 1440 + d.getHours() * 60 + d.getMinutes();

const TUE = 2;
const FRI = 5;
const SWITCH_TUE = TUE * 1440 + SALE_SWITCH_HOUR * 60;
const SWITCH_FRI = FRI * 1440 + SALE_SWITCH_HOUR * 60;

/** יום המכירה הקרוב לפי החלון · הקטגוריה והתאריך שאליו היא שייכת */
export function upcomingSale(now: Date): { cat: 'cous' | 'schn'; date: string } {
  const t = weekMinutes(now);
  const cat: 'cous' | 'schn' = t >= SWITCH_TUE && t < SWITCH_FRI ? 'schn' : 'cous';
  const target = cat === 'cous' ? TUE : FRI;
  /* ⚠ בתוך החלון היעד תמיד לפנים · שלישי אחרי 18:00 כבר בחלון
     של שישי, ולכן ההפרש לעולם אינו ״היום שכבר עבר״. */
  const ahead = (target - now.getDay() + 7) % 7;
  const local = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return { cat, date: addDaysIso(local, ahead) };
}
