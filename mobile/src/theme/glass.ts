/**
 * מתכוני הזכוכית והזוהר · הועתקו אחד לאחד מקנבס העיצוב.
 *
 * בקנבס כל משטח זכוכית בנוי משלוש שכבות: גרדיאנט לבן חצי־שקוף,
 * מסגרת לבנה, וערימת צללים — קו אור פנימי למעלה, הילה צבעונית
 * מסביב, וצל רך למטה. `boxShadow` ב-React Native 0.76+ מקבל
 * מחרוזת CSS מלאה, כולל `inset` וכמה צללים מופרדים בפסיק, ולכן
 * הערימה עוברת כמו שהיא. הגרדיאנטים עצמם מצוירים ב-react-native-svg
 * (`GlassFill` / `Orb`) כי `backgroundImage` עדיין לא נתמך בכל הפלטפורמות.
 */
import type { TextStyle } from 'react-native';
import { a } from './tokens';

/**
 * צל טקסט · `textShadow` אחד במקום שלושת ה-`textShadow*` הישנים.
 *
 * ⚠ **העטיפה נחוצה בגלל הטיפוסים** · הריצה של ריאקט־נייטיב כבר
 * דורשת את הצורה החדשה ומדפיסה אזהרה על הישנה, אבל ההגדרות של
 * TypeScript עדיין לא מכירות את `textShadow` ב-`TextStyle`. עד
 * שיתעדכנו, ההמרה יושבת כאן במקום אחד ולא מפוזרת בקבצים.
 */
export const textShadow = (value: string): TextStyle =>
  ({ textShadow: value }) as unknown as TextStyle;

/** שכבת הזכוכית הבסיסית · linear-gradient(150deg …) בקנבס */
export const GLASS_STOPS = ['rgba(255,255,255,0.66)', 'rgba(255,255,255,0.40)'] as const;
export const GLASS_EDGE = 'rgba(255,255,255,0.72)';

/** הצל של לוח זכוכית רגיל · שורת המכירה וכרטיס ההזמנה האחרונה */
export const GLASS_SHADOW =
  'inset 0 1px 0 rgba(255,255,255,0.9), 0 14px 30px -24px rgba(96,80,132,0.6)';

/** סרגל הניווט · זכוכית חזקה יותר, קו אור עבה יותר */
export const NAV_STOPS = ['rgba(255,255,255,0.66)', 'rgba(255,255,255,0.44)'] as const;
export const NAV_EDGE = 'rgba(255,255,255,0.75)';
export const NAV_SHADOW =
  'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 18px 34px -18px rgba(96,80,132,0.6)';

/** הכפתור הסגול הראשי · ״מתחילים את המסע״ ב-Guest */
export const CTA_STOPS = ['#CCBAF0', '#BCA7E6', '#C6B3EB'] as const;
/**
 * ⚠ **הצל פוצל לשניים ב-16 בספטמבר 2026** · שקד דיווחה על ״צל מוזר
 * שחור״ מתחת לכפתור בטלפון.
 *
 * הסיבה: הכפתור צריך `overflow: 'hidden'` כדי לחתוך את הגרדיאנט ואת
 * השובל בתוך הגלולה. ב-iOS זה מתרגם ל-`masksToBounds`, שחותך גם את
 * **הצל החיצוני** של אותה שכבה — ומה שנשאר הוא קצה כהה וקשה במקום
 * דעיכה רכה. בדפדפן זה לא קורה, ולכן זה נראה תקין בכל בדיקה שם.
 *
 * הפתרון: השכבה שחותכת נושאת רק את הצללים הפנימיים, והצל החיצוני
 * עובר לשכבה עוטפת שאינה חותכת כלום.
 */
export const CTA_SHADOW =
  'inset 0 1.5px 0 rgba(255,255,255,0.6)' + ', inset 0 -2.5px 5px rgba(118,92,174,0.28)';
/** הצל החיצוני · על העוטפת בלבד */
export const CTA_DROP = '0 10px 20px -12px rgba(118,92,174,0.65)';

/** העיגול הלבן שבתוך הכפתור · מחזיק את החץ */
export const CTA_KNOB_SHADOW =
  'inset 0 1.5px 0 #FFFFFF, 0 4px 9px -4px rgba(90,70,140,0.55)';

/**
 * הילת הכרטיס הפעיל.
 * ⚠ לא מהקנבס · שם ההילה היא `0 0 40px -6px` בשקיפות 0.3.
 * שקד ביקשה עוד זוהר בכרטיסייה הראשית (14 בספטמבר).
 */
export const CARD_GLOW_BLUR = 64;
export const CARD_GLOW_SPREAD = -4;
export const CARD_GLOW_ALPHA = 0.46;

