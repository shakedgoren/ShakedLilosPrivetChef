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
 * ⚠ **הרוחב נמדד · תוקן ב-16 בספטמבר 2026** · כאן ישב
 * `width: 'calc(...)'` בדיוק כמו בקנבס. זה עובד ב-`react-native-web`,
 * שמעביר מחרוזת רוחב כמו שהיא ל-CSS — אבל **מנוע הפריסה של
 * ריאקט־נייטיב אינו מכיר `calc`**, ובמכשיר הרוחב נזרק לגמרי וכל
 * כרטיס הצטמצם לרוחב התוכן שבתוכו.
 *
 * ⚠ בהערה הקודמת כאן היה כתוב שגרסה מודדת נזנחה בגלל הבהוב של
 * פריים אחד, ״נמדד בדפדפן״ — **וזו בדיוק הבעיה**: הדפדפן הוא המקום
 * היחיד שבו ה-`calc` עבד, ולכן המדידה נעשתה במקום שלא יכול היה
 * להראות את התקלה. ההבהוב נפתר כאן באחוזים כערך ביניים, עד
 * שהמדידה מגיעה.
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

/** רוחב מסך טיפוסי · רק כדי לאמוד את המרווחים בפריים הראשון */
const GUESS_W = 360;

export function OptionGrid({ cols, gap = 8, maxWidth, style, pointerEvents, children }: Props) {
  const kids = React.Children.toArray(children);
  const [w, setW] = React.useState(0);

  /**
   * ערך ביניים לפריים הראשון · אחוזים, שמנוע הפריסה כן מכיר.
   * אחרי ה-`onLayout` הרוחב נגזר מהמדידה והוא מדויק לפיקסל.
   */
  const fallback = `${100 / cols - (gap * (cols - 1)) / (GUESS_W / 100) / cols}%`;
  const basis: number | string = w > 0 ? (w - gap * (cols - 1)) / cols : fallback;

  return (
    <View
      /* ⚠ `pointerEvents` בסגנון ולא כ-prop · ה-prop הוצא משימוש
         ומדפיס אזהרה בכל רינדור. 16 בספטמבר 2026. */
      style={[s.wrap, { gap }, maxWidth != null && { maxWidth }, style, { pointerEvents }]}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
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
