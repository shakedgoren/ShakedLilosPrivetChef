import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { surface } from '../../theme/tokens';
import {
  DAY_TAG_MANY,
  DAY_TAG_ONE,
  DROP_LABEL,
  NO_DAY_LABEL,
  NO_DAY_SUB,
  NO_OPEN_DAY,
  ROW_LEFT_TAG,
  SALE_NOTE,
  TOTAL_LEFT_TAG,
} from '../../data/adminStock';
import { ProgressBar } from '../ui/ProgressBar';
import type { useAdminStock } from './useAdminStock';
import { Minus, Plus } from '../../icons';

const AMBER = '#A65E2A';

type Props = { admin: ReturnType<typeof useAdminStock> };

/** מלאי המכירה · לקריאה בלבד, פרט להורדת מנות שהתקלקלו */
export function SaleStock({ admin }: Props) {
  const { days } = admin;

  return (
    <View style={s.wrap}>
      <View style={s.head}>
        <View style={s.headText}>
          <Text style={s.tag}>{days.length > 1 ? DAY_TAG_MANY : DAY_TAG_ONE}</Text>
          <Text style={s.dayName}>
            {days.length ? days.map((d) => d.day).join(' · ') : NO_OPEN_DAY}
          </Text>
        </View>
        <View style={s.total}>
          <Text style={s.totalValue}>{admin.leftAll}</Text>
          <Text style={s.tag}>{TOTAL_LEFT_TAG}</Text>
        </View>
      </View>

      {days.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>{NO_DAY_LABEL}</Text>
          <Text style={s.emptySub}>{NO_DAY_SUB}</Text>
        </View>
      ) : null}

      {days.map((d) => (
        <View key={d.cat} style={s.dayCard}>
          <View style={s.dayHead}>
            <Text style={[s.dayTitle, { color: d.deep }]}>{d.name}</Text>
            <View style={[s.pill, { backgroundColor: `rgba(${d.rgb},0.12)` }]}>
              <Text style={[s.pillText, { color: d.deep }]}>{d.day}</Text>
            </View>
          </View>

          {d.rows.map((r) => (
            <View key={r.key} style={s.row}>
              <View style={s.rowHead}>
                <Text style={s.itemName}>{r.name}</Text>
                <View style={s.leftBox}>
                  <Text style={[s.leftValue, { color: r.fg }]}>{r.left}</Text>
                  <Text style={s.leftTag}>{ROW_LEFT_TAG}</Text>
                </View>
              </View>

              <ProgressBar fill={r.fill} color={r.barColor} hue={d.hue} />

              <View style={s.rowFoot}>
                <Text style={s.sold}>{r.soldLabel}</Text>
                <Text style={[s.state, { color: r.fg }]}>{r.state}</Text>
              </View>

              <View style={s.dropRow}>
                <View style={s.dropText}>
                  <Text style={s.dropLabel}>{DROP_LABEL}</Text>
                  <Text style={s.dropSub}>{r.dropSub}</Text>
                </View>
                <View style={s.stepper}>
                  <Pressable
                    onPress={() => admin.bumpWaste(r.key, r.room, 1)}
                    style={[s.round, s.amberBg, { opacity: r.left > 0 ? 1 : 0.35 }]}
                  >
                    <Plus size={13} color={AMBER} strokeWidth={2.4} />
                  </Pressable>
                  <Text
                    style={[
                      s.wasteValue,
                      { color: r.waste > 0 ? AMBER : '#C4BDCE', fontWeight: r.waste > 0 ? '700' : '400' },
                    ]}
                  >
                    {r.waste}
                  </Text>
                  <Pressable
                    onPress={() => admin.bumpWaste(r.key, r.room, -1)}
                    style={[s.round, s.greyBg, { opacity: r.waste > 0 ? 1 : 0.35 }]}
                  >
                    <Minus size={13} color="#2A2430" strokeWidth={2.4} />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
      ))}

      <Text style={s.note}>{SALE_NOTE}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headText: { flex: 1 },
  tag: { fontSize: 11.5, fontWeight: '300', color: surface.faint },
  dayName: { fontSize: 13.5, fontWeight: '600', color: surface.ink },
  total: { alignItems: 'flex-end' },
  totalValue: { fontSize: 21, fontWeight: '700', color: '#43307A' },

  empty: { alignItems: 'center', gap: 4, paddingVertical: 40 },
  emptyTitle: { fontSize: 14, fontWeight: '500', color: '#A79FB2' },
  emptySub: { fontSize: 11.5, color: surface.muted, textAlign: 'center' },

  dayCard: {
    borderRadius: 22,
    padding: 14,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  dayHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayTitle: { flex: 1, fontSize: 14, fontWeight: '600' },
  pill: { borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9 },
  pillText: { fontSize: 11, fontWeight: '600' },

  row: { gap: 6 },
  rowHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  itemName: { flex: 1, fontSize: 13, fontWeight: '500', color: surface.ink },
  leftBox: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  leftValue: { fontSize: 19, fontWeight: '700' },
  leftTag: { fontSize: 11.5, fontWeight: '300', color: surface.faint },
  rowFoot: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  sold: { flex: 1, fontSize: 11.5, fontWeight: '300', color: surface.faint },
  state: { fontSize: 11.5, fontWeight: '600' },

  dropRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  dropText: { flex: 1 },
  dropLabel: { fontSize: 12, fontWeight: '500', color: surface.inkSoft },
  dropSub: { fontSize: 10.5, fontWeight: '300', color: '#A79FB2' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  round: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  amberBg: { backgroundColor: 'rgba(199,125,62,0.14)' },
  greyBg: { backgroundColor: 'rgba(130,112,162,0.09)' },
  sign: { fontSize: 16, fontWeight: '700', color: '#6E6478', lineHeight: 19 },
  wasteValue: { minWidth: 18, textAlign: 'center', fontSize: 15 },

  note: { fontSize: 11, fontWeight: '300', lineHeight: 16, color: surface.muted, paddingHorizontal: 4 },
});
