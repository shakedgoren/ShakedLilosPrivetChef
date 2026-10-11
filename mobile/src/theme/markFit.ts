import { Platform } from 'react-native';

/**
 * מדידת הדיו של הכותרת · **באותו מסלול שבו היא באמת מצוירת.**
 *
 * ⚠⚠ **למה זה נולד · 11 באוקטובר 2026** · שקד דיווחה ארבע פעמים
 * שהכותרת ״נחתכת״ (24.9, 3.10, ופעמיים ב-11.10). המידות שעל פיהן
 * נבנה הבד — גובה 88, קו בסיס 74, `nudge` של ‎6- — כולן מספרים
 * קבועים שנמדדו פעם אחת על iPhone 17 Pro. מספר קבוע אינו יכול
 * לדעת מה המנוע שמולו באמת מצייר.
 *
 * ⚠⚠ **ו-`measureText` של הקנבס שיקר** · הניסיון הראשון כאן השתמש
 * בו, ונמדד שהוא מחזיר `descent: 7` בזמן שה-SVG עצמו מצייר דיו
 * שיורד **30.3** מתחת לקו הבסיס. כלומר הקנבס לא השתמש בגופן
 * המבוקש אלא בגיבוי. גרוע מזה:
 * `document.fonts.check('75px "NoSuchFontXYZ"')` מחזיר **true**,
 * ולכן גם הבדיקה ״האם הגופן מוכן״ הייתה חסרת ערך.
 *
 * ⚠ **מה שעושים במקום** · מודדים `<text>` אמיתי בתוך `<svg>` סמוי,
 * עם אותה משפחה ואותו גודל, וקוראים `getBBox`. זה בדיוק מנוע
 * הפריסה שמצייר את הכותרת — אותה התאמת גופן, אותה הרכבת אותיות —
 * ולכן המספר שחוזר הוא מה שיהיה על המסך.
 *
 * ⚠ **והאם הגופן נטען** · לא שואלים את `fonts.check`. מודדים
 * פעמיים, פעם עם המשפחה המבוקשת ופעם עם שם שאינו קיים; אם שתי
 * המדידות זהות — הגופן עוד לא הוחל, והמדידה חסרת משמעות.
 *
 * ⚠ **ווב בלבד** · במכשיר אין DOM, ושם המידות נמדדו על מכשיר
 * אמיתי ואושרו על ידי שקד. הקורא נופל לערכים שלה.
 */

export type MarkInk = {
  /** רוחב הדיו · מהקצה השמאלי ביותר לימני ביותר */
  width: number;
  /**
   * מה להוסיף ל-`x` כדי שה**דיו** יהיה במרכז ולא רוחב הפסיעה.
   *
   * ⚠ זה מה ש-`nudge` ניסה לתאר כמספר קבוע. בגופן עם זנבות הדיו
   * אינו סימטרי סביב הפסיעה, ולכן טקסט שממורכז לפי הפסיעה
   * **נראה** מוסט.
   *
   * ⚠ **המדידה נעשית באותו עוגן של הכותרת** · `text-anchor:
   * middle`. הניסיון הראשון מדד עם עוגן `start` וחישב דרך רוחב
   * הפסיעה — וזה נשבר, כי המסמך הוא `dir="rtl"` ולכן ״start״ הוא
   * הקצה **הימני**: ה-bbox חזר עם ‎x = ‎320.2-, הכותרת הוזזה
   * בכ-315 פיקסלים ויצאה אל מחוץ למסך. נמדד.
   *
   * עם עוגן `middle` הכיוון כבר לא משנה: מרכז הדיו ביחס לעוגן
   * הוא `bbox.x + width/2`, וכדי שהוא יינחת על `c` צריך
   * `X = c - (bbox.x + width/2)`.
   */
  shift: number;
  /**
   * כמה הדיו יורד **מתחת לקו הבסיס**.
   *
   * ⚠⚠ **זה מה שחתך את הכותרת** · גובה הבד נקבע ממספר קבוע (88)
   * עם קו בסיס ב-74, כלומר ארבע-עשרה יחידות מתחתיו. ההערה שלצידו
   * טענה ש״הזנב הנמוך ביותר יורד שמונה פיקסלים בלבד״. נמדד
   * ב-`getBBox`: הוא יורד **שלושים**. הזנב של ה-B, של ה-& ושל
   * ה-l האחרונה נחתכו בקו ישר בתחתית הבד — וזה מה שנראה בצילום
   * של שקד כשישים עמודות שנגמרות באותה שורה בדיוק.
   */
  descent: number;
  /** כמה הדיו עולה מעל קו הבסיס · לשלמות המדידה */
  ascent: number;
};

const NS = 'http://www.w3.org/2000/svg';
/** שם משפחה שבוודאות אינו קיים · לזיהוי ״הגופן עוד לא הוחל״ */
const NO_FONT = '__bite_and_tell_missing__';

type Measured = { x: number; y: number; width: number; height: number };

function bboxOf(text: string, family: string, size: number): Measured | null {
  const svg = document.createElementNS(NS, 'svg');
  /* ⚠ `visibility` ולא `display: none` · אלמנט שאינו מרונדר
     אינו מחזיר `getBBox` בכל המנועים */
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.style.left = '-9999px';
  svg.style.visibility = 'hidden';
  svg.style.pointerEvents = 'none';

  const node = document.createElementNS(NS, 'text');
  node.setAttribute('x', '0');
  node.setAttribute('y', '0');
  /* ⚠ אותו עוגן של הכותרת האמיתית · ראו ההערה ב-`shift` */
  node.setAttribute('text-anchor', 'middle');
  node.setAttribute('font-family', family);
  node.setAttribute('font-size', String(size));
  node.textContent = text;
  svg.appendChild(node);
  document.body.appendChild(svg);
  try {
    const box = node.getBBox();
    return {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
    };
  } catch {
    return null;
  } finally {
    document.body.removeChild(svg);
  }
}

export function measureMarkInk(text: string, family: string, size: number): MarkInk | null {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return null;
  try {
    const real = bboxOf(text, family, size);
    if (!real || !(real.width > 0)) return null;

    /* ⚠ הגופן עוד לא הוחל · ראו ההערה בראש הקובץ */
    const plain = bboxOf(text, NO_FONT, size);
    if (plain && Math.abs(plain.width - real.width) < 0.5) return null;

    return {
      width: real.width,
      /* ⚠ ראו את החשבון ב-`shift` */
      shift: -(real.x + real.width / 2),
      /* קו הבסיס הוא 0 · ולכן התחתית היא כמה שירדנו מתחתיו */
      descent: real.y + real.height,
      ascent: -real.y,
    };
  } catch {
    /* ⚠ מדידה שנכשלה אינה שוברת כותרת · נופלים לערכים הקבועים */
    return null;
  }
}

/**
 * ממתין לטעינת הגופנים · מחזיר מבטל.
 * ⚠ **לא `fonts.check`** · הוא מחזיר `true` גם לשם שאינו קיים,
 * ולכן אינו יכול לשמש כשער. `fonts.ready` הוא הבטחה אמיתית,
 * והמדידה עצמה היא שמאמתת.
 */
export function onFontsReady(fn: () => void): () => void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return () => undefined;
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (!fonts?.ready) return () => undefined;
  let live = true;
  void fonts.ready.then(() => {
    if (live) fn();
  });
  return () => {
    live = false;
  };
}
