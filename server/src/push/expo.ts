/**
 * שליחת התראות דרך שירות הדחיפה של Expo.
 *
 * ⚠ **נבנה ב-18 בספטמבר 2026** · שקד ביקשה התראה אמיתית לטלפון
 * כשיום מכירה נפתח, ולא רק שורה בתוך האפליקציה.
 *
 * ⚠ **דרך Expo ולא ישירות מול אפל** · שליחה ישירה ל-APNs דורשת
 * להחזיק כאן את מפתח החתימה של אפל, לחדש אותו, ולממש HTTP/2 עם
 * JWT. שירות Expo עושה את זה, ואותו אסימון עובד גם לאנדרואיד.
 * מה שכן נדרש מצד שקד: להעלות מפתח APNs לחשבון ה-Expo שלה, אחרת
 * ההודעה תצא מכאן ותיעצר שם.
 *
 * ⚠ **כישלון אינו מפיל כלום** · פתיחת יום מכירה חשובה מההתראה
 * עליו. כל שגיאה נבלעת, והשורה בתוך האפליקציה ממשיכה לעבוד כרגיל.
 */

const ENDPOINT = 'https://exp.host/--/api/v2/push/send';
/** Expo מקבל עד 100 הודעות בבקשה · ראו התיעוד שלהם */
const CHUNK = 100;

export type PushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

/** אסימון תקין של Expo · שומר מלשלוח זבל ולקבל 400 על כל הקבוצה */
export const isExpoToken = (t: string): boolean =>
  /^Expo(nent)?PushToken\[[^\]]+\]$/.test(t.trim());

export async function sendPush(messages: PushMessage[]): Promise<number> {
  const valid = messages.filter((m) => isExpoToken(m.to));
  if (valid.length === 0) return 0;
  let sent = 0;
  for (let i = 0; i < valid.length; i += CHUNK) {
    const batch = valid.slice(i, i + CHUNK);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(batch),
      });
      if (res.ok) sent += batch.length;
    } catch {
      /* ראו ההערה למעלה */
    }
  }
  return sent;
}
