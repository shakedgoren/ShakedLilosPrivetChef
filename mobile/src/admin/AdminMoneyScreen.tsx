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
import { MoneyWave, type WavePoint } from './money/MoneyWave';
import { BarChart, Bowl, BoxMeal, Cart, ChefHat, FileText, PayCash, SchnitzelDish } from '../icons';
import { Chip } from './ui/Chip';
import { apiEnabled } from '../api/config';
import { adminMoney } from '../api/admin';
import { useNav } from '../navigation/store';

const nf = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const PLUM = { rgb: '123,92,188', deep: '#43307A', hue: '#7B5CBC' };
/* ⚠ לא מהקנבס · האריח השלישי שביקשה שקד (15 בספטמבר 2026) */
const TILE_REV = 'הכנסות';

/** אייקון לכל יום מכירה · חלק מעיצוב ״הגלים״ שנבחר */
const CAT_ICON: Record<string, typeof Bowl> = {
  cous: Bowl,
  schn: SchnitzelDish,
  box: BoxMeal,
  chef: ChefHat,
};

/** ‎#7B5CBC → ‎123,92,188 · לשקיפויות, כי אין rgba על hex ב-RN */
const hexRgb = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};

export function AdminMoneyScreen() {
  const { user, go } = useNav();
  const live = apiEnabled && user?.role === 'admin';
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [data, setData] = useState<{
    label: string;
    periodName: string;
    revenue: number;
    expenses: number;
    profit: number;
    margin: number;
    cats: { id: string; n: string; hue: string; deep: string; v: number; pct: number }[];
    points: WavePoint[];
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
    const buckets = period === 'month' ? 30 : period === 'quart' ? 3 : 12;
    return {
      label: p.label,
      periodName: p.n,
      revenue: rev,
      expenses: exp,
      profit,
      margin,
      cats: MONEY_CATS.map((c) => ({
        id: c.id,
        n: c.n,
        hue: c.hue,
        deep: c.deep,
        v: Math.round(rev * c.share),
        pct: Math.round(c.share * 100),
        w: Math.round((c.share / maxShare) * 100),
      })),
      /**
       * ⚠ **נקודות נפילה-לאחור** · בלי שרת אין מגמה אמיתית, ולכן
       * הסכום של הקנבס נפרס על הסלים בעלייה רכה — רק כדי שהגל
       * ייראה. עם שרת מגיעות הנקודות האמיתיות.
       */
      points: Array.from({ length: buckets }, (_, i) => {
        const t = (i + 1) / buckets;
        /* גל ולא סרגל · הסינוס נותן לנפילה-לאחור צורה אורגנית */
        const ripple = 1 + 0.32 * Math.sin(t * Math.PI * 3.2);
        return {
          k: String(i + 1),
          rev: Math.round((rev / buckets) * (0.45 + 1.1 * t) * ripple),
          exp: Math.round((exp / buckets) * (0.7 + 0.6 * t) * (2 - ripple)),
        };
      }),
      expenseRows: EXPENSES.map((e) => ({ k: e.k, sub: e.sub, v: Math.round(e.gross * p.factor) })),
    };
  }, [period]);

  const view = data ?? demo;
  const maxCat = Math.max(...view.cats.map((c) => c.v), 1);

  return (
    /* ⚠ **דלת למסך ההוצאות** · בקשה של שקד (15 בספטמבר 2026)
       שהגישה תהיה דרך הכספים. גם האריח ״הוצאות״ עצמו נלחץ. */
    <AdminShell
      title={MONEY_TITLE}
      sub={view.label}
      actions={[
        { label: 'ניהול הוצאות', onPress: () => go('adminExpenses'), icon: FileText },
        { label: 'פנקס ההכנסות', onPress: () => go('adminIncome'), icon: PayCash },
      ]}
    >
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
        {/* ⚠ **עיצוב ״הגלים״** · הבחירה של שקד (15 בספטמבר 2026)
            מתוך חמש הצעות. הגרף הוא הרקע של הכרטיס, והמספרים
            מרחפים מעליו בזכוכית. */}
        <MoneyWave
          label={REV_LABEL}
          total={view.revenue}
          margin={view.margin}
          marginLabel={REV_SUB_PREFIX}
          points={view.points}
        />

        {/* ⚠ **שלושה אריחי זכוכית** · שקד ביקשה (15 בספטמבר 2026)
            שהשורה תתחלק להכנסות, הוצאות ורווח, עם אייקון לצד כל
            תיאור. שניים מהם נלחצים ופותחים את הפנקסים. */}
        <View style={s.row}>
          <Pressable onPress={() => go('adminIncome')} style={s.tile}>
            <View style={s.tileHead}>
              <PayCash size={13} color={PLUM.deep} strokeWidth={1.9} />
              <Text style={s.tileK}>{TILE_REV}</Text>
            </View>
            <Text style={[s.tileV, { color: PLUM.deep }]}>{nf(view.revenue)}</Text>
          </Pressable>
          <Pressable onPress={() => go('adminExpenses')} style={s.tile}>
            <View style={s.tileHead}>
              <Cart size={13} color="#A65E2A" strokeWidth={1.9} />
              <Text style={s.tileK}>{TILE_EXP}</Text>
            </View>
            <Text style={[s.tileV, { color: '#A65E2A' }]}>{nf(view.expenses)}</Text>
          </Pressable>
          <View style={s.tile}>
            <View style={s.tileHead}>
              <BarChart size={13} color="#4E8A64" strokeWidth={1.9} />
              <Text style={s.tileK}>{TILE_PROFIT}</Text>
            </View>
            <Text style={[s.tileV, { color: '#4E8A64' }]}>{nf(view.profit)}</Text>
          </View>
        </View>

        {/* ⚠ **אייקון לכל קטגוריה** · קערה לקוסקוס, שניצל למטעמים,
            מארז לספיישל וכובע שף לשף וטאבון — במקום שם בלבד. */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <Text style={s.cardTitle}>{CAT_TITLE}</Text>
            <Text style={s.tag}>{view.periodName}</Text>
          </View>
          {view.cats.map((c) => {
            const Icon = CAT_ICON[c.id] ?? Bowl;
            return (
              <View key={c.n} style={s.catRow}>
                <View style={s.catTop}>
                  <View style={[s.catIcon, { backgroundColor: `rgba(${hexRgb(c.hue)},0.16)` }]}>
                    <Icon size={13} color={c.deep} strokeWidth={1.9} />
                  </View>
                  <Text style={[s.catName, { color: c.deep }]} numberOfLines={1}>
                    {c.n}
                  </Text>
                  <Text style={s.catVal}>{`${nf(c.v)} ₪`}</Text>
                </View>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${Math.round((c.v / maxCat) * 100)}%`, backgroundColor: c.hue }]} />
                </View>
                <Text style={s.catPct}>{`${c.pct}%`}</Text>
              </View>
            );
          })}
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
  /**
   * ⚠ **האריחים מרחפים מעל הגל** · שוליים שליליים מרימים אותם על
   * שולי כרטיס הגלים, ולכן הם זכוכית בהירה עם צל רך משלהם —
   * זה מה שמייחד את עיצוב ״הגלים״ שנבחר.
   */
  row: { flexDirection: 'row', gap: 8, marginTop: -22, marginHorizontal: 6, zIndex: 2 },
  tileHead: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tile: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 9,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.92)',
    boxShadow: '0 8px 20px -14px rgba(90,80,70,0.5)',
  } as never,
  tileK: { fontSize: 10, color: surface.faint, fontWeight: '500' },
  tileV: { fontSize: 17, fontWeight: '700', marginTop: 2 },
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
  catTop: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  catIcon: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  catName: { flex: 1, fontSize: 13, fontWeight: '600' },
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
