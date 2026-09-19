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
import { shortById } from '../../mobile/src/data/shortNames.ts';

/**
 * ממה מורכבת כל מנה · **כשורות מוצר ברשימה**.
 *
 * ⚠ בקשה של שקד (19 בספטמבר 2026): ״במנת עוף · מוצר: קוסקוס
 * ירקות, כמות 1, מחיר כמה שיצא העלות ייצור בחישוב של הקוסקוס
 * צמחוני · מוצר: עוף, כמות 1, מחיר כמה שיצא בחישוב של תוספת
 * עוף. ואז לבצע את החישוב של עלות ייצור המנה ועלות הרווח שלה״.
 *
 * ⚠ **`ref` ולא `from`** · קודם ההרכבה ישבה בשדה `from`, שהוא
 * קישור **נסתר** — היא לא הופיעה ברשימת המצרכים. עכשיו כל רכיב
 * הוא שורה שרואים, עם שם וכמות, ומחיר שמתעדכן לבד מעלות הייצור
 * של המנה שאליה הוא מצביע.
 *
 * ⚠ **המחיר 0 והכמות 1** · המחיר בשורת `ref` מחושב ואינו נשמר,
 * ו-0 כאן הוא רק מציין מקום.
 */
const COMPOSED: Record<string, { n: string; ref: string; qty: number; price: number }[]> = {
  cousChick: [
    { n: 'קוסקוס ירקות', ref: 'cousVeg', qty: 1, price: 0 },
    { n: 'עוף', ref: 'addChick', qty: 1, price: 0 },
  ],
  cousMafr: [
    { n: 'קוסקוס ירקות', ref: 'cousVeg', qty: 1, price: 0 },
    { n: 'מפרום', ref: 'addMafr', qty: 1, price: 0 },
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
      /* ⚠ שם קצר למנות השניצל · בקשה של שקד · ראו `shortNames` */
      name: shortById(d.id, d.name),
      mode: d.mode,
      /* המחיר ללקוחה · הדבר היחיד שאמיתי כאן */
      price: d.price,
      /* ⚠ העלות מתחילה מאפס · ראו ההערה בראש הקובץ */
      yieldQty: 0,
      note: '',
      fromJson: '[]',
      partsJson: JSON.stringify(COMPOSED[d.id] ?? []),
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
