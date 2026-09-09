import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { surface } from '../theme/tokens';
import {
  DONUT,
  HOME_SUBTITLE,
  HOME_TITLE,
  MANUAL_SUB,
  MANUAL_TITLE,
  PROFIT,
  REVENUE,
  TODAY,
  type TileKey,
} from '../data/adminHome';
import { COPY } from '../api/copy';
import { useNav, type Screen } from '../navigation/store';
import { GlassCard } from './home/GlassCard';
import { SalePanel } from './home/SalePanel';
import { TileRail } from './home/TileRail';
import { CategoryDonut, ProfitBars, RevenueChart } from './home/Charts';
import { useAdminHome } from './home/useAdminHome';
import { LTR_ROW } from './ui/ltrRow';

/** כל אריח מצביע על מסך ניהול · אותה מפה שבקנבס, בשמות של הניווט */
const TILE_ROUTES: Record<TileKey, Screen> = {
  orders: 'adminOrders',
  days: 'adminDays',
  stock: 'adminStock',
  shop: 'adminShopping',
  people: 'adminCustomers',
  menu: 'adminMenu',
  costs: 'adminCosts',
  hist: 'adminHistory',
};

const money = (n: number) => n.toLocaleString('en-US');

export function AdminHomeScreen() {
  const { go } = useNav();
  const home = useAdminHome();

  return (
    <ScrollView style={s.root} contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
      <View style={s.head}>
        <View style={s.headText}>
          <Text style={s.title}>{HOME_TITLE}</Text>
          <Text style={s.sub}>{home.subtitle || HOME_SUBTITLE}</Text>
        </View>
        <Pressable onPress={() => go('main')} style={s.monthChip}>
          <Text style={s.monthText}>{COPY.shopHome}</Text>
        </Pressable>
      </View>

      <SalePanel
        isOpen={home.isOpen}
        onToggle={home.toggleOpen}
        quotas={home.quotas}
        onBump={home.bump}
        step={home.step}
        ringPct={home.ringPct}
        note={home.note}
        dayLabel={home.subtitle}
      />

      <View style={s.row}>
        <Pressable onPress={() => go('adminOrders')} style={s.manual}>
          <View style={s.manualIcon}>
            <Text style={s.manualPlus}>+</Text>
          </View>
          <View>
            <Text style={s.manualTitle}>{MANUAL_TITLE}</Text>
            <Text style={s.manualSub}>{MANUAL_SUB}</Text>
          </View>
        </Pressable>

        <View style={s.stats}>
          <GlassCard style={s.stat}>
            <Text style={s.statLabel}>{TODAY.ordersLabel}</Text>
            <Text style={s.statValue}>{home.today.orders}</Text>
          </GlassCard>
          <GlassCard style={s.stat}>
            <Text style={s.statLabel}>{TODAY.revenueLabel}</Text>
            <View style={s.statMoney}>
              <Text style={s.statValue}>{money(home.today.revenue)}</Text>
              <Text style={s.currency}>₪</Text>
            </View>
          </GlassCard>
        </View>
      </View>

      <GlassCard style={s.revCard}>
        <View style={s.cardHead}>
          <Text style={s.cardTitle}>{REVENUE.title}</Text>
          <View style={s.statMoney}>
            <Text style={s.revTotal}>{money(home.live && home.month.revenue ? home.month.revenue : REVENUE.total)}</Text>
            <Text style={s.currency}>₪</Text>
          </View>
        </View>
        <View style={s.chart}>
          <RevenueChart />
        </View>
        <View style={s.months}>
          <View style={s.axisPad} />
          <View style={s.monthRow}>
            {REVENUE.months.map((m, i) => (
              <Text key={m} style={[s.month, i === REVENUE.months.length - 1 && s.monthOn]}>
                {m}
              </Text>
            ))}
          </View>
        </View>
      </GlassCard>

      <View style={s.row}>
        <GlassCard style={s.donutCard}>
          <Text style={s.cardTitle}>{DONUT.title}</Text>
          <View style={s.donutBody}>
            <CategoryDonut />
            <View style={s.legend}>
              {DONUT.legend.map((l) => (
                <View key={l.name} style={s.legendRow}>
                  <View style={[s.legendDot, { backgroundColor: l.color }]} />
                  <Text style={s.legendName}>{l.name}</Text>
                  <Text style={s.legendPct}>{`${l.pct}%`}</Text>
                </View>
              ))}
            </View>
          </View>
        </GlassCard>

        <GlassCard style={s.profitCard}>
          <Text style={s.cardTitle}>{PROFIT.title}</Text>
          <View style={s.statMoney}>
            <Text style={s.profitNet}>{money(home.live ? home.month.profit : PROFIT.net)}</Text>
            <Text style={s.currencyBig}>₪</Text>
          </View>
          <View style={s.rule} />
          <View style={s.grossRow}>
            <Text style={s.profitNote}>{PROFIT.revLabel}</Text>
            <View style={s.statMoney}>
              <Text style={s.gross}>{money(home.live ? home.month.revenue : PROFIT.rev)}</Text>
              <Text style={s.currencySm}>₪</Text>
            </View>
          </View>
          <View style={[s.grossRow, s.expRow]}>
            <Text style={s.profitNote}>{PROFIT.expLabel}</Text>
            <View style={s.statMoney}>
              <Text style={s.gross}>{money(home.live ? home.month.expenses : PROFIT.exp)}</Text>
              <Text style={s.currencySm}>₪</Text>
            </View>
          </View>
          <View style={s.spacer} />
          <ProfitBars />
        </GlassCard>
      </View>

      <TileRail onOpen={(key) => go(TILE_ROUTES[key])} badges={home.badges} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  pad: { paddingTop: 30, paddingHorizontal: 18, paddingBottom: 120, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headText: { flex: 1, gap: 2 },
  title: { fontSize: 21, fontWeight: '600', color: surface.ink },
  sub: { fontSize: 12.5, fontWeight: '300', color: surface.faint },
  monthChip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: { fontSize: 12.5, fontWeight: '500', color: '#6E6478' },

  row: { flexDirection: 'row', gap: 12, height: 100 },
  manual: {
    width: 168,
    borderRadius: 22,
    padding: 14,
    backgroundColor: '#C6B3EC',
    justifyContent: 'space-between',
  },
  manualIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualPlus: { fontSize: 20, fontWeight: '700', color: '#43307A', lineHeight: 24 },
  manualTitle: { fontSize: 14.5, fontWeight: '600', color: '#43307A' },
  manualSub: { fontSize: 10.5, color: '#5B4494', marginTop: 1 },

  stats: { flex: 1, gap: 12 },
  stat: { flex: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  statLabel: { flex: 1, fontSize: 11.5, color: '#6E6478' },
  statValue: { fontSize: 21, fontWeight: '600', color: surface.ink },
  statMoney: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  currency: { fontSize: 11, color: surface.faint },
  currencySm: { fontSize: 10, color: surface.faint },
  currencyBig: { fontSize: 12, color: surface.faint },

  revCard: { height: 158, borderRadius: 22, paddingTop: 12, paddingHorizontal: 16, paddingBottom: 8 },
  cardHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  cardTitle: { fontSize: 12.5, fontWeight: '600', color: '#6E6478' },
  revTotal: { fontSize: 15, fontWeight: '600', color: surface.ink },
  chart: { flex: 1, marginTop: 4 },
  months: { flexDirection: LTR_ROW, alignItems: 'center' },
  axisPad: { width: 30 },
  /* בקנבס שורת החודשים היא direction: ltr · מרץ בשמאל, אוג׳ בימין */
  monthRow: { flex: 1, flexDirection: LTR_ROW, justifyContent: 'space-around' },
  month: { fontSize: 10, fontWeight: '300', color: '#9A93A6' },
  expRow: { marginTop: 3 },
  monthOn: { fontWeight: '600', color: '#7B5CBC' },

  donutCard: { width: 168, height: 144, borderRadius: 22, paddingVertical: 12, paddingHorizontal: 14 },
  donutBody: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 6, flex: 1 },
  legend: { flex: 1, gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendName: { flex: 1, fontSize: 10, fontWeight: '300', color: '#6E6478' },
  legendPct: { fontSize: 10.5, fontWeight: '600', color: surface.ink },

  profitCard: {
    flex: 1,
    height: 144,
    borderRadius: 22,
    paddingTop: 12,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  profitNet: { fontSize: 23, fontWeight: '600', color: surface.ink },
  profitNote: { fontSize: 10.5, fontWeight: '300', color: surface.faint },
  rule: { height: 1, backgroundColor: 'rgba(130,112,162,0.16)', marginVertical: 7 },
  grossRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 },
  gross: { fontSize: 13.5, fontWeight: '600', color: surface.ink },
  spacer: { flex: 1 },
});
