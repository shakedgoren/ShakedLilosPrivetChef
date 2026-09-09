import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Minus, Plus } from '../icons';

const OFF = '#C0B9CA';
const ON = '#2A2430';
/* מידות האייקון בקנבס · 13 פיקסלים, עובי 2.4 */
const GLYPH = 13;
const GLYPH_STROKE = 2.4;
/* צבע הפלוס בקנבס · קבוע, בשונה מהמינוס שנצבע לפי הכמות */
const PLUS_INK = '#43307A';

/** בורר כמות · מינוס מימין ופלוס משמאל, כמו בקנבס */
type Props = { value: number; onChange: (next: number) => void; min?: number };

export function Stepper({ value, onChange, min = 0 }: Props) {
  return (
    <View style={s.row}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={[s.key, value <= min && s.keyOff]}
        hitSlop={8}
      >
        <Minus size={GLYPH} color={value <= min ? OFF : ON} strokeWidth={GLYPH_STROKE} />
      </Pressable>

      <Text style={[s.value, { color: value === 0 ? OFF : ON }]}>{value}</Text>

      <Pressable onPress={() => onChange(value + 1)} style={s.key} hitSlop={8}>
        <Plus size={GLYPH} color={PLUS_INK} strokeWidth={GLYPH_STROKE} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
