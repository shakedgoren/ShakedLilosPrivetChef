import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { surface } from '../theme/tokens';
import { DONUT, HOME_SUBTITLE, HOME_TITLE, PROFIT, type TileKey } from '../data/adminHome';
import { NewOrderSheet } from './NewOrderSheet';
import { SentNotice } from './SentNotice';
import { useAdminOrders } from './useAdminOrders';
import { useNav, type Screen } from '../navigation/store';
import { GlassCard } from './home/GlassCard';
import { SalePanel } from './home/SalePanel';
import { TileRail } from './home/TileRail';
import { CategoryDonut, ProfitBars, RevenueChart } from './home/Charts';
import { REV_RANGES, useAdminHome } from './home/useAdminHome';
import { LTR_ROW } from './ui/ltrRow';
import { Plus } from '../icons';

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

/** ‎2026-09-15 → ‎15.9 · כמו התג של ״ימי מכירה״ בקנבס */
const shortDate = (iso: string) =>
  iso.length === 10 ? `${+iso.slice(8)}.${+iso.slice(5, 7)}` : iso;

/** ⚠ טקסט שכתבתי · שקד ביקשה את המילים האלה על הכפתור */
const NEW_ORDER_LABEL = 'הזמנה חדשה';

export function AdminHomeScreen() {
  const { go } = useNav();
  const home = useAdminHome();
  /* אותה חלונית בדיוק של מסך ההזמנות · ההזמנה הידנית חיה שם */
  const admin = useAdminOrders();

  return (
    <ScrollView style={s.root} contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
      <View style={s.head}>
        <View style={s.headText}>
          <Text style={s.title}>{HOME_TITLE}</Text>
          <Text style={s.sub}>{home.subtitle || HOME_SUBTITLE}</Text>
        </View>
        {/* ⚠ **״לחנות״ ירד וכאן יושבת הזמנה חדשה** · שקד ביקשה
            (15 בספטמבר 2026) כפתור שממנו היא מכניסה הזמנה של לקוחה
            שהתקשרה או כתבה בוואטסאפ, בלי שהלקוחה נרשמת לאתר.
            הכרטיס הסגול ״הזמנה ידנית״ שהיה מתחת ללוח המכירה ירד,
            והפעולה שלו עברה לכאן. */}
        <Pressable onPress={admin.openNew} style={s.newChip}>
          <View style={s.newPlus}>
            <Plus size={13} color="#43307A" strokeWidth={2.8} />
          </View>
          <Text style={s.newText}>{NEW_ORDER_LABEL}</Text>
        </Pressable>
      </View>

      <SalePanel
        label={home.sale.label}
        isOpen={home.sale.open}
        onToggle={home.toggleOpen}
        dishes={home.sale.dishes}
        onBump={home.bumpDish}
        step={home.step}
        pct={home.ringPct}
        hue={home.sale.hue}
        rgb={home.sale.rgb}
        sold={home.soldTotal}
        quota={home.quotaTotal}
      />

      {/* ⚠ **שני הכרטיסים של יום המכירה** · שקד ביקשה שיופיעו זה
          לצד זה, ושכל אחד ינקוב בתאריך המכירה עצמו ולא ב״היום״. */}
      <View style={s.statRow}>
        {/* ⚠ **הזמנות ומנות יחד** · שקד ביקשה (15 בספטמבר 2026)
            לראות גם כמה הזמנות התקבלו וגם כמה מנות נמכרו בהן —
            עשר הזמנות של עשר מנות יופיעו ״10 | 100״. */}
        <GlassCard style={s.stat}>
          <Text style={s.statLabel}>{`הזמנות ומנות עבור ${shortDate(home.sale.date)}`}</Text>
          <View style={s.pair}>
            <Text style={s.statValue}>{home.sale.orders}</Text>
            <Text style={s.pipe}>|</Text>
            <Text style={s.statValue}>{home.sale.meals}</Text>
          </View>
        </GlassCard>
        <GlassCard style={s.stat}>
          <Text style={s.statLabel}>{`מחזור עבור ${shortDate(home.sale.date)}`}</Text>
          <View style={s.statMoney}>
            <Text style={s.statValue}>{money(home.sale.revenue)}</Text>
            <Text style={s.currency}>₪</Text>
          </View>
        </GlassCard>
      </View>

      {/* ⚠ **בחירת טווח** · שקד ביקשה (15 בספטמבר 2026) לראות את
          המחזור של היום, של השבוע, של החודש ושל חצי השנה האחרונה.
          קודם הגרף היה נתיב קבוע מהקנבס והראה תמיד ששה חודשים. */}
      <GlassCard style={s.revCard}>
        <View style={s.cardHead}>
          <Text style={s.cardTitle}>{home.rev.label}</Text>
          <View style={s.statMoney}>
            <Text style={s.revTotal}>{money(home.rev.total)}</Text>
            <Text style={s.currency}>₪</Text>
          </View>
        </View>

        <View style={s.ranges}>
          {REV_RANGES.map((r) => {
            const on = home.range === r.id;
            return (
              <Pressable
                key={r.id}
                onPress={() => home.setRange(r.id)}
                style={[s.range, on && s.rangeOn]}
              >
                <Text style={[s.rangeText, on && s.rangeTextOn]}>{r.n}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={s.chart}>
          <RevenueChart points={home.rev.points} />
        </View>
        <View style={s.months}>
          <View style={s.axisPad} />
          <View style={s.monthRow}>
            {home.rev.points.map((p, i) => (
              <Text
                key={`${p.k}-${i}`}
                style={[s.month, i === home.rev.points.length - 1 && s.monthOn]}
                numberOfLines={1}
              >
                {p.k}
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

      {admin.newOpen ? <NewOrderSheet admin={admin} /> : null}

      {/* ⚠ אישור שהודעת הוואטסאפ יצאה ללקוח · בקשה של שקד */}
      <SentNotice who={admin.notified} onClose={admin.clearNotified} />
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
  newChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 34,
    paddingHorizontal: 5,
    paddingLeft: 13,
    borderRadius: 999,
    backgroundColor: '#C6B3EC',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  newPlus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newText: { fontSize: 12.5, fontWeight: '600', color: '#43307A' },

  row: { flexDirection: 'row', gap: 12, height: 144 },
  statRow: { flexDirection: 'row', gap: 12, height: 62 },
  /* ⚠ ממורכז · בקשה של שקד (15 בספטמבר 2026) */
  stat: { flex: 1, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', gap: 3 },
  statLabel: { fontSize: 11, color: '#6E6478', textAlign: 'center' },
  statValue: { fontSize: 21, fontWeight: '600', color: surface.ink },
  statMoney: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  currency: { fontSize: 11, color: surface.faint },
  currencySm: { fontSize: 10, color: surface.faint },
  currencyBig: { fontSize: 12, color: surface.faint },

  /* ⚠ הגובה גדל ב-34 · שורת הטווחים נוספה מתחת לכותרת */
  revCard: { height: 192, borderRadius: 22, paddingTop: 12, paddingHorizontal: 16, paddingBottom: 8 },
  ranges: { flexDirection: 'row', gap: 5, marginTop: 8 },
  range: {
    flex: 1,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1.2,
    borderColor: 'rgba(130,112,162,0.16)',
  },
  rangeOn: { backgroundColor: 'rgba(123,92,188,0.12)', borderColor: 'rgba(123,92,188,0.42)' },
  rangeText: { fontSize: 11, fontWeight: '400', color: '#6E6478' },
  rangeTextOn: { fontWeight: '600', color: '#43307A' },

  pair: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  pipe: { fontSize: 15, fontWeight: '300', color: 'rgba(130,112,162,0.5)' },
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
