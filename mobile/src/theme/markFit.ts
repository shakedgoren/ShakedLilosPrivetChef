import { Platform } from 'react-native';

/**
 * מדידת הדיו של הכותרת · **במנוע שבו היא באמת מצוירת.**
 *
 * ⚠⚠ **למה זה נולד · 11 באוקטובר 2026** · שקד צילמה את האתר
 * באייפון: ״הכיתוב לא על כל המסך, הוא נחתך״. זו הפעם השלישית
 * שהאות ״l״ האחרונה מדווחת כחתוכה (24.9, 3.10, והיום), ובכל פעם
 * התיקון היה מספר קבוע שנמדד על מכשיר אחד.
 *
 * מדידה מהצילום שלה: הדיו נגמר ב-97.4% מרוחב המסך. אותה בנייה
 * בדיוק בכרום, באותו רוחב: 92.3%. כלומר **WebKit מצייר את
 * ״Bite & Tell״ בערך חמישה אחוזים רחב יותר מ-Blink.** הגופן הוא
 * כתב יד מחובר עם זנב מעופף, ורוחב הדיו שלו אינו רוחב הפסיעה —
 * כמה בדיוק הוא חורג זו החלטה של מנוע העיצוב.
 *
 * ⚠ **למה `TAIL_PAD` לא הספיק** · הוא הרחיב את בד ה-SVG ב-24
 * נקודות לכל צד ובלע אותן במרווח שלילי. הבד באמת גדל — אבל הוא
 * גדל **אל מחוץ למסך**: ברוחב 390 הוא מתחיל ב-‎5.2- ונגמר ב-395.2.
 * כלומר ה״מקום לזנב״ שנוצר יושב מעבר לקצה המסך, ושם הוא לא עוזר
 * לאף אחד. הדיו לא נחתך על ידי ה-SVG אלא על ידי המסך עצמו.
 *
 * ⚠ **מה שנעשה במקום** · לא מנחשים את המנוע, שואלים אותו.
 * `measureText` על בד דו-ממדי מחזיר את גבולות הדיו **האמיתיים**
 * של אותו דפדפן, כולל הזנבות, ומשם נגזרים שני דברים שהיו עד
 * היום מספרים קבועים: כמה להקטין כדי להיכנס, ובכמה להזיז כדי
 * שהדיו — ולא רוחב הפסיעה — יהיה במרכז.
 *
 * ⚠ **ווב בלבד** · במכשיר אין `canvas`, ושם המידות נמדדו על
 * iPhone 17 Pro ואושרו על ידי שקד. הקורא נופל לערכים שלה.
 */

export type MarkInk = {
  /** רוחב הדיו · מהקצה השמאלי ביותר לימני ביותר */
  width: number;
  /**
   * מה להוסיף ל-`x` כדי שה**דיו** יהיה במרכז ולא רוחב הפסיעה.
   *
   * ⚠ זה בדיוק מה ש-`nudge` ניסה לתאר כמספר קבוע שנמדד על מכשיר
   * אחד. בגופן עם זנבות הדיו אינו סימטרי סביב הפסיעה, ולכן
   * טקסט שממורכז לפי הפסיעה **נראה** מוסט.
   *
   * החשבון · ב-`textAnchor="middle"` הפסיעה ממורכזת, כלומר היא
   * מתחילה ב-`x - advance/2`. הדיו משתרע משם מ-‎`-left` עד
   * ‎`+right`, ולכן מרכז הדיו הוא `x - advance/2 + (right-left)/2`.
   * כדי שמרכז הדיו יינחת על `c` צריך `x = c + advance/2 - (right-left)/2`.
   */
  shift: number;
};

/**
 * @param text   הטקסט עצמו
 * @param family שם משפחת הגופן · חייב להיות טעון כבר
 * @param size   גודל הגופן בפיקסלים
 */
export function measureMarkInk(text: string, family: string, size: number): MarkInk | null {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return null;
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return null;
    ctx.font = `${size}px "${family}"`;
    const m = ctx.measureText(text);
    const left = m.actualBoundingBoxLeft;
    const right = m.actualBoundingBoxRight;
    /* ⚠ דפדפן ישן בלי גבולות דיו · עדיף ערכי הקנבס על ניחוש */
    if (typeof left !== 'number' || typeof right !== 'number') return null;
    const advance = m.width;
    if (!(advance > 0)) return null;
    return {
      width: left + right,
      /* ⚠ ראו את החשבון ב-`shift` */
      shift: advance / 2 - (right - left) / 2,
    };
  } catch {
    /* ⚠ מדידה שנכשלה אינה שוברת כותרת · נופלים לערכים הקבועים */
    return null;
  }
}

/**
 * האם הגופן כבר נטען · מדידה לפני כן מחזירה את מידות גופן הגיבוי.
 * ⚠ ה-SVG עצמו מצויר נכון מרגע שהגופן מגיע; המדידה חייבת להתיישר
 * איתו, אחרת נקבל קנה מידה שנגזר מגופן אחר לגמרי.
 */
export function fontReady(family: string, size: number): boolean {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return false;
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (!fonts || typeof fonts.check !== 'function') return false;
  try {
    return fonts.check(`${size}px "${family}"`);
  } catch {
    return false;
  }
}

/** ממתין לטעינת כל הגופנים · מחזיר מבטל */
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
