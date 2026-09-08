import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { a, surface, type } from '../theme/tokens';
import type { Category } from '../data/categories';

/** שורת הבועות מתחת לכרטיס · לחיצה מחליפה את הקטגוריה הפעילה */
type Props = { items: Category[]; activeKey: string; onPick: (i: number) => void };

export function CategoryRail({ items, activeKey, onPick }: Props) {
  return (
    <View style={s.row}>
      {items.map((it, i) => {
        const on = it.key === activeKey;
        return (
          <Pressable key={it.key} onPress={() => onPick(i)} style={s.col}>
            <View
              style={[
                s.orb,
                {
                  backgroundColor: a(it.rgb, on ? 0.3 : 0.15),
                  transform: [{ translateY: on ? -5 : 0 }, { scale: on ? 1.07 : 1 }],
                },
              ]}
            />
            <Text style={[s.name, { color: on ? surface.ink : '#A79FB2', fontWeight: on ? '600' : '400' }]}>
              {it.short}
            </Text>
            <Text style={[s.tag, { color: on ? it.hue : a(it.rgb, 0.5) }]}>{it.tag}</Text>
            <View style={[s.underline, { backgroundColor: on ? it.hue : 'transparent' }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 2 },
  col: { width: 68, alignItems: 'center', gap: 8 },
  orb: { width: 56, height: 56, borderRadius: 28 },
  name: { fontSize: type.tiny, textAlign: 'center', lineHeight: type.tiny * 1.25 },
  tag: { fontSize: 10, textAlign: 'center', lineHeight: 12.5 },
  underline: { height: 2.5, width: 26, borderRadius: 999 },
});
