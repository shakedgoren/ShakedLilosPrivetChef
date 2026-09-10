import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Minus, Plus } from '../icons';
import { IS_RTL } from '../theme/rtl';

const OFF = '#C0B9CA';
const ON = '#2A2430';
/* מידות האייקון בקנבס · 13 פיקסלים, עובי 2.4 */
const GLYPH = 13;
const GLYPH_STROKE = 2.4;
/* צבע הפלוס בקנבס · קבוע, בשונה מהמינוס שנצבע לפי הכמות */
const PLUS_INK = '#43307A';

/**
 * בורר כמות · הפלוס תמיד מימין לכמות והמינוס תמיד משמאל,
 * בכל מסך באפליקציה. שקד ביקשה את זה מפורשות.
 *
 * הסדר ב-JSX הוא פלוס · כמות · מינוס, ולכן ב-RTL (`row`) הפלוס
 * נוחת בימין. אם הכיוון יתהפך אי פעם, `row-reverse` שומר על אותו
 * סידור ויזואלי — הכיוון לא נלקח מ-I18nManager אלא מ-rtl.ts.
 */
type Props = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  /** פורש את הכפתורים לקצוות ומשאיר את הכמות באמצע · מגשי הפירות */
  wide?: boolean;
  /** רקע הכפתור · ברירת המחדל היא הסגול העדין של הקנבס */
  keyColor?: string;
  /** צבע הפלוס והמינוס בתוך הכפתור */
  glyphColor?: string;
};

export function Stepper({ value, onChange, min = 0, wide, keyColor, glyphColor }: Props) {
  const keyStyle = keyColor ? { backgroundColor: keyColor } : undefined;
  const plusInk = glyphColor ?? PLUS_INK;
  const minusInk = glyphColor ?? ON;
  return (
    <View style={[s.row, wide && s.wide]}>
      <Pressable onPress={() => onChange(value + 1)} style={[s.key, keyStyle]} hitSlop={8}>
        <Plus size={GLYPH} color={plusInk} strokeWidth={GLYPH_STROKE} />
      </Pressable>

      <Text style={[s.value, wide && s.grow, { color: value === 0 ? OFF : ON }]}>{value}</Text>

      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={[s.key, keyStyle, value <= min && s.keyOff]}
        hitSlop={8}
      >
        <Minus size={GLYPH} color={value <= min ? OFF : minusInk} strokeWidth={GLYPH_STROKE} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: IS_RTL ? 'row' : 'row-reverse', alignItems: 'center', gap: 10 },
  /* הכפתורים נצמדים לקצוות והכמות נשארת באמצע */
  wide: { alignSelf: 'stretch', gap: 0 },
  grow: { flex: 1 },
  key: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(130,112,162,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyOff: { opacity: 0.4 },
  value: { minWidth: 22, textAlign: 'center', fontSize: 16, fontWeight: '600' },
});
