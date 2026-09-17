import React from 'react';
import { StyleSheet, Text as RNText, TextInput as RNTextInput } from 'react-native';
import { fontFor } from '../theme/fonts';
import { INPUT_START, IS_RTL, TEXT_START } from '../theme/rtl';
import { FONT_BUMP } from '../theme/fontScale';

/**
 * ה-Text וה-TextInput של האפליקציה · כל מסך מייבא מכאן ולא
 * מ-`react-native`.
 *
 * באפליקציה מאות רכיבי טקסט, וכל אחד מגדיר `fontWeight` משלו. במקום
 * להוסיף `fontFamily` בכל אחד — ולשכוח באחד — הוא נגזר כאן מהמשקל
 * שבסגנון. הסגנון המקורי נשאר **אחרון** במערך, ולכן כל סגנון שמגדיר
 * בעצמו `fontFamily` או `textAlign` (הכותרת ב-Anton, פסקה ממורכזת)
 * עדיין גובר.
 *
 * ⚠ **למה רכיב ולא דריסה גלובלית · 16 בספטמבר 2026** · עד היום זה
 * נעשה ב-`applyFonts` שדרס את `Text.render`. זה עובד ב-
 * `react-native-web`, שבו `Text` הוא `React.forwardRef` ויש לו
 * `render` — אבל **בריאקט־נייטיב 0.86 `Text` הוא רכיב פונקציה רגיל
 * בלי `render` כלל**, והדריסה דילגה עליו **בשקט**.
 *
 * כלומר במכשיר לא הוחל הגופן, לא הוחל `writingDirection` ולא הוחל
 * היישור — וכל טקסט באפליקציה נפל ליישור הטבעי, כלומר **שמאלה**.
 * בדפדפן הכל עבד, ולכן זה לא נראה באף בדיקה שנעשתה שם. זה המקור
 * היחיד לשלושת הדיווחים של שקד על ״הכיתוב צמוד לשמאל״ — בקוסקוס,
 * בשישניצל ובספיישל.
 *
 * ⚠ ניסיתי לפני זה גם לעטוף את ה-getter של `Text` על אובייקט המודול
 * של ריאקט־נייטיב. **נמדד בסימולטור: לא תפס.** רכיב מפורש הוא הדבר
 * היחיד שעובד בשתי הפלטפורמות, ואין בו קסם.
 *
 * ⚠ `Animated.Text` אינו עובר כאן · שני המקומות שמשתמשים בו
 * (`PrimaryButton`, `OrderTracker`) מגדירים סגנון מלא בעצמם.
 *
 * ⚠ **`TextInput` מקבל יישור הפוך** · ההחלפה של ריאקט־נייטיב חלה על
 * `Text` בלבד. ראו את ההערה המלאה ב-`INPUT_START` שב-`theme/rtl.ts`,
 * עם המדידה שהוכיחה את זה.
 *
 * ⚠ **הגדלת הכתב הגלובלית יושבת כאן** · ראו `FONT_BUMP`. זו הנקודה
 * היחידה באפליקציה שבה אפשר להזיז את **כל** הטקסטים יחד, בדיוק
 * מהסיבה שמתוארת למעלה: כל מסך מייבא את ה-`Text` הזה.
 */

type TextProps = React.ComponentProps<typeof RNText>;
type TextInputProps = React.ComponentProps<typeof RNTextInput>;
type Flat = { fontWeight?: string; fontSize?: number; lineHeight?: number } | undefined;

function baseFor(flat: Flat, align: 'left' | 'right') {
  return {
    fontFamily: fontFor(flat?.fontWeight),
    writingDirection: IS_RTL ? ('rtl' as const) : ('ltr' as const),
    textAlign: align,
  };
}

/**
 * ההגדלה הגלובלית · ראו `FONT_BUMP`.
 *
 * ⚠ **אחרי הסגנון המקורי ולא לפניו** · אחרת כל `fontSize` שכתוב
 * במסך היה דורס אותה מיד.
 *
 * ⚠ **`lineHeight` גדל באותו יחס** · כותרת עם `lineHeight` צמוד
 * (למשל 13 על 15.6) הייתה חותכת את הכתב אם רק הגופן היה גדל.
 *
 * ⚠ **טקסט בלי `fontSize` מפורש אינו נוגע** · הוא יורש את הגודל
 * מה-`Text` שמעליו, שכבר גדל.
 */
function bumpFor(flat: Flat) {
  if (FONT_BUMP === 0) return null;
  const size = flat?.fontSize;
  if (typeof size !== 'number' || size <= 0) return null;
  const next = size + FONT_BUMP;
  const line = flat?.lineHeight;
  return typeof line === 'number'
    ? { fontSize: next, lineHeight: (line / size) * next }
    : { fontSize: next };
}

export const Text = React.forwardRef<React.ComponentRef<typeof RNText>, TextProps>(
  ({ style, ...rest }, ref) => {
    /* ⚠ שיטוח אחד לשניהם · הוא לא זול, והוא רץ על כל טקסט באפליקציה */
    const flat = StyleSheet.flatten(style as never) as Flat;
    return (
      <RNText ref={ref} {...rest} style={[baseFor(flat, TEXT_START), style, bumpFor(flat)]} />
    );
  },
);
Text.displayName = 'Text';

export const TextInput = React.forwardRef<React.ComponentRef<typeof RNTextInput>, TextInputProps>(
  ({ style, ...rest }, ref) => {
    const flat = StyleSheet.flatten(style as never) as Flat;
    return (
      <RNTextInput ref={ref} {...rest} style={[baseFor(flat, INPUT_START), style, bumpFor(flat)]} />
    );
  },
);
TextInput.displayName = 'TextInput';
