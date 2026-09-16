import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { surface } from '../../theme/tokens';
import { SUPPLY_NOTE } from '../../data/adminStock';
import type { SupplyRow, useAdminStock } from './useAdminStock';
import { iconOrbShadow } from '../../theme/glass';

const AMBER = '#A65E2A';

/** שורת ההסבר מתחת לשם · מינימום, ואם ארוז גם כמה יחידות באריזה */
function itemSub(x: SupplyRow, isLow: boolean) {
  const base = isLow ? `מתחת למינימום · ${x.min}` : `מינימום ${x.min}`;
  return base + (x.per ? ` · ${x.per} יח׳ ב${x.unit}` : '');
}

type Props = { admin: ReturnType<typeof useAdminStock> };

/** מלאי לוגיסטי · אריזות, יבשים וציוד. ידני בלבד */
export function SupplyStock({ admin }: Props) {
  return (
    <View style={s.wrap}>
      {/* ⚠ **כרטיס ״מתחת למינימום״ נמחק** · בקשה מפורשת של שקד
          (15 בספטמבר 2026). איתו ירד גם הכפתור ״לרשימת הקניות״,
          שהיה הדרך היחידה לדחוף פריטים חסרים אל רשימת הקניות —
          הפריטים החסרים עדיין מסומנים בכתום בשורות עצמן. */}
      {admin.groups.map((g) => (
        <View key={g.name} style={s.group}>
          <Text style={s.groupName}>{g.name}</Text>
          {g.items.map((x) => {
            const isLow = x.n < x.min;
            return (
              <View
                key={x.id}
                style={[
                  s.item,
                  {
                    backgroundColor: isLow ? 'rgba(199,125,62,0.07)' : 'rgba(255,255,255,0.7)',
                    borderColor: isLow ? 'rgba(199,125,62,0.28)' : 'rgba(130,112,162,0.14)',
                  },
                ]}
              >
                <View style={s.itemText}>
                  <Text style={s.itemName}>{x.name}</Text>
                  <Text style={[s.itemSub, { color: isLow ? AMBER : '#A79FB2' }]}>
                    {itemSub(x, isLow)}
                  </Text>
                </View>

                <View style={s.stepper}>
                  <Pressable
                    onPress={() => admin.bumpSupply(x.id, 1)}
                    style={[s.round, s.plusBg]}
                  >
                    <Text style={[s.sign, { color: '#43307A' }]}>+</Text>
                  </Pressable>
                  <View style={s.count}>
                    <Text style={[s.n, { color: isLow ? AMBER : surface.ink }]}>{x.n}</Text>
                    <Text style={s.unit}>{x.unit}</Text>
                  </View>
                  <Pressable
                    onPress={() => admin.bumpSupply(x.id, -1)}
                    style={[s.round, s.greyBg, { opacity: x.n > 0 ? 1 : 0.4 }]}
                  >
                    <Text style={s.sign}>−</Text>
                  </Pressable>
                </View>

                <Pressable onPress={() => admin.dropItem(x.id)} style={s.drop} hitSlop={6}>
                  <Text style={s.dropGlyph}>✕</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}

      <Text style={s.note}>{SUPPLY_NOTE}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 12 },
  group: { gap: 7 },
  groupName: { fontSize: 14, fontWeight: '600', letterSpacing: 0.7, color: '#A79FB2', paddingHorizontal: 4 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderWidth: 1.5,
  },
  itemText: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '500', color: surface.ink },
  itemSub: { fontSize: 12.5, fontWeight: '300', marginTop: 1 },

  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  round: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', boxShadow: iconOrbShadow('130,112,162')},
  plusBg: { backgroundColor: 'rgba(123,92,188,0.13)' },
  greyBg: { backgroundColor: 'rgba(130,112,162,0.09)' },
  sign: { fontSize: 18.5, fontWeight: '700', color: '#6E6478', lineHeight: 19 },
  count: { minWidth: 42, alignItems: 'center' },
  n: { fontSize: 18.5, fontWeight: '700' },
  unit: { fontSize: 11.5, fontWeight: '300', color: '#A79FB2' },
  drop: { width: 22, alignItems: 'center' },
  dropGlyph: { fontSize: 14, color: '#C4BDCE' },

  note: { fontSize: 12.5, fontWeight: '300', color: surface.muted, textAlign: 'center' },
});
