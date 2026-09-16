import React from 'react';
import { S } from './Sym';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import {
  CTA_DROP,
  CTA_FILL_STOPS,
  CTA_GLASS_STOPS,
  CTA_INK,
  CTA_KNOB_RADIUS,
  CTA_KNOB_SHADOW,
  CTA_RADIUS,
  CTA_SHADOW,
} from '../theme/glass';
import { stopOf } from '../theme/tokens';
import { NO_TOUCH } from '../theme/pointerEvents';
/**
 * הכפתור הסגול הראשי · הגרדיאנט, ערימת הצללים ועיגול החץ
 * מגיעים אחד לאחד מכפתור ״מתחילים את המסע״ ב-Guest.dc.html.
 *
 * ⚠ **גוררים את החץ שמאלה** · בקשה של שקד (16 בספטמבר 2026):
 * ״שכדי לעבור הלאה אליו יהיה איזו אנימציה מגניבה של גרירה של החץ
 * שמאלה״. הכפתור אינו נלחץ סתם — מושכים את הידית לאורך המסלול.
 *
 * ⚠ **הידית עברה מהקצה השמאלי לימני** · בקנבס היא יושבת בשמאל.
 * גרירה שמאלה חייבת להתחיל מימין — שם העין מתחילה לקרוא בעברית —
 * ולכן זו מנוחה חדשה. זה **שינוי לעומת הקנבס**, ונובע ישירות
 * מהבקשה; אם שקד מעדיפה שהידית תישאר בשמאל צריך להפוך את הגרירה.
 */
/**
 * ⚠ **המידות · סבב שלישי, 16 בספטמבר 2026** · הרוחב ירד 250 → 220 →
 * 196 בשלוש בקשות נפרדות של שקד, אחרי שהכיתוב קוצר ל״להתחברות״.
 * `TRAVEL` נגזר מ-W ולכן הגרירה מתקצרת איתו.
 */
const W = 196;
const H = 48;
const KNOB = 38;
const KNOB_INSET = 5;
const ARROW = 16;

/** אורך המסלול · מקצה לקצה, פחות הידית ושני הריפודים */
const TRAVEL = W - KNOB - KNOB_INSET * 2;
/** מאיזה חלק מהמסלול זה נחשב ״הושלם״ · מתחת לזה הידית חוזרת */
const DONE_AT = 0.62;
const SNAP_MS = 170;
const BACK_MS = 260;
/** רמז התנועה במנוחה · דחיפה קטנה שמאלה כדי שיהיה ברור שגוררים */
const HINT_PX = 7;
const HINT_MS = 620;
const HINT_REST_MS = 1500;
/** מתחת לזה זו לחיצה ולא גרירה */
const TAP_PX = 6;

type Props = { label: string; onPress: () => void };

let seq = 0;
const nextId = () => `cta${(seq += 1)}`;

