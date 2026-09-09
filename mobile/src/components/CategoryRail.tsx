import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { a, surface, type } from '../theme/tokens';
import { orbShadow } from '../theme/glass';
import type { Category } from '../data/categories';
import { CategoryIcon } from './CategoryIcon';
import { Orb } from './Orb';

/**
 * שורת הבועות מתחת לכרטיס · לחיצה מחליפה את הקטגוריה הפעילה.
 * הבועה, ההילה והאייקון מגיעים מאותה שפה שבקנבס — בועה של 56
 * פיקסלים שמתרוממת ב-5 ומתנפחת ל-1.07 כשהיא הפעילה.
 */
type Props = { items: Category[]; activeKey: string; onPick: (i: number) => void };

/** מידות הבועה והאייקון · מהקנבס */
const ORB = 56;
const GLYPH = 27;

export function CategoryRail({ items, activeKey, onPick }: Props) {
  return (
    <View style={s.row}>
      {items.map((it, i) => {
        const on = it.key === activeKey;
        const ink = on ? it.hue : a(it.rgb, 0.55);
        return (
          <Pressable key={it.key} onPress={() => onPick(i)} style={s.col}>
            <View style={[s.lift, { transform: [{ translateY: on ? -5 : 0 }, { scale: on ? 1.07 : 1 }] }]}>
              <Orb
                rgb={it.rgb}
                size={ORB}
                shadow={orbShadow(it.rgb, on)}
                tint={on ? 0.3 : 0.15}
                halo={on ? 0.42 : 0.14}
              >
                <CategoryIcon categoryKey={it.key} size={GLYPH} color={ink} />
              </Orb>
            </View>
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
  lift: { width: ORB, height: ORB },
  name: { fontSize: type.tiny, textAlign: 'center', lineHeight: type.tiny * 1.25 },
  tag: { fontSize: 10, textAlign: 'center', lineHeight: 12.5 },
  underline: { height: 2.5, width: 26, borderRadius: 999 },
});
