import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { surface } from '../theme/tokens';
import { MONTHS } from '../data/adminDays';
import { AdminShell } from './ui/AdminShell';
import { apiEnabled } from '../api/config';
import { adminIncome, type IncomeRow } from '../api/admin';
import { useNav } from '../navigation/store';

/**
 * פנקס ההכנסות.
 *
 * ⚠ **לא מהקנבס** · בקשה של שקד (15 בספטמבר 2026): כפתור לעמוד
 * הכנסות לצד כפתור ההוצאות במסך הכספים.
 *
 * ⚠ **הסכום הוא מה ששולם** · `total` של ההזמנה, כולל דמי משלוח —
 * אותו מספר שכרטיס ״מחזור״ במסך הכספים מסכם, כדי שהשניים
 * יתיישבו. בדף הבית ״הכנסות עבור היום״ מחושב אחרת (מנות ×
 * מחיר), לפי בקשה מפורשת שלה.
 */

const nf = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** ‎2026-09 → ״ספטמבר 2026״ */
function monthLabel(period: string): string {
  const [y, m] = period.split('-').map(Number);
  return MONTHS[m - 1] ? `${MONTHS[m - 1]} ${y}` : period;
}

export function AdminIncomeScreen() {
  const { user } = useNav();
  const live = apiEnabled && user?.role === 'admin';
  const [rows, setRows] = useState<IncomeRow[] | null>(null);

  const load = useCallback(() => {
    if (!live) return;
    void adminIncome()
      .then((r) => setRows(r.rows))
      .catch(() => setRows([]));
  }, [live]);

  useEffect(load, [load]);

  /** קיבוץ לחודשים · החדש למעלה, עם סכום לכל חודש */
  const months = useMemo(() => {
    const out: { period: string; total: number; orders: number; rows: IncomeRow[] }[] = [];
    for (const r of rows ?? []) {
      let bucket = out.find((b) => b.period === r.period);
      if (!bucket) {
        bucket = { period: r.period, total: 0, orders: 0, rows: [] };
        out.push(bucket);
      }
      bucket.total += r.amount;
      bucket.orders += r.orders;
      bucket.rows.push(r);
    }
    return out;
  }, [rows]);

  return (
    <AdminShell title="הכנסות" sub="לפי יום מכירה וקטגוריה">
      <ScrollView style={s.body} contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
        {!live ? <Text style={s.empty}>ההכנסות נטענות מהשרת · אין חיבור כרגע</Text> : null}
        {live && rows && rows.length === 0 ? <Text style={s.empty}>עוד אין הזמנות</Text> : null}

        {months.map((m) => (
          <View key={m.period} style={s.card}>
            <View style={s.cardHead}>
              <Text style={s.cardTitle}>{monthLabel(m.period)}</Text>
              <Text style={s.cardSum}>{`${nf(m.total)} ₪`}</Text>
            </View>

            {m.rows.map((r) => (
              <View key={r.id} style={s.row}>
                <View style={[s.bar, { backgroundColor: r.hue }]} />
                <View style={s.rowText}>
                  <Text style={[s.rowCat, { color: r.deep }]}>{r.catName}</Text>
                  <Text style={s.rowSub} numberOfLines={1}>
                    {`${r.label} · ${r.orders} הזמנות · ${r.meals} מנות`}
                  </Text>
                </View>
                <Text style={s.rowVal}>{`${nf(r.amount)} ₪`}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </AdminShell>
  );
}

const s = StyleSheet.create({
  body: { flex: 1 },
  pad: { paddingBottom: 120, gap: 12 },
  empty: { fontSize: 12.5, color: surface.faint, textAlign: 'center', marginTop: 24 },

  card: {
    borderRadius: 20,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    gap: 9,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 13.5, fontWeight: '600', color: surface.ink },
  cardSum: { fontSize: 13.5, fontWeight: '700', color: '#43307A' },

  row: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  /* פס בגוון הקטגוריה · מזהה את יום המכירה במבט */
  bar: { width: 3, alignSelf: 'stretch', borderRadius: 2, minHeight: 28 },
  rowText: { flex: 1, gap: 1 },
  rowCat: { fontSize: 12.5, fontWeight: '600' },
  rowSub: { fontSize: 11, fontWeight: '300', color: surface.faint },
  rowVal: { fontSize: 13.5, fontWeight: '700', color: surface.ink },
});
