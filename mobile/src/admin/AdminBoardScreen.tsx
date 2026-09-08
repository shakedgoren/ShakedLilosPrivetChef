import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { surface } from '../theme/tokens';
import {
  BOARD_BAND,
  BOARD_CAT,
  BOARD_COL_PAY,
  BOARD_COL_STATUS,
  BOARD_COL_SUM,
  BOARD_COL_TIME,
  BOARD_COL_WHO,
  BOARD_EMPTY,
  BOARD_FLOW,
  BOARD_GONE,
  BOARD_LIVE,
  BOARD_MODES,
  BOARD_SEED,
  BOARD_STEPS,
  BOARD_TOTAL,
} from '../data/adminBoard';
import { CancelSheet } from './CancelSheet';
import { apiEnabled } from '../api/config';
import { adminBoard, adminSetBoardStatus, adminSetQty } from '../api/admin';
import { adminSetStatus } from '../api/orders';
import { useNav } from '../navigation/store';
import type { CancelNote } from './useAdminOrders';

const nf = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

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
  const [mode, setMode] = useState<'all' | 'pickup' | 'deliv'>('pickup');
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

  const compact = width < 900;

  return (
    <View style={s.root}>
      <View style={s.head}>
        <Pressable onPress={back} style={s.back}>
          <Text style={s.backGlyph}>‹</Text>
        </Pressable>
        <View style={s.headText}>
          <Text style={s.title}>{BOARD_CAT.name}</Text>
          <Text style={s.sub}>{BOARD_LIVE}</Text>
        </View>
        <View style={s.modes}>
          {BOARD_MODES.map((m) => {
            const n = liveRows.filter((o) => m.id === 'all' || o.ship === m.id).length;
            const on = mode === m.id;
            return (
              <Pressable key={m.id} onPress={() => setMode(m.id)} style={[s.mode, on && s.modeOn]}>
                <Text style={[s.modeText, on && s.modeTextOn]}>{`${m.n} ${n}`}</Text>
              </Pressable>
            );
          })}
        </View>
        {gone > 0 ? <Text style={s.gone}>{`${BOARD_GONE} ${gone}`}</Text> : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={!compact} style={s.stock}>
        {stock.map((it) => (
          <View key={it.id} style={s.stockChip}>
            <Text style={s.stockText}>{`${it.sub} ${it.left} מתוך ${it.quota}`}</Text>
          </View>
        ))}
      </ScrollView>

      <ScrollView horizontal>
        <View style={{ minWidth: compact ? 980 : 1100 }}>
          <View style={s.cols}>
            <Text style={[s.col, { width: 80 }]}>{BOARD_COL_TIME}</Text>
            <Text style={[s.col, { width: 140 }]}>{BOARD_COL_WHO}</Text>
            {BOARD_CAT.items.map((it) => (
              <Text key={it.id} style={[s.col, s.itemCol]}>{`${it.t}\n${it.sub}`}</Text>
            ))}
            <Text style={[s.col, { width: 72 }]}>{BOARD_COL_SUM}</Text>
            <Text style={[s.col, { width: 80 }]}>{BOARD_COL_PAY}</Text>
            <Text style={[s.col, { width: 160 }]}>{BOARD_COL_STATUS}</Text>
          </View>
          <ScrollView style={s.list}>
            {shown.length === 0 ? (
              <Text style={s.empty}>{BOARD_EMPTY}</Text>
            ) : (
              shown.map((x) => {
                const band = BOARD_BAND[x.o.status] ?? BOARD_BAND['חדשה'];
                return (
                  <View key={x.o.id ?? x.i} style={[s.row, { backgroundColor: band.row, borderColor: band.edge }]}>
                    <Text style={[s.cell, { width: 80, color: band.ink }]}>{x.o.time}</Text>
                    <View style={{ width: 140 }}>
                      <Text style={[s.who, { color: band.ink }]} numberOfLines={1}>{x.o.who}</Text>
                      {x.o.note ? <Text style={s.note} numberOfLines={1}>{x.o.note}</Text> : null}
                    </View>
                    {BOARD_CAT.items.map((it) => (
                      <TextInput
                        key={it.id}
                        value={String(x.o.q[it.id] || 0)}
                        keyboardType="number-pad"
                        onChangeText={(v) => setQ(x.i, it.id, v)}
                        style={s.qty}
                      />
                    ))}
                    <Text style={[s.cell, { width: 72 }]}>{`${nf(sumOf(x.o.q))} ₪`}</Text>
                    <Text style={[s.cell, { width: 80 }]}>{x.o.pay}</Text>
                    <View style={s.steps}>
                      {BOARD_STEPS.map((st) => {
                        const on = x.o.status === st.id;
                        return (
                          <Pressable key={st.id} onPress={() => setStatus(x.i, st.id)} style={[s.step, on && { backgroundColor: band.edge }]}>
                            <Text style={[s.stepText, on && { color: '#FFFFFF' }]}>{st.label}</Text>
                          </Pressable>
                        );
                      })}
                      <Pressable onPress={() => { setCancelling(x.i); setCx({ reason: '', note: '' }); }} hitSlop={6}>
                        <Text style={s.x}>×</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
            <View style={s.foot}>
              <Text style={[s.cell, { width: 220 }]}>{BOARD_TOTAL}</Text>
              {colSums.map((n, i) => (
                <Text key={BOARD_CAT.items[i].id} style={[s.cell, s.itemCol]}>{n}</Text>
              ))}
              <Text style={[s.cell, { width: 72, fontWeight: '700' }]}>{`${nf(grand)} ₪`}</Text>
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
  steps: { width: 160, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  step: { flex: 1, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.55)' },
  stepText: { fontSize: 9, fontWeight: '600', color: '#6E6478' },
  x: { fontSize: 16, color: '#B95349', paddingHorizontal: 4 },
  foot: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(130,112,162,0.16)' },
});
