import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { surface } from '../theme/tokens';
import { LATE_FEE, LATE_HOURS, REASONS, type AdminOrder } from '../data/adminOrders';
import { Sheet } from './ui/Sheet';
import { Field } from './ui/Field';
import { Chip } from './ui/Chip';
import type { CancelNote } from './useAdminOrders';

const RED = { rgb: '185,83,73', deep: '#B95349' };
const GREEN = '#4E8A64';

/** הודעת דמי הביטול · פחות מ-12 שעות לפני האיסוף מחייבת 30% */
function feeNotice(order: AdminOrder) {
  const late = order.hrs < LATE_HOURS;
  if (!late) {
    return {
      title: 'ביטול מוקדם · ללא חיוב',
      sub: `נותרו ${order.hrs} שעות לאיסוף · מעל ${LATE_HOURS}`,
      bg: 'rgba(78,138,100,0.1)',
      fg: GREEN,
    };
  }
  const when = order.hrs < 0 ? 'האיסוף כבר עבר' : `נותרו ${order.hrs} שעות לאיסוף`;
  return {
    title: 'ביטול מאוחר · חיוב 30%',
    sub: `${when} · ${Math.round(order.sum * LATE_FEE)} ₪ מתוך ${order.sum} ₪`,
    bg: 'rgba(185,83,73,0.09)',
    fg: RED.deep,
  };
}

type Props = {
  order: AdminOrder;
  cx: CancelNote;
  ready: boolean;
  onSetField: (k: keyof CancelNote, v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function CancelSheet({ order, cx, ready, onSetField, onClose, onConfirm }: Props) {
  const fee = feeNotice(order);

  return (
    <Sheet title="ביטול הזמנה" sub={order.who} onClose={onClose} style={s.pos}>
      <View style={s.gap}>
        <View style={[s.fee, { backgroundColor: fee.bg }]}>
          <Text style={[s.feeTitle, { color: fee.fg }]}>{fee.title}</Text>
          <Text style={[s.feeSub, { color: fee.fg }]}>{fee.sub}</Text>
        </View>

        <View style={s.block}>
          <Text style={s.label}>סיבת הביטול</Text>
          <View style={s.wrap}>
            {REASONS.map((r) => (
              <Chip
                key={r}
                label={r}
                on={cx.reason === r}
                tint={RED}
                fontSize={12}
                onPress={() => onSetField('reason', r)}
              />
            ))}
          </View>
        </View>

        <Field
          label="הערה · לא חובה"
          value={cx.note}
          onChange={(v) => onSetField('note', v)}
          placeholder="מה קרה"
          height={46}
        />

        <View style={s.buttons}>
          <Pressable onPress={onClose} style={[s.btn, s.keep]}>
            <Text style={s.keepText}>להשאיר</Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            style={[
              s.btn,
              {
                backgroundColor: ready ? 'rgba(185,83,73,0.12)' : 'rgba(130,112,162,0.11)',
                borderColor: ready ? 'rgba(185,83,73,0.34)' : 'transparent',
                borderWidth: 1.5,
              },
            ]}
          >
            <Text style={[s.btnText, { color: ready ? RED.deep : '#A79FB2' }]}>ביטול ההזמנה</Text>
          </Pressable>
        </View>
      </View>
    </Sheet>
  );
}

const s = StyleSheet.create({
  pos: { top: 150, padding: 20 },
  gap: { gap: 12, marginTop: 12 },
  fee: { borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 },
  feeTitle: { fontSize: 13, fontWeight: '700' },
  feeSub: { fontSize: 11.5, marginTop: 2 },
  block: { gap: 6 },
  label: { fontSize: 11.5, fontWeight: '500', color: surface.faint },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  buttons: { flexDirection: 'row', gap: 9, marginTop: 2 },
  btn: { flex: 1, height: 46, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  keep: { backgroundColor: 'rgba(130,112,162,0.09)' },
  keepText: { fontSize: 14, fontWeight: '600', color: surface.inkSoft },
  btnText: { fontSize: 14, fontWeight: '600' },
});
