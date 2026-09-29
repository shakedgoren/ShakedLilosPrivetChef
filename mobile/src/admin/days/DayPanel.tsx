import React from 'react';

/** קוטר העיגול שהיה מאחורי ה-+ · הסמל תופס אותו עכשיו */
const ROUND = 32;
import { S } from '../../components/Sym';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
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
import { RED } from '../ui/tint';
import { ToggleRow } from '../ui/Toggle';
import { HOURS, hourLabel, hoursSummary } from './blockedHours';
import { BOXES, FRIDAY_ONLY_BOXES } from '../../data/boxes';
import { dowOf } from '../../data/calendar';
import type { useAdminDays } from './useAdminDays';

const FRIDAY = 5;

/**
 * שמות ארבעת מארזי שישי · **מהנתונים ולא מהקלדה**.
 *
 * ⚠ **למה להציג אותם** · שקד קראה להם בבקשה שלה ״פותחים שולחן,
 * הכל עליי, כמה שבא לכם״, ובנתונים הם ״חגיגה בשולחן, הכל עלינו,
 * קחו כמה שבא לכם״. השורה הזו מראה לה בדיוק על מה המתג עובד,
 * ואם מארז יתווסף או ייצא מהרשימה — היא תתעדכן לבד.
 */
const FRIDAY_BOX_NAMES = FRIDAY_ONLY_BOXES.map(
  (k) => BOXES.find((b) => b.key === k)?.name ?? k,
).join(' · ');

/** ⚠ הנוסחים בבלוק הזה נכתבו על ידי Claude · שקד לא כתבה אותם */
const HOURS_TITLE = 'שעות משלוח חסומות';
const HOURS_SUB = 'לחיצה על שעה חוסמת משלוחים בה · איסוף עצמי לא נחסם';
const HOURS_CLEAR = 'לפתוח הכול';
const BOX_ON = 'מארזי שישי פתוחים להזמנות';
const BOX_OFF = 'מארזי שישי סגורים להזמנות';

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

      {/**
        * ⚠ **מתג מארזי שישי · בקשה של שקד (26 בספטמבר 2026)** ·
        * ״באופן קבוע כל הימי מכירה שקשורים ל… פותחים שולחן וסלטים,
        * הכל עליי, כמה שבא לכם — סגורים להזמנות והם נפתחים עפ
        * החלטה שלי בלבד בצד מנהל״.
        *
        * ⚠ **בימי שישי בלבד** · ארבעת המארזים האלה נמסרים בשישי,
        * ולכן ביום אחר המתג לא היה משנה כלום — ומתג שלא עושה
        * כלום גרוע ממתג שאינו קיים. מה שלא נפתח נשאר סגור.
        *
        * ⚠ **נפרד מ-״פתוח להזמנות״** · בבחירה מפורשת שלה.
        */}
      {dowOf(admin.selected) === FRIDAY ? (
        <View style={s.block}>
          <View style={s.rule} />
          <ToggleRow
            title={admin.boxOpen ? BOX_ON : BOX_OFF}
            sub={FRIDAY_BOX_NAMES}
            on={admin.boxOpen}
            onToggle={admin.toggleBoxOpen}
          />
        </View>
      ) : null}

      {/**
        * ⚠ **חסימת שעות משלוח · בקשה של שקד (26 בספטמבר 2026)** ·
        * ״אופציה לחסום שעות של משלוחים לפי ימים בצד מנהל״, ובבחירה
        * שלה: לתאריך מסוים ולשעות מסוימות.
        *
        * ⚠ **מוצג בכל יום** · החסימה אינה קשורה ליום מכירה ולא
        * לקטגוריה — היא חלה על כל משלוח בתאריך הזה.
        */}
      <View style={s.block}>
        <View style={s.rule} />
        <View style={s.hoursHead}>
          <View style={s.hoursText}>
            <Text style={s.blockTitle}>{HOURS_TITLE}</Text>
            <Text style={s.blockSub}>{HOURS_SUB}</Text>
          </View>
          {admin.blockedHours.length > 0 ? (
            <Pressable onPress={admin.clearHours} hitSlop={8}>
              <Text style={s.clear}>{HOURS_CLEAR}</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={s.chips}>
          {HOURS.map((h) => (
            <Chip
              key={h}
              label={hourLabel(h)}
              on={admin.blockedHours.includes(h)}
              tint={RED}
              fontSize={12}
              height={32}
              radius={11}
              onPress={() => admin.toggleHour(h)}
            />
          ))}
        </View>
        <Text style={[s.summary, admin.blockedHours.length > 0 && s.summaryOn]}>
          {hoursSummary(admin.blockedHours)}
        </Text>
      </View>

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
                      style={[s.round, { backgroundColor: `rgba(${cat.rgb},0.13)` }]}
                    >
                                            <S k="plus" size={13} color={cat.deep} />
                    </Pressable>
                    <Text style={s.quotaNum}>{q.n}</Text>
                    <Pressable
                      onPress={() => admin.bumpQuota(q.id, -1)}
                      style={[s.round, s.minus, { opacity: q.n > 0 ? 1 : 0.4 }]}
                    >
                      <S k="minus" size={13} color="#2A2430" />
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
  title: { fontSize: 19, fontWeight: '600', color: surface.ink },
  block: { gap: 8 },
  rule: { height: 1, backgroundColor: 'rgba(130,112,162,0.14)' },
  blockTitle: { fontSize: 15.5, fontWeight: '600', color: surface.ink },
  blockSub: { fontSize: 13, fontWeight: '300', lineHeight: 17, color: surface.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },

  /* שורת הכותרת של השעות · הכותרת מימין, ״לפתוח הכול״ בקצה */
  hoursHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  hoursText: { flex: 1 },
  clear: { fontSize: 13, fontWeight: '600', color: RED.deep },
  summary: { fontSize: 12.5, fontWeight: '300', color: surface.muted, marginTop: 2 },
  summaryOn: { fontWeight: '500', color: RED.deep },

  quotaTitle: { fontSize: 15.5, fontWeight: '600', color: surface.ink, marginTop: 4 },
  quotaBlock: { gap: 4 },
  quotaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  /* שורת ההורדה · קטנה יותר, מתחת למכסה של אותה מנה */
  wasteRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 4 },
  wasteLabel: { flex: 1, fontSize: 12.5, fontWeight: '300', color: '#A79FB2' },
  roundSm: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  amber: { backgroundColor: 'rgba(199,125,62,0.14)' },
  wasteNum: { minWidth: 18, textAlign: 'center', fontSize: 15, fontWeight: '400', color: '#C4BDCE' },
  wasteOn: { fontWeight: '700', color: '#A65E2A' },
  quotaText: { flex: 1 },
  quotaName: { fontSize: 15, fontWeight: '500', color: surface.ink },
  quotaSold: { fontSize: 12.5, fontWeight: '300', color: '#A79FB2' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  round: { width: ROUND, height: ROUND, borderRadius: ROUND / 2, alignItems: 'center', justifyContent: 'center' },
  minus: { backgroundColor: 'rgba(130,112,162,0.09)' },
  sign: { fontSize: 19.5, fontWeight: '700', color: '#6E6478', lineHeight: 20 },
  quotaNum: { minWidth: 32, textAlign: 'center', fontSize: 18.5, fontWeight: '600', color: surface.ink },

  totalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, paddingTop: 3 },
  totalLabel: { flex: 1, fontSize: 14.5, fontWeight: '600', color: surface.inkSoft },
  totalValue: { width: 114, textAlign: 'center', fontSize: 18.5, fontWeight: '700', color: '#43307A' },
});
