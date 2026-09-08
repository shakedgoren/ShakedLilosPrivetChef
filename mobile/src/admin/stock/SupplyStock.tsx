import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { surface } from '../../theme/tokens';
import { LOW_CTA, SUPPLY_NOTE } from '../../data/adminStock';
import type { SupplyRow, useAdminStock } from './useAdminStock';

const AMBER = '#A65E2A';
const GREEN = '#4E8A64';

/** שורת ההסבר מתחת לשם · מינימום, ואם ארוז גם כמה יחידות באריזה */
function itemSub(x: SupplyRow, isLow: boolean) {
  const base = isLow ? `מתחת למינימום · ${x.min}` : `מינימום ${x.min}`;
  return base + (x.per ? ` · ${x.per} יח׳ ב${x.unit}` : '');
}

type Props = { admin: ReturnType<typeof useAdminStock> };

/** מלאי לוגיסטי · אריזות, יבשים וציוד. ידני בלבד */
export function SupplyStock({ admin }: Props) {
  const { lowItems } = admin;

  return (
    <View style={s.wrap}>
      {lowItems.length > 0 ? (
        <View style={s.lowCard}>
          <View style={s.lowText}>
            <Text style={s.lowTitle}>{`${lowItems.length} פריטים מתחת למינימום`}</Text>
            <Text style={s.lowSub}>{lowItems.map((x) => x.name).join(' · ')}</Text>
          </View>
          <Pressable onPress={admin.sendToShopping} style={s.lowCta}>
            <Text style={s.lowCtaText}>{LOW_CTA}</Text>
          </Pressable>
        </View>
      ) : null}

      {admin.sent ? (
        <View style={s.sent}>
          <Text style={s.sentText}>{`נוספו ${lowItems.length} פריטים לרשימת הקניות`}</Text>
        </View>
      ) : null}

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
  lowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    padding: 13,
    backgroundColor: 'rgba(199,125,62,0.09)',
    borderWidth: 1.5,
    borderColor: 'rgba(199,125,62,0.26)',
  },
  lowText: { flex: 1 },
  lowTitle: { fontSize: 13, fontWeight: '600', color: AMBER },
  lowSub: { fontSize: 11, fontWeight: '300', color: surface.muted, marginTop: 1 },
  lowCta: {
    height: 34,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: 'rgba(199,125,62,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lowCtaText: { fontSize: 12, fontWeight: '600', color: AMBER },

  sent: {
    alignSelf: 'center',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 13,
    backgroundColor: 'rgba(78,138,100,0.12)',
  },
  sentText: { fontSize: 12.5, fontWeight: '600', color: GREEN },

  group: { gap: 7 },
  groupName: { fontSize: 12, fontWeight: '600', letterSpacing: 0.7, color: '#A79FB2', paddingHorizontal: 4 },
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
  itemName: { fontSize: 13, fontWeight: '500', color: surface.ink },
  itemSub: { fontSize: 11, fontWeight: '300', marginTop: 1 },

  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  round: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  plusBg: { backgroundColor: 'rgba(123,92,188,0.13)' },
  greyBg: { backgroundColor: 'rgba(130,112,162,0.09)' },
  sign: { fontSize: 16, fontWeight: '700', color: '#6E6478', lineHeight: 19 },
  count: { minWidth: 42, alignItems: 'center' },
  n: { fontSize: 16, fontWeight: '700' },
  unit: { fontSize: 10, fontWeight: '300', color: '#A79FB2' },
  drop: { width: 22, alignItems: 'center' },
  dropGlyph: { fontSize: 12, color: '#C4BDCE' },

  note: { fontSize: 11, fontWeight: '300', color: surface.muted, textAlign: 'center' },
});
