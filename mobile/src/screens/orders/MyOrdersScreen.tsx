import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { listMyOrders, reorderOrder } from '../../api/orders';
import { apiEnabled } from '../../api/config';
import { COPY, orderError } from '../../api/copy';
import { ApiError, type Order } from '../../api/types';
import { LogoutConfirm } from '../../components/LogoutConfirm';
import { useNav, type Screen } from '../../navigation/store';
import { a, hues, radius, space, surface, type } from '../../theme/tokens';
import {
  categoryKey,
  categoryName,
  countLabel,
  isCancelled,
  isLive,
  itemsLine,
  shortRef,
  whenLine,
} from './format';
import {
  AGAIN_LABEL,
  EMPTY_CTA,
  EMPTY_TEXT,
  MY_ORDERS_TITLE,
  PAST_LABEL,
} from '../../data/myOrders';
import { TILE_EDGE, TILE_SHADOW } from '../../theme/glass';

/** ההזמנות שלי · מקביל ל-MyOrders.dc.html, מחובר ל-GET /orders */
export function MyOrdersScreen() {
  const { go, signOut } = useNav();
  const [orders, setOrders] = useState<Order[]>([]);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [outOpen, setOutOpen] = useState(false);

  const load = useCallback(async () => {
    if (!apiEnabled) {
      setOrders([]);
      return;
    }
    setErr('');
    try {
      const { orders: rows } = await listMyOrders();
      setOrders(rows);
    } catch {
      setErr(COPY.net);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const live = orders.filter((o) => isLive(o.status));
  const past = orders.filter((o) => !isLive(o.status));
  const empty = live.length + past.length === 0 && !err;

  const onAgain = async (o: Order) => {
    if (!apiEnabled) {
      go(categoryKey(o.category) as Screen);
      return;
    }
    setErr('');
    try {
      await reorderOrder(o.id);
      await load();
    } catch (e) {
      const code = e instanceof ApiError ? e.code : '';
      if (code === 'reorder_unavailable') {
        go(categoryKey(o.category) as Screen);
        return;
      }
      setErr(e instanceof ApiError ? orderError(e.code, e.message) : COPY.reorderFail);
    }
  };

  return (
    <View style={s.page}>
      <View style={s.head}>
        <View style={s.headText}>
          <Text style={s.title}>{MY_ORDERS_TITLE}</Text>
          {!empty ? <Text style={s.count}>{countLabel(live.length, past.length)}</Text> : null}
        </View>
        <Pressable onPress={() => setOutOpen(true)} style={s.authBtn} hitSlop={8}>
          <Text style={s.authGlyph}>⎋</Text>
        </Pressable>
      </View>

      {empty ? (
        <View style={s.empty}>
          <View style={s.emptyOrb}>
            <Text style={s.emptyGlyph}>☰</Text>
          </View>
          <Text style={s.emptyTitle}>{EMPTY_TEXT}</Text>
          <Pressable onPress={() => go('main')} style={s.emptyCta}>
            <Text style={s.emptyCtaText}>{EMPTY_CTA}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {err ? <Text style={s.err}>{err}</Text> : null}
          {live.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              variant="live"
              open={open === o.id}
              onToggle={() => setOpen((cur) => (cur === o.id ? null : o.id))}
            />
          ))}
          {past.length > 0 ? <Text style={s.pastLabel}>{PAST_LABEL}</Text> : null}
          {past.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              variant="past"
              open={open === o.id}
              onToggle={() => setOpen((cur) => (cur === o.id ? null : o.id))}
              onAgain={isCancelled(o.status) ? undefined : () => void onAgain(o)}
            />
          ))}
        </ScrollView>
      )}

      <LogoutConfirm open={outOpen} onCancel={() => setOutOpen(false)} onConfirm={signOut} />
    </View>
  );
}

