import React from 'react';
import { S } from './Sym';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Text } from '../ui/text';
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
 *
 * ⚠ **עיגול לבן ורקע מטושטש · 17 בספטמבר 2026** · בקשה של שקד:
 * ״שההודעה ׳תזכורת הופעלה׳ תהיה על עיגול עם רקע לבן ושכל הרקע
 * מאחורה יהיה מטושטש״.
 *
 * ⚠ **`toast` · הודעה צפה בלי חגיגה** · אותה בקשה, חציה השני:
 * ״שההודעה ׳תזכורת נמחקה׳ לא תזיז דברים במסך הבית, שתופיע כמו
 * הודעה צפה״. קודם היא רונדרה **בתוך** שורת המכירה בדף הבית, ולכן
 * היא דחפה את הכרטיסים שמתחתיה. כאן היא מרחפת מעל הכל ואינה
 * תופסת מקום בפריסה.
 */

/** כמה החגיגה נמשכת · הקונפטי ארוך יותר וממשיך מתחתיה */
const HOLD_MS = 2200;
/** ההודעה הצפה קצרה יותר · אין בה מה להסתכל */
const TOAST_MS = 1900;
const IN_MS = 300;
const OUT_MS = 220;
const RING_MS = 140;
const BELL_SIZE = 56;
const RING_DEG = 14;

/** ⚠ העיגול · מספיק רחב לשתי מילים בשורה אחת בלי לשבור אותן */
const DISC = 208;
/** עוצמת הטשטוש של הרקע · 0–100 ב-expo-blur */
const BLUR = 34;

type Kind = 'cheer' | 'toast';
type Show = { label: string; kind: Kind; seq: number };

type CheerApi = {
  /** חגיגה מלאה · קונפטי, פעמון ועיגול לבן על רקע מטושטש */
  cheer: (label: string) => void;
  /** הודעה צפה קצרה · בלי קונפטי ובלי לתפוס מקום בפריסה */
  toast: (label: string) => void;
};

const Ctx = React.createContext<CheerApi>({ cheer: () => {}, toast: () => {} });

export const useCheer = () => React.useContext(Ctx);

export function CheerProvider({ children }: { children: React.ReactNode }) {
  const [show, setShow] = React.useState<Show | null>(null);

  const api = React.useMemo<CheerApi>(
    () => ({
      cheer: (label) => setShow((p) => ({ label, kind: 'cheer', seq: (p?.seq ?? 0) + 1 })),
      toast: (label) => setShow((p) => ({ label, kind: 'toast', seq: (p?.seq ?? 0) + 1 })),
    }),
    [],
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      {show ? (
        /* ⚠ `key` על המונה · הודעה חדשה מתחילה מחזור חדש ולא ממשיכה את הקודם */
        <CheerLayer key={show.seq} label={show.label} kind={show.kind} onDone={() => setShow(null)} />
      ) : null}
    </Ctx.Provider>
  );
}

function CheerLayer({ label, kind, onDone }: { label: string; kind: Kind; onDone: () => void }) {
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

  const cheering = kind === 'cheer';

  React.useEffect(() => {
    const hold = cheering ? HOLD_MS : TOAST_MS;
    /* ⚠ יציאה ולא היעלמות · שכבה שנמחקת בפריים אחד נראית כמו תקלה */
    const id = setTimeout(() => {
      Animated.timing(t, {
        toValue: 0,
        duration: reduce ? 0 : OUT_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(onDone);
    }, hold);

    if (reduce) {
      t.setValue(1);
      return () => clearTimeout(id);
    }
    Animated.timing(t, {
      toValue: 1,
      duration: IN_MS,
      easing: Easing.out(Easing.back(cheering ? 2 : 1.2)),
      useNativeDriver: true,
    }).start();

    if (cheering) {
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
    }
    return () => clearTimeout(id);
  }, [cheering, onDone, reduce, ring, t]);

  const rotate = ring.interpolate({
    inputRange: [-1, 1],
    outputRange: [`-${RING_DEG}deg`, `${RING_DEG}deg`],
  });
  /* ההודעה הצפה נכנסת מלמטה · העיגול נכנס בקנה מידה */
  const rise = t.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return (
    <View style={[s.layer, NO_TOUCH]} accessibilityLiveRegion="polite">
      {/* ⚠ הטשטוש רק בחגיגה · הודעה צפה לא אמורה לחסום את המסך */}
      {cheering ? (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: t }]}>
          <BlurView intensity={BLUR} tint="light" style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : null}

      {cheering ? <Confetti /> : null}

      {cheering ? (
        <Animated.View style={[s.disc, { opacity: t, transform: [{ scale: t }] }]}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <S k="bell" size={BELL_SIZE} color={BELL_INK} />
          </Animated.View>
          <Text style={s.label}>{label}</Text>
        </Animated.View>
      ) : (
        <Animated.View style={[s.pill, { opacity: t, transform: [{ translateY: rise }] }]}>
          <Text style={s.pillText}>{label}</Text>
        </Animated.View>
      )}
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
  /* ⚠ עיגול לבן · בקשה מפורשת של שקד, ראו ההערה בראש הקובץ */
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: DISC / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 18,
    boxShadow: '0 26px 56px -20px rgba(60,48,84,0.5)',
  } as never,
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: surface.ink,
    textAlign: 'center',
  },
  /* ההודעה הצפה · גלולה כהה במרכז המסך, מעל כל תוכן */
  pill: {
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: 'rgba(42,36,48,0.9)',
    boxShadow: '0 18px 36px -16px rgba(42,36,48,0.6)',
  } as never,
  pillText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});
