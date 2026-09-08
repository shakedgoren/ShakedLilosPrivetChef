import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PICKUP } from '../data/categories';
import { a, radius, space, surface, type } from '../theme/tokens';

/**
 * מפות ההגעה לחנייה · הכתובת בגדול, הערת הוויז מתחתיה,
 * וארבע המפות עם כותרת הכיוון על התמונה מימין למעלה.
 * קבצי parking-1..4 עדיין לא הועלו — עד אז מוצג מציין מקום עם שם הקובץ.
 */
export function PickupMaps({ rgb, ink }: { rgb: string; ink: string }) {
  const [i, setI] = useState(0);
  const maps = PICKUP.maps;
  const cur = maps[i];

  const step = (d: number) => setI((n) => (n + d + maps.length) % maps.length);

  return (
    <View style={s.wrap}>
      <Text style={s.address}>כתובת : {PICKUP.address}</Text>
      <Text style={s.note}>{PICKUP.note}</Text>

      <View style={s.frame}>
        <View style={[s.placeholder, { borderColor: a(rgb, 0.36) }]}>
          <Text style={[s.placeholderText, { color: a(rgb, 0.66) }]}>{cur.file}</Text>
        </View>

        <View style={s.badge}>
          <Text style={[s.badgeText, { color: ink }]}>{cur.title}</Text>
        </View>

        <Pressable onPress={() => step(-1)} style={[s.arrow, s.arrowRight]} hitSlop={6}>
          <Text style={[s.arrowGlyph, { color: ink }]}>›</Text>
        </Pressable>
        <Pressable onPress={() => step(1)} style={[s.arrow, s.arrowLeft]} hitSlop={6}>
          <Text style={[s.arrowGlyph, { color: ink }]}>‹</Text>
        </Pressable>
      </View>

      <View style={s.dots}>
        {maps.map((m, k) => (
          <Pressable
            key={m.file}
            onPress={() => setI(k)}
            style={[
              s.dot,
              { width: k === i ? 18 : 6, backgroundColor: k === i ? ink : 'rgba(130,112,162,0.28)' },
            ]}
            hitSlop={8}
          />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: space.sm, marginTop: space.md },
  address: { fontSize: 17, fontWeight: '600', color: surface.ink, lineHeight: 23 },
  note: { fontSize: type.label, color: surface.muted, lineHeight: 19 },
  frame: {
    width: '100%',
    height: 190,
    borderRadius: radius.field,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginTop: space.xs,
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radius.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { fontSize: 10, letterSpacing: 0.6 },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowRight: { right: 8 },
  arrowLeft: { left: 8 },
  arrowGlyph: { fontSize: 20, lineHeight: 22, fontWeight: '700' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: space.xs },
  dot: { height: 6, borderRadius: 999 },
});
