/**
 * שמות המשפחות והמיפוי ממשקל · בלי קבצי גופן.
 * הקבצים נטענים ב-fonts.ts (מכשיר) וב-webFonts.css (דפדפן).
 */

/** המשקלים שהקנבס משתמש בהם · 200 עד 700 */
const BY_WEIGHT: Record<string, string> = {
  '100': 'Assistant_200ExtraLight',
  '200': 'Assistant_200ExtraLight',
  '300': 'Assistant_300Light',
  '400': 'Assistant_400Regular',
  '500': 'Assistant_500Medium',
  '600': 'Assistant_600SemiBold',
  '700': 'Assistant_700Bold',
  '800': 'Assistant_700Bold',
  '900': 'Assistant_700Bold',
  normal: 'Assistant_400Regular',
  bold: 'Assistant_700Bold',
};

export const DEFAULT_FAMILY = 'Assistant_400Regular';
export const DISPLAY_FAMILY = 'Anton_400Regular';

/** הכותרת · ״חתימה״. ⚠ Anton עדיין משמש את הסמל במסך ההתחברות */
export const SIGNATURE_FAMILY = 'GreatVibes_400Regular';

/** משפחת הגופן למשקל נתון · ברירת המחדל היא Regular */
export const fontFor = (weight?: string | number): string =>
  BY_WEIGHT[String(weight ?? '400')] ?? DEFAULT_FAMILY;
