import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { a, stopOf } from '../theme/tokens';
import { HALO_BLUR, HALO_INSET } from '../theme/glass';
import { NO_TOUCH } from '../theme/pointerEvents';

/**
 * הבועה הצבעונית · שורת הקטגוריות בדף הבית והכרטיס בקרוסלה.
 *
 * ארבע שכבות, בדיוק כמו בקנבס:
 * הילה מטושטשת מסביב · גוף הבועה עם שני גרדיאנטים רדיאליים ·
 * נקודת אור קטנה למעלה־שמאל · והאייקון במרכז.
 *
 * ⚠ `spark` מכבה את **שלוש** שכבות האור: האליפסה שמעל הבועה,
 * גרדיאנט הברק, והעוצר הלבן שבמרכז גרדיאנט הגוף. שקד ביקשה
 * להסיר את הנקודה משורת הקטגוריות בלבד, ורק נטרול שלושתן
 * מסיר אותה. בקנבס כולן קיימות — `Guest.dc.html` שורות 160, 181
 * ומתכון ה-`orb` בשורה 681.
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
  /** נקודת האור הקטנה למעלה־שמאל · ברירת המחדל היא כמו בקנבס */
  spark?: boolean;
  children?: React.ReactNode;
};

let seq = 0;
const nextId = () => `orb${(seq += 1)}`;

export function Orb({ rgb, size, shadow, tint, halo, spark = true, children }: Props) {
  const id = React.useMemo(nextId, []);
  const r = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      {halo > 0 && (
        <View
          style={[
            styles.halo,
            { inset: HALO_INSET, borderRadius: r - HALO_INSET, filter: `blur(${HALO_BLUR}px)` },
          , NO_TOUCH]}
        >
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id={`${id}h`} cx="50%" cy="50%" r="50%">
                <Stop offset="0" {...stopOf(a(rgb, halo))} />
                <Stop offset="0.54" {...stopOf(a(rgb, halo * 0.33))} />
                <Stop offset="0.8" {...stopOf(a(rgb, 0))} />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id}h)`} />
          </Svg>
        </View>
      )}

      <View style={[styles.body, { borderRadius: r, boxShadow: shadow }]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            {/* גוף הבועה · לבן בפינה העליונה־שמאלית, מתעבה לגוון בקצה.
                ⚠ העוצר הלבן הזה הוא שלישית מקורות האור על הבועה, והוא
                זה שנראה על המסך כ״נקודה״ — מדוד בדפדפן ב-14 בספטמבר:
                נטרול הצל הלבן הפנימי לא הסיר אותה, נטרול העוצר הזה כן. */}
            <RadialGradient id={`${id}b`} cx="34%" cy="28%" r="78%">
              <Stop offset="0" {...stopOf(spark ? '#FFFFFF' : 'rgba(255,255,255,0)')} />
              <Stop offset="0.4" {...stopOf(a(rgb, tint * 0.27))} />
              <Stop offset="1" {...stopOf(a(rgb, tint))} />
            </RadialGradient>
            {/* הברק העליון · דועך במהירות · זו ״הנקודה״ שנראית על הבועה */}
            {spark && (
              <RadialGradient id={`${id}s`} cx="30%" cy="22%" r="30%">
                <Stop offset="0" {...stopOf('rgba(255,255,255,0.96)')} />
                <Stop offset="1" {...stopOf('rgba(255,255,255,0)')} />
              </RadialGradient>
            )}
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" rx={r} fill={`url(#${id}b)`} />
          {spark && <Rect x="0" y="0" width="100%" height="100%" rx={r} fill={`url(#${id}s)`} />}
        </Svg>
      </View>

      {/* נקודת האור · אליפסה קטנה ומטושטשת, המידות מהקנבס באחוזים */}
      {spark && (
        <View
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
          , NO_TOUCH]}
        />
      )}

      <View style={[styles.center, NO_TOUCH]}>
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
