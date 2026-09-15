import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { surface } from '../theme/tokens';
import {
  BAND as BOARD_BAND,
  BOARD_SUB as BOARD_LIVE,
  CATS as BOARD_CATS,
  COL_W,
  EMPTY_LABEL as BOARD_EMPTY,
  FLOW as BOARD_FLOW,
  GONE_PREFIX as BOARD_GONE,
  HEAD_COLS,
  LOW_STOCK,
  MODES as BOARD_MODES,
  SEED as BOARD_SEED,
  STEPS as BOARD_STEPS,
  START_MODE,
  TAIL_COLS,
  tableWidth,
} from '../data/adminBoard';
import { CancelSheet } from './CancelSheet';
import { apiEnabled } from '../api/config';
import { adminBoard, adminSetBoardStatus, adminSetQty } from '../api/admin';
import { adminSetStatus } from '../api/orders';
import { useNav } from '../navigation/store';
import type { CancelNote } from './useAdminOrders';
import { ChevronRight, Close } from '../icons';
import Svg, { Path } from 'react-native-svg';

const nf = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** הקטגוריה היחידה בלוח כרגע · הקוסקוס, כמו בקנבס */
const BOARD_CAT = BOARD_CATS.cous;

/**
 * ⚠ **״סה״כ״ ולא ״סה״כ בטאב״** · בקנבס השורה נקראת `TOTAL_LABEL`
 * ובה כתוב ״סה״כ בטאב״. שקד ביקשה (15 בספטמבר 2026) שיהיה כתוב
 * ״סה״כ״ בלבד, ולכן הערך נדרס כאן ולא בקובץ המחולץ.
 */
const TOTAL_LABEL = 'סה״כ';

/**
 * ⚠ **מתג התצוגה** · בקשה של שקד — הלוח תוכנן לאייפד (1180×820),
 * והיא רוצה לעבור בין תצוגת אייפד לתצוגת טלפון בלחיצה.
 * בתצוגת טלפון הטבלה מצטמצמת לעמודות שנכנסות למסך צר.
 */
const VIEWS = [
  { id: 'pad', label: 'תצוגת אייפד' },
  { id: 'phone', label: 'תצוגת טלפון' },
] as const;
type ViewId = (typeof VIEWS)[number]['id'];

type Row = {
  id?: string;
  who: string;
  time: string;
  ship: 'pickup' | 'deliv';
  pay: string;
  status: string;
  note: string;
  q: Record<string, number>;
  gone?: boolean;
  hrs: number;
};

const sumOf = (q: Record<string, number>) =>
  BOARD_CAT.items.reduce((s, it) => s + (q[it.id] || 0) * it.price, 0);

