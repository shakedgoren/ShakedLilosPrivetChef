import React from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

/**
 * הקונפטי של מסך הסיום · `CONFETTI` ו-`@keyframes cfall` בקנבס.
 * 22 פתיתים, כל אחד עם עיכוב, סחיפה אופקית וסיבוב משלו, נופלים
 * מ-‎-60 ל-880 במשך 2900ms. הערכים נגזרים מאותו זרע שבקנבס, ולכן
 * הפיזור זהה בדיוק ואינו מוגרל מחדש בכל פתיחה.
 */

const COUNT = 22;
const COLORS = ['#7B5CBC', '#416D9E', '#A85A28', '#B04A76', '#A85A28', '#F2D8C0'] as const;
const FALL_MS = 2900;
const FROM_Y = -60;
const TO_Y = 880;
/* cubic-bezier(.16,.5,.4,1) בקנבס */
const EASE = Easing.bezier(0.16, 0.5, 0.4, 1);
/* opacity 0 → 1 ב-9% → 0 בסוף */
const FADE_IN = 0.09;

type Flake = {
  x: string;
  w: number;
  h: number;
  r: number;
  c: string;
  delay: number;
  dx: number;
  rot: string;
};

/** אותו זרע של הקנבס · (i * 2654435761) % 1000 / 1000 */
const FLAKES: Flake[] = Array.from({ length: COUNT }, (_, i) => {
  const seed = ((i * 2654435761) % 1000) / 1000;
  return {
    x: `${(3 + ((i * 4.4) % 94)).toFixed(1)}%`,
    w: 5 + Math.round(seed * 5),
    h: 9 + Math.round(seed * 7),
    r: i % 3 === 0 ? 999 : 2,
    c: COLORS[i % COLORS.length],
    delay: i * 46,
    dx: Math.round((seed - 0.5) * 130),
    rot: `${420 + Math.round(seed * 520)}deg`,
  };
});

function Flake({ f }: { f: Flake }) {
  const t = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: FALL_MS,
      delay: f.delay,
      easing: EASE,
      /* ⚠ `false` · הנפילה רצה בדפדפן, ושם אין דרייבר מקורי */
      useNativeDriver: false,
    }).start();
  }, [f.delay, t]);

  return (
    <Animated.View
      style={[
        s.flake,
        {
          left: f.x as unknown as number,
          width: f.w,
          height: f.h,
          borderRadius: f.r,
          backgroundColor: f.c,
          opacity: t.interpolate({
            inputRange: [0, FADE_IN, 1],
            outputRange: [0, 1, 0],
          }),
          transform: [
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [FROM_Y, TO_Y] }) },
            { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, f.dx] }) },
            {
              rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', f.rot] }),
            },
          ],
        },
      ]}
    />
  );
}

export function Confetti() {
  return (
    <View style={s.layer} pointerEvents="none">
      {FLAKES.map((f, i) => (
        <Flake key={i} f={f} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  layer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' },
  flake: { position: 'absolute', top: 0 },
});
