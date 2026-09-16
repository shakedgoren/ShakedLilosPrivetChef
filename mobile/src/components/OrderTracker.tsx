import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { KITCHEN_CANCELLED, KITCHEN_FLOW } from '../api/status';
import { EASE_OUT, TRACK, useReducedMotion } from '../theme/motion';
import { a } from '../theme/tokens';

/**
 * מעקב הזמנה · ארבעת שלבי המטבח נדלקים בזה אחר זה בכרטיס ההזמנה.
 *
 * ⚠ **אינו מהקנבס** · בחירה של שקד (15 בספטמבר 2026), 480ms לשלב.
 * השלבים אינם טקסט שכתבתי — הם `KITCHEN_FLOW` של השרת מילה במילה.
 *
 * ⚠ **הייתה כאן מנה מכוסה וירדה** · ציירתי מכסה פליז שמתרומם
 * לאורך ההתקדמות, ושקד אמרה שזו לא הייתה הכוונה. המד לפינת השף
 * נדחה לשלב מאוחר יותר, והמסלול כאן משותף לכל הקטגוריות.
 */

/** ארבעת השלבים החיים · ״נמסרה״ הוא הסוף ולא שלב שממתינים בו */
const STAGES = KITCHEN_FLOW.slice(0, 4);
const DONE = KITCHEN_FLOW[4];

/* המסלול · נקודה לכל שלב וקו שמתמלא ביניהן */
const DOT = 9;
const DOT_ON = 13;
const RAIL_H = 2;


/* גווני הפליז · אותה משפחה של עיגול הווי במסך הסיום של פינת השף */

type Accent = { hue: string; deep: string; rgb: string };

/** השלב שבו נמצאת ההזמנה · ‎-1 כשאין מה להראות */
export function stageOf(status: string): number {
  if (status === DONE) return STAGES.length - 1;
  return STAGES.indexOf(status as (typeof STAGES)[number]);
}

type Props = {
  status: string;
  accent: Accent;
};

export function OrderTracker({ status, accent }: Props) {
  const reduced = useReducedMotion();
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

const s = StyleSheet.create({
  wrap: { gap: 10, marginTop: 12 },

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