export function AdminBoardScreen() {
  const { back, user } = useNav();
  const live = apiEnabled && user?.role === 'admin';
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<'all' | 'pickup' | 'deliv'>(
    START_MODE as 'all' | 'pickup' | 'deliv',
  );
  /* ברירת המחדל נגזרת מרוחב החלון · באייפד פותחים בתצוגת אייפד */
  const [view, setView] = useState<ViewId>('pad');
  const [orders, setOrders] = useState<Row[]>(() =>
    BOARD_SEED.map((o) => ({ ...o, q: { ...o.q }, hrs: o.hrs })),
  );
  const [cancelling, setCancelling] = useState(-1);
  const [cx, setCx] = useState<CancelNote>({ reason: '', note: '' });

  const reload = useCallback(async () => {
    if (!live) return;
    const res = await adminBoard('2026-09-01');
    setOrders(
      res.cards.map((c) => ({
        id: c.id,
        who: c.who,
        time: c.time,
        ship: c.ship.includes('משלוח') ? 'deliv' : 'pickup',
        pay: c.pay,
        status: BOARD_FLOW.includes(c.status as (typeof BOARD_FLOW)[number])
          ? c.status
          : c.status === 'בהכנה' || c.status === 'מאושרת'
            ? 'חדשה'
            : c.status === 'נמסרה'
              ? 'נמסרה'
              : 'חדשה',
        note: c.ship.includes('משלוח') ? c.ship.replace('משלוח · ', '') : c.via,
        q: res.qty[c.id] ?? {},
        hrs: c.hrs,
      })),
    );
  }, [live]);

  useEffect(() => {
    void reload().catch(() => undefined);
  }, [reload]);

  const liveRows = orders.filter((o) => !o.gone);
  const shown = liveRows
    .map((o, i) => ({ o, i: orders.indexOf(o) }))
    .filter((x) => mode === 'all' || x.o.ship === mode)
    .sort((a, b) => {
      const g = BOARD_FLOW.indexOf(a.o.status as (typeof BOARD_FLOW)[number]) - BOARD_FLOW.indexOf(b.o.status as (typeof BOARD_FLOW)[number]);
      return g !== 0 ? g : a.o.time.localeCompare(b.o.time);
    });

  const gone = orders.filter((o) => o.gone).length + (live ? 0 : 0);
  const setQ = (i: number, id: string, v: string) => {
    const n = parseInt(String(v).replace(/[^\d]/g, ''), 10);
    const qn = isNaN(n) ? 0 : Math.max(0, n);
    setOrders((list) =>
      list.map((o, k) => (k === i ? { ...o, q: { ...o.q, [id]: qn } } : o)),
    );
    const row = orders[i];
    if (live && row?.id) void adminSetQty(row.id, { ...row.q, [id]: qn }).catch(() => undefined);
  };

  const setStatus = (i: number, name: string) => {
    setOrders((list) => list.map((o, n) => (n === i ? { ...o, status: name } : o)));
    const row = orders[i];
    if (live && row?.id) void adminSetBoardStatus(row.id, name).then(reload).catch(() => undefined);
  };

  const doCancel = () => {
    if (!cx.reason) return;
    const i = cancelling;
    const row = orders[i];
    if (live && row?.id) {
      void adminSetStatus(row.id, 'בוטלה', { reason: cx.reason, note: cx.note }).then(reload).catch(() => undefined);
    }
    setOrders((list) => list.map((o, n) => (n === i ? { ...o, gone: true } : o)));
    setCancelling(-1);
  };

  const colSums = BOARD_CAT.items.map((it) => shown.reduce((s, x) => s + (x.o.q[it.id] || 0), 0));
  const grand = shown.reduce((s, x) => s + sumOf(x.o.q), 0);
  const stock = BOARD_CAT.items.filter((it) => it.quota).map((it) => {
    const used = liveRows.reduce((s, o) => s + (o.q[it.id] || 0), 0);
    return { ...it, used, left: (it.quota ?? 0) - used };
  });

  /**
   * ⚠ הרוחבים · בתצוגת אייפד בדיוק אלה של הקנבס, ובתצוגת טלפון
   * מצטמצמים כדי שהשורה תיכנס במסך צר בלי גלילה אינסופית.
   */
  const pad = view === 'pad';
  const w = pad
    ? COL_W
    : { time: 58, who: 96, item: 44, sum: 64, pay: 58, status: 118 };

  return (
    <View style={s.root}>
      <View style={s.head}>
        <Pressable onPress={back} style={s.back}>
          <ChevronRight size={19} color="#6E6478" strokeWidth={2} />
        </Pressable>
        <View style={s.headText}>
          <Text style={s.title}>{BOARD_CAT.name}</Text>
          <Text style={s.sub}>{BOARD_LIVE}</Text>
        </View>
        {/* ⚠ מתג התצוגה · בקשה של שקד, אינו בקנבס */}
        <View style={s.views}>
          {VIEWS.map((v) => {
            const on = view === v.id;
            return (
              <Pressable key={v.id} onPress={() => setView(v.id)} style={[s.viewBtn, on && s.viewOn]}>
                <Text style={[s.viewText, on && s.viewTextOn]}>{v.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={s.modes}>
          {BOARD_MODES.map((m) => {
            const n = liveRows.filter((o) => m.id === 'all' || o.ship === m.id).length;
            const on = mode === m.id;
            return (
              <Pressable key={m.id} onPress={() => setMode(m.id)} style={[s.mode, on && s.modeOn]}>
                <Text style={[s.modeText, on && s.modeTextOn]}>{`${m.name} ${n}`}</Text>
              </Pressable>
            );
          })}
        </View>
        {gone > 0 ? <Text style={s.gone}>{`${BOARD_GONE} ${gone}`}</Text> : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={pad} style={s.stock}>
        {stock.map((it) => {
          /* ⚠ שלושת המצבים של הקנבס · אזל, מתחת לסף, ורגיל */
          const outOf = it.left <= 0;
          const low = it.left <= LOW_STOCK;
          const fg = outOf ? '#B95349' : low ? '#A65E2A' : '#43307A';
          const bg = outOf
            ? 'rgba(185,83,73,0.09)'
            : low
              ? 'rgba(199,125,62,0.1)'
              : 'rgba(255,255,255,0.72)';
          const bd = outOf
            ? 'rgba(185,83,73,0.3)'
            : low
              ? 'rgba(199,125,62,0.32)'
              : 'rgba(255,255,255,0.9)';
          return (
          <View key={it.id} style={[s.stockChip, { backgroundColor: bg, borderColor: bd }]}>
            <Text style={[s.stockText, { color: fg }]}>{`${it.sub} ${it.left} מתוך ${it.quota}`}</Text>
          </View>
          );
        })}
      </ScrollView>

      {/* ⚠ **רוחבי העמודות מהקנבס** · COL_W חולץ מהקוד של הארטבורד
          ולא נמדד בעין. בתצוגת טלפון העמודות מצטמצמות כדי להיכנס. */}
      <ScrollView horizontal>
        <View style={{ minWidth: pad ? tableWidth(BOARD_CAT.items.length) : undefined }}>
          <View style={s.cols}>
            <Text style={[s.col, { width: w.time }]}>{HEAD_COLS.time}</Text>
            <Text style={[s.col, { width: w.who }]}>{HEAD_COLS.who}</Text>
            {BOARD_CAT.items.map((it) => (
              <Text key={it.id} style={[s.col, { width: w.item }]}>{`${it.t}\n${it.sub}`}</Text>
            ))}
            <Text style={[s.col, { width: w.sum }]}>{TAIL_COLS.sum}</Text>
            <Text style={[s.col, { width: w.pay }]}>{TAIL_COLS.pay}</Text>
            <Text style={[s.col, { width: w.status }]}>{TAIL_COLS.status}</Text>
          </View>
          <ScrollView style={s.list}>
            {shown.length === 0 ? (
              <Text style={s.empty}>{BOARD_EMPTY}</Text>
            ) : (
              shown.map((x) => {
                const band = BOARD_BAND[x.o.status] ?? BOARD_BAND['חדשה'];
                return (
                  <View key={x.o.id ?? x.i} style={[s.row, { backgroundColor: band.row, borderColor: band.edge }]}>
                    <Text style={[s.cell, { width: w.time, color: band.ink }]}>{x.o.time}</Text>
                    <View style={{ width: w.who }}>
                      <Text style={[s.who, { color: band.ink }]} numberOfLines={1}>{x.o.who}</Text>
                      {x.o.note ? <Text style={s.note} numberOfLines={1}>{x.o.note}</Text> : null}
                    </View>
                    {BOARD_CAT.items.map((it) => (
                      <TextInput
                        key={it.id}
                        value={String(x.o.q[it.id] || 0)}
                        keyboardType="number-pad"
                        onChangeText={(v) => setQ(x.i, it.id, v)}
                        style={[s.qty, { width: w.item - 16 }]}
                      />
                    ))}
                    <Text style={[s.cell, { width: w.sum }]}>{`${nf(sumOf(x.o.q))} ₪`}</Text>
                    <Text style={[s.cell, { width: w.pay }]}>{x.o.pay}</Text>
                    {/* ⚠ **שלושה אייקונים ולא כפתורי טקסט** · כך זה בקנבס:
                        `STEPS` נושא את הנתיבים, והפעיל נצבע בגוון השורה. */}
                    <View style={[s.steps, { width: w.status }]}>
                      {BOARD_STEPS.map((st) => {
                        const on = x.o.status === st.id;
                        return (
                          <Pressable
                            key={st.id}
                            onPress={() => setStatus(x.i, st.id)}
                            style={[
                              s.step,
                              { borderColor: on ? band.edge : 'rgba(130,112,162,0.22)' },
                              on ? { backgroundColor: band.edge } : s.stepOff,
                            ]}
                          >
                            <Svg width={17} height={17} viewBox="0 0 24 24">
                              {st.paths.map((d) => (
                                <Path
                                  key={d}
                                  d={d}
                                  fill="none"
                                  stroke={on ? '#FFFFFF' : '#A79FB2'}
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              ))}
                            </Svg>
                          </Pressable>
                        );
                      })}
                      <Pressable onPress={() => { setCancelling(x.i); setCx({ reason: '', note: '' }); }} hitSlop={6}>
                        <Close size={13} color="#B95349" strokeWidth={2.4} />
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
            <View style={s.foot}>
              <Text style={[s.cell, { width: w.time + w.who }]}>{TOTAL_LABEL}</Text>
              {colSums.map((n, i) => (
                <Text key={BOARD_CAT.items[i].id} style={[s.cell, { width: w.item }]}>{n}</Text>
              ))}
              <Text style={[s.cell, { width: w.sum, fontWeight: '700' }]}>{`${nf(grand)} ₪`}</Text>
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {cancelling >= 0 && orders[cancelling] ? (
        <CancelSheet
          order={{
            key: 'cous',
            status: orders[cancelling].status,
            who: orders[cancelling].who,
            phone: '',
            time: orders[cancelling].time,
            items: '',
            sum: sumOf(orders[cancelling].q),
            ship: orders[cancelling].ship,
            pay: orders[cancelling].pay,
            via: '',
            hrs: orders[cancelling].hrs,
          }}
          cx={cx}
          ready={cx.reason !== ''}
          onSetField={(k, v) => setCx((c) => ({ ...c, [k]: v }))}
          onClose={() => setCancelling(-1)}
          onConfirm={doCancel}
        />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingTop: 18, paddingHorizontal: 14, gap: 8, backgroundColor: surface.ground },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(130,112,162,0.09)', alignItems: 'center', justifyContent: 'center' },
  backGlyph: { fontSize: 20, color: '#6E6478' },
  headText: { flex: 1 },
  title: { fontSize: 20, fontWeight: '600', color: surface.ink },
  sub: { fontSize: 12, color: surface.faint },
  modes: { flexDirection: 'row', gap: 6 },
  mode: { height: 32, paddingHorizontal: 10, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(130,112,162,0.16)' },
  modeOn: { backgroundColor: 'rgba(123,92,188,0.1)', borderColor: 'rgba(123,92,188,0.42)' },
  modeText: { fontSize: 12, color: surface.inkSoft },
  modeTextOn: { fontWeight: '600', color: '#43307A' },
  gone: { fontSize: 12.5, fontWeight: '600', color: '#B95349' },
  stock: { flexGrow: 0 },
  stockChip: { marginEnd: 6, height: 28, paddingHorizontal: 10, borderRadius: 10, backgroundColor: 'rgba(123,92,188,0.1)', justifyContent: 'center' },
  stockText: { fontSize: 11, color: '#43307A' },
  cols: { flexDirection: 'row', paddingVertical: 6, alignItems: 'flex-end' },
  col: { fontSize: 10, fontWeight: '600', color: '#8A8194', textAlign: 'center' },
  itemCol: { width: 68, textAlign: 'center' },
  list: { maxHeight: 560 },
  empty: { fontSize: 15, color: '#A79FB2', textAlign: 'center', padding: 70 },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingVertical: 6, marginBottom: 4 },
  cell: { fontSize: 12, textAlign: 'center', color: surface.ink },
  who: { fontSize: 13, fontWeight: '600' },
  note: { fontSize: 10, color: surface.faint },
  qty: { width: 68, height: 32, textAlign: 'center', fontSize: 13, color: surface.ink, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 8 },
  steps: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 5, justifyContent: 'center' },
  /* ⚠ ריבוע אייקון · בקנבס 34×30 עם מסגרת, והפעיל נצבע מלא */
  step: {
    width: 34,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepOff: { backgroundColor: 'rgba(255,255,255,0.72)' },

  /* מתג התצוגה · אינו בקנבס, בקשה של שקד */
  views: { flexDirection: 'row', gap: 4 },
  viewBtn: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(130,112,162,0.22)',
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewOn: { backgroundColor: '#C6B3EC', borderColor: '#C6B3EC' },
  viewText: { fontSize: 11, fontWeight: '600', color: '#6E6478' },
  viewTextOn: { color: '#43307A' },
  x: { fontSize: 16, color: '#B95349', paddingHorizontal: 4 },
  foot: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(130,112,162,0.16)' },
});
