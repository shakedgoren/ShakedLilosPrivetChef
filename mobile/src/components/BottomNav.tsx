import React from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Text } from '../ui/text';
import { radius, type } from '../theme/tokens';
import { INDIGO_70, S, type SYM } from './Sym';
import { useNav } from '../navigation/store';
import { atRest, dragEdges, settleEdges, spanOf, type Edges } from '../motion/liquid';

/**
 * סרגל הניווט התחתון · מופיע אך ורק כשהמשתמשת מחוברת,
 * בדיוק כמו בקנבס. כשלא מחוברים הוא לא מרונדר בכלל.
 *
 * ⚠ **עיצוב ״גלולה״ · נבחר ב-16 בספטמבר 2026** · שקד ראתה את עיצוב
 * המגרעת (האייקון הפעיל שיוצא לעיגול מרחף) על המכשיר, לא אהבה, וקיבלה
 * חמש אפשרויות חדשות. היא בחרה את ״גלולה״: גלולה לבנה מרחפת, והלשונית
 * הפעילה מקבלת כרית סגולה רכה מאחוריה.
 *
 * ⚠ **Liquid Glass אמיתי · 16 בספטמבר 2026** · `expo-glass-effect`
 * חושף את הזכוכית **של המערכת** — אותה שכבה שאפל משתמשת בה, עם
 * השבירה וההשתקפות — ולא חיקוי שלה בצבע ובצל. דורש iOS 26 ומעלה,
 * ומתחתיו נשאר בדיוק הסרגל הלבן שהיה.
 *
 * ⚠ **הכרית נוסעת עם האצבע · 18 בספטמבר 2026** · שקד שלחה הקלטת מסך
 * מאפליקציית הקבצים וכתבה ״כמו באייפון מהבחינה שניתן להזיז אותו כזה
 * בחופשיות״. ניתחתי אותה פריים-פריים; ככה זה עובד שם:
 *
 * 1. במנוחה — כרית **שטוחה** מאחורי הלשונית הפעילה, בלי צל ובלי
 *    זכוכית.
 * 2. במגע — היא **מתרוממת**: הופכת לזכוכית, גדלה מעט ומקבלת צל.
 * 3. בגרירה — היא **נוסעת עם האצבע ברציפות**, ובדרך **נמתחת**,
 *    כי הקצה הקדמי רץ לפני האחורי. מה שמתחתיה נשבר דרכה, והלשונית
 *    שהיא מכסה נצבעת **תוך כדי**.
 * 4. בשחרור — היא מתכנסת ליעד הקרוב **ומתיישבת** חזרה לכרית שטוחה.
 *
 * ⚠ **המסך מתחלף רק בשחרור** · בדקתי בסרטון: התוכן מעל הסרגל אינו
 * משתנה כל עוד האצבע על המסך, רק צבעי הלשוניות. זה גם מה שמונע
 * טעינת שלושה מסכים בזמן גרירה אחת.
 */
const TABS = [
  { key: 'main', label: 'בית', sym: 'home' },
  { key: 'orders', label: 'הזמנות', sym: 'orders' },
  { key: 'profile', label: 'אזור אישי', sym: 'personalArea' },
] as const satisfies readonly { key: string; label: string; sym: keyof typeof SYM }[];

/**
 * המרווח שמסך עם שורה תחתונה חייב להשאיר לנאב-בר.
 * מהקנבס (`Order.dc.html`): הנאב יושב ב-`bottom: 26` בגובה 68,
 * ושורת הסה״כ יושבת ב-`bottom: 102` — שמונה פיקסלים מעליו.
 * ⚠ בלי זה הנאב עולה על שורת הסה״כ ועל כפתור ההמשך, ואי אפשר
 * ללחוץ עליו. שקד דיווחה על זה ב-14 בספטמבר.
 */
export const BAR_BOTTOM_WITH_NAV = 102;

/**
 * ריפוד תחתון לאזור גלילה שממשיך עד תחתית המסך.
 * ⚠ בלי זה התוכן האחרון נחתך מתחת לנאב-בר ואי אפשר ללחוץ עליו.
 */
export const SCROLL_PAD_NAV = BAR_BOTTOM_WITH_NAV;

/* צבעי הלשונית · הפעילה סגולה ועבה יותר */
const ON_INK = '#7B5CBC';
const OFF_INK = '#918A9E';
/** הכרית מאחורי הלשונית הפעילה */
const CUSHION = 'rgba(123,92,188,0.14)';
/**
 * ⚠ **לבן כמעט אטום** · זכוכית הקנבס (0.66) נעלמת מעל רצועת
 * התמונות בדף הבית. נמדד בפיקסלים ב-16 בספטמבר 2026.
 */
