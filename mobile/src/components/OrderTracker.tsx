import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { KITCHEN_CANCELLED, KITCHEN_FLOW } from '../api/status';
import { EASE_OUT, TRACK, useReducedMotion } from '../theme/motion';
import { a } from '../theme/tokens';

/**
 * מעקב הזמנה · ארבעת שלבי המטבח נדלקים בזה אחר זה בכרטיס ההזמנה.
 *
 * ⚠ **אינו מהקנבס** · בחירה של שקד (15 בספטמבר 2026), 480ms לשלב.
 * השלבים אינם טקסט שכתבתי — הם `KITCHEN_FLOW` של השרת מילה במילה.
 *
 * ⚠ **לפינת השף יש מד משלה** · שקד ביקשה ״משהו יותר יוקרתי, כמו
 * שהיה באתר הקודם — מנה מכוסה״. באתר הקודם אין לי גישה, ולכן
 * המנה המכוסה כאן **מצוירת מחדש** בגווני הפליז של מסך הסיום של
 * פינת השף: המכסה מתרומם ככל שההזמנה מתקדמת, ומתגלה מתחתיו
 * המנה עם האדים. אם זה לא מה שהיה שם — תגידי ואשנה.
 */

/** ארבעת השלבים החיים · ״נמסרה״ הוא הסוף ולא שלב שממתינים בו */
const STAGES = KITCHEN_FLOW.slice(0, 4);
const DONE = KITCHEN_FLOW[4];

/* המסלול · נקודה לכל שלב וקו שמתמלא ביניהן */
const DOT = 9;
const DOT_ON = 13;
const RAIL_H = 2;

/* המנה המכוסה · viewBox 112×96, והמכסה מתרומם 24 יחידות */
const CLOCHE = { w: 104, h: 89, box: '0 0 112 96' } as const;
const LIFT = 24;
const DOME = 'M14 78 A 42 38 0 0 1 98 78 Z';
const FOOD = 'M36 80 C 42 57, 70 57, 76 80 Z';
/**
 * ⚠ **היו כאן אדים ואין** · שלושה קווי אדים מעל המנה נבלעו מאחורי
 * המכסה המורם — נמדד בדפדפן: הרווח בין שפת המכסה לראש המנה הוא
 * שמונה יחידות בלבד, ואי אפשר לצייר בו כלום. להגדיל את ההרמה היה
 * מוציא את הכפתור מחוץ למסגרת.
 */

/* גווני הפליז · אותה משפחה של עיגול הווי במסך הסיום של פינת השף */
const BRASS = ['#FAF1E8', '#EBCFAF', '#C08A52'] as const;
const PLATE = ['#E7D6C0', '#A8763E'] as const;

type Accent = { hue: string; deep: string; rgb: string };

let seq = 0;
const nextId = () => `trk${(seq += 1)}`;

/** השלב שבו נמצאת ההזמנה · ‎-1 כשאין מה להראות */
export function stageOf(status: string): number {
  if (status === DONE) return STAGES.length - 1;
  return STAGES.indexOf(status as (typeof STAGES)[number]);
}

type Props = {
  status: string;
  accent: Accent;
  /** פינת השף · המנה המכוסה במקום המסלול לבדו */
  chef?: boolean;
};

