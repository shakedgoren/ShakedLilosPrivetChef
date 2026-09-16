import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { S } from './Sym';

/**
 * מתג ״הצג סיסמה״ · עין פקוחה כשהסיסמה מוסתרת, עין חצויה כשהיא גלויה.
 *
 * ⚠ לא מהקנבס · שקד ביקשה אותו (14 בספטמבר).
 *
 * ⚠ **עבר ל-SF Symbols** (16 בספטמבר) · `eye.fill` כשהסיסמה נסתרת
 * ו-`eye.slash.fill` כשהיא גלויה, שניהם ב-bounce. שני הסמלים
 * וכיוון הסימון הם בדיוק כפי ששקד כתבה אותם.
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
      <S k={shown ? 'eyeOpen' : 'eyeShut'} size={GLYPH} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center' },
});