const BAR_BG = 'rgba(255,255,255,0.95)';
const BAR_SHADOW =
  'inset 0 0 0 1px rgba(255,255,255,0.9), 0 12px 26px -18px rgba(96,80,132,0.6)';
/**
 * גוון הזכוכית · לבן דליל מאוד.
 * ⚠ **דליל בכוונה** · הזכוכית של המערכת כבר מביאה את הבהירות
 * מהרקע. גוון חזק היה הופך אותה חזרה ללוח אטום.
 */
const GLASS_TINT = 'rgba(255,255,255,0.18)';

/* ── הכתם הנוסע ─────────────────────────────────────── */

/** כמה הכרית נסוגה מקצות הלשונית · חייב להתאים ל-`s.cushion` */
const INSET = 8;
/** גובה הכרית · מרחק מלמעלה ומלמטה בתוך הגלולה */
const RIM = 7;
/** ההתרוממות · כמה הכתם גדל כשנוגעים בו */
const LIFT = 1.07;
/** גוון הזכוכית של הכתם · דליל מזה של הגלולה, שלא יסתיר את האייקון */
const LENS_TINT = 'rgba(255,255,255,0.10)';
/** הצל שמופיע רק כשהכתם מורם */
const LENS_SHADOW = '0 7px 18px -7px rgba(70,56,100,0.7)';
/** תזוזה קטנה מזו היא לחיצה ולא גרירה */
const SLOP = 4;
/** ההתרוממות · קפיץ קצר, בלי חריגה */
const LIFT_SPRING = {
  stiffness: 520,
  damping: 36,
  mass: 1,
  overshootClamping: true,
  useNativeDriver: false,
} as const;

