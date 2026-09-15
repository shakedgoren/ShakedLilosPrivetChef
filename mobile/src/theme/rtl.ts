import Constants, { ExecutionEnvironment } from 'expo-constants';
import { I18nManager, Platform } from 'react-native';
import * as Updates from 'expo-updates';

/**
 * האפליקציה בעברית · RTL נדלק פעם אחת בעליית התהליך.
 *
 * ⚠ ב-React Native Web `forceRTL` לבדו אינו מספיק: הוא מעדכן את
 * `I18nManager.isRTL` אבל אינו נוגע בכיוון המסמך, וכל המסכים יצאו
 * LTR בדפדפן בעוד שבקנבס הם RTL. סימון `<html dir="rtl">` הוא מה
 * שמזיז את הכיוון בפועל.
 *
 * ⚠ **במכשיר `forceRTL` נכנס לתוקף רק בהפעלה הבאה** · הוא כותב
 * העדפה בצד הילידי, והפריסה נקבעת כשהגשר עולה. נמדד בסימולטור
 * אייפון 17 Pro (15 בספטמבר 2026): `I18nManager.isRTL` היה
 * **false**, ולכן חץ החזרה הופיע בשמאל במקום בימין וכל שורה
 * יצאה הפוכה. `reloadOnce()` למטה סוגר את הפער.
 */

/**
 * האפליקציה בעברית בלבד · הכיוון תמיד RTL.
 *
 * ⚠ אסור להסתמך על `I18nManager.isRTL` · בדפדפן הוא נשאר false גם
 * אחרי `forceRTL(true)`, ובגללו רצועת התמונות בדף הבית נגררה אל
 * מחוץ למסך. הקבוע הזה הוא המקור היחיד לכיוון.
 */
export const IS_RTL = true;

/** רצה ב-Expo Go · שם `forceRTL` לעולם אינו נתפס */
const IN_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * טעינה מחדש אחת · רק כשההעדפה נכתבה ועדיין לא הוחלה.
 *
 * ⚠ **אין כאן לולאה** · אחרי הטעינה `isRTL` כבר true, התנאי לא
 * מתקיים שוב, והאפליקציה עולה רגיל. ב-Expo Go ההעדפה לעולם אינה
 * נתפסת ולכן הטעינה מדולגת לגמרי — שם הכיוון יישאר LTR, וזו
 * מגבלה של Expo Go ולא של האפליקציה.
 */
function reloadOnce(): void {
  if (Platform.OS === 'web' || IN_EXPO_GO) return;
  if (I18nManager.isRTL === IS_RTL) return;
  void Updates.reloadAsync().catch(() => undefined);
}

export function enableRTL(): void {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'he';
    return;
  }

  reloadOnce();
}
