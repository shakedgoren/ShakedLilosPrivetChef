import React from 'react';
import { StyleSheet, Text, Animated, type StyleProp, type TextStyle } from 'react-native';
import { EASE_OUT, ROLL, useReducedMotion } from '../theme/motion';

/**
 * סה״כ שמתגלגל · הסכום רץ למספר החדש במקום לקפוץ אליו.
 *
 * ⚠ **אינו מהקנבס** · בחירה של שקד (15 בספטמבר 2026). 400ms,
 * והספרות בעמודה קבועה כדי שהמחיר לא ירקוד בזמן הריצה.
 *
 * ⚠ **המצב נשמר ב-state ולא ב-`Animated`** · טקסט ב-React Native
 * אינו מקבל ערך מונפש, ולכן המאזין מעדכן מספר רגיל. זה מצייר מחדש
 * שורה אחת, ורק בזמן הגלגול.
 */

type Props = {
  value: number;
  style?: StyleProp<TextStyle>;
};

export function RollingTotal({ value, style }: Props) {
  const reduced = useReducedMotion();
  const v = React.useRef(new Animated.Value(value)).current;
  const [shown, setShown] = React.useState(value);

  React.useEffect(() => {
    if (reduced) {
      v.setValue(value);
      setShown(value);
      return;
    }
    const id = v.addListener((e) => setShown(Math.round(e.value)));
    const anim = Animated.timing(v, {
      toValue: value,
      duration: ROLL.ms,
      easing: EASE_OUT,
      useNativeDriver: false,
    });
    /* הנחיתה מדויקת · עיגול של הפריים האחרון יכול לפספס בשקל */
    anim.start(() => setShown(value));
    return () => {
      anim.stop();
      v.removeListener(id);
    };
  }, [value, reduced, v]);

  return <Text style={[s.num, style]}>{shown}</Text>;
}

const s = StyleSheet.create({
  /** ⚠ ספרות ברוחב אחיד · בלי זה השורה זזה בכל פריים של הגלגול */
  num: { fontVariant: ['tabular-nums'] },
});
