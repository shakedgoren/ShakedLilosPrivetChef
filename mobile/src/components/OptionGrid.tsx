import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

/**
 * רשת אפשרויות ברוחב אחיד · הנמל של `--opt-basis` מהקנבס.
 *
 * בקנבס כל רשת אפשרויות היא `flex-wrap` שבו לכל ילד
 * `flex: 0 0 calc((100% - (cols-1) * gap) / cols)` — כלומר **כל
 * הכרטיסים באותה קטגוריה יוצאים באותו רוחב בדיוק**, בלי קשר לאורך
 * הטקסט שבתוכם.
 *
 * ⚠ הרוחב הוא `calc` ולא מדידה · `react-native-web` מעביר מחרוזת
 * רוחב כמו שהיא ל-CSS, ולכן הנוסחה של הקנבס עובדת כאן מילה במילה.
 * גרסה קודמת מדדה את הרוחב ב-`onLayout` וחילקה בעצמה, וזה עלה
 * בהבהוב של פריים אחד שבו הכרטיסים עוד ברוחב התוכן. נמדד בדפדפן.
 */
type Props = {
  /** מספר העמודות · מגיע מנתוני הקנבס (`cols`, או ברירת מחדל לפי הסוג) */
  cols: number;
  /** המרווח בין כרטיסים · 8 ברוב הרשתות, 10 בכרטיסי התמונה */
  gap?: number;
  /** הצרת הרשת · `narrow` בקנבס הוא 272, ו-`maxw` נותן ערך מפורש */
  maxWidth?: number;
  style?: ViewStyle;
  /** נעילת הסעיף · עובר כמו שהוא ל-View העוטף */
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
  children: React.ReactNode;
};

export function OptionGrid({ cols, gap = 8, maxWidth, style, pointerEvents, children }: Props) {
  const kids = React.Children.toArray(children);
  /* בדיוק הנוסחה של `--opt-basis` בקנבס */
  const basis = `calc((100% - ${(cols - 1) * gap}px) / ${cols})`;

  return (
    <View
      /* ⚠ `pointerEvents` בסגנון ולא כ-prop · ה-prop הוצא משימוש
         ומדפיס אזהרה בכל רינדור. 16 בספטמבר 2026. */
      style={[s.wrap, { gap }, maxWidth != null && { maxWidth }, style, { pointerEvents }]}
    >
      {kids.map((kid, i) => (
        /* העטיפה מחזיקה את הרוחב · הילד נמתח אליה, כך שגם כרטיס עם
           שורת טקסט אחת יוצא ברוחב ובגובה של השכן */
        <View key={i} style={{ width: basis as unknown as number }}>
          {kid}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'flex-start',
  },
});
