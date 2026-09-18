/**
 * תנועה של נוזל · שני קצוות, מטרה אחת, שתי מהירויות.
 *
 * ⚠ **נמדד מהסרטון של שקד · 18 בספטמבר 2026** · היא שלחה הקלטת מסך
 * של הנאב-בר באפליקציית הקבצים וכתבה ״ניתן להזיז אותו כזה בחופשיות״.
 * מה שקורה שם: הכרית שמאחורי הלשונית הפעילה **מתרוממת** לזכוכית
 * כשנוגעים בה, **נוסעת עם האצבע**, ובדרך היא **נמתחת** — הקצה הקדמי
 * רץ לפני הקצה האחורי — ואז מתכנסת חזרה ביעד.
 *
 * זה כל המודל: לא ״רוחב שגדל״ אלא **שני קצוות שרצים לאותה מטרה בשתי
 * מהירויות**. כשהמטרה זזה הם נפרדים, וזו המתיחה; כשהיא עומדת הם
 * מתאחדים, וזו ההתכנסות. אין כאן שום קבוע של ״כמה למתוח״.
 */

/** שני קצוות הכתם · מיקום בפיקסלים לאורך הסרגל */
export type Edges = { lead: number; trail: number };

/**
 * קבועי הזמן של שני הקצוות, בשניות.
 * ⚠ היחס ביניהם הוא המתיחה · שווים ⇒ אין נוזל, רק מלבן שזז.
 */
const TAU_LEAD = 0.05;
const TAU_TRAIL = 0.13;

/** דעיכה מעריכית · לא תלויה בקצב הפריימים */
const toward = (from: number, to: number, dt: number, tau: number): number =>
  to + (from - to) * Math.exp(-dt / tau);

/** צעד אחד כששני הקצוות רצים למטרה · אחרי שהאצבע עזבה */
export const settleEdges = (e: Edges, target: number, dt: number): Edges => ({
  lead: toward(e.lead, target, dt, TAU_LEAD),
  trail: toward(e.trail, target, dt, TAU_TRAIL),
});

/**
 * צעד אחד בזמן גרירה · הקצה המוביל **הוא** האצבע.
 * ⚠ זו הבקשה עצמה — ״אני אוכל לשלוט במהירות שאני מזיזה״ · אין כאן
 * החלקה על מיקום האצבע, רק על הקצה שנגרר אחריה.
 */
export const dragEdges = (e: Edges, at: number, dt: number): Edges => ({
  lead: at,
  trail: toward(e.trail, at, dt, TAU_TRAIL),
});

/** הקטע שהקצוות מגדירים · `base` הוא רוחב הכתם במנוחה */
export const spanOf = (e: Edges, base: number): { x: number; w: number } => ({
  x: Math.min(e.lead, e.trail),
  w: Math.abs(e.lead - e.trail) + base,
});

/** פחות מחצי פיקסל מהמטרה · אין מה להמשיך לצייר */
export const atRest = (e: Edges, target: number): boolean =>
  Math.abs(e.lead - target) < 0.5 && Math.abs(e.trail - target) < 0.5;
