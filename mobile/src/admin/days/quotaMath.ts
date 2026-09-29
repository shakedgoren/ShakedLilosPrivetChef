import { CATS, type DayCatKey } from '../../data/adminDays';

/**
 * חשבון המכסות וההורדות · פונקציות טהורות.
 *
 * ⚠ **למה זה יצא מההוק · 29 בספטמבר 2026** · `bumpQuota` ו-`bumpWaste`
 * חישבו את הערך הבא מתוך **הרינדור**. שתי הקשות באותו טיק קראו
 * שתיהן את אותו מספר, והשנייה דרסה את הראשונה — כלומר לחיצה
 * נעלמת. נמדד קודם באותה תקלה בדיוק בצ׳יפים של שעות המשלוח:
 * ארבע לחיצות השאירו אחת.
 *
 * כאן הפונקציות מקבלות את **השורה** ומחזירות מפה חדשה, ולכן אפשר
 * להריץ אותן בתוך עדכון המצב — ואז כל הקשה רואה את זו שלפניה.
 *
 * ⚠ **אין כאן מוטציה** · כל פונקציה מחזירה מפה חדשה.
 */

export type QuotaRecord = {
  blocked?: boolean;
  sale?: DayCatKey | null;
  except?: DayCatKey | null;
  q?: Record<string, number>;
  /** מה כבר נמכר · לקריאה בלבד, מגיע מההזמנות */
  sold?: Record<string, number>;
  /** מנות שהתקלקלו, נפלו או נרשמו בטעות */
  waste?: Record<string, number>;
};

/** הקטגוריה הפעילה ביום · חריגה ביום חסום, אחרת יום המכירה */
export const activeCatOf = (rec: QuotaRecord): DayCatKey | null =>
  (rec.blocked ? rec.except : rec.sale) ?? null;

/** מכסת ברירת המחדל של המנה · מה שהמסך מציג כשאין ערך שמור */
export function defaultQuota(rec: QuotaRecord, id: string): number {
  const key = activeCatOf(rec);
  if (!key) return 0;
  return CATS[key].dishes.find((d) => d.id === id)?.q ?? 0;
}

/**
 * המספר שהמסך מראה · הערך השמור, ואם אין — ברירת המנה.
 *
 * ⚠ **המקור היחיד לאמת** · קודם המסך הציג `q[id] ?? ברירת המנה`
 * וההקשה חישבה מ-`q[id] ?? 0`. יום שהגיע מהשרת בלי מכסות שמורות
 * הציג 40, ולחיצה אחת על מינוס קפצה ל-0. עכשיו שניהם קוראים כאן.
 */
export const shownQuota = (rec: QuotaRecord, id: string): number =>
  rec.q?.[id] ?? defaultQuota(rec, id);

/** מפת המכסות אחרי הקשה · לא יורדים מתחת לאפס */
export function nextQuotas(
  rec: QuotaRecord,
  id: string,
  delta: number,
): Record<string, number> {
  return { ...(rec.q ?? {}), [id]: Math.max(0, shownQuota(rec, id) + delta) };
}

/**
 * מפת ההורדות אחרי הקשה.
 * ⚠ **התקרה היא מה שלא נמכר** · אי אפשר להוריד מנה שכבר יצאה
 * ללקוחה. זה היה `room` בהוק, והוא נגזר כאן מאותה שורה.
 */
export function nextWaste(
  rec: QuotaRecord,
  id: string,
  delta: number,
): Record<string, number> {
  const room = Math.max(0, shownQuota(rec, id) - (rec.sold?.[id] ?? 0));
  const now = rec.waste?.[id] ?? 0;
  return { ...(rec.waste ?? {}), [id]: Math.min(room, Math.max(0, now + delta)) };
}