export function PrimaryButton({ label, onPress }: Props) {
  const id = React.useMemo(nextId, []);
  const step = 1 / (CTA_FILL_STOPS.length - 1);

  /** מיקום הידית · 0 במנוחה, ‎-TRAVEL בסוף המסלול */
  const x = React.useRef(new Animated.Value(0)).current;
  /** רמז התנועה · נפרד מ-`x` כדי שגרירה לא תילחם בו */
  const hint = React.useRef(new Animated.Value(0)).current;
  const hintLoop = React.useRef<Animated.CompositeAnimation | null>(null);
  const [reduce, setReduce] = React.useState(false);
  const done = React.useRef(false);

  React.useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setReduce(v))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const stopHint = React.useCallback(() => {
    hintLoop.current?.stop();
    hintLoop.current = null;
    hint.setValue(0);
  }, [hint]);

  const startHint = React.useCallback(() => {
    if (reduce || hintLoop.current) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(hint, {
          toValue: -HINT_PX,
          duration: HINT_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(hint, {
          toValue: 0,
          duration: HINT_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(HINT_REST_MS),
      ]),
    );
    hintLoop.current = loop;
    loop.start();
  }, [hint, reduce]);

  React.useEffect(() => {
    startHint();
    return stopHint;
  }, [startHint, stopHint]);

  /** חזרה למנוחה · אחרי גרירה שלא הושלמה, ואחרי שהפעולה רצה */
  const springBack = React.useCallback(() => {
    Animated.timing(x, {
      toValue: 0,
      duration: BACK_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      done.current = false;
      startHint();
    });
  }, [x, startHint]);

  const complete = React.useCallback(() => {
    if (done.current) return;
    done.current = true;
    stopHint();
    Animated.timing(x, {
      toValue: -TRAVEL,
      duration: SNAP_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onPress();
      springBack();
    });
  }, [onPress, springBack, stopHint, x]);

  const pan = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        /* ⚠ נתפס רק על תנועה אופקית · אחרת הכפתור בולע גלילה אנכית */
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 3,
        onPanResponderGrant: () => stopHint(),
        onPanResponderMove: (_e, g) => {
          if (done.current) return;
          /* רק שמאלה · ולא מעבר לקצה המסלול */
          x.setValue(Math.max(-TRAVEL, Math.min(0, g.dx)));
        },
        onPanResponderRelease: (_e, g) => {
          if (done.current) return;
          if (-g.dx >= TRAVEL * DONE_AT) complete();
          /**
           * ⚠ **הלחיצה מטופלת כאן ולא ב-`Pressable`** · נמדד בדפדפן
           * (16 בספטמבר 2026) שכש-`panHandlers` נפרשׂ על `Pressable`
           * המחוון של הלחיצה גובר, הידית לא זזה כלל, ומה שרץ היה
           * לחיצה רגילה. לכן הכפתור הוא `View` והלחיצה היא פשוט
           * מחווה שכמעט לא זזה.
           */
          else if (Math.abs(g.dx) < TAP_PX && Math.abs(g.dy) < TAP_PX) complete();
          else springBack();
        },
        onPanResponderTerminate: () => springBack(),
      }),
    [complete, springBack, stopHint, x],
  );

  /* ⚠ **לחיצה רגילה גם עובדת** · מי שלא יגלה את הגרירה עדיין צריך
     להצליח להזמין, וזו גם הדרך של קורא מסך. היא מטופלת בתוך
     `onPanResponderRelease` — ראו ההערה שם. */

  const slide = Animated.add(x, hint);
  /* הכיתוב נמוג כשהידית יוצאת לדרך */
  const labelOpacity = x.interpolate({
    inputRange: [-TRAVEL * 0.55, 0],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  /* השובל · לוח בהיר שנחשף מימין לשמאל מאחורי הידית */
  const trail = x.interpolate({
    inputRange: [-TRAVEL, 0],
    outputRange: [0, W],
    extrapolate: 'clamp',
  });

  return (
    <View style={s.wrap}>
      {/* ⚠ **אין כאן הילה** · הייתה שכבת גרדיאנט רדיאלי סגול מטושטשת
          מסביב לכפתור. שקד דיווחה עליה פעמיים כ״זוהר שחור״ — על הרקע
          הכמעט־לבן של המכשיר היא נקראה כלכלוך אפרפר ולא כזוהר. */}
      {/* שכבת הצל · **לא** חותכת. `overflow: 'hidden'` ב-iOS חותך גם
          את הצל החיצוני ומשאיר קצה כהה וקשה. */}
      <View style={s.shade}>
        <View
          accessible
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint="גוררים את החץ שמאלה, או לוחצים"
          onAccessibilityTap={complete}
          style={s.button}
          {...pan.panHandlers}
        >
          {/* גוף הזכוכית */}
          <Svg width="100%" height="100%" style={[StyleSheet.absoluteFill, NO_TOUCH]}>
            <Defs>
              <LinearGradient id={`${id}g`} x1="0" y1="0" x2="0.5" y2="0.866">
                {CTA_GLASS_STOPS.map((c, i) => (
                  <Stop key={c + i} offset={i} {...stopOf(c)} />
                ))}
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" rx={CTA_RADIUS} fill={`url(#${id}g)`} />
          </Svg>

          {/* ⚠ **המילוי בלילך של אופציה 01** · בקשה מפורשת של שקד.
              הוא נכנס מימין ככל שהידית מתקדמת שמאלה. */}
          <Animated.View
            style={[s.fill, NO_TOUCH, { transform: [{ translateX: trail }] }]}
          >
            <Svg width="100%" height="100%">
              <Defs>
                <LinearGradient id={`${id}f`} x1="0" y1="0" x2="0.97" y2="0.24">
                  {CTA_FILL_STOPS.map((c, i) => (
                    <Stop key={c + i} offset={i === 1 ? 0.58 : i * step} {...stopOf(c)} />
                  ))}
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id}f)`} />
            </Svg>
          </Animated.View>

          <Animated.Text style={[s.label, { opacity: labelOpacity }]}>{label}</Animated.Text>

          <Animated.View style={[s.knob, { transform: [{ translateX: slide }] }]}>
            <S k="arrowLeft" size={ARROW} color={CTA_INK} />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { width: W, height: H, alignItems: 'center', justifyContent: 'center' },
  /** נושאת את הצל החיצוני · בלי חיתוך */
  shade: { width: W, height: H, borderRadius: CTA_RADIUS, boxShadow: CTA_DROP },
  button: {
    width: W,
    height: H,
    borderRadius: CTA_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: CTA_SHADOW,
    overflow: 'hidden',
  },
  label: { fontSize: 18, fontWeight: '600', color: CTA_INK },
  fill: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  /**
   * ⚠ **`right` ולא `left`** · הידית נחה בקצה הימני, ומשם נגררת
   * שמאלה. `right` פיזי ולא `end`, כי `end` תלוי ב-`I18nManager`
   * שאינו אמין בדפדפן.
   * ⚠ ריבוע מעוגל ולא עיגול · כך היא נראתה בתצוגה ששקד בחרה.
   */
  knob: {
    position: 'absolute',
    right: KNOB_INSET,
    top: KNOB_INSET,
    width: KNOB,
    height: KNOB,
    borderRadius: CTA_KNOB_RADIUS,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: CTA_KNOB_SHADOW,
  },
});
