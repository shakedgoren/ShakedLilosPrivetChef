import { Assistant_200ExtraLight } from '@expo-google-fonts/assistant/200ExtraLight';
import { Assistant_300Light } from '@expo-google-fonts/assistant/300Light';
import { Assistant_400Regular } from '@expo-google-fonts/assistant/400Regular';
import { Assistant_500Medium } from '@expo-google-fonts/assistant/500Medium';
import { Assistant_600SemiBold } from '@expo-google-fonts/assistant/600SemiBold';
import { Assistant_700Bold } from '@expo-google-fonts/assistant/700Bold';
import { Anton_400Regular } from '@expo-google-fonts/anton/400Regular';
/**
 * ⚠ **הגופן של הכותרת · 16 בספטמבר 2026** · שקד בחרה את ״חתימה״
 * מתוך עשר תצוגות. שתי המועמדות האחרות (Cormorant Garamond
 * ו-Yeseva One) הוסרו יחד עם החבילות שלהן.
 */
import { GreatVibes_400Regular } from '@expo-google-fonts/great-vibes/400Regular';

/**
 * הגופנים של הקנבס · Assistant לכל הטקסט ו-Anton לכותרת המותג.
 *
 * ב-React Native כל משקל הוא משפחה נפרדת · fontWeight לבדו לא בוחר
 * את הקובץ הנכון, ולכן כל משקל ממופה כאן לשם המשפחה שלו.
 *
 * ⚠ הייבוא הוא מהתיקייה של המשקל ולא מאינדקס החבילה · האינדקס
 * מושך גם את משקל 800, שהאפליקציה לא משתמשת בו.
 */
export const FONTS = {
  Assistant_200ExtraLight,
  Assistant_300Light,
  Assistant_400Regular,
  Assistant_500Medium,
  Assistant_600SemiBold,
  Assistant_700Bold,
  Anton_400Regular,
  GreatVibes_400Regular,
} as const;

export { DEFAULT_FAMILY, DISPLAY_FAMILY, SIGNATURE_FAMILY, fontFor } from './fontFamilies';
