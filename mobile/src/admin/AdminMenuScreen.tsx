import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { surface } from '../theme/tokens';
import type { MenuCatKey, MenuRow } from '../data/adminMenu';
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
} from '../data/adminMenu';
import { AdminShell, KpiRow } from './ui/AdminShell';
import { Chip } from './ui/Chip';
import { apiEnabled } from '../api/config';
import { adminMenu } from '../api/admin';
import { useNav } from '../navigation/store';

const money = (n: number) => (Math.round(n * 10) / 10).toFixed(1);

/* אימות בגבול · השרת מחזיר קטגוריה כמחרוזת חופשית, והמסך מצייר רק ארבע */
const isMenuCat = (c: string): c is MenuCatKey => CATS.some((x) => x.id === c);
const toMenuRows = (rows: readonly { c: string; name: string; price: number; cost: number }[]): MenuRow[] =>
  rows.flatMap((x) => (isMenuCat(x.c) ? [{ c: x.c, name: x.name, price: x.price, cost: x.cost }] : []));

export function AdminMenuScreen() {
  const { user } = useNav();
  const live = apiEnabled && user?.role === 'admin';
  const [cat, setCat] = useState<MenuCatKey>(START_CAT);
  const [items, setItems] = useState<MenuRow[]>(MENU);

  useEffect(() => {
    if (!live) return;
    void adminMenu()
      .then((r) => setItems(toMenuRows(r.items)))
      .catch(() => undefined);
  }, [live]);

  const tint = CATS.find((c) => c.id === cat) ?? CATS[0];
  const list = items.filter((x) => x.c === cat);
  const totPrice = list.reduce((s, x) => s + x.price, 0);
  const totCost = list.reduce((s, x) => s + x.cost, 0);
  const avg = totPrice > 0 ? Math.round(((totPrice - totCost) / totPrice) * 100) : 0;

  const kpis = useMemo(
    () => [
      { k: KPI_KEYS[0], v: String(list.length), fg: tint.deep },
      { k: KPI_KEYS[1], v: `${avg}%`, fg: avg < THIN_MARGIN ? '#A65E2A' : '#4E8A64' },
      { k: KPI_KEYS[2], v: list.length ? `${(totCost / list.length).toFixed(1)} ₪` : '—', fg: '#A65E2A' },
    ],
    [list, avg, totCost, tint.deep],
  );

  return (
    <AdminShell title={MENU_TITLE} sub={MENU_SUB}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cats}>
        {CATS.map((c) => (
          <Chip key={c.id} label={c.n} on={cat === c.id} tint={c} onPress={() => setCat(c.id)} />
        ))}
      </ScrollView>
      <View style={[s.sum, { backgroundColor: `rgba(${tint.rgb},0.1)` }]}>
        <KpiRow kpis={kpis} />
      </View>
      <ScrollView style={s.body} contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
        {list.map((it) => {
          const profit = it.price - it.cost;
          const pct = marginPct(it);
          const thin = pct < THIN_MARGIN;
          return (
            <View key={it.name} style={[s.card, { borderRightColor: tint.hue }]}>
              <Text style={s.name}>{it.name}</Text>
              <Text style={[s.margin, { color: thin ? '#A65E2A' : '#4E8A64' }]}>{`${MARGIN_PREFIX}${pct}%`}</Text>
              <View style={s.vals}>
                <View style={s.box}>
                  <Text style={s.lab}>{PRICE_LABEL}</Text>
                  <View style={s.valBox}>
                    <Text style={s.val}>{`${it.price}`}</Text>
                  </View>
                </View>
                <View style={s.box}>
                  <Text style={s.lab}>{COST_LABEL}</Text>
                  <View style={[s.valBox, { backgroundColor: 'rgba(199,125,62,0.1)' }]}>
                    <Text style={[s.val, { color: '#A65E2A' }]}>{money(it.cost)}</Text>
                  </View>
                </View>
                <View style={s.box}>
                  <Text style={s.lab}>{PROFIT_LABEL}</Text>
                  <View style={[s.valBox, { backgroundColor: thin ? 'rgba(199,125,62,0.1)' : 'rgba(78,138,100,0.12)' }]}>
                    <Text style={[s.val, { color: thin ? '#A65E2A' : '#4E8A64' }]}>{money(profit)}</Text>
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
  cats: { gap: 6 },
  sum: { borderRadius: 20, overflow: 'hidden' },
  body: { flex: 1 },
  pad: { gap: 9, paddingBottom: 120 },
  card: {
    borderRadius: 18,
    padding: 13,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRightWidth: 3,
    gap: 11,
  },
  name: { fontSize: 14.5, fontWeight: '600', color: surface.ink },
  margin: { fontSize: 11.5, marginTop: -8 },
  vals: { flexDirection: 'row', gap: 8 },
  box: { flex: 1 },
  lab: { fontSize: 10.5, fontWeight: '500', color: surface.faint, marginBottom: 3 },
  valBox: {
    height: 40,
    borderRadius: 13,
    backgroundColor: 'rgba(130,112,162,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  val: { fontSize: 14.5, fontWeight: '700', color: surface.ink },
});
