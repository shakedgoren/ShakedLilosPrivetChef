import React from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

/**
 * רצועת ״הגלים״ · הבחירה של שקד (15 בספטמבר 2026) מתוך חמש הצעות.
 *
 * ⚠ **ציור בלבד** · שקד ביקשה (15 בספטמבר 2026) להוריד את המילה
 * ״מחזור״ ואת הסכום מהכרטיס ולהשאיר רק את הדיאגרמה, בגובה
 * מינימלי, עם שלוש הכרטיסיות **מתחתיה**.
 *
 * ⚠ **שני גלים על אותה סקאלה** · הסגול הוא המחזור והחום הוא
 * ההוצאות, כדי שהמרחק ביניהם יהיה הרווח שהעין רואה.
 *
 * ⚠ **הגלים נוגעים בשוליים** · ה-SVG ברוחב מלא של הכרטיס ובלי
 * ריפוד, אחרת נשאר פס ריק משני הצדדים והגל נראה תלוש.
 */

export type WavePoint = { k: string; rev: number; exp: number };

/** ⚠ **גובה מינימלי** · בקשה של שקד · מספיק לגל ולא יותר */
const H = 78;
const TOP = 7;
const BASE = H - 3;
/** ⚠ קבוע גדול מכל אורך נתיב אפשרי · אין מדידת אורך נתיב חוצת-פלטפורמות */
const DASH = 2400;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * עקומה רכה דרך הנקודות · קטמול-רום שמתורגם לבזייה מעוקבת.
 * ⚠ קו שבור בין הנקודות נראה כמו גרף ולא כמו גל.
 */
function smooth(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M${pts[0].x} ${pts[0].y}`;
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export function MoneyWave({ points }: { points: WavePoint[] }) {
  const [w, setW] = React.useState(0);
  const draw = React.useRef(new Animated.Value(1)).current;
  const dot = React.useRef(new Animated.Value(0)).current;

  /* מפתח הטווח · החלפת טווח מציירת מחדש */
  const key = `${points.length}:${points[0]?.k ?? ''}:${points.reduce((t, p) => t + p.rev, 0)}`;

  React.useEffect(() => {
    let alive = true;
    const run = (reduce: boolean) => {
      if (!alive) return;
      if (reduce) {
        draw.setValue(0);
        dot.setValue(1);
        return;
      }
      draw.setValue(1);
      dot.setValue(0);
      Animated.timing(draw, {
        toValue: 0,
        duration: 1100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      Animated.timing(dot, {
        toValue: 1,
        duration: 320,
        delay: 950,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: false,
      }).start();
    };
    /* ⚠ בדפדפן זה ממופה ל-prefers-reduced-motion */
    AccessibilityInfo.isReduceMotionEnabled()
      .then(run)
      .catch(() => run(false));
    return () => {
      alive = false;
    };
  }, [draw, dot, key]);

  const offset = draw.interpolate({ inputRange: [0, 1], outputRange: [0, DASH] });

  const chart = React.useMemo(() => {
    if (w <= 0 || points.length === 0) return null;
    const width = w;
    const top = Math.max(...points.map((p) => Math.max(p.rev, p.exp)), 1);
    const at = (v: number, i: number) => ({
      x: points.length === 1 ? width / 2 : (i / (points.length - 1)) * width,
      y: BASE - (v / top) * (BASE - TOP),
    });
    const rev = points.map((p, i) => at(p.rev, i));
    const exp = points.map((p, i) => at(p.exp, i));
    /**
     * ⚠ **הנקודה נכנסת פנימה** · לכרטיס יש `overflow: hidden`,
     * ובקצה ממש חצי מהעיגול נחתך. נמדד בדפדפן.
     */
    const tip = rev[rev.length - 1];
    const last = { x: Math.min(Math.max(tip.x, 6), width - 6), y: Math.min(Math.max(tip.y, 6), H - 6) };
    return {
      width,
      revLine: smooth(rev),
      expLine: smooth(exp),
      revArea: `${smooth(rev)} L${width} ${H} L0 ${H} Z`,
      expArea: `${smooth(exp)} L${width} ${H} L0 ${H} Z`,
      last,
    };
  }, [w, points]);

  return (
    <View style={s.card} onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}>
      {/* המדרגה של הרקע · ל-React Native אין גרדיאנט ב-CSS */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="bg" x1="1" y1="0" x2="0.15" y2="1">
            <Stop offset="0" stopColor="#EBE3F8" />
            <Stop offset="0.62" stopColor="#F7F3FD" />
            <Stop offset="1" stopColor="#FFFFFF" />
          </LinearGradient>
        </Defs>
        <Path d="M0 0 H10000 V10000 H0 Z" fill="url(#bg)" />
      </Svg>

      <View style={s.waveBox}>
        {chart ? (
          <Svg width={chart.width} height={H}>
            <Defs>
              <LinearGradient id="wRev" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#8E6FD0" stopOpacity="0.42" />
                <Stop offset="1" stopColor="#8E6FD0" stopOpacity="0.04" />
              </LinearGradient>
              <LinearGradient id="wExp" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#C98A5B" stopOpacity="0.3" />
                <Stop offset="1" stopColor="#C98A5B" stopOpacity="0.03" />
              </LinearGradient>
            </Defs>

            <Path d={chart.revArea} fill="url(#wRev)" />
            <AnimatedPath
              d={chart.revLine}
              fill="none"
              stroke="#8E6FD0"
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeDasharray={DASH}
              strokeDashoffset={offset}
            />

            <Path d={chart.expArea} fill="url(#wExp)" />
            <AnimatedPath
              d={chart.expLine}
              fill="none"
              stroke="#C98A5B"
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.75}
              strokeDasharray={DASH}
              strokeDashoffset={offset}
            />

            <AnimatedCircle
              cx={chart.last.x}
              cy={chart.last.y}
              r={4.2}
              fill="#FFFFFF"
              stroke="#8E6FD0"
              strokeWidth={2.4}
              opacity={dot}
            />
          </Svg>
        ) : (
          <View style={{ height: H }} />
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  /* ⚠ בלי ריפוד · הגל נוגע בכל ארבעת השוליים */
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(142,111,208,0.16)',
    overflow: 'hidden',
    height: H,
    boxShadow: '0 2px 4px -2px rgba(90,80,70,0.1), 0 16px 32px -18px rgba(90,80,70,0.28)',
  } as never,
  waveBox: { height: H },
});
