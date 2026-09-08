import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { surface } from '../theme/tokens';
import {
  AGAIN_LABEL,
  COUNT,
  EMPTY_CTA,
  EMPTY_TEXT,
  FEE_KEY,
  HUES,
  MY_ORDERS_TITLE,
  ORDERS,
  PAST_LABEL,
  ROW_KEYS,
  type MyOrder,
} from '../data/myOrders';
import { useNav } from '../navigation/store';

const RED = '#B95349';

/** שורות הפירוט · דמי הביטול נוספים רק בהזמנה שבוטלה */
function detailRows(o: MyOrder) {
  const rows = [
    { k: ROW_KEYS[0], v: o.items },
    { k: ROW_KEYS[1], v: o.when },
    { k: ROW_KEYS[2], v: o.pay },
    { k: ROW_KEYS[3], v: o.ref },
  ];
  if (!o.cancelled) return rows;
  return [...rows, { k: FEE_KEY, v: o.fee ? `${o.fee} ₪ · 30% מהעסקה` : 'ללא חיוב' }];
}

function OrderCard({
  order,
  isOpen,
  onToggle,
}: {
  order: MyOrder;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const hue = HUES[order.key] ?? HUES.cous;
  const off = !!order.cancelled;

  return (
    <Pressable
      onPress={onToggle}
      style={[s.card, { borderRightColor: off ? 'rgba(185,83,73,0.34)' : `rgba(${hue.rgb},0.34)` }]}
    >
      <View style={s.head}>
        <View style={s.headText}>
          <Text style={[s.status, { color: off ? RED : '#A79FB2' }]}>{order.status}</Text>
          <Text style={[s.name, { color: off ? surface.faint : surface.ink }]}>{order.name}</Text>
          <Text style={s.when}>{order.when}</Text>
        </View>
        <View style={s.side}>
          <Text style={s.sum}>{`${order.sum} ₪`}</Text>
          <Text style={s.chev}>{isOpen ? '⌃' : '⌄'}</Text>
        </View>
      </View>

      {!off ? (
        <View style={s.againRow}>
          <Text style={[s.again, { color: hue.deep }]}>{AGAIN_LABEL}</Text>
        </View>
      ) : null}

      {isOpen ? (
        <View style={s.body}>
          <View style={s.rule} />
          {detailRows(order).map((r) => (
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

export function MyOrdersScreen() {
  const { go } = useNav();
  const [open, setOpen] = useState(-1);

  const live = ORDERS.map((o, i) => ({ o, i })).filter((x) => x.o.live);
  const past = ORDERS.map((o, i) => ({ o, i })).filter((x) => !x.o.live);
  const any = live.length + past.length > 0;

  const countLabel = live.length
    ? `${live.length}${COUNT.live}${past.length}${COUNT.past}`
    : `${past.length}${COUNT.onlyPast}`;

  const toggle = (i: number) => setOpen((cur) => (cur === i ? -1 : i));

  return (
    <View style={s.page}>
      <View style={s.header}>
        <Text style={s.title}>{MY_ORDERS_TITLE}</Text>
        {any ? <Text style={s.count}>{countLabel}</Text> : null}
      </View>

      {!any ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>{EMPTY_TEXT}</Text>
          <Pressable onPress={() => go('main')} style={s.emptyBtn}>
            <Text style={s.emptyBtnText}>{EMPTY_CTA}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {live.map(({ o, i }) => (
            <OrderCard key={o.ref} order={o} isOpen={open === i} onToggle={() => toggle(i)} />
          ))}

          {past.length > 0 ? <Text style={s.pastLabel}>{PAST_LABEL}</Text> : null}

          {past.map(({ o, i }) => (
            <OrderCard key={o.ref} order={o} isOpen={open === i} onToggle={() => toggle(i)} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, paddingTop: 30, paddingHorizontal: 18 },
  header: { gap: 2, marginBottom: 14 },
  title: { fontSize: 21, fontWeight: '600', color: surface.ink },
  count: { fontSize: 12.5, fontWeight: '300', color: surface.faint },

  list: { gap: 9, paddingBottom: 120 },
  pastLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.7,
    color: '#A79FB2',
    marginTop: 8,
    paddingHorizontal: 4,
  },

  card: {
    borderRadius: 20,
    paddingVertical: 13,
    paddingHorizontal: 15,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    borderRightWidth: 3,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headText: { flex: 1, gap: 2 },
  status: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  name: { fontSize: 15.5, fontWeight: '600' },
  when: { fontSize: 11.5, fontWeight: '300', color: surface.faint },
  side: { alignItems: 'flex-end', gap: 4 },
  sum: { fontSize: 16, fontWeight: '600', color: surface.ink },
  chev: { fontSize: 14, color: '#A79FB2' },
  againRow: { alignItems: 'flex-start' },
  again: { fontSize: 12, fontWeight: '600' },

  body: { gap: 8 },
  rule: { height: 1, backgroundColor: 'rgba(130,112,162,0.14)' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  rowKey: { width: 88, fontSize: 11.5, fontWeight: '300', color: surface.muted, lineHeight: 18 },
  rowVal: { flex: 1, fontSize: 12.5, fontWeight: '500', color: surface.ink, lineHeight: 18 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingBottom: 120 },
  emptyText: { fontSize: 15, color: surface.muted, textAlign: 'center' },
  emptyBtn: {
    height: 46,
    paddingHorizontal: 26,
    borderRadius: 999,
    backgroundColor: '#C6B3EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtnText: { fontSize: 14.5, fontWeight: '600', color: '#43307A' },
});
