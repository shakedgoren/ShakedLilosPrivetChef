import React from 'react';

/** קוטר העיגול שהיה מאחורי ה-+ · הסמל תופס אותו עכשיו */
const ROUND = 32;
import { S } from '../../components/Sym';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { surface } from '../../theme/tokens';
import {
  CATS,
  CAT_KEYS,
  DAY_NAMES,
  EXCEPT_SUB,
  EXCEPT_TITLE,
  MONTHS,
  SALE_KEYS,
  SALE_TITLE,
  TOTAL_LABEL,
  type DayCatKey,
} from '../../data/adminDays';
import { Chip } from '../ui/Chip';
import { ToggleRow } from '../ui/Toggle';
import type { useAdminDays } from './useAdminDays';
import { Minus, Plus } from '../../icons';

/** ראשון, 8 בספטמבר */
function dayTitle(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${DAY_NAMES[date.getDay()]}, ${d} ב${MONTHS[m - 1]}`;
}

type Props = { admin: ReturnType<typeof useAdminDays> };

/**
 * ⚠ **פירות ירדו מימי המכירה** · שקד ביקשה (15 בספטמבר 2026):
 * ״להוציא את פירות מהימי מכירה — זה לא קשור לשם״. מגשי הפירות
 * נעשים אצל מיכל גורן ואינם עוברים במערכת ההזמנות, ולכן אין
 * להם יום מכירה ואין להם מכסה.
 * ⚠ `CAT_KEYS` מגיע מהקובץ המחולץ ואין לערוך אותו ביד.
 */
const EXCEPT_KEYS = CAT_KEYS.filter((k) => k !== 'fruit');

export function DayPanel({ admin }: Props) {
  const r = admin.current;
  const cat = admin.cat;
  const blocked = !!r.blocked;

  return (
    <View style={s.card}>
      <Text style={s.title}>{dayTitle(admin.selected)}</Text>

      <ToggleRow
        title={blocked ? 'לא זמינה ביום הזה' : 'זמינה ביום הזה'}
        sub={blocked ? 'היום חסום לכל הקטגוריות' : 'אפשר לקבוע יום מכירה'}
        on={!blocked}
        onToggle={admin.toggleAvail}
      />

      {blocked ? (
        <View style={s.block}>
          <View style={s.rule} />
          <Text style={s.blockTitle}>{EXCEPT_TITLE}</Text>
          <Text style={s.blockSub}>{EXCEPT_SUB}</Text>
          <View style={s.chips}>
            {EXCEPT_KEYS.map((k) => (
              <Chip
                key={k}
                label={CATS[k].short}
                on={r.except === k}
                tint={CATS[k]}
                fontSize={12}
                onPress={() => admin.setExcept(k)}
              />
            ))}
          </View>
        </View>
      ) : (
        <View style={s.block}>
          <View style={s.rule} />
          <Text style={s.blockTitle}>{SALE_TITLE}</Text>
          <View style={s.chips}>
            {SALE_KEYS.map((k) => (
              <Chip
                key={k}
                label={CATS[k].n}
                on={r.sale === k}
                tint={CATS[k]}
                fontSize={12}
                onPress={() => admin.setSale(k)}
              />
            ))}
          </View>
        </View>
      )}

      {cat ? (
        <View style={s.block}>
          <View style={s.rule} />
          <ToggleRow
            title={r.open ? 'פתוח להזמנות' : 'סגור להזמנות'}
            /* ⚠ **שני התיאורים נמחקו** · שקד ביקשה (15 בספטמבר 2026)
               להוריד את ״לקוחות רואות את היום ויכולות להזמין״ ואת
               ״היום מוגדר, אבל עוד לא נפתח״. תיאורי החריגה נשארו —
               הם אומרים משהו שאי אפשר לדעת מהכותרת לבדה. */
            sub={
              blocked
                ? r.open
                  ? `${cat.n} בלבד · שאר הקטגוריות סגורות`
                  : 'החריגה מוגדרת, אבל עוד לא נפתחה'
                : undefined
            }
            on={!!r.open}
            onToggle={admin.toggleOpen}
          />

          {admin.quotas.length > 0 ? (
            <>
              {/* ⚠ ״מלאי יומי״ · בקשה של שקד (15 בספטמבר 2026) */}
              <Text style={s.quotaTitle}>{blocked ? 'מלאי החריגה' : 'מלאי יומי'}</Text>
              {admin.quotas.map((q) => (
                <View key={q.id} style={s.quotaBlock}>
                  <View style={s.quotaRow}>
                  <View style={s.quotaText}>
                    <Text style={s.quotaName}>{q.name}</Text>
                    {/* ⚠ **בלי ״טרם נמכרו״** · שקד ביקשה (15 בספטמבר
                        2026) למחוק אותו. השורה מופיעה רק כשבאמת
                        נמכר משהו. */}
                    {q.sold > 0 ? <Text style={s.quotaSold}>{q.soldLabel}</Text> : null}
                  </View>
                  <View style={s.stepper}>
                    <Pressable
                      onPress={() => admin.bumpQuota(q.id, 1)}
                      style={s.round}
                    >
                      {/* ⚠ הסמל מגיע עם טבעת משלו · עיגול רקע היה יוצר שני עיגולים */}
                      <S k="plus" size={ROUND} color={cat.deep} />
                    </Pressable>
                    <Text style={s.quotaNum}>{q.n}</Text>
                    <Pressable
                      onPress={() => admin.bumpQuota(q.id, -1)}
                      style={[s.round, { opacity: q.n > 0 ? 1 : 0.4 }]}
                    >
                      <S k="minus" size={ROUND} color="#2A2430" />
                    </Pressable>
                  </View>
                  </View>
                </View>
              ))}
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>{TOTAL_LABEL}</Text>
                <Text style={s.totalValue}>{admin.totalQuota}</Text>
              </View>
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  title: { fontSize: 16.5, fontWeight: '600', color: surface.ink },
  block: { gap: 8 },
  rule: { height: 1, backgroundColor: 'rgba(130,112,162,0.14)' },
  blockTitle: { fontSize: 13.5, fontWeight: '600', color: surface.ink },
  blockSub: { fontSize: 11.5, fontWeight: '300', lineHeight: 17, color: surface.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },

  quotaTitle: { fontSize: 13.5, fontWeight: '600', color: surface.ink, marginTop: 4 },
  quotaBlock: { gap: 4 },
  quotaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  /* שורת ההורדה · קטנה יותר, מתחת למכסה של אותה מנה */
  wasteRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 4 },
  wasteLabel: { flex: 1, fontSize: 11, fontWeight: '300', color: '#A79FB2' },
  roundSm: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  amber: { backgroundColor: 'rgba(199,125,62,0.14)' },
  wasteNum: { minWidth: 18, textAlign: 'center', fontSize: 13, fontWeight: '400', color: '#C4BDCE' },
  wasteOn: { fontWeight: '700', color: '#A65E2A' },
  quotaText: { flex: 1 },
  quotaName: { fontSize: 13, fontWeight: '500', color: surface.ink },
  quotaSold: { fontSize: 11, fontWeight: '300', color: '#A79FB2' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  /* ⚠ בלי רקע ובלי רדיוס · הטבעת מגיעה מהסמל עצמו */
  round: { width: ROUND, height: ROUND, alignItems: 'center', justifyContent: 'center' },
  sign: { fontSize: 17, fontWeight: '700', color: '#6E6478', lineHeight: 20 },
  quotaNum: { minWidth: 32, textAlign: 'center', fontSize: 16, fontWeight: '600', color: surface.ink },

  totalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, paddingTop: 3 },
  totalLabel: { flex: 1, fontSize: 12.5, fontWeight: '600', color: surface.inkSoft },
  totalValue: { width: 114, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#43307A' },
});
