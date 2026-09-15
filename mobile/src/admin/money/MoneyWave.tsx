import React from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

/**
 * כרטיס ״הגלים״ · הבחירה של שקד (15 בספטמבר 2026) מתוך חמש הצעות.
 *
 * ⚠ **הגרף הוא הרקע** · לא כרטיס נפרד מתחת למספרים. שני גלים:
 * הסגול הוא המחזור והחום הוא ההוצאות, שניהם על אותה סקאלה כדי
 * שהמרחק ביניהם יהיה הרווח שהעין רואה.
 *
 * ⚠ **הגלים נוגעים בשוליים** · ה-SVG רחב מהריפוד של הכרטיס
 * ומוסט אחורה, אחרת נשאר פס ריק משני הצדדים והגל נראה תלוש.
 */

export type WavePoint = { k: string; rev: number; exp: number };

const H = 104;
const TOP = 8;
const BASE = H - 4;
/** ⚠ קבוע גדול מכל אורך נתיב אפשרי · אין מדידת אורך נתיב חוצת-פלטפורמות */
const DASH = 2400;
const PAD = 15;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const nf = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

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

export function MoneyWave({
  label,
  total,
  margin,
  marginLabel,
  points,
}: {
  label: string;
  total: number;
  margin: number;
  marginLabel: string;
  points: WavePoint[];
}) {
  const [w, setW] = React.useState(0);
  const draw = React.useRef(new Animated.Value(1)).current;
  const dot = React.useRef(new Animated.Value(0)).current;

  /* מפתח הטווח · החלפת טווח מציירת מחדש */
  const key = `${points.length}:${points[0]?.k ?? ''}:${total}`;

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
    /* ⚠ שולי הכרטיס · הגל חוצה אותם לשני הצדדים */
    const width = w + PAD * 2;
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
    <View style={s.card} onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width - PAD * 2))}>
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

      <View style={s.top}>
        <View style={s.headText}>
          <Text style={s.cap}>{label}</Text>
          <View style={s.money}>
            <Text style={s.big}>{nf(total)}</Text>
            <Text style={s.ils}>₪</Text>
          </View>
        </View>
        <View style={s.badge}>
          <Text style={s.badgeText}>{`${marginLabel}${margin}%`}</Text>
        </View>
      </View>

      <View style={s.waveBox}>
        {chart ? (
          <Svg width={chart.width} height={H} style={{ marginHorizontal: -PAD }}>
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
  card: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(142,111,208,0.16)',
    overflow: 'hidden',
    paddingHorizontal: PAD,
    paddingTop: PAD,
    boxShadow: '0 2px 4px -2px rgba(90,80,70,0.1), 0 16px 32px -18px rgba(90,80,70,0.28)',
  } as never,
  top: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  headText: { gap: 1 },
  cap: { fontSize: 11, fontWeight: '600', color: '#6E5E95' },
  money: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  big: { fontSize: 29, fontWeight: '800', letterSpacing: -0.6, color: '#3B2F58' },
  ils: { fontSize: 14, color: '#9488B5' },
  badge: {
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 9,
    backgroundColor: 'rgba(127,196,155,0.22)',
    marginBottom: 3,
  },
  badgeText: { fontSize: 10.5, fontWeight: '700', color: '#3E7A57' },
  waveBox: { marginTop: 10 },
});
