/**
 * הוצאות קבועות חודשיות.
 *
 * ⚠ **בקשה של שקד · 19 בספטמבר 2026** · ״תוסיף אופציה להוסיף
 * הוצאות כלליות חודשיות שהן הוצאות קבועות — כלומר חודש הבא אני
 * לא אצטרך להקליד את כל החלק הזה שוב, הוא אוטומטית יתעדכן״.
 *
 * ⚠ **תבנית שמתממשת, ולא חישוב בזמן אמת** · כל דוח כספי בפרויקט
 * קורא מטבלת `Expense`. אילו ההוצאות הקבועות היו מתווספות
 * ״בזמן חישוב״, כל דוח היה חייב לזכור להוסיף אותן — והראשון
 * שישכח יציג מספר אחר. במקום זה התבנית **יוצרת שורת הוצאה
 * אמיתית** לכל חודש, וכל השאר ממשיך לעבוד בלי לדעת שהיא קיימת.
 *
 * ⚠ **שורה שנוצרה היא שלה** · אפשר למחוק או לשנות את החודש הזה
 * בלי לפגוע בתבנית, ואפשר למחוק את התבנית בלי למחוק היסטוריה.
 * זו בדיוק ההתנהגות שמצפים לה מ״הוצאה קבועה״.
 *
 * ⚠ **`period` הוא yyyy-mm** · לכן השוואת מחרוזות רגילה נותנת
 * סדר כרונולוגי נכון, ואין צורך להמיר לתאריכים.
 */

/** תקרת מילוי אחורה · תבנית ישנה לא תיצור מאות שורות בבת אחת */
export const MAX_BACKFILL = 24;

export type FixedRow = {
  id: string;
  fromPeriod: string;
  untilPeriod: string;
  /** החודש האחרון שכבר מולא · ראו `startPeriod` */
  lastPeriod: string;
  /**
   * כל כמה זמן · `month` (ברירת המחדל, כפי שהיה) או `year`.
   *
   * ⚠ **שנתי חוזר באותו חודש** · ביטוח שנתי שנקבע במרץ ייווצר
   * במרץ בכל שנה ולא בכל חודש. לכן `monthsToFill` מדלג לפי
   * שתים־עשרה ולא לפי אחת.
   */
  every?: FixedEvery;
};

/** התדירויות שתבנית יכולה לשאת · ׳חד פעמי׳ אינו תבנית כלל */
export type FixedEvery = 'month' | 'year';

/** החודש שאחרי · yyyy-mm */
export function nextPeriod(period: string): string {
  let [y, m] = period.split('-').map(Number);
  m += 1;
  if (m > 12) {
    m = 1;
    y += 1;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

/** אותו חודש בשנה הבאה · yyyy-mm */
export function nextYearPeriod(period: string): string {
  const [y, m] = period.split('-').map(Number);
  return `${y + 1}-${String(m).padStart(2, '0')}`;
}

/** המחזור הבא · לפי התדירות של התבנית */
export function nextOf(period: string, every: FixedEvery): string {
  return every === 'year' ? nextYearPeriod(period) : nextPeriod(period);
}

/**
 * מאיזה חודש להתחיל למלא.
 *
 * ⚠ **מחיקה ידנית נשארת מחוקה · 19 בספטמבר 2026** · בלי זה, שורה
 * שנמחקה מחודש מסוים הייתה נוצרת מחדש בריענון הבא — כלומר אי
 * אפשר היה לומר ״החודש הזה לא שילמתי את זה״. `lastPeriod` זוכר
 * עד לאן כבר הגענו, ולכן ממלאים רק **קדימה**.
 */
export function startPeriod(fixed: FixedRow): string {
  if (!fixed.lastPeriod) return fixed.fromPeriod;
  return nextOf(fixed.lastPeriod, fixed.every ?? 'month');
}

/**
 * האם ההוצאה הקבועה חלה על החודש הזה.
 *
 * ⚠ **שנתי חל רק על חודש המחזור** · תבנית שנתית שהתחילה במרץ
 * חלה על מרץ בכל שנה, ולא על אפריל. בלי הבדיקה הזו ביטוח שנתי
 * היה נרשם שתים־עשרה פעמים בשנה.
 */
export function appliesTo(fixed: FixedRow, period: string): boolean {
  if (period < fixed.fromPeriod) return false;
  if (fixed.untilPeriod !== '' && period > fixed.untilPeriod) return false;
  if ((fixed.every ?? 'month') === 'year') {
    return period.slice(5) === fixed.fromPeriod.slice(5);
  }
  return true;
}

/** מזהה המקור בשורת ההוצאה · כך יודעים שהחודש הזה כבר מולא */
export const sourceOf = (fixedId: string): string => `fixed:${fixedId}`;

/**
 * החודשים שצריך למלא · מהחודש הראשון ועד החודש הנוכחי, כולל.
 * ⚠ מוגבל ל-`MAX_BACKFILL` האחרונים · ראו את ההערה למעלה.
 */
export function monthsToFill(from: string, until: string, every: FixedEvery = 'month'): string[] {
  const out: string[] = [];
  let [y, m] = from.split('-').map(Number);
  const key = () => `${y}-${String(m).padStart(2, '0')}`;
  while (key() <= until) {
    out.push(key());
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    if (out.length > 1000) break;
  }
  /* שנתי · רק החודש שתואם לחודש ההתחלה */
  const mm = from.slice(5);
  const kept = every === 'year' ? out.filter((p) => p.slice(5) === mm) : out;
  return kept.slice(-MAX_BACKFILL);
}
