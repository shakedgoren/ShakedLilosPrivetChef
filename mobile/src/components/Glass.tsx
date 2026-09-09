import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

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
  return (
    <Svg width="100%" height="100%" style={[StyleSheet.absoluteFill, { borderRadius: radius }]} pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0.5" y2="0.866">
          {stops.map((c, i) => (
            <Stop key={c + i} offset={i * step} stopColor={c} />
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
