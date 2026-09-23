import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { S } from '../components/Sym';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { surface } from '../theme/tokens';
import {
  EXPENSES, EXPENSE_METHODS, EXPENSE_EVERY, EXPENSE_EVERY_LABEL,
  type ExpenseMethod, type ExpenseEvery,
} from '../data/adminMoney';
import { MONTHS } from '../data/adminDays';
import { AdminShell } from './ui/AdminShell';
import { Chip, ChipRow } from './ui/Chip';
import { ChipRail } from './ui/ChipRail';
import { Field } from './ui/Field';
import { Sheet } from './ui/Sheet';
import { Cart, Plus } from '../icons';
import { apiEnabled } from '../api/config';
import {
  adminAddExpense,
  adminAddFixedExpense,
  adminDeleteExpense,
  adminDeleteFixedExpense,
  adminExpenses,
  adminFixedExpenses,
  type ExpenseRow,
  type FixedExpenseRow,
} from '../api/admin';
import { useNav } from '../navigation/store';

/**
 * מסך ההוצאות · הזנה ידנית.
 *
 * ⚠ **לא מהקנבס** · בקשה של שקד (15 בספטמבר 2026). עד כה הדבר
 * היחיד שיצר הוצאה היה סגירת רשימת קניות, שנרשמה תמיד ל״חומרי
 * גלם״ — כלומר ארבע מתוך חמש הקטגוריות במסך הכספים לא יכלו לזוז
 * לעולם. כאן היא מזינה הוצאה בכל קטגוריה, עם תאריך משלה.
 */

const PLUM = { rgb: '123,92,188', deep: '#43307A', hue: '#7B5CBC' };

/**
 * ⚠ **תדירות ואמצעי תשלום · בקשת שקד, 23 בספטמבר 2026** ·
 * ״צריך שיהיה את האופציה להוסיף אם זה תשלום שנתי קבוע, חודשי
 * קבוע, או תשלום חד פעמי — כמובן שלא חובה להוסיף את זה בכל
 * הוצאה, וההוצאות של הקניות לא מקבלות בזה שום ערך״, וכן ״צריך
 * להיות סוג תשלום שאני אוכל לעקוב אחרי ההוצאות שלי, האם שולם
 * במזומן, אשראי, או העברה״.
 *
 * ⚠ **המתג הבוליאני הוחלף בשלוש אפשרויות** · קודם היה כאן
 * ״הוצאה קבועה״ כן/לא. ״חד פעמי״ הוא עכשיו בחירה מפורשת ולא
 * היעדר בחירה, כי ״שנתי״ הצטרף ואי אפשר לבטא שלושה מצבים
 * בתיבת סימון אחת.
 */
/** ⚠ הכיתוב היחיד במקטע הזה · שקד ביקשה בלי הסברים והארות */
const METHOD_LABEL = 'סוג תשלום';

/**
 * ⚠ **שני הנוסחים האלה נכתבו על ידי Claude · 19.9.2026** · שקד לא
 * כתבה אותם. הם מתג ההוצאה הקבועה.
 */
const FIXED_TITLE = 'הוצאות קבועות';
const AMBER = '#A65E2A';

const nf = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const pad2 = (n: number) => String(n).padStart(2, '0');

