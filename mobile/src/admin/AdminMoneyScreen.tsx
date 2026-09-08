import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { surface } from '../theme/tokens';
import {
  CAT_TITLE,
  EXP_TITLE,
  EXPENSES,
  MONEY_CATS,
  MONEY_TITLE,
  PERIODS,
  REV_LABEL,
  REV_SUB_PREFIX,
  TILE_EXP,
  TILE_PROFIT,
  type PeriodKey,
} from '../data/adminMoney';
import { AdminShell } from './ui/AdminShell';
import { Chip } from './ui/Chip';
import { apiEnabled } from '../api/config';
import { adminMoney } from '../api/admin';
import { useNav } from '../navigation/store';

const nf = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const PLUM = { rgb: '123,92,188', deep: '#43307A', hue: '#7B5CBC' };

export function AdminMoneyScreen() {
  const { user } = useNav();
  const live = apiEnabled && user?.role === 'admin';
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [data, setData] = useState<{
    label: string;
    periodName: string;
    revenue: number;
    expenses: number;
    profit: number;
    margin: number;
    cats: { n: string; hue: string; deep: string; v: number; pct: number }[];
    expenseRows: { k: string; sub: string; v: number }[];
  } | null>(null);

  useEffect(() => {
    if (!live) return;
    void adminMoney(period).then(setData).catch(() => setData(null));
  }, [live, period]);

  const demo = useMemo(() => {
    const p = PERIODS[period];
    const rev = p.gross;
    const exp = Math.round(EXPENSES.reduce((s, e) => s + e.gross, 0) * p.factor);
    const profit = rev - exp;
    const margin = rev > 0 ? Math.round((profit / rev) * 100) : 0;
    const maxShare = MONEY_CATS[0].share;
    return {
      label: p.label,
      periodName: p.n,
      revenue: rev,
      expenses: exp,
      profit,
      margin,
      cats: MONEY_CATS.map((c) => ({
        n: c.n,
        hue: c.hue,
        deep: c.deep,
        v: Math.round(rev * c.share),
        pct: Math.round(c.share * 100),
        w: Math.round((c.share / maxShare) * 100),
      })),
      expenseRows: EXPENSES.map((e) => ({ k: e.k, sub: e.sub, v: Math.round(e.gross * p.factor) })),
    };
  }, [period]);

  const view = data ?? demo;
  const maxCat = Math.max(...view.cats.map((c) => c.v), 1);

  return (
    <AdminShell title={MONEY_TITLE} sub={view.label}>
      <View style={s.tabs}>
        {(Object.keys(PERIODS) as PeriodKey[]).map((k) => (
          <Chip
            key={k}
            label={PERIODS[k].n}
            on={period === k}
            tint={PLUM}
            style={s.tab}
            onPress={() => setPeriod(k)}
          />
        ))}
      </View>

      <ScrollView style={s.body} contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <Text style={s.heroLabel}>{REV_LABEL}</Text>
          <View style={s.money}>
            <Text style={s.heroVal}>{nf(view.revenue)}</Text>
            <Text style={s.ils}>₪</Text>
          </View>
          <Text style={s.heroSub}>{`${REV_SUB_PREFIX}${view.margin}%`}</Text>
        </View>

        <View style={s.row}>
          <View style={s.tile}>
            <Text style={s.tileK}>{TILE_EXP}</Text>
            <Text style={[s.tileV, { color: '#A65E2A' }]}>{nf(view.expenses)}</Text>
          </View>
          <View style={s.tile}>
            <Text style={s.tileK}>{TILE_PROFIT}</Text>
            <Text style={[s.tileV, { color: '#4E8A64' }]}>{nf(view.profit)}</Text>
          </View>
        </View>

        <View style={s.card}>
          <View style={s.cardHead}>
            <Text style={s.cardTitle}>{CAT_TITLE}</Text>
            <Text style={s.tag}>{view.periodName}</Text>
          </View>
          {view.cats.map((c) => (
            <View key={c.n} style={s.catRow}>
              <View style={s.catTop}>
                <Text style={[s.catName, { color: c.deep }]}>{c.n}</Text>
                <Text style={s.catVal}>{`${nf(c.v)} ₪`}</Text>
              </View>
              <View style={s.barTrack}>
                <View style={[s.barFill, { width: `${Math.round((c.v / maxCat) * 100)}%`, backgroundColor: c.hue }]} />
              </View>
              <Text style={s.catPct}>{`${c.pct}%`}</Text>
            </View>
          ))}
        </View>

        <View style={s.card}>
          <View style={s.cardHead}>
            <Text style={s.cardTitle}>{EXP_TITLE}</Text>
            <Text style={s.tag}>{view.periodName}</Text>
          </View>
          {view.expenseRows.map((e) => (
            <View key={e.k} style={s.expRow}>
              <View style={s.expText}>
                <Text style={s.expK}>{e.k}</Text>
                <Text style={s.expSub}>{e.sub}</Text>
              </View>
              <Text style={s.expV}>{`${nf(e.v)} ₪`}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </AdminShell>
  );
}

const s = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 6 },
  tab: { flex: 1 },
  body: { flex: 1 },
  pad: { gap: 12, paddingBottom: 120 },
  hero: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: 'rgba(123,92,188,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
  },
  heroLabel: { fontSize: 12.5, fontWeight: '600', color: '#6E6478' },
  money: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 },
  heroVal: { fontSize: 32, fontWeight: '700', color: surface.ink },
  ils: { fontSize: 14, color: surface.faint },
  heroSub: { fontSize: 12.5, color: '#4E8A64', marginTop: 4, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12 },
  tile: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  tileK: { fontSize: 11.5, color: surface.faint },
  tileV: { fontSize: 22, fontWeight: '700', marginTop: 4 },
  card: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    gap: 12,
  },
  cardHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#6E6478' },
  tag: { fontSize: 11, color: surface.faint },
  catRow: { gap: 4 },
  catTop: { flexDirection: 'row', justifyContent: 'space-between' },
  catName: { fontSize: 13, fontWeight: '600' },
  catVal: { fontSize: 13, fontWeight: '600', color: surface.ink },
  barTrack: { height: 7, borderRadius: 4, backgroundColor: 'rgba(130,112,162,0.1)', overflow: 'hidden' },
  barFill: { height: 7, borderRadius: 4 },
  catPct: { fontSize: 11, color: surface.faint },
  expRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  expText: { flex: 1 },
  expK: { fontSize: 13.5, fontWeight: '600', color: surface.ink },
  expSub: { fontSize: 11, color: surface.faint, marginTop: 1 },
  expV: { fontSize: 14, fontWeight: '600', color: '#A65E2A' },
});
