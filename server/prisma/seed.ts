/**
 * זריעה · **חשבון הניהול והמחירים בלבד.**
 *
 * ⚠ **נכתב מחדש ב-19 בספטמבר 2026 · בקשה מפורשת של שקד** ·
 * ״כל הדאטה בייס צריך להיות ריק ללא נתונים כלל! העסק מתחיל מ-0,
 * אין לו לקוחות, אין לו הכנסות, אין לו הוצאות, אין לו הזמנות,
 * אין לו קניות, אין רווחים, אין עלויות, אין כלום כלום כלום —
 * פרט לנתונים על המחירים של המנות אותם אנחנו מוכרים בלבד״.
 *
 * הזריעה הקודמת יצרה לקוחות, הזמנות, ימי מכירה, מלאי, רשימות
 * קניות והוצאות — כולם מנתוני הקנבס. זה היה שימושי כדי לראות
 * מסכים מלאים בפיתוח, ומסוכן ברגע שהעסק אמיתי: מספרים פיקטיביים
 * שנראים כמו מחזור ורווח.
 *
 * ⚠ **מה שכן נשאר, ולמה**
 * · **חשבון הניהול** · בלעדיו אין איך להיכנס לאפליקציה בכלל.
 * · **מחירי המכירה בלבד** · 37 מנות, סכום 3656. מאומת שהם זהים
 *   בין `adminCosts.ts` למסד, אפס הפרשים.
 *
 * ⚠ **עלויות הייצור מאופסות · 19 בספטמבר 2026** · שקד: ״עלויות
 * ייצור הן לא נכונות, אני צריכה לעדכן אותם — גם שם הכל צריך
 * להיות בנתיים 0״. וזה מתועד גם בראש `adminCosts.ts` עצמו:
 * ״המחירים למכירה תואמים את מסכי הלקוחה. **המתכונים הם נתוני
 * הדגמה מהקנבס**״.
 *
 * לכן המתכון (`parts`) והתפוקה (`yieldQty`) נזרעים ריקים,
 * והעלות יוצאת 0 בכל מנה. שקד תזין אותם בעצמה במסך העלויות.
 *
 * ⚠ **ההרכבה כן נזרעת · 19 בספטמבר 2026** · שקד: ״אם עדכנתי כמה
 * עולה מנה של קוסקוס ירקות אוטומטית זה צריך לעדכן גם את הקוסקוס
 * עם עוף וקוסקוס עם מפרום כי הם מוכלים בתוכם, ואז כשאני אעדכן
 * עוף או מפרום זה יעדכן את המחיר המלא״.
 *
 * ⚠ **מבנה, לא מחיר** · `from` אומר *ממה מורכבת* המנה ולא *כמה
 * היא עולה. הוא נשאר 0 עד שהיא מזינה את המצרכים, ומאותו רגע
 * הסכום מחלחל לבד. `unitCost` כבר יודע ללכת בשרשרת — זה פשוט
 * לא היה מחובר.
 *
 * ⚠ **רק קוסקוס** · זה מה שהיא תיארה. לשאר הקטגוריות אין הרכבה
 * עד שהיא תגיד מה מורכב ממה.
 *
 * ⚠ **`adminCosts.ts` לא נערך** · הוא נוצר אוטומטית מהקנבס, ואין
 * לגעת בו ביד. הסינון נעשה כאן.
 *
 * ⚠ **ימי המכירה לא נזרעים** · שלישי ושישי נגזרים לבד מ-
 * `impliedWeekdayRecord`, סגורים עד שפותחים אותם. שורה במסד
 * נוצרת רק כששקד נוגעת ביום בדף ימי המכירה.
 */
import { prisma } from '../src/db.ts';
import { env } from '../src/env.ts';
import { hashPassword } from '../src/auth/passwords.ts';
import { normalizePhone } from '../src/auth/identity.ts';
import { COST_DISHES } from '../../mobile/src/data/adminCosts.ts';

/**
 * ממה מורכבת כל מנה · `{ id, m }` = מנה אחרת כפול מכפיל.
 * קוסקוס עם עוף = צמחוני + תוספת עוף · וכך גם המפרום.
 */
const COMPOSED: Record<string, { id: string; m: number }[]> = {
  cousChick: [
    { id: 'cousVeg', m: 1 },
    { id: 'addChick', m: 1 },
  ],
  cousMafr: [
    { id: 'cousVeg', m: 1 },
    { id: 'addMafr', m: 1 },
  ],
};

async function main() {
  const email = env.adminEmail.toLowerCase();
  const passwordHash = await hashPassword(env.adminPassword);

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      phone: normalizePhone(env.adminPhone),
      passwordHash,
      name: env.adminName,
      role: 'admin',
    },
    update: {
      phone: normalizePhone(env.adminPhone),
      passwordHash,
      name: env.adminName,
      role: 'admin',
    },
  });
  console.log(`seed · חשבון ניהול · ${email}`);

  for (const d of COST_DISHES) {
    const fields = {
      category: d.c,
      sub: d.sub,
      name: d.name,
      mode: d.mode,
      /* המחיר ללקוחה · הדבר היחיד שאמיתי כאן */
      price: d.price,
      /* ⚠ העלות מתחילה מאפס · ראו ההערה בראש הקובץ */
      yieldQty: 0,
      note: '',
      fromJson: JSON.stringify(COMPOSED[d.id] ?? []),
      partsJson: '[]',
    };
    await prisma.productionDish.upsert({
      where: { id: d.id },
      create: { id: d.id, ...fields },
      update: fields,
    });
  }
  console.log(`seed · מנות ומחירים · ${COST_DISHES.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
