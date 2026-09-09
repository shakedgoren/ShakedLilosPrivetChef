import { I18nManager, Platform } from 'react-native';

/**
 * האפליקציה בעברית · RTL נדלק פעם אחת בעליית התהליך.
 *
 * ⚠ ב-React Native Web `forceRTL` לבדו אינו מספיק: הוא מעדכן את
 * `I18nManager.isRTL` אבל אינו נוגע בכיוון המסמך, וכל המסכים יצאו
 * LTR בדפדפן בעוד שבקנבס הם RTL. סימון `<html dir="rtl">` הוא מה
 * שמזיז את הכיוון בפועל.
 *
 * במכשיר `forceRTL` נכנס לתוקף רק אחרי הפעלה מחדש של האפליקציה.
 */

/**
 * האפליקציה בעברית בלבד · הכיוון תמיד RTL.
 *
 * ⚠ אסור להסתמך על `I18nManager.isRTL` · בדפדפן הוא נשאר false גם
 * אחרי `forceRTL(true)`, ובגללו רצועת התמונות בדף הבית נגררה אל
 * מחוץ למסך. הקבוע הזה הוא המקור היחיד לכיוון.
 */
export const IS_RTL = true;

export function enableRTL(): void {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'he';
  }
}