export function OrderTracker({ status, accent, chef = false }: Props) {
  const reduced = useReducedMotion();
  const id = React.useMemo(nextId, []);
  const at = stageOf(status);

  /**
   * ⚠ מתחיל מתחת לאפס · הנקודה הראשונה צריכה **להידלק**, ואם
   * הערך יוצא מ-0 היא כבר דלוקה בפריים הראשון ואין מה לראות.
   */
  const p = React.useRef(new Animated.Value(-1)).current;

  React.useEffect(() => {
    if (at < 0) return;
    if (reduced) {
      p.setValue(at);
      return;
    }
    const anim = Animated.timing(p, {
      toValue: at,
      duration: TRACK.ms * (at + 1),
      easing: EASE_OUT,
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [at, p, reduced]);

  /* הזמנה שבוטלה או מצב שאינו במסלול · אין מה לעקוב אחריו */
  if (at < 0 || status === KITCHEN_CANCELLED) return null;

  const last = STAGES.length - 1;
  const fill = p.interpolate({
    inputRange: [0, last],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={s.wrap}>
      {chef ? <Cloche id={id} p={p} last={last} /> : null}

      <View>
        {/* ⚠ המסלול מתוח בין **מרכזי** הנקודות · אחרת המילוי מגיע
            ל-100% חצי נקודה אחרי האחרונה. `right` פיזי, כי
            האפליקציה תמיד RTL ו-`I18nManager.isRTL` אינו אמין בדפדפן. */}
        <View style={[s.lane, { backgroundColor: a(accent.rgb, 0.16) }]}>
          <Animated.View style={[s.fill, { width: fill, backgroundColor: accent.hue }]} />
        </View>

        <View style={s.dots}>
          {STAGES.map((name, i) => {
            const lit = p.interpolate({
              inputRange: [i - 0.6, i],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            });
            return (
              <View key={name} style={s.node}>
                <Animated.View
                  style={[
                    s.dot,
                    {
                      backgroundColor: accent.hue,
                      opacity: lit.interpolate({ inputRange: [0, 1], outputRange: [0.22, 1] }),
                      transform: [
                        { scale: lit.interpolate({ inputRange: [0, 1], outputRange: [DOT / DOT_ON, 1] }) },
                      ],
                    },
                  ]}
                />
                <Animated.Text
                  style={[
                    s.label,
                    {
                      color: accent.deep,
                      opacity: lit.interpolate({ inputRange: [0, 1], outputRange: [0.34, 1] }),
                    },
                  ]}
                >
                  {name}
                </Animated.Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/**
 * המנה המכוסה · המכסה מתרומם ככל שההזמנה מתקדמת.
 * ⚠ שתי שכבות נפרדות · הצלחת נשארת במקומה והמכסה זז, ולכן אי
 * אפשר לצייר את שתיהן ב-SVG אחד ולהזיז אותו.
 */
function Cloche({ id, p, last }: { id: string; p: Animated.Value; last: number }) {
  const lift = p.interpolate({ inputRange: [0, last], outputRange: [0, -LIFT], extrapolate: 'clamp' });
  return (
    <View style={s.cloche}>
      <Svg width={CLOCHE.w} height={CLOCHE.h} viewBox={CLOCHE.box} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={`${id}p`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={PLATE[0]} />
            <Stop offset="1" stopColor={PLATE[1]} />
          </LinearGradient>
        </Defs>
        <Path d={FOOD} fill="#B5773F" opacity={0.92} />
        <Ellipse cx="56" cy="82" rx="50" ry="7" fill={`url(#${id}p)`} />
        <Ellipse cx="56" cy="80" rx="50" ry="7" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" />
      </Svg>

      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ translateY: lift }] }]}
        pointerEvents="none"
      >
        <Svg width={CLOCHE.w} height={CLOCHE.h} viewBox={CLOCHE.box}>
          <Defs>
            <LinearGradient id={`${id}d`} x1="0.18" y1="0" x2="0.9" y2="1">
              <Stop offset="0" stopColor={BRASS[0]} />
              <Stop offset="0.36" stopColor={BRASS[1]} />
              <Stop offset="1" stopColor={BRASS[2]} />
            </LinearGradient>
          </Defs>
          <Path d={DOME} fill={`url(#${id}d)`} />
          <Path d="M30 72 A 30 26 0 0 1 52 44" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="3" strokeLinecap="round" />
          <Rect x="53" y="32" width="6" height="10" rx="3" fill={BRASS[2]} />
          <Ellipse cx="56" cy="30" rx="6" ry="6" fill={`url(#${id}d)`} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 10, marginTop: 12 },
  cloche: { width: CLOCHE.w, height: CLOCHE.h, alignSelf: 'center' },

  lane: {
    position: 'absolute',
    top: (DOT_ON - RAIL_H) / 2,
    right: DOT_ON / 2,
    left: DOT_ON / 2,
    height: RAIL_H,
    borderRadius: RAIL_H,
  },
  fill: { position: 'absolute', top: 0, right: 0, bottom: 0, borderRadius: RAIL_H },

  dots: { flexDirection: 'row', justifyContent: 'space-between' },
  node: { alignItems: 'center', gap: 5 },
  dot: { width: DOT_ON, height: DOT_ON, borderRadius: DOT_ON / 2 },
  label: { fontSize: 10.5, fontWeight: '600' },
});