function OrderCard({
  order,
  variant,
  open,
  onToggle,
  onAgain,
}: {
  order: Order;
  variant: 'live' | 'past';
  open: boolean;
  onToggle: () => void;
  onAgain?: () => void;
}) {
  const hue = hues[categoryKey(order.category)];
  const cancelled = isCancelled(order.status);
  const rows = [
    { k: 'הפריטים', v: itemsLine(order) || '—' },
    { k: 'מועד', v: whenLine(order) },
    { k: 'תשלום', v: order.pay },
    { k: 'מספר הזמנה', v: shortRef(order.id) },
  ];
  if (cancelled) rows.push({ k: 'דמי ביטול', v: 'ללא חיוב' });

  return (
    <Pressable
      onPress={onToggle}
      style={[
        s.card,
        variant === 'past' && s.cardPast,
        { borderRightColor: cancelled ? 'rgba(185,83,73,0.34)' : hue.hue },
      ]}
    >
      <View style={s.cardTop}>
        <View style={s.cardMain}>
          {variant === 'live' ? (
            <View style={s.statusRow}>
              <View style={s.liveDot} />
              <Text style={s.liveStatus}>{order.status}</Text>
            </View>
          ) : (
            <Text style={[s.pastStatus, cancelled && s.cancelledStatus]}>{order.status}</Text>
          )}
          <Text style={[s.cardName, cancelled && s.cancelledName]}>{categoryName(order.category)}</Text>
          {variant === 'live' ? <Text style={[s.when, { color: hue.deep }]}>{whenLine(order)}</Text> : null}
        </View>
        <View style={s.cardSide}>
          <View style={s.sumRow}>
            <Text style={[s.sum, variant === 'past' && s.sumPast]}>{order.total} ₪</Text>
            <Text style={s.chev}>{open ? '⌃' : '⌄'}</Text>
          </View>
          {onAgain ? (
            <Pressable onPress={onAgain} style={s.again}>
              <Text style={s.againText}>{AGAIN_LABEL}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {open ? (
        <View style={s.detail}>
          <View style={s.rule} />
          {rows.map((r) => (
            <View key={r.k} style={s.row}>
              <Text style={s.rowKey}>{r.k}</Text>
              <Text style={s.rowVal}>{r.v}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: space.lg, paddingTop: space.xxl },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingBottom: 18,
  },
  headText: { gap: 3, flex: 1 },
  title: { fontSize: 21, fontWeight: '600', color: surface.ink },
  count: { fontSize: 13, fontWeight: '300', color: surface.faint },
  authBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FAF7FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authGlyph: { fontSize: 18, color: '#8A8194' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22, paddingBottom: 150, paddingHorizontal: 30 },
  emptyOrb: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: 'rgba(123,92,188,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGlyph: { fontSize: 36, color: '#43307A' },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: surface.ink,
    lineHeight: 30,
  },
  emptyCta: {
    height: 50,
    paddingHorizontal: 30,
    borderRadius: radius.pill,
    backgroundColor: '#B9A4E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCtaText: { fontSize: 15, fontWeight: '600', color: '#43307A' },

  list: { gap: 11, paddingBottom: 120 },
  err: { fontSize: 13, color: '#B95349', textAlign: 'center' },
  pastLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: '#A79FB2',
    paddingHorizontal: 8,
    paddingTop: 8,
  },

  card: {
    borderRadius: 26,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: TILE_EDGE,
    boxShadow: TILE_SHADOW,
    borderRightWidth: 3,
    gap: 12,
  },
  cardPast: { borderRadius: 22, paddingVertical: 15, backgroundColor: 'rgba(255,255,255,0.56)' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardMain: { flex: 1, minWidth: 0, gap: 5 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4E8A64' },
  liveStatus: { fontSize: 10.5, letterSpacing: 1.8, fontWeight: '700', color: '#4E8A64' },
  pastStatus: { fontSize: 10.5, letterSpacing: 1.8, fontWeight: '600', color: '#A79FB2' },
  cancelledStatus: { color: '#B95349' },
  cardName: { fontSize: 19, fontWeight: '600', color: surface.ink, lineHeight: 23 },
  cancelledName: { color: '#8A8194' },
  when: { fontSize: 13, fontWeight: '500' },
  cardSide: { alignItems: 'flex-end', gap: 7 },
  sumRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  sum: { fontSize: 20, fontWeight: '600', color: surface.ink },
  sumPast: { fontSize: 17, color: '#6E6478' },
  chev: { fontSize: 14, color: '#A79FB2' },
  again: {
    height: 32,
    paddingHorizontal: 13,
    borderRadius: radius.pill,
    backgroundColor: '#B9A4E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  againText: { fontSize: 12.5, fontWeight: '600', color: '#43307A' },

  detail: { gap: 9 },
  rule: { height: 1, backgroundColor: a('130,112,162', 0.14) },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  rowKey: { width: 84, fontSize: 12, fontWeight: '300', color: surface.muted, lineHeight: 18 },
  rowVal: { flex: 1, fontSize: 12.5, fontWeight: '500', color: surface.ink, lineHeight: 18 },
});