/** ‎2026-09-15 → ‎15.09.2026 · הצורה שבה שקד כותבת תאריך */
function toHuman(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

/** ‎15.9.2026 או ‎15/9/26 → ‎2026-09-15 · ריק כשהתאריך אינו תקין */
function toIso(human: string): string {
  const parts = human.trim().split(/[./-]/).filter(Boolean);
  if (parts.length !== 3) return '';
  const d = Number(parts[0]);
  const m = Number(parts[1]);
  let y = Number(parts[2]);
  if (!d || !m || !y) return '';
  if (y < 100) y += 2000;
  if (m < 1 || m > 12 || d < 1 || d > 31) return '';
  const test = new Date(y, m - 1, d);
  if (test.getFullYear() !== y || test.getMonth() !== m - 1 || test.getDate() !== d) return '';
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

/** ‎2026-09 → ״ספטמבר 2026״ */
function monthLabel(period: string): string {
  const [y, m] = period.split('-').map(Number);
  return MONTHS[m - 1] ? `${MONTHS[m - 1]} ${y}` : period;
}

const CATS = EXPENSES.map((e) => ({ k: e.k, sub: e.sub }));
const SUB_OF: Record<string, string> = Object.fromEntries(CATS.map((c) => [c.k, c.sub]));

export function AdminExpensesScreen() {
  const { user } = useNav();
  const live = apiEnabled && user?.role === 'admin';
  const [rows, setRows] = useState<ExpenseRow[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [killing, setKilling] = useState('');
  const [busy, setBusy] = useState(false);

  const [cat, setCat] = useState(CATS[0]?.k ?? '');
  const [amount, setAmount] = useState('');
  const [when, setWhen] = useState('');
  const [note, setNote] = useState('');
  /**
   * ⚠ **הוצאה קבועה חודשית · בקשה של שקד (19 בספטמבר 2026)** ·
   * ״חודש הבא אני לא אצטרך להקליד את כל החלק הזה שוב, הוא
   * אוטומטית יתעדכן״. ההסבר המלא ב-`server/src/admin/fixedExpenses.ts`.
   */
  const [every, setEvery] = useState<ExpenseEvery>('once');
  const [method, setMethod] = useState<ExpenseMethod>('');
  const [fixedRows, setFixedRows] = useState<FixedExpenseRow[] | null>(null);

  const load = useCallback(() => {
    if (!live) return;
    void adminExpenses()
      .then((r) => setRows(r.rows))
      .catch(() => setRows([]));
    void adminFixedExpenses()
      .then((r) => setFixedRows(r.rows))
      .catch(() => setFixedRows([]));
  }, [live]);

  useEffect(load, [load]);

  const openAdd = () => {
    const now = new Date();
    setCat(CATS[0]?.k ?? '');
    setAmount('');
    setWhen(`${pad2(now.getDate())}.${pad2(now.getMonth() + 1)}.${now.getFullYear()}`);
    setNote('');
    setEvery('once');
    setMethod('');
    setAdding(true);
  };

  const iso = toIso(when);
  const sum = Math.round(Number(amount.replace(/[^\d.]/g, '')) || 0);
  const ready = Boolean(cat) && sum > 0 && Boolean(iso);

  const save = () => {
    if (!ready || busy) return;
    setBusy(true);
    /* ⚠ קבועה נשמרת כתבנית · והיא יוצרת את שורת המחזור בעצמה */
    const call =
      every === 'once'
        ? adminAddExpense({ category: cat, amount: sum, date: iso, note: note.trim(), method })
        : adminAddFixedExpense({
            category: cat,
            amount: sum,
            note: note.trim(),
            fromPeriod: iso.slice(0, 7),
            method,
            every,
          });
    void call
      .then(() => {
        setAdding(false);
        load();
      })
      .catch(() => undefined)
      .finally(() => setBusy(false));
  };

  /** הפסקת הוצאה קבועה · ההיסטוריה נשארת */
  const stopFixed = (id: string) => {
    void adminDeleteFixedExpense(id).then(load).catch(() => undefined);
  };

  const remove = (id: string) => {
    setKilling('');
    void adminDeleteExpense(id).then(load).catch(() => undefined);
  };

  /** קיבוץ לחודשים · החדש למעלה, עם סכום לכל חודש */
  const months = useMemo(() => {
    const out: { period: string; total: number; rows: ExpenseRow[] }[] = [];
    for (const r of rows ?? []) {
      let bucket = out.find((b) => b.period === r.period);
      if (!bucket) {
        bucket = { period: r.period, total: 0, rows: [] };
        out.push(bucket);
      }
      bucket.total += r.amount;
      bucket.rows.push(r);
    }
    return out;
  }, [rows]);

  return (
    <AdminShell
      title="הוצאות"
      sub="הזנה ידנית וסגירות קניות"
      actions={[{ label: 'הוצאה חדשה', onPress: openAdd, icon: Plus, primary: true }]}
    >
      <ScrollView style={s.body} contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
        {!live ? <Text style={s.empty}>ההוצאות נטענות מהשרת · אין חיבור כרגע</Text> : null}
        {live && rows && rows.length === 0 ? (
          <Text style={s.empty}>עוד אין הוצאות · אפשר להוסיף בכפתור ה-+</Text>
        ) : null}

        {/**
          * ⚠ **רשימת ההוצאות הקבועות · 19 בספטמבר 2026** · היא
          * למעלה כי זה מה שמסביר למה מופיעות שורות שלא הוקלדו.
          * הסרה כאן עוצרת את החודשים הבאים ואינה נוגעת בהיסטוריה.
          */}
        {fixedRows && fixedRows.length > 0 ? (
          <View style={s.fixedCard}>
            <Text style={s.fixedHead}>{FIXED_TITLE}</Text>
            {fixedRows.map((f) => (
              <View key={f.id} style={s.fixedItem}>
                <View style={s.rowText}>
                  <View style={s.rowTop}>
                    <Text style={s.rowCat}>{f.category}</Text>
                    {/* ⚠ שנתי מסומן · חודשי הוא ברירת המחדל ולא צריך תג */}
                    {f.every === 'year' ? (
                      <View style={s.tag}>
                        <Text style={s.tagText}>שנתי</Text>
                      </View>
                    ) : null}
                  </View>
                  {f.note || f.method ? (
                    <Text style={s.rowSub} numberOfLines={1}>
                      {[f.method, f.note].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                </View>
                <Text style={s.rowVal}>{`${nf(f.amount)} ₪`}</Text>
                <Pressable onPress={() => stopFixed(f.id)} style={s.kill} hitSlop={8}>
                  <S k="close" size={13} color="#B95349" />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {months.map((m) => (
          <View key={m.period} style={s.card}>
            <View style={s.cardHead}>
              <Text style={s.cardTitle}>{monthLabel(m.period)}</Text>
              <Text style={s.cardSum}>{`${nf(m.total)} ₪`}</Text>
            </View>

            {m.rows.map((r) => (
              <View key={r.id} style={s.row}>
                <View style={s.rowText}>
                  <View style={s.rowTop}>
                    <Text style={s.rowCat}>{r.category}</Text>
                    {r.fromShop ? (
                      <View style={s.tag}>
                        <Cart size={10} color={PLUM.deep} strokeWidth={2} />
                        <Text style={s.tagText}>מקנייה</Text>
                      </View>
                    ) : null}
                  </View>
                  {/* ⚠ אמצעי התשלום נכנס לאותה שורת משנה · הוא פרט
                      ולא כותרת, ושורה נפרדת הייתה מרווחת את הרשימה */}
                  <Text style={s.rowSub} numberOfLines={1}>
                    {`${toHuman(r.date)}${r.method ? ` · ${r.method}` : ''}${r.note ? ` · ${r.note}` : ''}`}
                  </Text>
                </View>

                {killing === r.id ? (
                  <View style={s.confirm}>
                    <Pressable onPress={() => remove(r.id)} style={[s.mini, s.miniYes]} hitSlop={6}>
                      <Text style={s.miniYesText}>למחוק</Text>
                    </Pressable>
                    <Pressable onPress={() => setKilling('')} style={s.mini} hitSlop={6}>
                      <Text style={s.miniText}>ביטול</Text>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <Text style={s.rowVal}>{`${nf(r.amount)} ₪`}</Text>
                    {/* ⚠ מחיקה בשני שלבים · הסכום נכנס לדוח הכספים */}
                    <Pressable onPress={() => setKilling(r.id)} style={s.kill} hitSlop={8}>
                      <S k="close" size={12} color="#A79FB2" />
                    </Pressable>
                  </>
                )}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      {adding ? (
        <Sheet title="הוצאה חדשה" sub="נכנסת לדוח הכספים של החודש שבתאריך" onClose={() => setAdding(false)} centerTitle>
          {/* ⚠ **רווחים · בקשה של שקד (19 בספטמבר 2026)** · ״הכל שם
              צפוף מדי״. ליריעה עצמה אין `gap`, ולכן כל שדה נגע בשכנו. */}
          <View style={s.form}>
            <ChipRail>
              {CATS.map((c) => (
                <Chip
                  key={c.k}
                  label={c.k}
                  on={cat === c.k}
                  tint={PLUM}
                  fontSize={11.5}
                  height={32}
                  radius={11}
                  onPress={() => setCat(c.k)}
                />
              ))}
            </ChipRail>
            {SUB_OF[cat] ? <Text style={s.catHint}>{SUB_OF[cat]}</Text> : null}

            <View style={s.pair}>
              <View style={s.half}>
                <Field label="סכום ₪" value={amount} onChange={setAmount} placeholder="0" keyboardType="number-pad" />
              </View>
              <View style={s.half}>
                <Field
                  label={every === 'once' ? 'תאריך' : 'מאיזה חודש'}
                  value={when}
                  onChange={setWhen}
                  placeholder="15.09.2026"
                  borderColor={when && !iso ? '#B95349' : undefined}
                  note={when && !iso ? 'תאריך לא תקין' : undefined}
                  noteColor="#B95349"
                />
              </View>
            </View>

            <Field label="הערה" value={note} onChange={setNote} placeholder="למשל: קצביית אבו חסן" />

            {/**
              * ⚠ **סוג תשלום · בקשת שקד (23 בספטמבר 2026)** · ״סוג
              * תשלום שאני אוכל לעקוב אחרי ההוצאות שלי״.
              * ⚠ **לחיצה שנייה מבטלת** · היא ביקשה שזה לא יהיה חובה,
              * ולכן חייבת להיות דרך לחזור ל״לא צוין״ אחרי בחירה.
              */}
            <View style={s.block}>
              <Text style={s.blockLabel}>{METHOD_LABEL}</Text>
              <ChipRow>
                {EXPENSE_METHODS.map((m) => (
                  <Chip
                    key={m}
                    label={m}
                    on={method === m}
                    tint={PLUM}
                    fontSize={12}
                    height={34}
                    radius={12}
                    onPress={() => setMethod((cur) => (cur === m ? '' : m))}
                  />
                ))}
              </ChipRow>
            </View>

            {/**
              * ⚠ **תדירות · אותה בקשה** · ״שנתי קבוע, חודשי קבוע, או
              * תשלום חד פעמי״. ׳חד פעמי׳ הוא ברירת המחדל.
              * ⚠ **בלי כותרת ובלי הסבר** · שקד, 23.9.2026: ״אין צורך
              * בהארות והסברים״. שמות הצ׳יפים מסבירים את עצמם.
              */}
            <View style={s.block}>
              <ChipRow>
                {EXPENSE_EVERY.map((e) => (
                  <Chip
                    key={e}
                    label={EXPENSE_EVERY_LABEL[e]}
                    on={every === e}
                    tint={PLUM}
                    fontSize={12}
                    height={34}
                    radius={12}
                    onPress={() => setEvery(e)}
                  />
                ))}
              </ChipRow>
            </View>

            {/* ⚠ **ברוחב מינימלי · בקשת שקד** · ממורכז ולא נמתח */}
            <View style={s.saveWrap}>
              <Pressable onPress={save} style={[s.save, !ready && s.saveOff]} disabled={!ready || busy}>
                <Text style={s.saveText}>{busy ? 'שומרת…' : 'שמירה'}</Text>
              </Pressable>
            </View>
          </View>
        </Sheet>
      ) : null}
    </AdminShell>
  );
}

const s = StyleSheet.create({
  /* ⚠ קבוצת שדה · כותרת, שורת צ׳יפים והסבר · 23 בספטמבר 2026 */
  block: { gap: 7 },
  blockLabel: { fontSize: 12.5, color: surface.muted },

  body: { flex: 1 },
  pad: { paddingBottom: 120, gap: 12 },
  empty: { fontSize: 14.5, color: surface.faint, textAlign: 'center', marginTop: 24 },

  card: {
    borderRadius: 20,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    gap: 8,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 15.5, fontWeight: '600', color: surface.ink },
  cardSum: { fontSize: 15.5, fontWeight: '700', color: AMBER },

  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowText: { flex: 1, gap: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowCat: { fontSize: 14.5, fontWeight: '600', color: surface.ink },
  rowSub: { fontSize: 12.5, fontWeight: '300', color: surface.faint },
  rowVal: { fontSize: 15.5, fontWeight: '700', color: surface.ink },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(123,92,188,0.12)',
  },
  tagText: { fontSize: 11, fontWeight: '600', color: PLUM.deep },
  kill: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },

  confirm: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mini: {
    height: 26,
    paddingHorizontal: 9,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(130,112,162,0.1)',
  },
  miniText: { fontSize: 12.5, fontWeight: '600', color: '#6E6478' },
  miniYes: { backgroundColor: 'rgba(185,83,73,0.14)' },
  miniYesText: { fontSize: 12.5, fontWeight: '600', color: '#B95349' },

  catHint: { fontSize: 12.5, fontWeight: '300', color: surface.faint, marginTop: -4 },
  /* ⚠ הרווח בין כל שדה לשכנו · ראו ההערה ביריעה */
  form: { gap: 14 },
  pair: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  /* ⚠ ממורכז · כדי שהכפתור הצר לא ייצמד לצד */
  saveWrap: { alignItems: 'center', marginTop: 2 },
  save: {
    height: 44,
    paddingHorizontal: 30,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C6B3EC',
  },
  saveOff: { opacity: 0.45 },
  saveText: { fontSize: 16, fontWeight: '700', color: '#2E2148' },
  /* ⚠ רשימת ההוצאות הקבועות · מעל רשימת החודשים */
  fixedCard: {
    borderRadius: 20,
    padding: 14,
    backgroundColor: 'rgba(123,92,188,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(123,92,188,0.14)',
    gap: 8,
  },
  fixedHead: { fontSize: 14, fontWeight: '700', color: PLUM.deep },
  fixedItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
