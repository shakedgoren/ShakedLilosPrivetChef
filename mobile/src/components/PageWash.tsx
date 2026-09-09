import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { a, hues, surface, type CategoryKey } from '../theme/tokens';

/**
 * שטיפת הרקע של המסך · הועתקה אחת לאחת מהקנבס.
 *
 * ⚠ זה מה שהיה חסר · בקנבס הרקע אינו #FCFBFB שטוח אלא שלוש כתמי
 * צבע רכים מעליו, ובמסכי הקטגוריות גם כתם רביעי בגוון הקטגוריה.
 * הזכוכית של הכרטיסים והשורות נראית כזכוכית רק כשיש מתחתיה
 * הבדלי גוון — בלי השטיפה כל האפליקציה יצאה לבן על לבן.
 */

/** שלושת הכתמים הקבועים · אותם ערכים בכל 22 המסכים */
const BASE = [
  { rgb: '186,166,228', alpha: 0.07, cx: '10%', cy: '4%', rx: '56%', ry: '36%' },
  { rgb: '246,180,172', alpha: 0.05, cx: '92%', cy: '12%', rx: '50%', ry: '32%' },
  { rgb: '176,216,190', alpha: 0.05, cx: '84%', cy: '72%', rx: '58%', ry: '38%' },
] as const;

/** הכתם הרביעי · בגוון הקטגוריה, רק במסכי ההזמנה */
const TINT = { cx: '52%', cy: '20%', rx: '76%', ry: '44%', alpha: 0.14, fade: 0.72 } as const;

/** שני מסכים מחליפים כתם בסיס בגוון חם יותר · פירות ושף */
const SWAP: Partial<Record<CategoryKey, { at: number; rgb: string; alpha: number }>> = {
  fruit: { at: 0, rgb: '228,166,196', alpha: 0.2 },
  chef: { at: 2, rgb: '232,198,166', alpha: 0.15 },
};

type Props = { categoryKey?: CategoryKey };

let seq = 0;
const nextId = () => `wash${(seq += 1)}`;

export function PageWash({ categoryKey }: Props) {
  const id = React.useMemo(nextId, []);
  const swap = categoryKey ? SWAP[categoryKey] : undefined;
  const blobs = BASE.map((b, i) => (swap && swap.at === i ? { ...b, rgb: swap.rgb, alpha: swap.alpha } : b));

  return (
    <View style={styles.wash} pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          {blobs.map((b, i) => (
            <RadialGradient key={i} id={`${id}b${i}`} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry}>
              <Stop offset="0" stopColor={a(b.rgb, b.alpha)} />
              <Stop offset={i === 1 ? 0.66 : 0.62} stopColor={a(b.rgb, 0)} />
            </RadialGradient>
          ))}
          {categoryKey && (
            <RadialGradient id={`${id}t`} cx={TINT.cx} cy={TINT.cy} rx={TINT.rx} ry={TINT.ry}>
              <Stop offset="0" stopColor={a(hues[categoryKey].rgb, TINT.alpha)} />
              <Stop offset={TINT.fade} stopColor={a(hues[categoryKey].rgb, 0)} />
            </RadialGradient>
          )}
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={surface.ground} />
        {blobs.map((_, i) => (
          <Rect key={i} x="0" y="0" width="100%" height="100%" fill={`url(#${id}b${i})`} />
        ))}
        {categoryKey && <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id}t)`} />}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({ wash: { position: 'absolute', inset: 0 } });
