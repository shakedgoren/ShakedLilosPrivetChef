import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { surface } from '../theme/tokens';
import { AdminShell } from './ui/AdminShell';
import { Chip } from './ui/Chip';
import { ChipRail } from './ui/ChipRail';
import { apiEnabled } from '../api/config';
import { adminListOrders, adminOrderHistory, type SaleDaySummary } from '../api/orders';
import type { AdminCard } from '../api/types';
import { CATEGORIES } from '../data/categories';
import { DOWS, dowOf } from '../data/calendar';
import { count } from '../text/counts';

/**
 * היסטוריית ההזמנות · ימי מכירה, ובתוך כל יום ההזמנות שלו.
 *
 * ⚠ **נבנה ב-18 בספטמבר 2026** · בקשה של שקד: ״בעמוד ההזמנות לראות
 * רק את ההזמנות הפתוחות שקשורות לאותה המכירה הנוכחית. את כל השאר
 * שיהיו בהיסטוריית הזמנות, מחולקות לפי קטגוריות ומחולקות לכל תאריך.
 * בראשי אני אראה רק את התאריך, וכשאני אלחץ על התאריך ייפתחו כל
 * ההזמנות של אותה מכירה — ושם אתה יכול להוסיף את העימוד״.
 *
 * ⚠ **זה מה שהחליף את העימוד במסך הראשי** · במקום לשלוח אלפי הזמנות
 * ולסנן אותן במכשיר, השרת שולח **שורה אחת לכל יום מכירה**. ההזמנות
 * עצמן נטענות רק כשפותחים תאריך, ושם הן מגיעות בדפים.
 */

const PLUM = { hue: '#7B5CBC', deep: '#43307A', rgb: '123,92,188' };
const ALL = 'הכל';
/** כמה הזמנות בדף · פתיחת תאריך מביאה את הדף הראשון בלבד */
const PAGE = 20;

/** ״15.09.2026 · יום ג׳״ · אותו פורמט שכבר קיים בהודעות הוואטסאפ */
function humanDate(key: string): string {
  const [y, m, d] = key.split('-');
  return `${d}.${m}.${y} · יום ${DOWS[dowOf(key)]}׳`;
}

const nameOf = (key: string) =>
  CATEGORIES.find((c) => c.key === key)?.short ?? CATEGORIES.find((c) => c.key === key)?.title ?? key;

const nf = (n: number) => n.toLocaleString('he-IL');

