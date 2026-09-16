import React from 'react';
import { StyleSheet, Text as RNText, TextInput as RNTextInput } from 'react-native';
import { fontFor } from '../theme/fonts';
import { IS_RTL, TEXT_START } from '../theme/rtl';

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
 */

type TextProps = React.ComponentProps<typeof RNText>;
type TextInputProps = React.ComponentProps<typeof RNTextInput>;

function baseFor(style: unknown) {
  const flat = StyleSheet.flatten(style as never) as { fontWeight?: string } | undefined;
  return {
    fontFamily: fontFor(flat?.fontWeight),
    writingDirection: IS_RTL ? ('rtl' as const) : ('ltr' as const),
    textAlign: TEXT_START,
  };
}

export const Text = React.forwardRef<React.ComponentRef<typeof RNText>, TextProps>(
  ({ style, ...rest }, ref) => <RNText ref={ref} {...rest} style={[baseFor(style), style]} />,
);
Text.displayName = 'Text';

export const TextInput = React.forwardRef<React.ComponentRef<typeof RNTextInput>, TextInputProps>(
  ({ style, ...rest }, ref) => <RNTextInput ref={ref} {...rest} style={[baseFor(style), style]} />,
);
TextInput.displayName = 'TextInput';
