import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { surface } from '../theme/tokens';

const OFF = '#C0B9CA';
const ON = '#2A2430';

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
        <Text style={s.glyph}>−</Text>
      </Pressable>

      <Text style={[s.value, { color: value === 0 ? OFF : ON }]}>{value}</Text>

      <Pressable onPress={() => onChange(value + 1)} style={s.key} hitSlop={8}>
        <Text style={s.glyph}>+</Text>
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
  glyph: { fontSize: 17, color: surface.inkSoft, lineHeight: 20 },
  value: { minWidth: 22, textAlign: 'center', fontSize: 16, fontWeight: '600' },
});
