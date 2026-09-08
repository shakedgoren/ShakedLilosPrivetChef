import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { surface } from '../theme/tokens';
import {
  AREA,
  AREAS,
  BUYS,
  COLS,
  EMPTY_LABEL,
  HISTORY_TITLE,
  START_FILTER,
  SUB_MIDDLE,
  SUB_SUFFIX,
  TOTAL_LABEL,
  buySum,
} from '../data/adminHistory';
import { AdminShell } from './ui/AdminShell';
import { Chip } from './ui/Chip';
import { ChipRail } from './ui/ChipRail';
import { nf } from './shopping/useAdminShopping';

/* רוחבי העמודות · זהים לטבלת הקניות */
const W_PRICE = 40;
const W_QTY = 52;
const W_SUM = 48;
const PLUM = { rgb: '123,92,188', deep: '#43307A' };

export function AdminHistoryScreen() {
  const [filter, setFilter] = useState(START_FILTER);
  const [open, setOpen] = useState(-1);

  const shown = BUYS.map((b, i) => ({ b, i })).filter(
    (x) => filter === 'all' || x.b.area === filter,
  );
  const total = BUYS.reduce((s, b) => s + buySum(b), 0);

  const pick = (id: string) => {
    setFilter(id);
    setOpen(-1);
  };

  return (
    <AdminShell
      title={HISTORY_TITLE}
      sub={`${BUYS.length}${SUB_MIDDLE}${nf(total)}${SUB_SUFFIX}`}
    >
      <ChipRail>
        {AREAS.map((a) => (
          <Chip
            key={a.id}
            label={a.n}
            on={filter === a.id}
            tint={PLUM}
            onPress={() => pick(a.id)}
          />
        ))}
      </ChipRail>

      <ScrollView style={s.body} contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
        {shown.length === 0 ? (
          <Text style={s.empty}>{EMPTY_LABEL}</Text>
        ) : (
          shown.map(({ b, i }) => {
            const area = AREA[b.area];
            const isOpen = open === i;
            const sum = buySum(b);
            return (
              <View key={`${b.area}-${b.d}-${b.t}`} style={s.card}>
                <Pressable onPress={() => setOpen(isOpen ? -1 : i)} style={s.head}>
                  <View style={s.headText}>
                    <Text numberOfLines={1} style={[s.title, { color: area.deep }]}>
                      {`${area.n} · ${b.d} · ${b.t}`}
                    </Text>
                    <Text style={s.count}>{`${b.rows.length} פריטים`}</Text>
                  </View>
                  <Text style={s.sum}>{`${nf(sum)} ₪`}</Text>
                  <Text style={s.chev}>{isOpen ? '⌃' : '⌄'}</Text>
                </Pressable>

                {isOpen ? (
                  <View style={s.details}>
                    <View style={s.rule} />

                    <View style={s.cols}>
                      <Text style={[s.col, s.colName]}>{COLS.name}</Text>
                      <Text style={[s.col, s.colPrice]}>{COLS.price}</Text>
                      <Text style={[s.col, s.colQty]}>{COLS.qty}</Text>
                      <Text style={[s.col, s.colSum]}>{COLS.sum}</Text>
                    </View>

                    {b.rows.map((r) => (
                      <View key={r.n} style={s.row}>
                        <Text numberOfLines={1} style={[s.cellName, s.colName]}>
                          {r.n}
                        </Text>
                        <Text style={[s.cell, s.colPrice]}>{r.p}</Text>
                        <Text style={[s.cell, s.colQty]}>{`${r.q} ${r.u}`}</Text>
                        <Text style={[s.cellSum, s.colSum]}>{nf(r.p * r.q)}</Text>
                      </View>
                    ))}

                    <View style={s.rule} />
                    <View style={s.totalRow}>
                      <Text style={s.totalLabel}>{TOTAL_LABEL}</Text>
                      <Text style={s.totalValue}>{`${nf(sum)} ₪`}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </AdminShell>
  );
}

const s = StyleSheet.create({
  body: { flex: 1 },
  pad: { gap: 9, paddingBottom: 120 },

  card: {
    borderRadius: 20,
    paddingVertical: 13,
    paddingHorizontal: 15,
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headText: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600' },
  count: { fontSize: 11.5, fontWeight: '300', color: '#A79FB2', marginTop: 2 },
  sum: { fontSize: 15, fontWeight: '700', color: '#43307A' },
  chev: { fontSize: 14, color: '#A79FB2' },

  details: { gap: 6 },
  rule: { height: 1, backgroundColor: 'rgba(130,112,162,0.14)' },
  cols: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  col: { fontSize: 10, fontWeight: '500', color: '#C4BDCE' },
  colName: { flex: 1 },
  colPrice: { width: W_PRICE, textAlign: 'center' },
  colQty: { width: W_QTY, textAlign: 'center' },
  colSum: { width: W_SUM, textAlign: 'left' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cellName: { fontSize: 12.5, fontWeight: '500', color: surface.ink },
  cell: { fontSize: 12, color: surface.faint },
  cellSum: { fontSize: 12.5, fontWeight: '700', color: '#43307A' },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  totalLabel: { fontSize: 12.5, fontWeight: '600', color: surface.inkSoft },
  totalValue: { fontSize: 15, fontWeight: '700', color: '#43307A' },

  empty: { fontSize: 14, fontWeight: '500', color: '#A79FB2', textAlign: 'center', marginTop: 60 },
});
