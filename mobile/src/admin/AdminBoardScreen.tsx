import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { radius, surface } from '../theme/tokens';
import {
  BOARD_SUB,
  CANCEL,
  CATS,
  GONE_PREFIX,
  LATE_FEE,
  LATE_HOURS,
  MODES,
  REASONS,
  tableWidth,
} from '../data/adminBoard';
import { AdminShell } from './ui/AdminShell';
import { Chip } from './ui/Chip';
import { Field } from './ui/Field';
import { Sheet } from './ui/Sheet';
import { BoardTable } from './board/BoardTable';
import { useAdminBoard, type BoardMode } from './board/useAdminBoard';

const RED = { rgb: '185,83,73', deep: '#B95349' };
const GREEN = '#4E8A64';

export function AdminBoardScreen() {
  const admin = useAdminBoard();
  const cat = CATS.cous;
  const width = tableWidth(cat.items.length);

  const target = admin.cancelling >= 0 ? admin.orders[admin.cancelling] : null;
  const late = target ? target.hrs < LATE_HOURS : false;

  return (
    <AdminShell title={cat.name} sub={BOARD_SUB}>
      <View style={s.modes}>
        {MODES.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => admin.setMode(m.id as BoardMode)}
            style={[s.mode, admin.mode === m.id && s.modeOn]}
          >
            <Text style={[s.modeText, admin.mode === m.id && s.modeTextOn]}>{m.name}</Text>
            <View style={[s.pill, admin.mode === m.id && s.pillOn]}>
              <Text style={[s.pillText, admin.mode === m.id && s.pillTextOn]}>
                {admin.count(m.id as BoardMode)}
              </Text>
            </View>
          </Pressable>
        ))}
        {admin.goneCount > 0 ? (
          <Text style={s.gone}>{`${GONE_PREFIX} ${admin.goneCount}`}</Text>
        ) : null}
      </View>

      <View style={s.stock}>
        {admin.stock.map((x) => (
          <View
            key={x.key}
            style={[
              s.stockCard,
              {
                backgroundColor: x.isOut
                  ? 'rgba(185,83,73,0.09)'
                  : x.isLow
                    ? 'rgba(199,125,62,0.1)'
                    : 'rgba(255,255,255,0.72)',
                borderColor: x.isOut
                  ? 'rgba(185,83,73,0.3)'
                  : x.isLow
                    ? 'rgba(199,125,62,0.32)'
                    : 'rgba(255,255,255,0.9)',
              },
            ]}
          >
            <Text style={s.stockKey}>{x.key}</Text>
            <View style={s.stockRow}>
              <Text
                style={[
                  s.stockLeft,
                  { color: x.isOut ? '#B95349' : x.isLow ? '#A65E2A' : '#43307A' },
                ]}
              >
                {x.left}
              </Text>
              <Text style={s.stockOf}>{x.of}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* הטבלה נשמרת ברוחב של הקנבס · במסך צר היא נגללת לרוחב */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.hScroll}>
        <ScrollView style={{ width }} contentContainerStyle={s.vPad} showsVerticalScrollIndicator={false}>
          <BoardTable admin={admin} />
        </ScrollView>
      </ScrollView>

      {target ? (
        <Sheet
          title={CANCEL.title}
          sub={`${target.who} · ${target.time}`}
          onClose={admin.closeCancel}
          style={s.sheet}
        >
          <View style={s.sheetBody}>
            <View
              style={[
                s.fee,
                { backgroundColor: late ? 'rgba(185,83,73,0.09)' : 'rgba(78,138,100,0.1)' },
              ]}
            >
              <Text style={[s.feeTitle, { color: late ? RED.deep : GREEN }]}>
                {late ? 'ביטול מאוחר · חיוב 30%' : 'ביטול מוקדם · ללא חיוב'}
              </Text>
              <Text style={[s.feeSub, { color: late ? RED.deep : GREEN }]}>
                {late
                  ? `נותרו ${target.hrs} שעות לאיסוף · ${Math.round(admin.sumOf(target) * LATE_FEE)} ₪ מתוך ${admin.sumOf(target)} ₪`
                  : `נותרו ${target.hrs} שעות לאיסוף · מעל ${LATE_HOURS}`}
              </Text>
            </View>

            <View style={s.block}>
              <Text style={s.label}>{CANCEL.reasonLabel}</Text>
              <View style={s.reasons}>
                {REASONS.map((r) => (
                  <Chip
                    key={r}
                    label={r}
                    on={admin.cx.reason === r}
                    tint={RED}
                    fontSize={12}
                    onPress={() => admin.setCxField('reason', r)}
                  />
                ))}
              </View>
            </View>

            <Field
              label={CANCEL.noteLabel}
              value={admin.cx.note}
              onChange={(v) => admin.setCxField('note', v)}
              placeholder={CANCEL.notePlaceholder}
              height={46}
            />

            <View style={s.buttons}>
              <Pressable onPress={admin.closeCancel} style={[s.btn, s.keep]}>
                <Text style={s.keepText}>{CANCEL.keep}</Text>
              </Pressable>
              <Pressable
                onPress={admin.doCancel}
                style={[
                  s.btn,
                  {
                    backgroundColor: admin.cancelReady
                      ? 'rgba(185,83,73,0.12)'
                      : 'rgba(130,112,162,0.11)',
                    borderColor: admin.cancelReady ? 'rgba(185,83,73,0.34)' : 'transparent',
                    borderWidth: 1.5,
                  },
                ]}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: admin.cancelReady ? RED.deep : '#A79FB2' }}>
                  {CANCEL.cta}
                </Text>
              </Pressable>
            </View>
          </View>
        </Sheet>
      ) : null}
    </AdminShell>
  );
}

const s = StyleSheet.create({
  modes: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  mode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 38,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
  },
  modeOn: { backgroundColor: '#FFFFFF' },
  modeText: { fontSize: 14.5, color: surface.faint },
  modeTextOn: { fontWeight: '600', color: '#43307A' },
  pill: {
    minWidth: 22,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(130,112,162,0.1)',
    alignItems: 'center',
  },
  pillOn: { backgroundColor: 'rgba(123,92,188,0.14)' },
  pillText: { fontSize: 12, color: surface.faint },
  pillTextOn: { color: '#43307A', fontWeight: '600' },
  gone: { fontSize: 12, color: '#B95349', marginStart: 4 },

  stock: { flexDirection: 'row', gap: 8 },
  stockCard: { flex: 1, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 11, borderWidth: 1.5 },
  stockKey: { fontSize: 11, fontWeight: '500', color: surface.muted },
  stockRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 1 },
  stockLeft: { fontSize: 19, fontWeight: '600' },
  stockOf: { fontSize: 10.5, color: surface.faint },

  hScroll: { flex: 1 },
  vPad: { paddingBottom: 120 },

  sheet: { top: 120 },
  sheetBody: { gap: 12, marginTop: 12 },
  fee: { borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 },
  feeTitle: { fontSize: 13, fontWeight: '700' },
  feeSub: { fontSize: 11.5, marginTop: 2 },
  block: { gap: 6 },
  label: { fontSize: 11.5, fontWeight: '500', color: surface.faint },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  buttons: { flexDirection: 'row', gap: 9, marginTop: 2 },
  btn: { flex: 1, height: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  keep: { backgroundColor: 'rgba(130,112,162,0.09)' },
  keepText: { fontSize: 14, fontWeight: '600', color: surface.inkSoft },
});
