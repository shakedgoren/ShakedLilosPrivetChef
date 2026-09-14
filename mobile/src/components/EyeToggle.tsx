import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { surface } from '../theme/tokens';

/**
 * מתג ״הצג סיסמה״ · עין פקוחה כשהסיסמה מוסתרת, עין חצויה כשהיא גלויה.
 *
 * ⚠ לא מהקנבס · שקד ביקשה אותו (14 בספטמבר). האייקון מצויר כאן ולא
 * ב-`icons/index.tsx`, כי הקובץ ההוא נוצר אוטומטית מהקנבס ואסור
 * לערוך אותו ביד — הרצה הבאה של ה-emitter הייתה מוחקת את התוספת.
 */
const GLYPH = 18;
const HIT = 8;

type Props = {
  /** האם הסיסמה גלויה כרגע */
  shown: boolean;
  onToggle: () => void;
};

export function EyeToggle({ shown, onToggle }: Props) {
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={HIT}
      accessibilityRole="button"
      accessibilityLabel={shown ? 'הסתרת הסיסמה' : 'הצגת הסיסמה'}
      style={s.button}
    >
      <Svg width={GLYPH} height={GLYPH} viewBox="0 0 24 24" fill="none">
        <Path
          d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"
          stroke={surface.faint}
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={12} cy={12} r={3} stroke={surface.faint} strokeWidth={1.7} />
        {shown ? (
          <Path d="M4 20L20 4" stroke={surface.faint} strokeWidth={1.7} strokeLinecap="round" />
        ) : null}
      </Svg>
    </Pressable>
  );
}

const s = StyleSheet.create({
  /* יושב בתוך שורת הסיסמה · המיקום נקבע על ידי הקורא */
  button: { alignItems: 'center', justifyContent: 'center' },
});
