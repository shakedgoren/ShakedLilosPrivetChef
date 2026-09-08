import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { surface } from '../theme/tokens';
import { CANCELLED, FLOW, HUES, ORDERS_SUBTITLE } from '../data/adminOrders';
import { AdminShell, KpiRow } from './ui/AdminShell';
import { Chip } from './ui/Chip';
import { OrderCard } from './OrderCard';
import { CancelSheet } from './CancelSheet';
import { NewOrderSheet } from './NewOrderSheet';
import { RollSheet } from './RollSheet';
import { useAdminOrders } from './useAdminOrders';

const ALL = 'הכל';
/* לשוניות הסינון · המסלול בלי ״נמסרה״, ואחריו ״בוטלה״ */
const TABS = [ALL, ...FLOW.slice(0, 3), CANCELLED];
const COUS = HUES.cous;

export function AdminOrdersScreen() {
  const admin = useAdminOrders();

  const all = admin.allOrders.map((o, i) => ({ o, i, status: admin.statusOf(i) }));
  const shown = admin.tab === ALL ? all : all.filter((x) => x.status === admin.tab);

  const live = all.filter((x) => x.status !== CANCELLED);
  const kpis = [
    { k: 'הזמנות היום', v: all.length, fg: surface.ink },
    { k: 'עוד לא נמסרו', v: live.filter((x) => x.status !== 'נמסרה').length, fg: '#A65E2A' },
    { k: 'מחזור היום', v: live.reduce((s, x) => s + x.o.sum, 0), fg: COUS.deep },
  ];

  const cancelTarget = admin.cancelling >= 0 ? admin.allOrders[admin.cancelling] : null;

  return (
    <AdminShell
      title="הזמנות"
      sub={ORDERS_SUBTITLE}
      actions={[{ label: 'הזמנה ידנית', onPress: admin.openNew, primary: true }]}
    >
      <View style={s.tabs}>
        {TABS.map((name) => (
          <Chip
            key={name}
            label={name}
            on={admin.tab === name}
            tint={COUS}
            style={s.tab}
            count={name === ALL ? all.length : all.filter((x) => x.status === name).length}
            onPress={() => admin.pickTab(name)}
          />
        ))}
      </View>

      <KpiRow kpis={kpis} />

      <ScrollView style={s.list} contentContainerStyle={s.listPad} showsVerticalScrollIndicator={false}>
        {shown.length === 0 ? (
          <Text style={s.empty}>אין הזמנות במצב הזה</Text>
        ) : (
          shown.map((x) => (
            <OrderCard
              key={x.i}
              order={x.o}
              status={x.status}
              isOpen={admin.open === x.i}
              note={admin.notes[x.i]}
              onToggle={() => admin.toggle(x.i)}
              onAdvance={() => admin.advance(x.i)}
              onCancel={() => admin.askCancel(x.i)}
            />
          ))
        )}
      </ScrollView>

      {cancelTarget ? (
        <CancelSheet
          order={cancelTarget}
          cx={admin.cx}
          ready={admin.cancelReady}
          onSetField={admin.setCxField}
          onClose={admin.closeCancel}
          onConfirm={admin.doCancel}
        />
      ) : null}

      {admin.newOpen ? <NewOrderSheet admin={admin} /> : null}

      {admin.pop ? (
        <RollSheet
          pop={admin.pop}
          onToggleTop={admin.togglePopTop}
          onClose={admin.closeRoll}
          onSave={admin.saveRoll}
        />
      ) : null}
    </AdminShell>
  );
}

const s = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 6 },
  tab: { flex: 1 },
  list: { flex: 1 },
  listPad: { gap: 9, paddingBottom: 120 },
  empty: { fontSize: 14, fontWeight: '500', color: '#A79FB2', textAlign: 'center', marginTop: 60 },
});
