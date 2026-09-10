import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { a, surface, type } from '../theme/tokens';
import { orbShadow } from '../theme/glass';
import type { Category } from '../data/categories';
import { CategoryIcon } from './CategoryIcon';
import { Orb } from './Orb';
import { SWIPE_SURFACE, useCategorySwipe } from './useCategorySwipe';

/**
 * שורת הבועות מתחת לכרטיס · לחיצה מחליפה קטגוריה, וגם החלקה
 * לרוחב השורה מחליפה — אותה מחווה בדיוק כמו על הכרטיס.
 *
 * ⚠ הבועה קטנה מזו שבקנבס (46 במקום 56) והשורה יורדת ב-RAIL_DROP.
 * שקד ביקשה את שניהם: הבועות חתכו את תחתית הכרטיס ואת ההילה שלו.
 */
type Props = {
  items: Category[];
  active: number;
  onActiveChange: (next: number) => void;
};

/** מידות הבועה והאייקון */
const ORB = 46;
const GLYPH = 22;
/** המרווח שמפריד את השורה מהכרטיס · מפנה מקום להילה של שניהם */
const RAIL_DROP = 26;
/** ההתרוממות של הבועה הפעילה · מהקנבס */
const LIFT = -5;
const POP = 1.07;

export function CategoryRail({ items, active, onActiveChange }: Props) {
  const pan = useCategorySwipe({ active, count: items.length, onChange: onActiveChange });

  return (
    <View {...pan.panHandlers} style={[s.row, SWIPE_SURFACE]}>
      {items.map((it, i) => {
        const on = i === active;
        const ink = on ? it.hue : a(it.rgb, 0.55);
        return (
          <Pressable key={it.key} onPress={() => onActiveChange(i)} style={s.col}>
            <View style={[s.lift, { transform: [{ translateY: on ? LIFT : 0 }, { scale: on ? POP : 1 }] }]}>
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
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 2, paddingTop: RAIL_DROP },
  col: { width: 68, alignItems: 'center', gap: 8 },
  lift: { width: ORB, height: ORB },
  name: { fontSize: type.tiny, textAlign: 'center', lineHeight: type.tiny * 1.25 },
  tag: { fontSize: 10, textAlign: 'center', lineHeight: 12.5 },
  underline: { height: 2.5, width: 26, borderRadius: 999 },
});
