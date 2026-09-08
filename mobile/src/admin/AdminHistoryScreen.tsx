import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { surface } from '../theme/tokens';
import {
  HIST_AREAS,
  HIST_BUYS,
  HIST_COLS,
  HIST_EMPTY,
  HIST_TITLE,
  HIST_TOTAL,
} from '../data/adminHistory';
import { AREA } from '../data/adminShopping';
import { AdminShell } from './ui/AdminShell';
import { Chip } from './ui/Chip';
import { apiEnabled } from '../api/config';
import { adminShopHistory, type ShopListDto } from '../api/admin';
import { useNav } from '../navigation/store';

const nf = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const PLUM = { rgb: '123,92,188', deep: '#43307A', hue: '#7B5CBC' };

function buySum(rows: { p: number; q: number }[]) {
  return rows.reduce((s, r) => s + r.p * r.q, 0);
}

export function AdminHistoryScreen() {
  const { user } = useNav();
  const live = apiEnabled && user?.role === 'admin';
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(-1);
  const [lists, setLists] = useState<ShopListDto[] | null>(null);

  useEffect(() => {
    if (!live) return;
    void adminShopHistory().then((r) => setLists(r.lists)).catch(() => setLists(null));
  }, [live]);

  const demo = useMemo(
    () =>
      HIST_BUYS.filter((b) => filter === 'all' || b.area === filter).map((b) => {
        const area = AREA[b.area] ?? HIST_AREAS.find((a) => a.id === b.area);
        return {
          title: `${area?.n ?? b.area} · ${b.d} · ${b.t}`,
          count: `${b.rows.length} פריטים`,
          sum: buySum(b.rows),
          hue: area?.hue ?? '#7B5CBC',
          deep: area?.deep ?? '#43307A',
          rows: b.rows.map((r) => ({ name: r.n, price: r.p, qty: `${r.q} ${r.u}`, sum: r.p * r.q })),
        };
      }),
    [filter],
  );

  const liveRows = useMemo(() => {
    if (!lists) return null;
    return lists
      .filter((l) => filter === 'all' || l.area === filter)
      .map((l) => {
        const area = AREA[l.area];
        const when = new Date(l.closedAt ?? l.openedAt);
        const title = `${area?.n ?? l.area} · ${when.getDate()} ב${['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'][when.getMonth()]} · ${String(when.getHours()).padStart(2,'0')}:${String(when.getMinutes()).padStart(2,'0')}`;
        const sum = l.items.reduce((s, x) => s + Number(x.qty) * Number(x.price), 0);
        return {
          title,
          count: `${l.items.length} פריטים`,
          sum,
          hue: area?.hue ?? '#7B5CBC',
          deep: area?.deep ?? '#43307A',
          rows: l.items.map((r) => ({
            name: r.name,
            price: Number(r.price),
            qty: `${r.qty} ${r.unit}`,
            sum: Number(r.qty) * Number(r.price),
          })),
        };
      });
  }, [lists, filter]);

  const rows = liveRows ?? demo;
  const total = rows.reduce((s, b) => s + b.sum, 0);

  return (
    <AdminShell title={HIST_TITLE} sub={`${rows.length} קניות · ${nf(total)} ₪ מצטבר`}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
        {HIST_AREAS.map((a) => (
          <Chip key={a.id} label={a.n} on={filter === a.id} tint={PLUM} onPress={() => { setFilter(a.id); setOpen(-1); }} />
        ))}
      </ScrollView>
      <ScrollView style={s.body} contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
        {rows.length === 0 ? (
          <Text style={s.empty}>{HIST_EMPTY}</Text>
        ) : (
          rows.map((b, i) => (
            <Pressable key={b.title + i} onPress={() => setOpen(open === i ? -1 : i)} style={[s.card, { borderRightColor: b.hue }]}>
              <View style={s.head}>
                <View style={s.headText}>
                  <Text style={[s.title, { color: b.deep }]} numberOfLines={1}>{b.title}</Text>
                  <Text style={s.count}>{b.count}</Text>
                </View>
                <Text style={s.sum}>{`${nf(b.sum)} ₪`}</Text>
              </View>
              {open === i ? (
                <View style={s.detail}>
                  <View style={s.cols}>
                    <Text style={[s.col, s.grow]}>{HIST_COLS.name}</Text>
                    <Text style={[s.col, s.w40]}>{HIST_COLS.price}</Text>
                    <Text style={[s.col, s.w52]}>{HIST_COLS.qty}</Text>
                    <Text style={[s.col, s.w48]}>{HIST_COLS.sum}</Text>
                  </View>
                  {b.rows.map((r) => (
                    <View key={r.name} style={s.line}>
                      <Text style={[s.cell, s.grow]} numberOfLines={1}>{r.name}</Text>
                      <Text style={[s.cell, s.w40]}>{r.price}</Text>
                      <Text style={[s.cell, s.w52]}>{r.qty}</Text>
                      <Text style={[s.cell, s.w48]}>{nf(r.sum)}</Text>
                    </View>
                  ))}
                  <Text style={s.total}>{`${HIST_TOTAL} · ${nf(b.sum)} ₪`}</Text>
                </View>
              ) : null}
            </Pressable>
          ))
        )}
      </ScrollView>
    </AdminShell>
  );
}

const s = StyleSheet.create({
  filters: { gap: 6, paddingBottom: 2 },
  body: { flex: 1 },
  pad: { gap: 9, paddingBottom: 120 },
  empty: { fontSize: 14, fontWeight: '500', color: '#A79FB2', textAlign: 'center', marginTop: 60 },
  card: {
    borderRadius: 18,
    padding: 13,
    backgroundColor: 'rgba(255,255,255,0.74)',
    borderRightWidth: 3,
    borderColor: 'rgba(255,255,255,0.85)',
    gap: 10,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headText: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600' },
  count: { fontSize: 11.5, color: '#A79FB2', marginTop: 2 },
  sum: { fontSize: 15, fontWeight: '700', color: '#43307A' },
  detail: { gap: 7, borderTopWidth: 1, borderTopColor: 'rgba(130,112,162,0.14)', paddingTop: 10 },
  cols: { flexDirection: 'row', gap: 8 },
  col: { fontSize: 10, fontWeight: '500', color: '#C4BDCE' },
  line: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  cell: { fontSize: 12.5, color: surface.ink },
  grow: { flex: 1 },
  w40: { width: 40, textAlign: 'center' },
  w52: { width: 52, textAlign: 'center' },
  w48: { width: 48, textAlign: 'left' },
  total: { fontSize: 13, fontWeight: '600', color: '#43307A', marginTop: 4 },
});
