import React from 'react';
import { S } from './Sym';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  PanResponder,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import {
  CTA_DROP,
  CTA_KNOB_EDGE,
  CTA_KNOB_FILL,
  CTA_LABEL_INK,
  CTA_PILL_STOPS,
  CTA_SHADOW,
  CTA_SLIDE_STOPS,
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
 * ⚠ **החלקה אמיתית · 19 בספטמבר 2026** · בקשה של שקד: ״הוא אמור
 * להיות כפתור שמחליקים אותו מימין לשמאל, ואז זה עובר כמו שהיה
 * בפתיחה הישנה של האייפון״. שני דברים היו חסרים:
 *
 * · **לחיצה פתחה אותו.** עד היום מגע שכמעט לא זז נספר כ״לחיצה״
 *   והפעיל את הכפתור, ולכן הוא לא היה באמת כפתור החלקה. עכשיו
 *   לחיצה רק **מרמזת** — הידית קופצת שמאלה וחוזרת — וההחלקה היא
 *   הדרך היחידה לעבור. בדיוק כמו במסך הנעילה הישן.
 * · **הכיתוב לא הבהב.** הברק שעובר על ״slide to unlock״ הוא
 *   החתימה של אותו כפתור, והוא מה שאומר לעין שיש כאן מה לגרור.
 *   `SHEEN` למטה הוא אותו פס אור.
 *
 * ⚠ **קורא מסך אינו מחליק** · `onAccessibilityTap` ממשיך להפעיל
 * את הכפתור ישירות, ולכן המחווה אינה חוסמת אף אחד.
 *
 * ⚠ **הידית עברה מהקצה השמאלי לימני** · בקנבס היא יושבת בשמאל.
 * גרירה שמאלה חייבת להתחיל מימין — שם העין מתחילה לקרוא בעברית —
 * ולכן זו מנוחה חדשה. זה **שינוי לעומת הקנבס**, ונובע ישירות
 * מהבקשה; אם שקד מעדיפה שהידית תישאר בשמאל צריך להפוך את הגרירה.
 */
/**
 * ⚠ **המידות · סבב רביעי, 19 בספטמבר 2026** · הרוחב ירד 250 → 220 →
 * 196 → 168 בארבע בקשות נפרדות של שקד. `TRAVEL` נגזר מ-W ולכן
 * הגרירה מתקצרת איתו — וזה גם עוזר למחווה, כי המסלול קצר יותר.
 *
 * ⚠ **הפינות מעוגלות יותר** · ״טיפה טיפה תעגל לו את הקצוות״ ·
 * 14 ⟵ 18. `RADIUS` מקומי ולא `CTA_RADIUS`, כי הכפתור הזה הוא
 * היחיד שמשתמש בו וכך שאר הערכת הזכוכית נשארת כפי שהיא בקנבס.
 */
const W = 168;
const RADIUS = 18;
const H = 48;
const KNOB = 38;
const KNOB_INSET = 5;
const ARROW = 16;

/** אורך המסלול · מקצה לקצה, פחות הידית ושני הריפודים */
const TRAVEL = W - KNOB - KNOB_INSET * 2;
/** מאיזה חלק מהמסלול זה נחשב ״הושלם״ · מתחת לזה הידית חוזרת */
const DONE_AT = 0.55;
const SNAP_MS = 170;
const BACK_MS = 260;
/** רמז התנועה במנוחה · דחיפה קטנה שמאלה כדי שיהיה ברור שגוררים */
const HINT_PX = 7;
const HINT_MS = 620;
const HINT_REST_MS = 1500;
/** מתחת לזה זו לחיצה ולא גרירה · ולחיצה רק מרמזת, ראו `nudge` */
const TAP_PX = 6;
/** פס האור שעובר על הכיתוב · רוחבו, זמן המעבר והמנוחה שבין סבב לסבב */
const SHEEN_W = 62;
const SHEEN_MS = 1250;
const SHEEN_REST_MS = 1700;
/** הקפיצה שמקבלת לחיצה · מלמדת שגוררים, ולא מפעילה */
const NUDGE_PX = 18;
const NUDGE_MS = 150;

type Props = { label: string; onPress: () => void };

let seq = 0;
const nextId = () => `cta${(seq += 1)}`;

export function PrimaryButton({ label, onPress }: Props) {
  const id = React.useMemo(nextId, []);
  const step = 1 / (CTA_SLIDE_STOPS.length - 1);

  /** מיקום הידית · 0 במנוחה, ‎-TRAVEL בסוף המסלול */
  const x = React.useRef(new Animated.Value(0)).current;
  /** רמז התנועה · נפרד מ-`x` כדי שגרירה לא תילחם בו */
  const hint = React.useRef(new Animated.Value(0)).current;
  const hintLoop = React.useRef<Animated.CompositeAnimation | null>(null);
  /** הברק · לולאה עצמאית שאינה מושפעת מהגרירה */
  const sheen = React.useRef(new Animated.Value(0)).current;
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

  /* הברק · רץ כל עוד לא ביקשו פחות תנועה */
  React.useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sheen, {
          toValue: 1,
          duration: SHEEN_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(SHEEN_REST_MS),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, sheen]);

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

  /**
   * ⚠ **לחיצה מרמזת · אינה מפעילה** · הידית קופצת שמאלה וחוזרת.
   * כך מי שלחץ מבין מיד שצריך לגרור, במקום ללחוץ שוב ושוב.
   */
  const nudge = React.useCallback(() => {
    if (done.current) return;
    stopHint();
    Animated.sequence([
      Animated.timing(x, {
        toValue: -NUDGE_PX,
        duration: NUDGE_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(x, { toValue: 0, useNativeDriver: true, bounciness: 12 }),
    ]).start(() => startHint());
  }, [startHint, stopHint, x]);

  const pan = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        /* ⚠ נתפס רק על תנועה אופקית · אחרת הכפתור בולע גלילה אנכית */
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 2,
        /**
         * ⚠ **תופסים לפני הגלילה · 19 בספטמבר 2026** · שקד דיווחה:
         * ״הכפתור כאילו לא קולט טוב את האצבע, לא מובן לי מה קורה
         * שם״. זו הסיבה, ויש לה שני חלקים:
         *
         * · דף הבית הוא `ScrollView`. ברגע שהאצבע זזה, הגלילה
         *   **מבקשת את המחווה בחזרה** — ו-`PanResponder` מוותר לה
         *   כברירת מחדל. הידית פשוט נעצרה באמצע הגרירה.
         *   `onPanResponderTerminationRequest` שמחזיר `false` הוא
         *   מה שמסרב לוותר.
         * · הלכידה (`Capture`) תופסת את התנועה האופקית **לפני**
         *   שהגלילה מספיקה להתחיל, ולא אחריה.
         */
        onMoveShouldSetPanResponderCapture: (_e, g) =>
          Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 2,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => stopHint(),
        onPanResponderMove: (_e, g) => {
          if (done.current) return;
          /* רק שמאלה · ולא מעבר לקצה המסלול */
          x.setValue(Math.max(-TRAVEL, Math.min(0, g.dx)));
        },
        onPanResponderRelease: (e, g) => {
          if (done.current) return;
          if (-g.dx >= TRAVEL * DONE_AT) complete();
          /**
           * ⚠ **לחיצה מרמזת · 19 בספטמבר 2026** · כאן היא קראה
           * ל-`complete()`, ולכן הכפתור נפתח בלחיצה ולא היה באמת
           * כפתור החלקה. ראו את ההערה בראש הקובץ.
           *
           * ⚠ **המגע מטופל כאן ולא ב-`Pressable`** · נמדד בדפדפן
           * (16 בספטמבר 2026) שכש-`panHandlers` נפרשׂ על `Pressable`
           * המחוון של הלחיצה גובר והידית לא זזה כלל.
           */
          else if (Math.abs(g.dx) < TAP_PX && Math.abs(g.dy) < TAP_PX) {
            /**
             * ⚠ **לחיצה בעכבר בדפדפן ממשיכה** · 23 בספטמבר 2026.
             * באפליקציה לחיצה רק מרמזת, כי ההחלקה היא הדרך. בדפדפן
             * השולחני אין מחווה טבעית, והכפתור נראה תקוע. מגע אצבע
             * (`touchend`) נשאר רמז; עכבר (`mouseup`) ממשיך.
             */
            const kind = (e.nativeEvent as { type?: string }).type;
            if (Platform.OS === 'web' && kind === 'mouseup') complete();
            else nudge();
          }
          else springBack();
        },
        onPanResponderTerminate: () => springBack(),
      }),
    [complete, nudge, springBack, stopHint, x],
  );

  /* ⚠ **לחיצה אינה מפעילה יותר** · היא מרמזת בלבד, ראו `nudge`.
     הדרך של קורא מסך היא `onAccessibilityTap` שעל הכפתור. */

  const slide = Animated.add(x, hint);
  /* הכיתוב נמוג כשהידית יוצאת לדרך */
  const labelOpacity = x.interpolate({
    inputRange: [-TRAVEL * 0.55, 0],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  /* הברק · מהקצה הימני אל מחוץ לקצה השמאלי */
  const sheenX = sheen.interpolate({
    inputRange: [0, 1],
    outputRange: [W, -SHEEN_W],
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
              {/* ⚠ אנכי · כך הוא בתמונה של שקד, ולא באלכסון של הקנבס */}
              <LinearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
                {CTA_PILL_STOPS.map((c, i) => (
                  <Stop key={c + i} offset={i} {...stopOf(c)} />
                ))}
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" rx={RADIUS} fill={`url(#${id}g)`} />
          </Svg>

          {/* ⚠ **המילוי בלילך של אופציה 01** · בקשה מפורשת של שקד.
              הוא נכנס מימין ככל שהידית מתקדמת שמאלה. */}
          <Animated.View
            style={[s.fill, NO_TOUCH, { transform: [{ translateX: trail }] }]}
          >
            <Svg width="100%" height="100%">
              <Defs>
                <LinearGradient id={`${id}f`} x1="0" y1="0" x2="0.97" y2="0.24">
                  {CTA_SLIDE_STOPS.map((c, i) => (
                    <Stop key={c + i} offset={i === 1 ? 0.58 : i * step} {...stopOf(c)} />
                  ))}
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id}f)`} />
            </Svg>
          </Animated.View>

          <Animated.Text style={[s.label, { opacity: labelOpacity }]}>{label}</Animated.Text>

          {/* ⚠ **הברק** · פס אור מוטה שעובר על הכיתוב, כמו במסך
              הנעילה הישן. נמוג יחד עם הכיתוב ברגע שגוררים. */}
          {reduce ? null : (
            <Animated.View
              style={[
                s.sheen,
                NO_TOUCH,
                { opacity: labelOpacity, transform: [{ translateX: sheenX }, { skewX: '-16deg' }] },
              ]}
            />
          )}

          <Animated.View style={[s.knob, { transform: [{ translateX: slide }] }]}>
            {/* ⚠ **סמל אמיתי ולא חץ** · בתמונה של שקד יש בידית סמל
                כניסה — דלת עם חץ. `login` הוא SF Symbol אמיתי,
                ובדפדפן ובאנדרואיד הוא Material Symbols. */}
            <S k="login" size={ARROW} color="#FFFFFF" />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { width: W, height: H, alignItems: 'center', justifyContent: 'center' },
  /** נושאת את הצל החיצוני · בלי חיתוך */
  shade: { width: W, height: H, borderRadius: RADIUS, boxShadow: CTA_DROP },
  button: {
    width: W,
    height: H,
    borderRadius: RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: CTA_SHADOW,
    overflow: 'hidden',
  },
  /**
   * ⚠ **הכיתוב ממורכז במסלול ולא בכפתור · 19 בספטמבר 2026** · אחרי
   * שהרוחב ירד ל-168 הידית כיסתה את האות האחרונה של ״להתחברות״.
   * השארת מקום לידית והמרכוז בתוך מה שנשאר פותרים את זה בלי
   * להקטין את הגופן ובלי להחזיר רוחב.
   * ⚠ `lineHeight: H` הוא מה שממרכז לגובה · `textAlignVertical`
   * אינו קיים ב-iOS.
   */
  label: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: KNOB + KNOB_INSET * 2,
    textAlign: 'center',
    lineHeight: H,
    fontSize: 18,
    /* ⚠ לבן ומודגש · כך הוא בתמונה. היה 600 בגוון סגול כהה */
    fontWeight: '700',
    color: CTA_LABEL_INK,
  },
  fill: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  /* ⚠ פס האור · נחתך על ידי `overflow: 'hidden'` של הכפתור */
  sheen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SHEEN_W,
    backgroundColor: 'rgba(255,255,255,0.30)',
  },
  /**
   * ⚠ **`right` ולא `left`** · הידית נחה בקצה הימני, ומשם נגררת
   * שמאלה. `right` פיזי ולא `end`, כי `end` תלוי ב-`I18nManager`
   * שאינו אמין בדפדפן.
   * ⚠ **עיגול מלא בסגול · 26 בספטמבר 2026** · היה ריבוע מעוגל
   * לבן. בתמונה ששקד שלחה הידית היא עיגול סגול מלא עם סמל לבן
   * בתוכו ושפה תחתונה כהה שנותנת לו נפח.
   */
  knob: {
    position: 'absolute',
    right: KNOB_INSET,
    top: KNOB_INSET,
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: CTA_KNOB_FILL,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: CTA_KNOB_EDGE,
  },
});
