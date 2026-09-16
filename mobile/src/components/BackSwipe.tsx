import React from 'react';
import { Dimensions, PanResponder, StyleSheet, View } from 'react-native';
import { useNav } from '../navigation/store';

/**
 * חזרה אחורה בגרירה · שקד ביקשה (16 בספטמבר 2026) ש״אם אני נמצאת
 * בעמוד ואני גוללת מימין לשמאל אני אחזור אחורה״, בנוסף לחץ החזרה.
 *
 * ⚠ **המחווה מתחילה מהקצה הימני בלבד** · בכוונה. באפליקציה יש שורות
 * נגללות לרוחב (התוספות בקוסקוס, הקרוסלה בדף הבית) ובוררי כמות,
 * וגרירה אופקית חופשית באמצע המסך הייתה בולעת אותן. הקצה הוא גם
 * המוסכמה של אייפון, ולכן זו המחווה שהאצבע כבר מכירה.
 *
 * ⚠ **`Capture` ולא הרגיל** · ברגע שילד — `ScrollView`, `Pressable` —
 * תפס את ה-responder, ההורה כבר לא נשאל ב-`onMoveShouldSetPanResponder`.
 * רק שלב ה-capture רץ לפניו. אותו לקח בדיוק כמו ב-`useCategorySwipe`.
 *
 * ⚠ **בלי `touchAction` בדפדפן** · שם זה היה מבטל את הגלילה האופקית
 * של כל השורות שמתחת. במכשיר המאפיין לא קיים ממילא.
 */

/** כמה קרוב לקצה הימני המחווה מתחילה */
const EDGE = 44;
/** כמה צריך למשוך שמאלה כדי שזו תהיה חזרה */
const TRAVEL = 60;
/** תזוזה קטנה מזו היא רעד אצבע ולא גרירה */
const SLOP = 10;

export function BackSwipe({ children }: { children: React.ReactNode }) {
  const { back, canBack } = useNav();
  const startX = React.useRef(0);
  const fired = React.useRef(false);

  /* ⚠ `canBack` ב-ref · אחרת כל מעבר מסך היה בונה PanResponder חדש */
  const able = React.useRef(canBack);
  able.current = canBack;
  const goBack = React.useRef(back);
  goBack.current = back;

  const pan = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: (e) => {
          startX.current = e.nativeEvent.pageX;
          fired.current = false;
          /* ⚠ תמיד false · אחרת שום לחיצה באפליקציה לא הייתה עוברת */
          return false;
        },
        onMoveShouldSetPanResponderCapture: (_e, g) => {
          if (!able.current || fired.current) return false;
          const fromEdge = startX.current >= Dimensions.get('window').width - EDGE;
          return fromEdge && g.dx < -SLOP && Math.abs(g.dx) > Math.abs(g.dy);
        },
        onPanResponderMove: (_e, g) => {
          if (fired.current || g.dx > -TRAVEL) return;
          fired.current = true;
          goBack.current();
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [],
  );

  return (
    <View style={s.fill} {...pan.panHandlers}>
      {children}
    </View>
  );
}

const s = StyleSheet.create({ fill: { flex: 1 } });
