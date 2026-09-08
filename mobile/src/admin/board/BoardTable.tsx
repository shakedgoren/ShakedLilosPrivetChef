import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { surface } from '../../theme/tokens';
import {
  BAND,
  COL_W,
  EMPTY_LABEL,
  FLOW,
  HEAD_COLS,
  STEPS,
  TAIL_COLS,
  TOTAL_LABEL,
} from '../../data/adminBoard';
import type { useAdminBoard } from './useAdminBoard';

const HAIR = 'rgba(130,112,162,0.07)';
const HEAD_HAIR = 'rgba(130,112,162,0.09)';

type Props = { admin: ReturnType<typeof useAdminBoard> };

/** הטבלה של הלוח · רוחב קבוע מהקנבס, נגללת לרוחב במסך צר */
export function BoardTable({ admin }: Props) {
  const items = admin.cat.items;

  return (
    <View>
      <View style={s.headRow}>
        <Text style={[s.headCell, s.headText, { width: COL_W.time, textAlign: 'center' }]}>
          {HEAD_COLS.time}
        </Text>
        <Text style={[s.headCell, s.headText, { width: COL_W.who, textAlign: 'right' }]}>
          {HEAD_COLS.who}
        </Text>
        {items.map((it) => (
          <View key={it.id} style={[s.headCell, { width: COL_W.item }]}>
            <Text style={[s.headText, s.center]}>{it.t}</Text>
            <Text style={[s.headSub, s.center]}>{it.sub}</Text>
          </View>
        ))}
        <Text style={[s.headCell, s.headText, s.center, { width: COL_W.sum }]}>{TAIL_COLS.sum}</Text>
        <Text style={[s.headCell, s.headText, s.center, { width: COL_W.pay }]}>{TAIL_COLS.pay}</Text>
        <Text style={[s.headCell, s.headText, s.center, { width: COL_W.status }]}>
          {TAIL_COLS.status}
        </Text>
      </View>

      {admin.shown.length === 0 ? (
        <Text style={s.empty}>{EMPTY_LABEL}</Text>
      ) : (
        admin.shown.map(({ o, i }) => {
          const b = BAND[o.status];
          const isLast = FLOW.indexOf(o.status) >= FLOW.length - 1;
          return (
            <View key={`${o.who}-${o.time}`} style={[s.row, { backgroundColor: b.row, borderRightColor: b.edge }]}>
              <View style={[s.cell, { width: COL_W.time }]}>
                <Text style={[s.time, { color: b.ink }]}>{o.time}</Text>
              </View>

              <View style={[s.cell, s.whoCell, { width: COL_W.who }]}>
                <Text style={[s.who, { color: b.ink }]}>{o.who}</Text>
                <Text style={[s.note, { color: b.muted }]}>
                  {o.note || (o.ship === 'pickup' ? 'איסוף' : 'משלוח')}
                </Text>
              </View>

              {items.map((it) => {
                const n = o.q[it.id] || 0;
                return (
                  <View key={it.id} style={[s.cell, s.qtyCell, { width: COL_W.item }]}>
                    <TextInput
                      value={String(n)}
                      onChangeText={(v) => admin.setQty(i, it.id, v)}
                      keyboardType="numeric"
                      style={[
                        s.qtyInput,
                        {
                          color: n > 0 ? b.ink : '#C4BDCE',
                          fontWeight: n > 0 ? '700' : '400',
                          backgroundColor: n > 0 ? 'rgba(255,255,255,0.62)' : 'transparent',
                          borderColor: n > 0 ? 'rgba(130,112,162,0.2)' : 'rgba(130,112,162,0.1)',
                        },
                      ]}
                    />
                  </View>
                );
              })}

              <View style={[s.cell, { width: COL_W.sum }]}>
                <Text style={[s.sum, { color: b.ink }]}>{`${admin.sumOf(o)} ₪`}</Text>
              </View>

              <View style={[s.cell, { width: COL_W.pay }]}>
                <Text style={[s.pay, { color: b.muted }]}>{o.pay}</Text>
              </View>

              <View style={[s.cell, s.stepsCell, { width: COL_W.status }]}>
                {STEPS.map((sp) => {
                  const on = sp.id === o.status;
                  return (
                    <Pressable
                      key={sp.id}
                      onPress={() => admin.setStatus(i, sp.id)}
                      style={[
                        s.step,
                        {
                          backgroundColor: on ? b.edge : 'rgba(255,255,255,0.72)',
                          borderColor: on ? b.edge : 'rgba(130,112,162,0.22)',
                        },
                      ]}
                    >
                      <Svg width={19} height={19} viewBox="0 0 24 24">
                        {sp.paths.map((p) => (
                          <Path
                            key={p}
                            d={p}
                            fill="none"
                            stroke={on ? '#FFFFFF' : '#A79FB2'}
                            strokeWidth={1.8}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        ))}
                      </Svg>
                    </Pressable>
                  );
                })}
                {!isLast ? (
                  <Pressable onPress={() => admin.askCancel(i)} style={s.kill} hitSlop={4}>
                    <Text style={s.killGlyph}>✕</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        })
      )}

      {/* שורת הסיכום · מיושרת לעמודות הטבלה */}
      <View style={s.totalRow}>
        <Text style={[s.totalLabel, { width: COL_W.time + COL_W.who }]}>{TOTAL_LABEL}</Text>
        {items.map((it, k) => (
          <Text key={it.id} style={[s.totalValue, s.center, { width: COL_W.item }]}>
            {admin.totals[k]}
          </Text>
        ))}
        <Text style={[s.totalValue, s.center, { width: COL_W.sum }]}>{`${admin.grand} ₪`}</Text>
        <View style={{ width: COL_W.pay + COL_W.status }} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  headRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(130,112,162,0.14)',
  },
  headCell: { paddingVertical: 9, paddingHorizontal: 6, borderLeftWidth: 1, borderLeftColor: HEAD_HAIR },
  headText: { fontSize: 12.5, fontWeight: '700', color: surface.inkSoft, lineHeight: 16 },
  headSub: { fontSize: 11, fontWeight: '400', color: surface.faint },
  center: { textAlign: 'center' },

  row: { flexDirection: 'row', alignItems: 'stretch', borderRightWidth: 3, marginBottom: 2 },
  cell: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderLeftWidth: 1,
    borderLeftColor: HAIR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whoCell: { alignItems: 'flex-start', paddingHorizontal: 10, gap: 1 },
  time: { fontSize: 15, fontWeight: '600' },
  who: { fontSize: 14.5, fontWeight: '600' },
  note: { fontSize: 11.5, fontWeight: '300' },
  qtyCell: { paddingVertical: 5, paddingHorizontal: 5 },
  qtyInput: {
    width: '100%',
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    textAlign: 'center',
  },
  sum: { fontSize: 15.5, fontWeight: '700' },
  pay: { fontSize: 13, fontWeight: '500' },
  stepsCell: { flexDirection: 'row', gap: 6 },
  step: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kill: {
    width: 34,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  killGlyph: { fontSize: 14, color: '#B95349' },

  empty: { fontSize: 14, fontWeight: '500', color: '#A79FB2', textAlign: 'center', paddingVertical: 50 },

  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(130,112,162,0.16)',
  },
  totalLabel: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 13.5,
    fontWeight: '600',
    color: surface.inkSoft,
  },
  totalValue: { paddingVertical: 12, paddingHorizontal: 6, fontSize: 16, fontWeight: '700', color: '#43307A' },
});
