import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { surface } from '../theme/tokens';
import {
  CATS,
  COST_LABEL,
  KPI_KEYS,
  MARGIN_PREFIX,
  MENU,
  MENU_SUB,
  MENU_TITLE,
  PRICE_LABEL,
  PROFIT_LABEL,
  START_CAT,
  THIN_MARGIN,
  marginPct,
  type MenuCatKey,
} from '../data/adminMenu';
import { AdminShell, KpiRow } from './ui/AdminShell';
import { Chip } from './ui/Chip';
import { ChipRail } from './ui/ChipRail';

const AMBER = '#A65E2A';
const GREEN = '#4E8A64';

export function AdminMenuScreen() {
  const [catId, setCatId] = useState<MenuCatKey>(START_CAT);

  const cat = CATS.find((c) => c.id === catId) ?? CATS[0];
  const list = MENU.filter((x) => x.c === catId);

  const totalPrice = list.reduce((s, x) => s + x.price, 0);
  const totalCost = list.reduce((s, x) => s + x.cost, 0);
  const avg = totalPrice > 0 ? Math.round(((totalPrice - totalCost) / totalPrice) * 100) : 0;

  const kpis = [
    { k: KPI_KEYS[0], v: String(list.length), fg: cat.deep },
    { k: KPI_KEYS[1], v: `${avg}%`, fg: avg < THIN_MARGIN ? AMBER : GREEN },
    {
      k: KPI_KEYS[2],
      v: list.length ? `${(totalCost / list.length).toFixed(1)} ₪` : '—',
      fg: AMBER,
    },
  ];

  return (
    <AdminShell title={MENU_TITLE} sub={MENU_SUB}>
      <ChipRail>
        {CATS.map((c) => (
          <Chip
            key={c.id}
            label={c.n}
            on={catId === c.id}
            tint={c}
            onPress={() => setCatId(c.id)}
          />
        ))}
      </ChipRail>

      <KpiRow kpis={kpis} style={{ ...s.summary, backgroundColor: `rgba(${cat.rgb},0.1)` }} />

      <ScrollView style={s.body} contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
        {list.map((x) => {
          const profit = x.price - x.cost;
          const pct = marginPct(x);
          const thin = pct < THIN_MARGIN;
          return (
            <View key={x.name} style={[s.card, { borderRightColor: cat.hue }]}>
              <View>
                <Text style={s.name}>{x.name}</Text>
                <Text style={[s.margin, { color: thin ? AMBER : GREEN }]}>
                  {`${MARGIN_PREFIX}${pct}%`}
                </Text>
              </View>

              <View style={s.cells}>
                <View style={s.cell}>
                  <Text style={s.cellLabel}>{PRICE_LABEL}</Text>
                  <View style={[s.box, s.priceBox]}>
                    <Text style={s.priceText}>{`${x.price} ₪`}</Text>
                  </View>
                </View>
                <View style={s.cell}>
                  <Text style={s.cellLabel}>{COST_LABEL}</Text>
                  <View style={[s.box, s.costBox]}>
                    <Text style={s.costText}>{`${x.cost.toFixed(1)} ₪`}</Text>
                  </View>
                </View>
                <View style={s.cell}>
                  <Text style={s.cellLabel}>{PROFIT_LABEL}</Text>
                  <View
                    style={[
                      s.box,
                      { backgroundColor: thin ? 'rgba(199,125,62,0.12)' : 'rgba(78,138,100,0.12)' },
                    ]}
                  >
                    <Text style={[s.boxText, { color: thin ? AMBER : GREEN }]}>
                      {`${profit.toFixed(1)} ₪`}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </AdminShell>
  );
}

const s = StyleSheet.create({
  /* בקנבס רצועת הסיכום נצבעת בגוון הקטגוריה · אין רקע לבן מתחתיה */
  summary: { borderRadius: 20, paddingVertical: 13, paddingHorizontal: 16 },
  body: { flex: 1 },
  pad: { gap: 9, paddingBottom: 120 },
  card: {
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 15,
    gap: 11,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    borderRightWidth: 3,
  },
  name: { fontSize: 14.5, fontWeight: '600', color: surface.ink },
  margin: { fontSize: 11.5, fontWeight: '300', marginTop: 2 },
  cells: { flexDirection: 'row', gap: 8 },
  cell: { flex: 1 },
  cellLabel: { fontSize: 10.5, fontWeight: '500', color: surface.faint, marginBottom: 3 },
  box: { height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  priceBox: { backgroundColor: 'rgba(130,112,162,0.07)' },
  costBox: { backgroundColor: 'rgba(199,125,62,0.1)' },
  boxText: { fontSize: 14.5, fontWeight: '700' },
  priceText: { fontSize: 14.5, fontWeight: '700', color: surface.ink },
  costText: { fontSize: 14.5, fontWeight: '700', color: AMBER },
});
