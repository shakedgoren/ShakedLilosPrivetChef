/**
 * איפוס ההזמנות · **מחיקה בלתי הפיכה**.
 *
 * ⚠ **בקשת שקד · 11 באוקטובר 2026** · ״תאפס את הדטה בייס של
 * ההזמנות״. היא בחרה במפורש: ההזמנות, המספור חזרה ל-1, והתיקונים
 * הידניים של ״נמכרו״ ושל הפחת.
 *
 * ⚠⚠ **שלושה דברים שמחיקת שורות לבדה אינה עושה** · ולכן הם כאן:
 *
 * · **המספור אינו חוזר ל-1.** `Order.number` הוא רצף של Postgres,
 *   והוא ממשיך לספור גם כשהטבלה ריקה. שקד ביקשה ב-26 בספטמבר
 *   2026 ש״יתחיל ממספר הזמנה 1 ויעלה ב-1 בכל פעם״, ולכן הרצף
 *   מוחזר במפורש.
 * · **״נמכרו״ אינו מתאפס.** `SaleDay.soldJson` הוא תיקון ידני
 *   ש**גובר** על הספירה מההזמנות (ראו `routes/adminDays.ts`).
 *   בלי לנקות אותו הלוח ימשיך להציג מנות שנמכרו בלי שתהיה
 *   מאחוריהן הזמנה אחת.
 * · **הפחת אינו מתאפס.** `SaleDay.wasteJson`, מאותה סיבה.
 *
 * ⚠ **מה **לא** נמחק** · לקוחות, ימי המכירה עצמם והמכסות שלהם,
 * הוצאות, רשימות קניות, מתכוני העלויות והמלאי הלוגיסטי. אלה
 * אינם הזמנות.
 *
 * ⚠ **ברירת המחדל היא סימולציה** · בלי `--yes` הסקריפט רק סופר
 * ומדפיס, ואינו נוגע בשום דבר. מחיקה דורשת כוונה מפורשת:
 *
 *     npx tsx scripts/reset-orders.ts            ← סימולציה
 *     npx tsx scripts/reset-orders.ts --yes      ← מוחק באמת
 */

import { prisma } from '../src/db.ts';

const REAL = process.argv.includes('--yes');

/**
 * שם הרצף נגזר מהמסד ולא מנוחש.
 * ⚠ ‎`"Order_number_seq"` הוא מה ש-Prisma מייצר היום, אבל שם קשיח
 * שישתנה ייכשל בשקט ויחזיר `setval` על רצף שאינו קיים.
 */
const SEQ = `pg_get_serial_sequence('"Order"', 'number')`;

async function main(): Promise<void> {
  const orders = await prisma.order.count();
  const days = await prisma.saleDay.findMany({
    select: { date: true, soldJson: true, wasteJson: true },
  });
  const dirty = days.filter(
    (d) => (d.soldJson && d.soldJson !== '{}') || (d.wasteJson && d.wasteJson !== '{}'),
  );

  console.log('');
  console.log('מה יימחק:');
  console.log(`  · הזמנות · ${orders}`);
  console.log(`  · מספור ההזמנות · חוזר ל-1`);
  console.log(`  · ימי מכירה עם תיקון ידני של ״נמכרו״ או פחת · ${dirty.length}`);
  for (const d of dirty) console.log(`      ${d.date} · נמכרו ${d.soldJson} · פחת ${d.wasteJson}`);
  console.log('');
  console.log('מה נשאר: לקוחות, ימי המכירה והמכסות, הוצאות, קניות, עלויות ומלאי.');
  console.log('');

  if (!REAL) {
    console.log('סימולציה בלבד · לא נגעתי בכלום. להרצה אמיתית: --yes');
    return;
  }

  /* ⚠ הכול או כלום · מחיקה בלי איפוס המספור היא בדיוק מה שלא נרצה */
  await prisma.$transaction(async (tx) => {
    const gone = await tx.order.deleteMany({});
    /* ⚠ `false` · כך הערך הבא שיישלף הוא 1 ולא 2 */
    await tx.$executeRawUnsafe(`SELECT setval(${SEQ}, 1, false)`);
    const cleared = await tx.saleDay.updateMany({
      data: { soldJson: '{}', wasteJson: '{}' },
    });
    console.log(`נמחקו ${gone.count} הזמנות`);
    console.log(`נוקו ${cleared.count} ימי מכירה`);
  });

  const left = await prisma.order.count();
  const next = await prisma.$queryRawUnsafe<{ last_value: bigint; is_called: boolean }[]>(
    `SELECT last_value, is_called FROM ${await seqName()}`,
  );
  console.log('');
  console.log(`נשארו ${left} הזמנות · ההזמנה הבאה תקבל מספר ${nextNumber(next[0])}`);
}

/** שם הרצף כמחרוזת · לשאילתת האימות שאחרי המחיקה */
async function seqName(): Promise<string> {
  const r = await prisma.$queryRawUnsafe<{ seq: string | null }[]>(
    `SELECT ${SEQ} AS seq`,
  );
  const name = r[0]?.seq;
  if (!name) throw new Error('לא נמצא הרצף של Order.number');
  return name;
}

function nextNumber(row?: { last_value: bigint; is_called: boolean }): string {
  if (!row) return '?';
  return String(row.is_called ? Number(row.last_value) + 1 : Number(row.last_value));
}

main()
  .catch((err) => {
    console.error('האיפוס נכשל ·', err);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
