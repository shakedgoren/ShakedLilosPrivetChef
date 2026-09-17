import React from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { Bell } from '../icons';
import { Confetti } from './Confetti';
import { NO_TOUCH } from '../theme/pointerEvents';
import { surface } from '../theme/tokens';

/**
 * חגיגת התזכורת · קונפטי, פעמון שמצלצל, וכיתוב מעליו.
 *
 * ⚠ **נבנה ב-17 בספטמבר 2026** · בקשה של שקד: ״לאחר הקונפטי שייכנס
 * האייקון של הפעמון באמצע המסך ויזוז ויופיע מעליו הכיתוב תזכורת
 * הופעלה״, וגם ״לאחר הקונפטי החזרה לדף הבית צריכה להיות מהירה
 * יותר״.
 *
 * ⚠ **שכבה גלובלית ולא במסך הקטגוריה** · קודם הקונפטי רונדר בתוך
 * מסך הקטגוריה, ולכן הניווט הביתה **קטע אותו באמצע** — ומשם נולדה
 * ההשהיה שהיא קראה לה איטית. עכשיו החגיגה יושבת מעל כל האפליקציה,
 * המסך חוזר הביתה **מיד**, והיא ממשיכה לרוץ מעליו.
 */

/** כמה החגיגה נמשכת · הקונפטי ארוך יותר וממשיך מתחתיה */
const HOLD_MS = 2200;
const IN_MS = 300;
const RING_MS = 140;
const BELL_SIZE = 64;
const RING_DEG = 14;

type CheerApi = { cheer: (label: string) => void };

const Ctx = React.createContext<CheerApi>({ cheer: () => {} });

export const useCheer = () => React.useContext(Ctx);

export function CheerProvider({ children }: { children: React.ReactNode }) {
  const [label, setLabel] = React.useState<string | null>(null);
  const api = React.useMemo<CheerApi>(() => ({ cheer: setLabel }), []);

  return (
    <Ctx.Provider value={api}>
      {children}
      {label ? <CheerLayer label={label} onDone={() => setLabel(null)} /> : null}
    </Ctx.Provider>
  );
}

function CheerLayer({ label, onDone }: { label: string; onDone: () => void }) {
  const t = React.useRef(new Animated.Value(0)).current;
  const ring = React.useRef(new Animated.Value(0)).current;
  const [reduce, setReduce] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setReduce(v))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    const id = setTimeout(onDone, HOLD_MS);
    if (reduce) {
      t.setValue(1);
      return () => clearTimeout(id);
    }
    Animated.timing(t, {
      toValue: 1,
      duration: IN_MS,
      easing: Easing.out(Easing.back(2)),
      useNativeDriver: true,
    }).start();
    /* הצלצול · ארבע נדנודים קצרים לשני הכיוונים */
    Animated.sequence([
      Animated.delay(IN_MS),
      ...[1, -1, 1, -1, 0].map((to) =>
        Animated.timing(ring, {
          toValue: to,
          duration: RING_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ),
    ]).start();
    return () => clearTimeout(id);
  }, [onDone, reduce, ring, t]);

  const rotate = ring.interpolate({
    inputRange: [-1, 1],
    outputRange: [`-${RING_DEG}deg`, `${RING_DEG}deg`],
  });

  return (
    <View style={[s.layer, NO_TOUCH]} accessibilityLiveRegion="polite">
      <Confetti />
      <Animated.View style={[s.card, { opacity: t, transform: [{ scale: t }] }]}>
        <Text style={s.label}>{label}</Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Bell size={BELL_SIZE} color={BELL_INK} strokeWidth={1.6} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/** גוון הפעמון · הסגול של המותג */
const BELL_INK = '#7B5CBC';

const s = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { alignItems: 'center', gap: 14 },
  label: {
    fontSize: 20,
    fontWeight: '700',
    color: surface.ink,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.9)',
    textShadowRadius: 8,
  },
});
