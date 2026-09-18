import { CATEGORIES } from '../../../mobile/src/data/categories.ts';
import { sendPush, type PushMessage } from './expo.ts';
import type { PrismaClient } from '@prisma/client';

/**
 * התראה אמיתית לטלפון כשיום מכירה נפתח.
 *
 * ⚠ **נבנה ב-18 בספטמבר 2026** · שקד: ״שמתי תזכורת לזה שמכירה
 * תתחיל שאני אקבל התראה, אבל המכירה החלה ולא קיבלתי שום התראה״.
 * עד כה התזכורת הייתה **בתוך האפליקציה** בלבד — החלטה שלה מ-15
 * בספטמבר — והיא ביקשה להוסיף את ההתראה האמיתית.
 *
 * ⚠ **אירוע, לא משימה מתוזמנת** · לשרת אין מתזמן, והוספת אחד היא
 * רכיב תשתית שצריך לנטר. במקום זה ההתראה יוצאת **ברגע ששקד פותחת
 * את יום המכירה** — כלומר בדיוק ברגע שהלקוחה מחכה לו, ובלי שום
 * תהליך רקע שיכול ליפול בשקט.
 *
 * ⚠ **הנוסח זהה לשורה שבתוך האפליקציה** · ראו `SaleAlert` בצד
 * הלקוחה. לא המצאתי כאן טקסט חדש.
 *
 * ⚠ **התזכורת לא נמחקת** · אותה לקוחה תקבל התראה גם בשבוע הבא,
 * בדיוק כמו שהשורה בתוך האפליקציה מתנהגת.
 */

/** שם הקטגוריה · בדיוק כמו `categoryName` בצד הלקוחה */
const nameOf = (key: string): string => {
  const cat = CATEGORIES.find((c) => c.key === key);
  return cat?.sub ?? cat?.title ?? key;
};

/** ⚠ הנוסח של `SaleAlert` · שורת המשנה שם היא בדיוק זו */
const BODY = 'ביקשת שנזכיר · אפשר להזמין עכשיו';

/** רק שתי הטבלאות שנדרשות · אותו דפוס של `saleDay.ts` */
type Db = Pick<PrismaClient, 'saleReminder' | 'pushToken'>;

export async function notifySaleOpen(db: Db, category: string, date: string): Promise<number> {
  if (!category) return 0;
  const reminders = await db.saleReminder.findMany({
    where: { category },
    select: { userId: true },
  });
  if (reminders.length === 0) return 0;

  const tokens = await db.pushToken.findMany({
    where: { userId: { in: reminders.map((r: { userId: string }) => r.userId) } },
    select: { token: true },
  });
  if (tokens.length === 0) return 0;

  const title = `${nameOf(category)} נפתח להזמנות`;
  const messages: PushMessage[] = tokens.map((t: { token: string }) => ({
    to: t.token,
    title,
    body: BODY,
    /* ⚠ כדי שלחיצה על ההתראה תפתח את הקטגוריה הנכונה */
    data: { category, date },
  }));
  return sendPush(messages);
}
