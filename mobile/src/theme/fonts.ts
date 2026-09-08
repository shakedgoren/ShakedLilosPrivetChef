import {
  Assistant_200ExtraLight,
  Assistant_300Light,
  Assistant_400Regular,
  Assistant_500Medium,
  Assistant_600SemiBold,
  Assistant_700Bold,
} from '@expo-google-fonts/assistant';
import { Anton_400Regular } from '@expo-google-fonts/anton';

/**
 * הגופנים של הקנבס · Assistant לכל הטקסט ו-Anton לכותרת המותג.
 *
 * ב-React Native כל משקל הוא משפחה נפרדת · fontWeight לבדו לא בוחר
 * את הקובץ הנכון, ולכן כל משקל ממופה כאן לשם המשפחה שלו.
 */
export const FONTS = {
  Assistant_200ExtraLight,
  Assistant_300Light,
  Assistant_400Regular,
  Assistant_500Medium,
  Assistant_600SemiBold,
  Assistant_700Bold,
  Anton_400Regular,
} as const;

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

/** משפחת הגופן למשקל נתון · ברירת המחדל היא Regular */
export const fontFor = (weight?: string | number): string =>
  BY_WEIGHT[String(weight ?? '400')] ?? DEFAULT_FAMILY;