/** כרטיס הקטגוריה בקרוסלה · הפעיל זוהר, הרדומים כמעט שטוחים */
export const cardShadow = (rgb: string, active: boolean): string =>
  active
    ? 'inset 0 2.5px 0 rgba(255,255,255,0.98)' +
      `, inset 0 -2.5px 3px ${a(rgb, 0.22)}` +
      ', inset 3px 0 3px rgba(255,255,255,0.6)' +
      `, inset -3px 0 4px ${a(rgb, 0.12)}` +
      ', 0 0 0 1px rgba(255,255,255,0.45)' +
      `, 0 0 ${CARD_GLOW_BLUR}px ${CARD_GLOW_SPREAD}px ${a(rgb, CARD_GLOW_ALPHA)}` +
      `, 0 22px 44px -22px ${a(rgb, 0.6)}`
    : `inset 0 1px 0 rgba(255,255,255,0.6), 0 10px 24px -22px ${a(rgb, 0.4)}`;

export const cardEdge = (active: boolean): string =>
  active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)';

/** בועת הקטגוריה בשורה שמתחת לקרוסלה · שלוש שכבות צל בקנבס */
export const orbShadow = (rgb: string, on: boolean): string =>
  on
    ? `inset -4px -5px 11px ${a(rgb, 0.26)}, inset 3px 4px 8px rgba(255,255,255,0.99)` +
      `, 0 0 22px -2px ${a(rgb, 0.42)}, 0 10px 20px -10px ${a(rgb, 0.6)}`
    : `inset -3px -4px 8px ${a(rgb, 0.12)}, inset 2px 3px 6px rgba(255,255,255,0.94)` +
      `, 0 5px 11px -9px ${a(rgb, 0.28)}`;

/** הבועה הגדולה בתוך הכרטיס · אותה שפה, בעוצמה גבוהה יותר */
export const cardOrbShadow = (rgb: string): string =>
  `inset -8px -10px 20px ${a(rgb, 0.22)}` +
  ', inset 6px 7px 16px rgba(255,255,255,0.98)' +
  `, 0 0 30px -2px ${a(rgb, 0.4)}` +
  `, 0 12px 26px -14px ${a(rgb, 0.55)}`;

/** ההילה המטושטשת שמאחורי הבועה · inset ‎-10px ו-blur 7px בקנבס */
export const HALO_INSET = -10;
export const HALO_BLUR = 7;

/**
 * אריח הזכוכית · שורות המנות, כרטיסי התוספות ושורות המסירה.
 * המתכון המדויק מ-Order.dc.html: מסגרת לבנה, קו אור פנימי למעלה
 * וצל רך ורחב למטה. בלי השלושה האלה האריח יוצא לוח לבן שטוח —
 * וזה מה שהיה באפליקציה עד עכשיו.
 */
export const TILE_STOPS = ['rgba(255,255,255,0.72)', 'rgba(255,255,255,0.44)'] as const;
export const TILE_EDGE = 'rgba(255,255,255,0.74)';
export const TILE_SHADOW =
  'inset 0 1px 0 rgba(255,255,255,0.92), 0 14px 28px -24px rgba(96,80,132,0.6)';

/**
 * ההילה של הכפתור הראשי · אינה מהקנבס.
 * ⚠ שקד ביקשה זוהר לכפתור ״להתחברות והזמנה״. בקנבס יש לו רק צל
 * עדין, ולכן ההילה בנויה באותה שפה של הבועות — סגול המותג, מטושטש.
 */
export const CTA_GLOW_RGB = '118,92,174';
export const CTA_GLOW_SPREAD = 42;
export const CTA_GLOW_BLUR = 24;

/**
 * עוצמת ההילה · שקד ביקשה עוד זוהר פעמיים:
 * 11 בספטמבר 0.5→0.68, ו-14 בספטמבר 0.68→0.82.
 */
export const CTA_GLOW_CORE_ALPHA = 0.82;
export const CTA_GLOW_MID_ALPHA = 0.42;

/**
 * שפת הבועה של האייקונים · המתכון שמאחורי `IconOrb`.
 *
 * ⚠ **לא מהקנבס** · שקד שלחה ב-16 בספטמבר 2026 תמונת ייחוס של חמש
 * הקטגוריות בתוך בועות זכוכית, וביקשה ש**כל עיגול שמקיף אייקון**
 * באפליקציה ייראה כך. המתכון כאן הוא אותה שפה של `orbShadow`,
 * בעוצמה נמוכה יותר כי הבועות האלה קטנות ויושבות על זכוכית לבנה:
 * צל פנימי בגוון בפינה התחתונה־ימנית, אור פנימי בעליונה־שמאלית,
 * שפה לבנה דקה, וצל רך מתחת.
 */
export const ICON_ORB_TINT = 0.16;
export const ICON_ORB_HALO = 0.22;
/** שפת הזכוכית · הטבעת הדקה שנראית בתמונת הייחוס */
export const ICON_ORB_EDGE = 'rgba(255,255,255,0.62)';

export const iconOrbShadow = (rgb: string): string =>
  `inset -3px -4px 9px ${a(rgb, 0.2)}` +
  ', inset 2px 3px 7px rgba(255,255,255,0.96)' +
  `, 0 0 0 1px ${ICON_ORB_EDGE}` +
  `, 0 6px 14px -8px ${a(rgb, 0.42)}`;
