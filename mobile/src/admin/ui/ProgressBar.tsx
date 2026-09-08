import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

const TRACK = 'rgba(130,112,162,0.1)';
const GRADIENT_FROM = '#B9A4E4';

type Props = {
  /** 0..1 · חלק המסלול שמתמלא */
  fill: number;
  /** צבע אחיד למצב חריג · בלעדיו מצויר מדרג מ-#B9A4E4 אל הגוון */
  color?: string | null;
  hue: string;
  height?: number;
};

/**
 * פס התקדמות · במצב רגיל מדרג כמו בקנבס, ובמצב אזל/כמעט אזל צבע אחיד.
 * המדרג מצויר ב-SVG כי ל-React Native אין linear-gradient בסגנון.
 */
export function ProgressBar({ fill, color, hue, height = 7 }: Props) {
  const pct = Math.max(0, Math.min(1, fill));
  const id = `bar-${hue.replace('#', '')}`;

  return (
    <View style={[s.track, { height, borderRadius: height / 2 }]}>
      <View style={[s.fill, { width: `${pct * 100}%` }]}>
        {color ? (
          <View style={[s.solid, { backgroundColor: color }]} />
        ) : (
          <Svg width="100%" height={height}>
            <Defs>
              <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%" stopColor={GRADIENT_FROM} />
                <Stop offset="100%" stopColor={hue} />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width="100%" height={height} fill={`url(#${id})`} />
          </Svg>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  track: { backgroundColor: TRACK, overflow: 'hidden' },
  fill: { height: '100%' },
  solid: { flex: 1 },
});
