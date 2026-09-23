import { StyleSheet, type ViewStyle } from 'react-native';

/**
 * `pointerEvents` כסגנון ולא כ-prop.
 *
 * ⚠ **ריאקט־נייטיב הוציא את ה-prop משימוש** · `props.pointerEvents`
 * מדפיס אזהרה בכל רינדור, וזו אחת האזהרות שהצטברו לבאנר השחור
 * שנראה מעל כפתור הכניסה בבילד הפיתוח. 16 בספטמבר 2026.
 *
 * ⚠ **`box-none` חייב לעבור ב-`StyleSheet.create`** · זה לא ערך CSS.
 * ריאקט־נייטיב־ווב ממיר אותו ל-`pointer-events: none` על השכבה
 * ו-`auto` על הילדים **רק** כשהסגנון נרשם. אובייקט רגיל נכתב כמו
 * שהוא (`pointer-events: box-none`), הדפדפן מתעלם ממנו, והשכבה
 * נשארת `auto` ובולעת כל מגע. זה מה שקפא את דף הבית אחרי התחברות:
 * שכבת כפתור ההתנתקות פרושה על כל המסך.
 */
export const NO_TOUCH: ViewStyle = { pointerEvents: 'none' };

const pass = StyleSheet.create({
  touch: { pointerEvents: 'box-none' },
});

export const PASS_TOUCH: ViewStyle = pass.touch;
