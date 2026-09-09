import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { surface } from '../../theme/tokens';
import { COLS, EMPTY_LABEL, EMPTY_SUB } from '../../data/adminShopping';
import { lineSum, nf, type ShopRow } from './useAdminShopping';
import { Close } from '../../icons';

/* רוחבי העמודות · הועתקו מהקנבס */
const W_BOX = 18;
const W_PRICE = 40;
const W_QTY = 52;
const W_SUM = 48;
const PLUM = '#7B5CBC';

type Props = {
  groups: { name: string; count: string; items: ShopRow[] }[];
  onToggle: (id: number | string) => void;
  onDrop: (id: number | string) => void;
};

export function ShopTable({ groups, onToggle, onDrop }: Props) {
  if (groups.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyTitle}>{EMPTY_LABEL}</Text>
        <Text style={s.emptySub}>{EMPTY_SUB}</Text>
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      {groups.map((g) => (
        <View key={g.name} style={s.group}>
          <View style={s.groupHead}>
            <Text style={s.groupName}>{g.name}</Text>
            <Text style={s.groupCount}>{g.count}</Text>
          </View>

          <View style={s.cols}>
            <View style={s.boxSlot} />
            <Text style={[s.col, s.colName]}>{COLS.name}</Text>
            <Text style={[s.col, s.colPrice]}>{COLS.price}</Text>
            <Text style={[s.col, s.colQty]}>{COLS.qty}</Text>
            <Text style={[s.col, s.colSum]}>{COLS.sum}</Text>
            <View style={s.dropSlot} />
          </View>

          {g.items.map((x) => (
            <View
              key={x.id}
              style={[
                s.row,
                {
                  backgroundColor: x.done ? 'rgba(123,92,188,0.06)' : 'rgba(255,255,255,0.7)',
                  borderColor: x.done ? 'rgba(123,92,188,0.22)' : 'rgba(130,112,162,0.14)',
                },
              ]}
            >
              <Pressable
                onPress={() => onToggle(x.id)}
                style={[
                  s.box,
                  {
                    backgroundColor: x.done ? PLUM : '#FFFFFF',
                    borderColor: x.done ? PLUM : 'rgba(130,112,162,0.28)',
                  },
                ]}
                hitSlop={6}
              >
                {x.done ? <Text style={s.check}>✓</Text> : null}
              </Pressable>

              <Pressable onPress={() => onToggle(x.id)} style={s.nameSlot}>
                <Text
                  numberOfLines={1}
                  style={[
                    s.name,
                    {
                      color: x.done ? surface.faint : surface.ink,
                      textDecorationLine: x.done ? 'line-through' : 'none',
                    },
                  ]}
                >
                  {x.name}
                </Text>
              </Pressable>

              <Text style={[s.cell, s.colPrice]}>{x.price}</Text>
              <Text style={[s.cell, s.colQty]}>{`${x.qty} ${x.unit}`}</Text>
              <Text style={[s.sum, s.colSum]}>{nf(lineSum(x))}</Text>

              <Pressable onPress={() => onDrop(x.id)} style={s.dropSlot} hitSlop={6}>
                <Close size={12} color="#B95349" strokeWidth={2.4} />
              </Pressable>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 14 },
  group: { gap: 6 },
  groupHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingHorizontal: 4 },
  groupName: { flex: 1, fontSize: 12, fontWeight: '600', letterSpacing: 0.7, color: '#A79FB2' },
  groupCount: { fontSize: 11, fontWeight: '500', color: '#C4BDCE' },

  cols: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10 },
  col: { fontSize: 10, fontWeight: '500', color: '#C4BDCE' },
  colName: { flex: 1 },
  colPrice: { width: W_PRICE, textAlign: 'center' },
  colQty: { width: W_QTY, textAlign: 'center' },
  colSum: { width: W_SUM, textAlign: 'left' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1.5,
  },
  boxSlot: { width: W_BOX },
  box: {
    width: W_BOX,
    height: W_BOX,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { fontSize: 11, fontWeight: '700', color: '#FFFFFF', lineHeight: 13 },
  nameSlot: { flex: 1 },
  name: { fontSize: 12.5, fontWeight: '500' },
  cell: { fontSize: 12, color: surface.faint },
  sum: { fontSize: 12.5, fontWeight: '700', color: '#43307A' },
  dropSlot: { width: 18, alignItems: 'center' },
  dropGlyph: { fontSize: 11, color: '#C4BDCE' },

  empty: { alignItems: 'center', gap: 4, paddingVertical: 60 },
  emptyTitle: { fontSize: 14, fontWeight: '500', color: '#A79FB2' },
  emptySub: { fontSize: 11.5, color: surface.muted },
});
