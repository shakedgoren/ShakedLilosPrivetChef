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
import { a } from './tokens';

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
export const CTA_SHADOW =
  'inset 0 1.5px 0 rgba(255,255,255,0.6)' +
  ', inset 0 -2.5px 5px rgba(118,92,174,0.28)' +
  ', 0 10px 20px -12px rgba(118,92,174,0.65)';

/** העיגול הלבן שבתוך הכפתור · מחזיק את החץ */
export const CTA_KNOB_SHADOW =
  'inset 0 1.5px 0 #FFFFFF, 0 4px 9px -4px rgba(90,70,140,0.55)';

/** כרטיס הקטגוריה בקרוסלה · הפעיל זוהר, הרדומים כמעט שטוחים */
export const cardShadow = (rgb: string, active: boolean): string =>
  active
    ? 'inset 0 2.5px 0 rgba(255,255,255,0.98)' +
      `, inset 0 -2.5px 3px ${a(rgb, 0.22)}` +
      ', inset 3px 0 3px rgba(255,255,255,0.6)' +
      `, inset -3px 0 4px ${a(rgb, 0.12)}` +
      ', 0 0 0 1px rgba(255,255,255,0.45)' +
      `, 0 0 40px -6px ${a(rgb, 0.3)}` +
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
export const CTA_GLOW_SPREAD = 18;
export const CTA_GLOW_BLUR = 12;
