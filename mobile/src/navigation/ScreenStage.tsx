import React from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, useWindowDimensions } from 'react-native';
import { useNav } from './store';

/**
 * ההנפשה של מעבר בין מסכים.
 *
 * ⚠ **שקד בחרה (17 בספטמבר 2026)** · מתוך עשר תצוגות מקדימות:
 * · קדימה — ״קיפול החוצה״ · המסך החדש נפתח מהמרכז החוצה.
 * · אחורה — ״החלקה אופקית״.
 *
 * ⚠ **מונפש המסך **הנכנס** בלבד** · המסך היוצא מוחלף מיד, כי
 * `Router` מרנדר מסך אחד בכל רגע. כדי להנפיש גם אותו צריך להחזיק
 * שני מסכים מרונדרים בו-זמנית, והמסך הישן היה נטען מחדש ומאבד את
 * המצב שהיית בו — למשל שלב בשאלון השף. לכן זו הגרסה שנבחרה.
 *
 * הכיוון נשמר: בחזרה **הכל זז שמאלה**, לכיוון שאליו האצבע מושכת
 * במחוות החזרה, ולכן המסך הנכנס מגיע מימין ומתיישב.
 */

/** משך המעבר · אותו עקום של שאר התנועות באפליקציה */
const FWD_MS = 300;
const BACK_MS = 280;
const EASE = Easing.bezier(0.22, 0.9, 0.28, 1);

/** מאיזה קנה מידה המסך נפתח · ״קיפול החוצה״ */
const FOLD_FROM = 0.62;

export function ScreenStage({ children }: { children: React.ReactNode }) {
  const { screen, navDir, navTick } = useNav();
  const { width } = useWindowDimensions();

  const t = React.useRef(new Animated.Value(1)).current;
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

  /* ⚠ `navTick` ולא `screen` · מסך שחוזר לעצמו עדיין מנפיש */
  React.useEffect(() => {
    if (reduce) {
      t.setValue(1);
      return;
    }
    t.setValue(0);
    Animated.timing(t, {
      toValue: 1,
      duration: navDir === 'back' ? BACK_MS : FWD_MS,
      easing: EASE,
      useNativeDriver: true,
    }).start();
  }, [navTick, navDir, reduce, t]);

  /* ״קיפול החוצה״ · נפתח מהמרכז */
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [FOLD_FROM, 1] });
  /* ״החלקה אופקית״ · נכנס מימין וזז שמאלה, עם האצבע */
  const slide = t.interpolate({ inputRange: [0, 1], outputRange: [width, 0] });

  const style =
    navDir === 'back'
      ? { transform: [{ translateX: slide }] }
      : { opacity: t, transform: [{ scale }] };

  return (
    <Animated.View
      style={[s.fill, style]}
      /* המפתח מאלץ רינדור נקי לכל מסך · בלעדיו התנועה מדלגת */
      key={screen}
    >
      {children}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
});
