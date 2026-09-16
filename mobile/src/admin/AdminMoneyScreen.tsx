import React, { useEffect, useMemo, useState } from 'react';
import { S, SymBoard, SymFileText, SymPackage } from '../components/Sym';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { surface } from '../theme/tokens';
import {
  CAT_TITLE,
  EXP_TITLE,
  EXPENSES,
  MONEY_CATS,
  MONEY_TITLE,
  PERIODS,
  REV_SUB_PREFIX,
  TILE_EXP,
  TILE_PROFIT,
  type PeriodKey,
} from '../data/adminMoney';
import { AdminShell } from './ui/AdminShell';
import { MoneyWave, type WavePoint } from './money/MoneyWave';
import { Bag, Bowl, BoxMeal, Camera, Cart, ChefHat, PayCash, SchnitzelDish, Truck } from '../icons';
import { Chip } from './ui/Chip';
import { apiEnabled } from '../api/config';
import { adminMoney } from '../api/admin';
import { useNav } from '../navigation/store';

const nf = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const PLUM = { rgb: '123,92,188', deep: '#43307A', hue: '#7B5CBC' };
/* ⚠ לא מהקנבס · האריח השלישי שביקשה שקד (15 בספטמבר 2026) */
const TILE_REV = 'הכנסות';
/* ⚠ ״הכנסות״ ולא ״לפי קטגוריה״ · בקשה של שקד (15 בספטמבר 2026) */
const INCOME_TITLE = 'הכנסות';

/** אייקון לכל יום מכירה · חלק מעיצוב ״הגלים״ שנבחר */
const CAT_ICON: Record<string, typeof Bowl> = {
  cous: Bowl,
  schn: SchnitzelDish,
  box: BoxMeal,
  chef: ChefHat,
};

/**
 * אייקון וגוון לכל קטגוריית הוצאה · אותה שורה נקייה של ״הגלים״.
 * ⚠ לא מהקנבס · הבחירה נגזרת ממה שהקטגוריה באמת אומרת: סל לשוק,
 * חבילה לאריזות, משאית למשלוחים, קרש למטבח ומצלמה לאינסטגרם.
 */