export function AdminOrderHistoryScreen() {
  const [days, setDays] = React.useState<SaleDaySummary[]>([]);
  const [filter, setFilter] = React.useState(ALL);
  const [open, setOpen] = React.useState('');
  /** ההזמנות של התאריך הפתוח · נטענות רק כשפותחים אותו */
  const [rows, setRows] = React.useState<AdminCard[]>([]);
  const [total, setTotal] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    if (!apiEnabled) return;
    let alive = true;
    adminOrderHistory()
      .then(({ days: d }) => alive && setDays(d))
      .catch(() => alive && setErr('לא ניתן לטעון את ההיסטוריה'));
    return () => {
      alive = false;
    };
  }, []);

  /** הקטגוריות שיש להן בכלל היסטוריה · אין טעם בצ׳יפ ריק */
  const cats = React.useMemo(() => {
    const seen = new Set(days.map((d) => d.category));
    return CATEGORIES.filter((c) => seen.has(c.key)).map((c) => c.key);
  }, [days]);

  const shown = filter === ALL ? days : days.filter((d) => d.category === filter);

  /**
   * פתיחת תאריך · מביאה את הדף הראשון.
   * ⚠ **הדף נטען מחדש בכל פתיחה** · יום מכירה סגור אינו משתנה, אבל
   * יום פתוח כן, ומטמון היה מציג מצב ישן בלי שתדעי.
   */
  const load = React.useCallback(async (day: SaleDaySummary, from: number) => {
    setBusy(true);
    try {
      const res = await adminListOrders({
        date: day.date,
        category: day.category,
        limit: PAGE,
        skip: from,
      });
      setRows((cur) => (from === 0 ? res.cards : [...cur, ...res.cards]));
      setTotal(res.total ?? res.cards.length);
    } catch {
      setErr('לא ניתן לטעון את ההזמנות');
    } finally {
      setBusy(false);
    }
  }, []);

  const toggle = (day: SaleDaySummary) => {
    const key = `${day.category}:${day.date}`;
    if (open === key) {
      setOpen('');
      return;
    }
    setOpen(key);
    setRows([]);
    setTotal(0);
    void load(day, 0);
  };

  const orders = days.reduce((n, d) => n + d.orders, 0);

  return (
    <AdminShell
      title="היסטוריית הזמנות"
      sub={`${count(days.length, 'יום מכירה אחד', 'ימי מכירה')} · ${nf(orders)} הזמנות`}
    >
      {cats.length > 1 ? (
        <ChipRail>
          <Chip
            label={ALL}
            on={filter === ALL}
            tint={PLUM}
            height={32}
            radius={11}
            onPress={() => {
              setFilter(ALL);
              setOpen('');
            }}
          />
          {cats.map((k) => (
            <Chip
              key={k}
              label={nameOf(k)}
              on={filter === k}
              tint={PLUM}
              height={32}
              radius={11}
              onPress={() => {
                setFilter(k);
                setOpen('');
              }}
            />
          ))}
        </ChipRail>
      ) : null}

      <ScrollView style={s.body} contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
        {err ? <Text style={s.err}>{err}</Text> : null}
        {shown.length === 0 && !err ? <Text style={s.empty}>אין עדיין מכירות בהיסטוריה</Text> : null}

        {shown.map((day) => {
          const key = `${day.category}:${day.date}`;
          const on = open === key;
          return (
            <Pressable key={key} onPress={() => toggle(day)} style={s.card}>
              <View style={s.head}>
                <View style={s.headText}>
                  <Text style={s.date}>{humanDate(day.date)}</Text>
                  <Text style={s.cat}>{nameOf(day.category)}</Text>
                </View>
                <Text style={s.n}>{count(day.orders, 'הזמנה אחת', 'הזמנות')}</Text>
              </View>

              {on ? (
                /**
                 * ⚠ **שני ילדים קבועים, תמיד · 19 בספטמבר 2026** ·
                 * לחיצה על תאריך הפילה את האפליקציה:
                 * `NSInternalInconsistencyException · Attempt to
                 * unmount a view which has a different index`, עם
                 * ה״טוען…״ בהודעה.
                 *
                 * הסיבה: כאן ישבו **שלושה אחים מותנים** — רשימת
                 * ההזמנות, כפתור ״עוד״ ושורת ״טוען…״. כשהתשובה
                 * חוזרת, באותו רינדור אחד ה״טוען…״ יורד והשורות
                 * עולות, וכל האחים מזיזים אינדקס. שכבת ההרכבה של
                 * Fabric לא עומדת בזה וזורקת.
                 *
                 * ⚠ **התיקון הוא מבני ולא ויזואלי** · מספר הילדים
                 * וסדרם קבועים: רשימה, ואחריה מגירה אחת שבתוכה
                 * מתחלף התוכן. הרכבה ופירוק קורים רק באינדקס 0 של
                 * מכל ייעודי, ואין למה להזיז אינדקס.
                 */
                <View style={s.detail}>
                  <View>
                    {rows.map((c) => (
                      <View key={c.id} style={s.line}>
                        <Text style={s.time}>{c.time}</Text>
                        <Text style={s.who} numberOfLines={1}>
                          {c.who}
                        </Text>
                        <Text style={s.status} numberOfLines={1}>
                          {c.status}
                        </Text>
                        <Text style={s.sum}>{`${nf(c.sum)} ₪`}</Text>
                      </View>
                    ))}
                  </View>

                  {/* ⚠ המגירה · ״טוען…״, ״עוד N״, או כלום · ראו `PAGE` */}
                  <View>
                    {busy ? (
                      <Text style={s.empty}>טוען…</Text>
                    ) : rows.length < total ? (
                      <Pressable onPress={() => void load(day, rows.length)} style={s.more}>
                        <Text style={s.moreText}>
                          {`עוד ${Math.min(PAGE, total - rows.length)}`}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </AdminShell>
  );
}

const s = StyleSheet.create({
  body: { flex: 1 },
  pad: { paddingBottom: 110, gap: 8 },
  err: { fontSize: 13.5, color: '#B95349', textAlign: 'center', marginTop: 10 },
  empty: { fontSize: 13.5, color: surface.muted, textAlign: 'center', marginTop: 14 },
  card: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRightWidth: 3,
    borderRightColor: PLUM.hue,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headText: { flex: 1, gap: 1 },
  date: { fontSize: 15.5, fontWeight: '600', color: PLUM.deep },
  cat: { fontSize: 12.5, color: surface.muted },
  n: { fontSize: 13, fontWeight: '600', color: surface.inkSoft },
  detail: { marginTop: 10, gap: 4, borderTopWidth: 1, borderTopColor: 'rgba(123,92,188,0.14)', paddingTop: 8 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  time: { width: 44, fontSize: 12.5, color: surface.muted },
  who: { flex: 1, fontSize: 13, color: surface.ink },
  status: { width: 58, fontSize: 12, color: surface.muted },
  sum: { width: 60, fontSize: 13, fontWeight: '600', color: PLUM.deep, textAlign: 'left' },
  more: {
    alignSelf: 'center',
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(123,92,188,0.1)',
  },
  moreText: { fontSize: 13, fontWeight: '600', color: PLUM.deep },
});