type Spot = { x: number; w: number };
type Geom = { barX: number; slots: number[]; slotW: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function BottomNav() {
  const { loggedIn } = useNav();
  if (!loggedIn) return null;
  return <NavBar />;
}

/**
 * ⚠ **רכיב נפרד · לא קישוט** · ב-`BottomNav` יש יציאה מוקדמת כשלא
 * מחוברים, ומתחתיה יושבים כל ה-hooks של הכתם הנוסע. hook אחרי
 * יציאה מותנית הוא שבירה של כללי ריאקט, ולכן ההפרדה.
 */
function NavBar() {
  const { screen, go } = useNav();
  const active = TABS.findIndex((t) => t.key === screen);

  /* ⚠ המיקומים **נמדדים** ולא מחושבים · הסרגל בכיוון ימין-לשמאל,
     ואריתמטיקה על אינדקסים הייתה מתהפכת בלי שנשים לב */
  const [spots, setSpots] = React.useState<Spot[]>([]);
  /** הלשונית שהכתם נמצא מעליה **כרגע** · משתנה תוך כדי גרירה */
  const [hot, setHot] = React.useState(active);

  const posX = React.useRef(new Animated.Value(0)).current;
  const posW = React.useRef(new Animated.Value(0)).current;
  const lift = React.useRef(new Animated.Value(0)).current;

  const edges = React.useRef<Edges>({ lead: 0, trail: 0 });
  const geom = React.useRef<Geom>({ barX: 0, slots: [], slotW: 0 });
  const raf = React.useRef<number | null>(null);
  const clock = React.useRef(0);
  const placed = React.useRef(false);
  const held = React.useRef(false);
  const dragging = React.useRef(false);
  const live = React.useRef({ hot, active, go });
  live.current = { hot, active, go };

  const paint = React.useCallback(() => {
    const span = spanOf(edges.current, geom.current.slotW);
    posX.setValue(span.x);
    posW.setValue(span.w);
  }, [posX, posW]);

  const lifted = React.useCallback(
    (on: boolean) => Animated.spring(lift, { toValue: on ? 1 : 0, ...LIFT_SPRING }).start(),
    [lift],
  );

  const stop = React.useCallback(() => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
  }, []);

  /** נסיעה אל יעד · הקצוות נפרדים בדרך ומתאחדים בסוף */
  const runTo = React.useCallback(
    (target: number) => {
      stop();
      clock.current = 0;
      const tick = () => {
        const now = Date.now();
        const dt = clock.current ? Math.min(0.05, (now - clock.current) / 1000) : 1 / 60;
        clock.current = now;
        edges.current = settleEdges(edges.current, target, dt);
        paint();
        if (!atRest(edges.current, target)) {
          raf.current = requestAnimationFrame(tick);
          return;
        }
        edges.current = { lead: target, trail: target };
        paint();
        raf.current = null;
        /* ⚠ ההתיישבות בסוף הנסיעה · בסרטון הכתם נשאר מורם **כל
           הדרך** ויורד רק כשהוא מגיע */
        if (!held.current) lifted(false);
      };
      raf.current = requestAnimationFrame(tick);
    },
    [lifted, paint, stop],
  );

  /** הלשונית הקרובה ביותר למיקום · המיקום הוא הקצה של המשבצת */
  const nearest = React.useCallback((x: number) => {
    const { slots } = geom.current;
    let best = 0;
    let far = Infinity;
    slots.forEach((s, i) => {
      const d = Math.abs(s - x);
      if (d < far) {
        far = d;
        best = i;
      }
    });
    return best;
  }, []);

  /* ── המדידה ──────────────────────────────────────── */

  const onBar = (x: number) => {
    geom.current = { ...geom.current, barX: x };
  };

  const onSpot = (i: number, x: number, w: number) =>
    setSpots((prev) => {
      if (prev[i] && Math.abs(prev[i].x - x) < 0.5 && Math.abs(prev[i].w - w) < 0.5) return prev;
      const next = prev.slice();
      next[i] = { x, w };
      return next;
    });

  const ready = spots.length === TABS.length && spots.every(Boolean);
  if (ready) {
    geom.current = {
      ...geom.current,
      slots: spots.map((sp) => sp.x + INSET),
      slotW: spots[0].w - INSET * 2,
    };
  }

  /* ── הכתם עוקב אחרי הלשונית הפעילה ───────────────── */

  React.useEffect(() => {
    if (!ready || active < 0) return;
    const target = geom.current.slots[active];
    if (!placed.current) {
      placed.current = true;
      edges.current = { lead: target, trail: target };
      paint();
      return;
    }
    if (dragging.current) return;
    runTo(target);
  }, [ready, active, paint, runTo]);

  React.useEffect(() => setHot(active), [active]);
  React.useEffect(() => stop, [stop]);

  /* ── הגרירה לאורך הסרגל ──────────────────────────── */

  const pan = React.useMemo(
    () =>
      PanResponder.create({
        /* ⚠ לא בלחיצה · אחרת ה-`Pressable` לא היה מקבל אותה לעולם */
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponderCapture: (_e, g) =>
          geom.current.slotW > 0 && Math.abs(g.dx) > SLOP && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderGrant: () => {
          stop();
          dragging.current = true;
          held.current = true;
          clock.current = 0;
          lifted(true);
        },
        onPanResponderMove: (_e, g) => {
          const { barX, slots, slotW } = geom.current;
          if (!slotW) return;
          const lo = Math.min(...slots);
          const hi = Math.max(...slots);
          /* ⚠ **`moveX` ולא `locationX`** · האחרון נמדד ביחס לילד
             שקיבל את המגע, והוא מתחלף כשהאצבע עוברת לשונית */
          const at = clamp(g.moveX - barX - slotW / 2, lo, hi);
          const now = Date.now();
          const dt = clock.current ? Math.min(0.05, (now - clock.current) / 1000) : 1 / 60;
          clock.current = now;
          edges.current = dragEdges(edges.current, at, dt);
          paint();
          const i = nearest(at);
          if (i !== live.current.hot) setHot(i);
        },
        onPanResponderRelease: () => {
          dragging.current = false;
          held.current = false;
          const i = nearest(edges.current.lead);
          setHot(i);
          runTo(geom.current.slots[i]);
          if (i !== live.current.active) live.current.go(TABS[i].key);
        },
        onPanResponderTerminate: () => {
          dragging.current = false;
          held.current = false;
          const back = geom.current.slots[Math.max(0, live.current.active)];
          runTo(back);
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [lifted, nearest, paint, runTo, stop],
  );

  /* ── הציור ───────────────────────────────────────── */

  const glass = isLiquidGlassAvailable();
  const grow = lift.interpolate({ inputRange: [0, 1], outputRange: [1, LIFT] });
  /* הכרית השטוחה נמוגה בדיוק כשהזכוכית עולה במקומה */
  const flat = lift.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  const tabs = TABS.map((t, i) => {
    const on = i === hot;
    return (
      <Pressable
        key={t.key}
        onLayout={(e) => onSpot(i, e.nativeEvent.layout.x, e.nativeEvent.layout.width)}
        onPressIn={() => {
          held.current = true;
          lifted(true);
        }}
        onPressOut={() => {
          held.current = false;
          /* ⚠ מושהה בכוונה · `onPress` נורה **אחרי** `onPressOut`,
             וההשהיה נותנת לנסיעה להתחיל לפני שהכתם יורד */
          setTimeout(() => {
            if (!held.current && raf.current === null && !dragging.current) lifted(false);
          }, 60);
        }}
        onPress={() => {
          setHot(i);
          if (ready) runTo(geom.current.slots[i]);
          go(t.key);
        }}
        style={s.tab}
        /**
         * ⚠ **תפקיד ומצב לקורא מסך** · הכיתוב נקרא ממילא, אבל בלי
         * אלה VoiceOver אינו יודע שזו **לשונית** ואינו מכריז איזו
         * מהן נבחרה. אין כאן טקסט חדש.
         */
        accessibilityRole="tab"
        accessibilityState={{ selected: on }}
      >
        {/* הכרית · מאחורי האייקון והכיתוב, לא מסביב ללשונית כולה */}
        {on ? <Animated.View style={[s.cushion, { opacity: flat }]} /> : null}
        <S k={t.sym} size={22} color={on ? ON_INK : INDIGO_70} />
        <Text style={[s.label, { color: on ? ON_INK : OFF_INK, fontWeight: on ? '700' : '400' }]}>
          {t.label}
        </Text>
      </Pressable>
    );
  });

  /**
   * ⚠ **הכתם מצויר אחרי הלשוניות** · זה מה שמאפשר לזכוכית לשבור את
   * האייקון והכיתוב שמתחתיה, כמו בסרטון. `pointerEvents` מבוטל
   * כדי שלא יבלע את הלחיצות שהוא מרחף מעליהן.
   */
  const lens =
    ready && hot >= 0 ? (
      <Animated.View
        pointerEvents="none"
        style={[
          s.lens,
          { width: posW, opacity: lift, transform: [{ translateX: posX }, { scaleY: grow }] },
        ]}
      >
        {glass ? (
          <GlassView
            style={s.lensFill}
            glassEffectStyle="clear"
            isInteractive
            tintColor={LENS_TINT}
          />
        ) : (
          <View style={[s.lensFill, s.lensFlat]} />
        )}
      </Animated.View>
    ) : null;

  const body = (
    <>
      {tabs}
      {lens}
    </>
  );

  const measure = (e: { nativeEvent: { layout: { x: number } } }) => onBar(e.nativeEvent.layout.x);

  if (glass) {
    return (
      <GlassView
        {...pan.panHandlers}
        onLayout={measure}
        style={[s.bar, s.glass]}
        glassEffectStyle="regular"
        isInteractive
        tintColor={GLASS_TINT}
      >
        {body}
      </GlassView>
    );
  }

  return (
    <View {...pan.panHandlers} onLayout={measure} style={s.bar}>
      {body}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 26,
    /* ⚠ **צומצם · 16 בספטמבר 2026** · בקשה של שקד: ״צמצם את הרוחב
       של הנב בר״. היה 18 מכל צד, כלומר כמעט כל רוחב המסך. */
    right: 46,
    left: 46,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: BAR_BG,
    boxShadow: BAR_SHADOW,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 8,
  },
  /* ⚠ הזכוכית מביאה רקע וצל משלה · המילוי והצל שלנו יורדים */
  glass: { backgroundColor: 'transparent', boxShadow: undefined },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  /* ⚠ מרחפת מאחור · `inset` כדי שתתפוס את כל הלשונית פחות מרווח */
  cushion: {
    position: 'absolute',
    top: RIM,
    bottom: RIM,
    right: INSET,
    left: INSET,
    borderRadius: radius.pill,
    backgroundColor: CUSHION,
  },
  /**
   * ⚠ **`left: 0` והזזה, ולא `start`** · הסרגל בכיוון ימין-לשמאל,
   * ו-`start` היה מתהפך מול מיקומים שנמדדו בפיקסלים מהשמאל.
   */
  lens: {
    position: 'absolute',
    top: RIM,
    bottom: RIM,
    left: 0,
    borderRadius: radius.pill,
    boxShadow: LENS_SHADOW,
  },
  lensFill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: radius.pill,
  },
  /* בלי זכוכית של המערכת · אותה כרית סגולה, רק שהיא נוסעת */
  lensFlat: { backgroundColor: CUSHION },
  label: { fontSize: type.tiny },
});
