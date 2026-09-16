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
 * ⚠ **ימין ושמאל נשארים פיזיים** · זו הנקודה שהכריעה.
 *
 * נמדד בבילד ילידי על אייפון 17 Pro (16 בספטמבר 2026), עם בדיקה
 * שהודפסה על המסך: `isRTL=true swap=true`. כלומר ריאקט־נייטיב
 * הופך מיוזמתו גם `left` ו-`right` — וכל מה שמוקם פיזית בקוד
 * יצא הפוך במכשיר לעומת הדפדפן. ידית החץ ב-`right: 4` הופיעה
 * בשמאל, וכפתור ההתנתקות ב-`left: 18` היה קופץ לימין.
 *
 * הדפדפן לא מחליף מאפיינים פיזיים — ב-CSS `dir="rtl"` מהפך רק
 * את סדר השורות. כיבוי ההחלפה כאן הוא מה שמשווה בין השניים.
 */
function alignWithBrowser(): void {
  I18nManager.swapLeftAndRightInRTL(false);
}

/**
 * ⚠ **התנאי נשען רק על `isRTL`** · ובכוונה.
 *
 * נמדד (16 בספטמבר 2026) ש-`doLeftAndRightSwapInRTL` ממשיך לדווח
 * `true` ב-JS גם אחרי שההעדפה כובתה ו**הפריסה כבר מכבדת אותה** —
 * הקבוע נלקח מ-`getConstants()` פעם אחת ואינו מתרענן. אילו התניתי
 * עליו את הטעינה מחדש, הוא לעולם לא היה מסתפק, והאפליקציה הייתה
 * נכנסת ללולאת טעינה אינסופית בכל עלייה.
 */
/**
 * טעינה מחדש אחת · רק כשההעדפה נכתבה ועדיין לא הוחלה.
 *
 * ⚠ **אין כאן לולאה** · אחרי הטעינה שני הדגלים כבר במקומם, התנאי
 * לא מתקיים שוב, והאפליקציה עולה רגיל. ב-Expo Go ההעדפה לעולם
 * אינה נתפסת ולכן הטעינה מדולגת לגמרי — שם הכיוון יישאר LTR, וזו
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

  alignWithBrowser();
  reloadOnce();
}
