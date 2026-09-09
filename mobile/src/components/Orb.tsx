import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { a } from '../theme/tokens';
import { HALO_BLUR, HALO_INSET } from '../theme/glass';

/**
 * הבועה הצבעונית · שורת הקטגוריות בדף הבית והכרטיס בקרוסלה.
 *
 * ארבע שכבות, בדיוק כמו בקנבס:
 * הילה מטושטשת מסביב · גוף הבועה עם שני גרדיאנטים רדיאליים ·
 * נקודת אור קטנה למעלה־שמאל · והאייקון במרכז.
 */
type Props = {
  /** שלישיית ה-rgb של גוון הקטגוריה */
  rgb: string;
  size: number;
  /** ערימת הצללים · מגיעה מ-orbShadow או cardOrbShadow */
  shadow: string;
  /** עוצמת הצבע בגוף הבועה · הפעילה כהה יותר */
  tint: number;
  /** עוצמת ההילה · 0 מכבה אותה */
  halo: number;
  children?: React.ReactNode;
};

let seq = 0;
const nextId = () => `orb${(seq += 1)}`;

export function Orb({ rgb, size, shadow, tint, halo, children }: Props) {
  const id = React.useMemo(nextId, []);
  const r = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      {halo > 0 && (
        <View
          pointerEvents="none"
          style={[
            styles.halo,
            { inset: HALO_INSET, borderRadius: r - HALO_INSET, filter: `blur(${HALO_BLUR}px)` },
          ]}
        >
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id={`${id}h`} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={a(rgb, halo)} />
                <Stop offset="0.54" stopColor={a(rgb, halo * 0.33)} />
                <Stop offset="0.8" stopColor={a(rgb, 0)} />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id}h)`} />
          </Svg>
        </View>
      )}

      <View style={[styles.body, { borderRadius: r, boxShadow: shadow }]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            {/* גוף הבועה · לבן בפינה העליונה־שמאלית, מתעבה לגוון בקצה */}
            <RadialGradient id={`${id}b`} cx="34%" cy="28%" r="78%">
              <Stop offset="0" stopColor="#FFFFFF" />
              <Stop offset="0.4" stopColor={a(rgb, tint * 0.27)} />
              <Stop offset="1" stopColor={a(rgb, tint)} />
            </RadialGradient>
            {/* הברק העליון · דועך במהירות */}
            <RadialGradient id={`${id}s`} cx="30%" cy="22%" r="30%">
              <Stop offset="0" stopColor="rgba(255,255,255,0.96)" />
              <Stop offset="1" stopColor="rgba(255,255,255,0)" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" rx={r} fill={`url(#${id}b)`} />
          <Rect x="0" y="0" width="100%" height="100%" rx={r} fill={`url(#${id}s)`} />
        </Svg>
      </View>

      {/* נקודת האור · אליפסה קטנה ומטושטשת, המידות מהקנבס באחוזים */}
      <View
        pointerEvents="none"
        style={[
          styles.spark,
          {
            left: size * 0.26,
            top: size * 0.16,
            width: size * 0.23,
            height: size * 0.17,
            borderRadius: size * 0.12,
            filter: 'blur(2.5px)',
          },
        ]}
      />

      <View style={styles.center} pointerEvents="none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  halo: { position: 'absolute' },
  body: { position: 'absolute', inset: 0, overflow: 'hidden' },
  spark: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.92)' },
  center: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
});
