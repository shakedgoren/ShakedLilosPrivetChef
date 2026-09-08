import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { surface } from '../../theme/tokens';

/* צבעי הצ׳יפ הכבוי · זהים בכל מסכי הניהול בקנבס */
const OFF_BG = 'rgba(255,255,255,0.7)';
const OFF_BD = 'rgba(130,112,162,0.16)';

type Props = {
  label: string;
  on: boolean;
  onPress: () => void;
  /** הגוון של המצב הדלוק · rgb לשקיפויות ו-deep לטקסט */
  tint: { rgb: string; deep: string; hue?: string };
  /** מונה קטן מתחת לתווית · לשוניות הסינון */
  count?: number;
  style?: ViewStyle;
  fontSize?: number;
};

/** צ׳יפ בחירה · אבן הבניין החוזרת בכל מסכי הניהול */
export function Chip({ label, on, onPress, tint, count, style, fontSize = 12.5 }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        s.chip,
        {
          backgroundColor: on ? `rgba(${tint.rgb},0.1)` : OFF_BG,
          borderColor: on ? `rgba(${tint.rgb},0.42)` : OFF_BD,
        },
        style,
      ]}
    >
      <Text
        style={[
          s.label,
          { fontSize, color: on ? tint.deep : surface.inkSoft, fontWeight: on ? '600' : '400' },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {count === undefined ? null : (
        <Text style={[s.count, { color: on ? tint.hue ?? tint.deep : '#A79FB2' }]}>{count}</Text>
      )}
    </Pressable>
  );
}

/** שורת צ׳יפים · כולם ברוחב שווה */
export function ChipRow({ children }: { children: React.ReactNode }) {
  return <View style={s.row}>{children}</View>;
}

const s = StyleSheet.create({
  chip: {
    borderRadius: 13,
    borderWidth: 1.5,
    minHeight: 38,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { textAlign: 'center' },
  count: { fontSize: 10, fontWeight: '500' },
  row: { flexDirection: 'row', gap: 6 },
});
