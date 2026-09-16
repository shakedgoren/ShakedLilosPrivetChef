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

/**
 * הכפתור הראשי · עיצוב ״זכוכית״, אופציה 03 מתוך חמש.
 *
 * ⚠ **נבחר על ידי שקד ב-16 בספטמבר 2026** · אחרי שדיווחה פעמיים על
 * ״זוהר שחור״ מעל הכפתור. מה שנראה ככתם היה **שכבת ההילה**: גרדיאנט
 * רדיאלי סגול בשקיפות 0.82 שנמרח על 42 פיקסלים לכל כיוון. בדפדפן זה
 * נראה כזוהר, ועל הרקע הכמעט־לבן של המכשיר זה נקרא כלכלוך אפרפר.
 * **ההילה הוסרה לגמרי.**
 *
 * שקד ביקשה גם פינות פחות מעוגלות (14 במקום גלולה), רוחב צר יותר,
 * ושהמילוי בזמן הגרירה יהיה בלילך של אופציה 01.
 */

/** גוף הכפתור · זכוכית קרה, אותה שפה של האריחים והבועות */
export const CTA_GLASS_STOPS = ['rgba(255,255,255,0.85)', 'rgba(236,230,248,0.7)'] as const;
export const CTA_SHADOW =
  'inset 0 0 0 1px rgba(255,255,255,0.9)' + ', inset 0 1.5px 0 rgba(255,255,255,1)';
/** הצל החיצוני · על שכבה שאינה חותכת. ראו את ההערה למטה. */
export const CTA_DROP = '0 10px 20px -16px rgba(96,80,132,0.6)';
/** פינת הכפתור · לא גלולה */
export const CTA_RADIUS = 14;

/**
 * המילוי שנחשף בזמן הגרירה · הלילך של אופציה 01, בקשה מפורשת של שקד.
 */
export const CTA_FILL_STOPS = ['#CCBAF0', '#BCA7E6', '#C6B3EB'] as const;

/** גוון הכיתוב על הזכוכית */
export const CTA_INK = '#5B4794';

/** הידית הלבנה שמחזיקה את החץ · ריבוע מעוגל, לא עיגול */
export const CTA_KNOB_SHADOW = '0 2px 7px rgba(90,70,140,0.28)';
export const CTA_KNOB_RADIUS = 11;

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

/* ⚠ קבועי ההילה של הכפתור (`CTA_GLOW_*`) הוסרו ב-16 בספטמבר 2026 ·
   ההילה עצמה היא שנראתה לשקד כ״זוהר שחור״ מעל הכפתור, וכשהיא ירדה
   לא נשאר להם צרכן. */

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
