import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { stopOf } from '../theme/tokens';
import { NO_TOUCH } from '../theme/pointerEvents';

/**
 * מילוי הזכוכית · הגרדיאנט הלבן שמתחת לכל משטח.
 *
 * בקנבס זה `linear-gradient(150deg, …)`. ב-React Native אין גרדיאנטים
 * ב-CSS בכל הפלטפורמות, ולכן הוא מצויר ב-SVG שיושב מתחת לתוכן.
 * 150 מעלות ב-CSS הן הווקטור (sin150, ‎-cos150) = (0.5, 0.866) —
 * ימינה ולמטה — וזה בדיוק x2/y2 כאן.
 */
type FillProps = { stops: readonly string[]; radius: number };

/** אותיות ייחודיות למזהה הגרדיאנט · שני מופעים באותו מסך לא יתנגשו */
let seq = 0;
const nextId = () => `glass${(seq += 1)}`;

export function GlassFill({ stops, radius }: FillProps) {
  const id = React.useMemo(nextId, []);
  const step = stops.length > 1 ? 1 / (stops.length - 1) : 1;
  /**
   * ⚠ **`width`/`height` בסגנון · חובה. תוקן ב-24 בספטמבר 2026** ·
   * שקד דיווחה ששורת יום המכירה ״לא כולה צבועה בלבן כמו שהיה
   * קודם״.
   *
   * **הסיבה** · `<svg>` הוא אלמנט **מוחלף** (replaced), כמו
   * `<img>`. ל-`position:absolute; inset:0` לבדו אין שום כוח
   * עליו: כשהרוחב הוא `auto`, אלמנט מוחלף לוקח את **המידה
   * הפנימית** שלו — ול-SVG בלי `width`/`height`/`viewBox` זו
   * 300×150 קבועה. אז המשוואה של ההיסטים יוצאת מוגזמת, ו-CSS
   * פותר אותה בהתעלמות מהקצה ה**מתחיל**. האפליקציה ב-RTL,
   * ולכן ה-SVG נצמד לימין ומשאיר פער משמאל.
   *
   * **נמדד** · שורה של 384×56 קיבלה זכוכית של 300×150, כלומר
   * **83 פיקסלים לא צבועים משמאל**. עם `width`/`height` של 100%:
   * 382×54, כלומר הכל חוץ מהמסגרת.
   *
   * ⚠ **זה גם מה שתוקן ב-17 בספטמבר, ובדרך הלא נכונה** · אז
   * הוסר `width="100%"` כדי לפתור פער של 24 נקודות מהריפוד.
   * ההסרה פתרה סימפטום ויצרה פער גדול יותר. אחוזים על אלמנט
   * **ממוקם מוחלט** נמדדים מול **תיבת הריפוד** של ההורה, ולא
   * מול תיבת התוכן — נבדק עם `paddingHorizontal: 12` בדיוק כמו
   * בשורה, והכיסוי מלא.
   */
  return (
    <Svg
      style={[
        StyleSheet.absoluteFill,
        { width: '100%', height: '100%', borderRadius: radius },
        NO_TOUCH,
      ]}
    >
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0.5" y2="0.866">
          {stops.map((c, i) => (
            <Stop key={c + i} offset={i * step} {...stopOf(c)} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" rx={radius} fill={`url(#${id})`} />
    </Svg>
  );
}

/**
 * לוח זכוכית שלם · מילוי, מסגרת וערימת הצללים ביחד.
 * `boxShadow` מקבל את המחרוזת מהקנבס כמו שהיא.
 */
type PanelProps = {
  stops: readonly string[];
  edge: string;
  shadow: string;
  radius: number;
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
};

export function GlassPanel({ stops, edge, shadow, radius, style, children }: PanelProps) {
  return (
    <View
      style={[
        { borderRadius: radius, borderWidth: 1, borderColor: edge, boxShadow: shadow, overflow: 'hidden' },
        style,
      ]}
    >
      <GlassFill stops={stops} radius={radius} />
      {children}
    </View>
  );
}
