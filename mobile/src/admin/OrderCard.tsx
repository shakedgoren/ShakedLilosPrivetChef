import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { surface } from '../theme/tokens';
import { CANCELLED, FLOW, HUES, LATE_FEE, LATE_HOURS, TONE, type AdminOrder } from '../data/adminOrders';
import type { CancelNote } from './useAdminOrders';

type Props = {
  order: AdminOrder;
  status: string;
  isOpen: boolean;
  note?: CancelNote;
  onToggle: () => void;
  onAdvance: () => void;
  onCancel: () => void;
};

/** שורות הפירוט שנפתחות מתחת לכרטיס */
function detailRows(order: AdminOrder, cancelled: boolean, note?: CancelNote) {
  const rows = [
    { k: 'טלפון', v: order.phone },
    { k: 'הפריטים', v: order.items },
    { k: 'איסוף / משלוח', v: order.ship },
    { k: 'תשלום', v: order.pay },
  ];
  if (!cancelled) return rows;

  const fee = order.hrs < LATE_HOURS ? Math.round(order.sum * LATE_FEE) : 0;
  return rows.concat([
    { k: 'סיבת הביטול', v: (note?.reason ?? '') + (note?.note ? ` · ${note.note}` : '') },
    { k: 'דמי ביטול', v: fee > 0 ? `${fee} ₪ · 30% מהעסקה` : 'ללא חיוב' },
  ]);
}

export function OrderCard({ order, status, isOpen, note, onToggle, onAdvance, onCancel }: Props) {
  const hue = HUES[order.key];
  const cancelled = status === CANCELLED;
  const tone = TONE[status] ?? TONE['חדשה'];
  const step = FLOW.indexOf(status);
  const isLast = step >= FLOW.length - 1;
  const rows = detailRows(order, cancelled, note);

  return (
    <Pressable onPress={onToggle} style={[s.card, { borderRightColor: hue.hue }]}>
      <View style={s.top}>
        <View style={s.main}>
          <View style={s.chipRow}>
            <View style={[s.statusChip, { backgroundColor: tone.bg }]}>
              <Text style={[s.statusText, { color: tone.fg }]}>{status}</Text>
            </View>
            {order.via ? <Text style={s.source}>{order.via}</Text> : null}
          </View>
          <Text style={s.who}>{order.who}</Text>
          <Text style={s.line}>{`${hue.n} · ${order.items}`}</Text>
        </View>
        <View style={s.side}>
          <Text style={s.sum}>{`${order.sum} ₪`}</Text>
          <Text style={[s.time, { color: hue.deep }]}>{order.time}</Text>
        </View>
        <Text style={s.chev}>{isOpen ? '⌃' : '⌄'}</Text>
      </View>

      {isOpen ? (
        <View style={s.body}>
          <View style={s.rule} />
          {rows.map((r) => (
            <View key={r.k} style={s.row}>
              <Text style={s.rowKey}>{r.k}</Text>
              <Text style={s.rowVal}>{r.v}</Text>
            </View>
          ))}

          <View style={s.actions}>
            <View style={s.call}>
              <Text style={s.callText}>חיוג</Text>
            </View>
            {cancelled ? null : (
              <>
                <Pressable
                  onPress={onAdvance}
                  style={[
                    s.next,
                    { backgroundColor: isLast ? 'rgba(130,112,162,0.09)' : `rgba(${hue.rgb},0.14)` },
                  ]}
                >
                  <Text style={[s.nextText, { color: isLast ? '#A79FB2' : hue.deep }]}>
                    {isLast ? 'ההזמנה נמסרה' : `סמני כ${FLOW[step + 1]}`}
                  </Text>
                </Pressable>
                <Pressable onPress={onCancel} style={s.kill} hitSlop={6}>
                  <Text style={s.killGlyph}>✕</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 20,
    paddingVertical: 13,
    paddingHorizontal: 15,
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    borderRightWidth: 3,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  main: { flex: 1, gap: 3 },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  statusChip: { borderRadius: 7, paddingVertical: 2, paddingHorizontal: 8 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  source: { fontSize: 10, fontWeight: '600', color: '#A79FB2' },
  who: { fontSize: 15.5, fontWeight: '600', color: surface.ink },
  line: { fontSize: 12, fontWeight: '300', color: surface.muted },
  /* בקנבס המספרים מיושרים לצד החיצוני של הכרטיס · ב-RTL זהו flex-end */
  side: { alignItems: 'flex-end' },
  sum: { fontSize: 16, fontWeight: '600', color: surface.ink },
  time: { fontSize: 11.5, fontWeight: '500' },
  chev: { fontSize: 14, color: '#A79FB2' },
  body: { gap: 10 },
  rule: { height: 1, backgroundColor: 'rgba(130,112,162,0.14)' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  rowKey: { width: 78, fontSize: 11.5, fontWeight: '300', color: surface.muted, lineHeight: 18 },
  rowVal: { flex: 1, fontSize: 12.5, fontWeight: '500', color: surface.ink, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 7 },
  call: {
    flex: 1,
    height: 38,
    borderRadius: 999,
    backgroundColor: 'rgba(130,112,162,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callText: { fontSize: 12.5, fontWeight: '600', color: surface.inkSoft },
  next: { flex: 2, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  nextText: { fontSize: 12.5, fontWeight: '600' },
  kill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(185,83,73,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  killGlyph: { fontSize: 14, fontWeight: '700', color: '#B95349' },
});
