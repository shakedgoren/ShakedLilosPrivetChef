import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { surface } from '../theme/tokens';
import {
  CATS,
  CAT_TITLE,
  EXPENSES,
  EXP_TITLE,
  MARGIN_PREFIX,
  MONEY_TITLE,
  PERIODS,
  PERIOD_KEYS,
  REV_LABEL,
  START_PERIOD,
  TILE_KEYS,
  type PeriodKey,
} from '../data/adminMoney';
import { AdminShell } from './ui/AdminShell';
import { Chip } from './ui/Chip';
import { ProgressBar } from './ui/ProgressBar';
import { nf } from './shopping/useAdminShopping';

const PLUM = { rgb: '123,92,188', deep: '#43307A' };
const AMBER = '#A65E2A';
const GREEN = '#4E8A64';

export function AdminMoneyScreen() {
  const [period, setPeriod] = useState<PeriodKey>(START_PERIOD);

  const p = PERIODS[period];
  const revenue = p.gross;
  const expenses = Math.round(EXPENSES.reduce((s, e) => s + e.gross, 0) * p.factor);
  const profit = revenue - expenses;
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

  const tiles = [
    { k: TILE_KEYS[0], v: expenses, fg: AMBER },
    { k: TILE_KEYS[1], v: profit, fg: GREEN },
  ];

  return (
    <AdminShell title={MONEY_TITLE} sub={p.label}>
      <View style={s.periods}>
        {PERIOD_KEYS.map((k) => (
          <Chip
            key={k}
            label={PERIODS[k].n}
            on={period === k}
            tint={PLUM}
            style={s.period}
            onPress={() => setPeriod(k)}
          />
        ))}
      </View>

      <ScrollView style={s.body} contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
        <View style={s.revCard}>
          <Text style={s.revLabel}>{REV_LABEL}</Text>
          <View style={s.revRow}>
            <Text style={s.revValue}>{nf(revenue)}</Text>
            <Text style={s.revCurrency}>₪</Text>
          </View>
          <Text style={s.revSub}>{`${MARGIN_PREFIX}${margin}%`}</Text>
        </View>

        <View style={s.tiles}>
          {tiles.map((t) => (
            <View key={t.k} style={s.tile}>
              <Text style={s.tileLabel}>{t.k}</Text>
              <View style={s.tileRow}>
                <Text style={[s.tileValue, { color: t.fg }]}>{nf(t.v)}</Text>
                <Text style={s.tileCurrency}>₪</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={s.card}>
          <View style={s.cardHead}>
            <Text style={s.cardTitle}>{CAT_TITLE}</Text>
            <Text style={s.cardTag}>{p.n}</Text>
          </View>
          {CATS.map((c) => (
            <View key={c.n} style={s.catRow}>
              <View style={s.catHead}>
                <Text style={[s.catName, { color: c.deep }]}>{c.n}</Text>
                <View style={s.catNums}>
                  <Text style={s.catValue}>{`${nf(revenue * c.share)} ₪`}</Text>
                  <Text style={s.catPct}>{`${Math.round(c.share * 100)}%`}</Text>
                </View>
              </View>
              {/* הפס יחסי לקטגוריה הגדולה ביותר · כמו בקנבס */}
              <ProgressBar fill={c.share / CATS[0].share} color={c.hue} hue={c.hue} />
            </View>
          ))}
        </View>

        <View style={s.card}>
          <View style={s.cardHead}>
            <Text style={s.cardTitle}>{EXP_TITLE}</Text>
            <Text style={s.cardTag}>{p.n}</Text>
          </View>
          {EXPENSES.map((e) => (
            <View key={e.k} style={s.expRow}>
              <View style={s.expText}>
                <Text style={s.expName}>{e.k}</Text>
                <Text style={s.expSub}>{e.sub}</Text>
              </View>
              <Text style={s.expValue}>{`${nf(Math.round(e.gross * p.factor))} ₪`}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </AdminShell>
  );
}

const s = StyleSheet.create({
  periods: { flexDirection: 'row', gap: 6 },
  period: { flex: 1 },
  body: { flex: 1 },
  pad: { gap: 11, paddingBottom: 120 },

  revCard: {
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(197,180,236,0.44)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  revLabel: { fontSize: 11.5, fontWeight: '600', letterSpacing: 0.7, color: '#5B4794' },
  revRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 5 },
  revValue: { fontSize: 34, fontWeight: '700', color: '#43307A' },
  revCurrency: { fontSize: 15, fontWeight: '500', color: '#5B4794' },
  revSub: { fontSize: 12, fontWeight: '500', color: '#5B4794', marginTop: 3 },

  tiles: { flexDirection: 'row', gap: 10 },
  tile: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  tileLabel: { fontSize: 11.5, fontWeight: '500', color: surface.muted },
  tileRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 4 },
  tileValue: { fontSize: 22, fontWeight: '700' },
  tileCurrency: { fontSize: 12, color: surface.faint },

  card: {
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 18,
    gap: 11,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  cardHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  cardTitle: { fontSize: 13.5, fontWeight: '600', color: surface.ink },
  cardTag: { fontSize: 11, color: '#A79FB2' },

  catRow: { gap: 5 },
  catHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  catName: { fontSize: 12.5, fontWeight: '500' },
  catNums: { flexDirection: 'row', alignItems: 'baseline', gap: 7 },
  catValue: { fontSize: 13, fontWeight: '600', color: surface.ink },
  catPct: { fontSize: 11, fontWeight: '500', color: '#A79FB2', minWidth: 26, textAlign: 'left' },

  expRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  expText: { flex: 1 },
  expName: { fontSize: 13, fontWeight: '500', color: surface.ink },
  expSub: { fontSize: 11, fontWeight: '300', color: surface.faint, marginTop: 1 },
  expValue: { fontSize: 13.5, fontWeight: '600', color: surface.ink },
});