const EXP_LOOK: Record<string, { Icon: typeof Bowl; hue: string; deep: string }> = {
  'חומרי גלם': { Icon: Bag, hue: '#C98A5B', deep: '#A65E2A' },
  'אריזות וכלים': { Icon: SymPackage, hue: '#8E6FD0', deep: '#43307A' },
  'דלק ומשלוחים': { Icon: Truck, hue: '#8FBFD8', deep: '#2B4A6E' },
  'ציוד ותחזוקה': { Icon: SymBoard, hue: '#9FC9AE', deep: '#2C5A3E' },
  'שיווק': { Icon: Camera, hue: '#E8B48F', deep: '#7A3D18' },
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
        { label: 'ניהול הוצאות', onPress: () => go('adminExpenses'), icon: SymFileText },
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
        {/* ⚠ **רצועת ״הגלים״** · הבחירה של שקד (15 בספטמבר 2026)
            מתוך חמש הצעות, ובבקשה שלה גם בלי המילה ״מחזור״ ובלי
            הסכום — ציור בלבד, בגובה מינימלי, ושלוש הכרטיסיות
            מתחתיו. */}
        <MoneyWave points={view.points} />

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
              <S k="barChart" size={13} color="#4E8A64" />
              <Text style={s.tileK}>{TILE_PROFIT}</Text>
            </View>
            <Text style={[s.tileV, { color: '#4E8A64' }]}>{nf(view.profit)}</Text>
            {/* ⚠ **הרווחיות ירדה לכאן** · היא ישבה על כרטיס הגלים,
                ושקד ביקשה להשאיר שם ציור בלבד. בלי המעבר הזה
                המספר נעלם מהמסך לגמרי. */}
            <Text style={s.tileNote}>{`${REV_SUB_PREFIX}${view.margin}%`}</Text>
          </View>
        </View>

        {/* ⚠ **רשימה נקייה, בלי פסים ואחוזים** · כך הכרטיס בהצעה
            שנבחרה: אייקון בגוון הקטגוריה, שם, סכום, וקו שיער בין
            השורות. הפסים והאחוזים ירדו איתה.
            ⚠ הכותרת ״הכנסות״ ולא ״לפי קטגוריה״ · בקשה של שקד. */}
        <View style={s.card}>
          {/* ⚠ **בלי תג התקופה** · שקד ביקשה למחוק אותו (15 בספטמבר
              2026) — הלשוניות שמעל כבר אומרות איזו תקופה מוצגת. */}
          <Text style={s.cardTitle}>{INCOME_TITLE}</Text>
          {view.cats.map((c, i) => {
            const Icon = CAT_ICON[c.id] ?? Bowl;
            return (
              <View key={c.n} style={[s.line, i > 0 && s.lineTop]}>
                <View style={[s.lineIcon, { backgroundColor: `rgba(${hexRgb(c.hue)},0.16)` }]}>
                  <Icon size={13} color={c.deep} strokeWidth={1.9} />
                </View>
                <Text style={s.lineName} numberOfLines={1}>
                  {c.n}
                </Text>
                <Text style={[s.lineVal, { color: c.v > 0 ? c.deep : surface.faint }]}>{`${nf(c.v)} ₪`}</Text>
              </View>
            );
          })}
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>{EXP_TITLE}</Text>
          {view.expenseRows.map((e, i) => {
            const look = EXP_LOOK[e.k] ?? { Icon: Bag, hue: '#8A8194', deep: '#4A4254' };
            return (
              <View key={e.k} style={[s.line, i > 0 && s.lineTop]}>
                <View style={[s.lineIcon, { backgroundColor: `rgba(${hexRgb(look.hue)},0.16)` }]}>
                  <look.Icon size={13} color={look.deep} strokeWidth={1.9} />
                </View>
                <View style={s.lineText}>
                  <Text style={s.lineName} numberOfLines={1}>
                    {e.k}
                  </Text>
                  <Text style={s.lineSub} numberOfLines={1}>
                    {e.sub}
                  </Text>
                </View>
                <Text style={[s.lineVal, { color: e.v > 0 ? look.deep : surface.faint }]}>{`${nf(e.v)} ₪`}</Text>
              </View>
            );
          })}
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
   * ⚠ **מתחת לרצועה ולא מעליה** · שקד ביקשה (15 בספטמבר 2026)
   * שהכרטיסיות יישבו מתחת לדיאגרמה. קודם הן ריחפו על שוליה.
   */
  row: { flexDirection: 'row', gap: 8 },
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
  tileK: { fontSize: 11.5, color: surface.faint, fontWeight: '500' },
  tileV: { fontSize: 19.5, fontWeight: '700', marginTop: 2 },
  tileNote: { fontSize: 11, fontWeight: '600', color: '#4E8A64', opacity: 0.75, marginTop: 1 },
  /* ⚠ לבן מלא ולא זכוכית · כך הכרטיס בהצעה שנבחרה */
  card: {
    borderRadius: 20,
    padding: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(142,111,208,0.16)',
    boxShadow: '0 2px 4px -2px rgba(90,80,70,0.1), 0 16px 32px -18px rgba(90,80,70,0.28)',
  } as never,
  cardTitle: { fontSize: 13, fontWeight: '600', letterSpacing: 0.7, color: '#9488B5', marginBottom: 4 },
  /* שורת הרשימה · אייקון, שם, סכום — וקו שיער בין השורות */
  line: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7 },
  lineTop: { borderTopWidth: 1, borderTopColor: 'rgba(142,111,208,0.09)' },
  lineIcon: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  lineText: { flex: 1 },
  lineName: { flex: 1, fontSize: 14, fontWeight: '500', color: '#54467A' },
  lineSub: { fontSize: 12, fontWeight: '300', color: surface.faint, marginTop: 1 },
  lineVal: { fontSize: 14.5, fontWeight: '700' },
});
