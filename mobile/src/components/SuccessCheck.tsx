import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { DRAW, EASE_OUT, EASE_POP, POP, RING, useReducedMotion } from '../theme/motion';
import { a, stopOf } from '../theme/tokens';
import { NO_TOUCH } from '../theme/pointerEvents';

/**
 * וי ההצלחה · במסך הסיום של פינת השף.
 *
 * ⚠ **עיצוב תנועה חדש** · שקד ביקשה ב-15 בספטמבר 2026 ״וי הצלחה
 * בעיצוב אחר, יותר מונפש״. הצבעים והמידות נשארו של הקנבס — מה
 * שהשתנה הוא מה שקורה:
 *
 * · קודם: העיגול קפץ, טבעת אחת התפשטה, והווי היה **מצויר מראש**.
 * · עכשיו: העיגול קופץ, **שתי** טבעות מתפשטות בזו אחר זו, והווי
 *   **מצייר את עצמו** משמאל לימין במקום להופיע שלם.
 *
 * ⚠ **הציור הוא `strokeDashoffset` ב-state** · `react-native-svg`
 * לא מקבל ערך מונפש בכל הפלטפורמות, ולכן המאזין מעדכן מספר רגיל.
 * זה מצייר מחדש עיגול אחד, פעם אחת, במסך שנפתח וננעל.
 */

/* מידות הקנבס · העיגול 82, ההילה ב-inset ‎-12, הווי 34 בעובי 2.8 */
const BADGE = 82;
const HALO = 12;
const TICK = 34;
const TICK_STROKE = 2.8;
const RING_W = 2.5;

/** הווי · אותו נתיב של האייקון בקנבס, ב-viewBox 24 */
const TICK_PATH = 'M5 12.5l4.5 4.5L19 7.5';
/**
 * אורך הנתיב ביחידות ה-viewBox · 4.5√2 ועוד 9.5√2.
 * ⚠ מחושב ביד · ל-`react-native-svg` אין `getTotalLength`.
 * תוספת קטנה מבטיחה שהקצה ייסגר לגמרי ולא יישאר פיקסל חסר.
 */
const TICK_LEN = 20.2;

/* העיגול · גרדיאנט הפליז של הקנבס */
const DISC_STOPS = [
  { offset: '0', color: '#FAF1E8' },
  { offset: '0.34', color: '#EBCFAF' },
  { offset: '1', color: '#C08A52' },
] as const;

type Accent = { hue: string; deep: string; rgb: string };

let seq = 0;
const nextId = () => `ok${(seq += 1)}`;

export function SuccessCheck({ accent }: { accent: Accent }) {
  const reduced = useReducedMotion();
  const id = React.useMemo(nextId, []);

  const pop = React.useRef(new Animated.Value(0)).current;
  const ringA = React.useRef(new Animated.Value(0)).current;
  const ringB = React.useRef(new Animated.Value(0)).current;
  const draw = React.useRef(new Animated.Value(0)).current;
  const [drawn, setDrawn] = React.useState(0);

  React.useEffect(() => {
    if (reduced) {
      pop.setValue(1);
      setDrawn(1);
      return;
    }
    const id2 = draw.addListener((e) => setDrawn(e.value));
    const run = (v: Animated.Value, duration: number, delay: number, easing: (t: number) => number) =>
      Animated.timing(v, { toValue: 1, duration, delay, easing, useNativeDriver: false });

    const anim = Animated.parallel([
      run(pop, POP.ms, POP.delay, EASE_POP),
      run(ringA, RING.ms, RING.delay, EASE_OUT),
      /* ⚠ הטבעת השנייה · היא מה שהופך את הווי ל״יותר מונפש״ */
      run(ringB, RING.ms, RING.delay + RING.gap, EASE_OUT),
      run(draw, DRAW.ms, DRAW.delay, EASE_OUT),
    ]);
    anim.start();
    return () => {
      anim.stop();
      draw.removeListener(id2);
    };
  }, [draw, pop, reduced, ringA, ringB]);

  const ringStyle = (v: Animated.Value) => ({
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [RING.alpha, 0] }),
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [RING.from, RING.to] }) }],
  });

  return (
    <View style={s.badge}>
      <View style={[s.halo, NO_TOUCH]}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id={`${id}h`} cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0" {...stopOf(a(accent.rgb, 0.42))} />
              <Stop offset="0.78" {...stopOf(a(accent.rgb, 0))} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id}h)`} />
        </Svg>
      </View>

      <Animated.View style={[s.ring, { borderColor: a(accent.rgb, 0.55) }, ringStyle(ringA)]} />
      <Animated.View style={[s.ring, { borderColor: a(accent.rgb, 0.55) }, ringStyle(ringB)]} />

      <Animated.View
        style={[
          s.disc,
          {
            opacity: pop.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
            transform: [
              { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [POP.from, 1] }) },
            ],
          },
        ]}
      >
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id={`${id}d`} cx="34%" cy="28%" rx="72%" ry="72%">
              {DISC_STOPS.map((v) => (
                <Stop key={v.offset} offset={v.offset} {...stopOf(v.color)} />
              ))}
            </RadialGradient>
            <RadialGradient id={`${id}g`} cx="30%" cy="22%" rx="28%" ry="28%">
              <Stop offset="0" {...stopOf('rgba(255,255,255,0.96)')} />
              <Stop offset="1" {...stopOf('rgba(255,255,255,0)')} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" rx={BADGE / 2} fill={`url(#${id}d)`} />
          <Rect x="0" y="0" width="100%" height="100%" rx={BADGE / 2} fill={`url(#${id}g)`} />
        </Svg>

        {/* ⚠ `zIndex` הכרחי · ה-SVG של הגרדיאנט ממוקם absolute,
            ולכן בדפדפן הוא נצבע **מעל** אח סטטי. בלי זה הווי נמצא
            ב-DOM בגודל הנכון אבל אינו נראה. */}
        <View style={s.tick}>
          <Svg width={TICK} height={TICK} viewBox="0 0 24 24" fill="none">
            <Path
              d={TICK_PATH}
              stroke={accent.deep}
              strokeWidth={TICK_STROKE}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`${TICK_LEN} ${TICK_LEN}`}
              strokeDashoffset={TICK_LEN * (1 - drawn)}
            />
          </Svg>
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  badge: { width: BADGE, height: BADGE, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', top: -HALO, right: -HALO, bottom: -HALO, left: -HALO },
  ring: {
    position: 'absolute',
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    borderWidth: RING_W,
  },
  disc: {
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    /* הצללים הפנימיים של הקנבס · מה שנותן לעיגול את הנפח */
    boxShadow:
      'inset -6px -8px 16px rgba(122,61,24,0.28)' +
      ', inset 5px 6px 12px rgba(255,255,255,0.95)' +
      ', 0 14px 28px -14px rgba(168,90,40,0.65)',
  },
  tick: { zIndex: 1 },
});
