import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { DAYS_SUB, DAYS_TITLE } from '../data/adminDays';
import { AdminShell } from './ui/AdminShell';
import { MonthGrid } from './days/MonthGrid';
import { DayPanel } from './days/DayPanel';
import { useAdminDays } from './days/useAdminDays';

export function AdminDaysScreen() {
  const admin = useAdminDays();

  return (
    <AdminShell title={DAYS_TITLE} sub={DAYS_SUB}>
      <ScrollView style={s.body} contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
        <View style={s.card}>
          <MonthGrid
            year={admin.year}
            month={admin.month}
            selected={admin.selected}
            days={admin.days}
            onStep={admin.step}
            onSelect={admin.select}
          />
        </View>
        <DayPanel admin={admin} />
      </ScrollView>
    </AdminShell>
  );
}

const s = StyleSheet.create({
  body: { flex: 1 },
  pad: { gap: 12, paddingBottom: 120 },
  card: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
});
