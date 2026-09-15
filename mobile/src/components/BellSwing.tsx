import React from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';
import { SWING, useReducedMotion } from '../theme/motion';

/**
 * פעמון שמתנדנד · הפעמון מתנדנד פעמיים כשההתראה מופיעה, ואז נח.
 *
 * ⚠ **אינו מהקנבס** · בחירה של שקד (15 בספטמבר 2026).
 * 700ms לנדנוד, פעמיים, והציר בראש הפעמון.
 *
 * ⚠ **אין `transformOrigin` ב-React Native** · הסיבוב הוא תמיד
 * סביב מרכז הרכיב, ופעמון שמסתובב סביב מרכזו נראה כמו גלגל.
 * לכן הציר מוזז ידנית: מעלים חצי גובה, מסובבים, ומחזירים.
 * סדר השלושה חשוב — כל טרנספורם פועל על מערכת הצירים שאחריו.
 */

type Props = {
  /** גובה הפעמון · ממנו נגזר מיקום הציר */
  size: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

/** נדנוד מדועך · ההגה נחלש בכל תנופה עד שהוא נח */
const ARC = [0, 0.12, 0.3, 0.48, 0.66, 0.82, 1] as const;
const DEG = [0, 1, -0.78, 0.57, -0.36, 0.14, 0] as const;

export function BellSwing({ size, style, children }: Props) {
  const reduced = useReducedMotion();
  const t = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (reduced) return;
    const anim = Animated.loop(
      Animated.timing(t, { toValue: 1, duration: SWING.ms, useNativeDriver: false }),
      { iterations: SWING.times },
    );
    anim.start();
    return () => anim.stop();
  }, [reduced, t]);

  const rotate = t.interpolate({
    inputRange: [...ARC],
    outputRange: DEG.map((d) => `${(d * SWING.deg).toFixed(2)}deg`),
  });

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ translateY: -size / 2 }, { rotate }, { translateY: size / 2 }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
