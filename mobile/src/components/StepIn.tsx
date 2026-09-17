import React from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';
import { EASE_OUT, STEP_IN, useReducedMotion } from '../theme/motion';

/**
 * כניסה במדרגות · שורות המנות עולות אחת אחרי השנייה כשנכנסים
 * למסך, במקום להופיע כולן בבת אחת.
 *
 * ⚠ **אינה מהקנבס** · בחירה של שקד (15 בספטמבר 2026).
 * 320ms לשורה, הפרש 60ms, עלייה של 10 פיקסלים.
 *
 * ⚠ **ההפרש נעצר אחרי שמונה שורות** · רשימת התוספות של קוסקוס
 * ארוכה, ובלי התקרה השורה האחרונה הייתה מחכה יותר משנייה וחצי
 * לפני שהיא בכלל מתחילה לעלות.
 */

type Props = {
  /** מקום השורה ברשימה · קובע את ההשהיה */
  index: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function StepIn({ index, style, children }: Props) {
  const reduced = useReducedMotion();
  const v = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (reduced) {
      v.setValue(1);
      return;
    }
    const anim = Animated.timing(v, {
      toValue: 1,
      duration: STEP_IN.ms,
      /* ⚠ `lead` · המסך עצמו עולה קודם, ורק אז הפריטים · ראו `STEP_IN` */
      delay: STEP_IN.lead + Math.min(index, STEP_IN.maxSteps) * STEP_IN.stagger,
      easing: EASE_OUT,
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [index, reduced, v]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [STEP_IN.rise, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
