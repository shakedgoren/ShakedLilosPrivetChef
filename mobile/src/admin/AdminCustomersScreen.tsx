import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { surface } from '../theme/tokens';
import {
  CUSTOMERS_TITLE,
  EMPTY_LABEL,
  FILTERS,
  SEARCH_PLACEHOLDER,
  SUB_MIDDLE,
  SUB_SUFFIX,
  PEOPLE,
} from '../data/adminCustomers';
import { AdminShell } from './ui/AdminShell';
import { Chip } from './ui/Chip';
import { CustomerCard } from './customers/CustomerCard';
import { HistorySheet } from './customers/HistorySheet';
import { useAdminCustomers } from './customers/useAdminCustomers';
import { nf } from './shopping/useAdminShopping';

const PLUM = { rgb: '123,92,188', deep: '#43307A', hue: '#7B5CBC' };

export function AdminCustomersScreen() {
  const admin = useAdminCustomers();

  return (
    <AdminShell
      title={CUSTOMERS_TITLE}
      sub={`${PEOPLE.length}${SUB_MIDDLE}${nf(admin.totalSpent)}${SUB_SUFFIX}`}
    >
      <TextInput
        value={admin.query}
        onChangeText={admin.search}
        placeholder={SEARCH_PLACEHOLDER}
        placeholderTextColor="#B3ABBD"
        style={s.search}
      />

      <View style={s.filters}>
        {FILTERS.map((f) => (
          <Chip
            key={f.id}
            label={f.name}
            on={admin.filter === f.id}
            tint={PLUM}
            count={admin.count(f.id)}
            style={s.filter}
            onPress={() => admin.pickFilter(f.id)}
          />
        ))}
      </View>

      <ScrollView style={s.body} contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
        {admin.shown.length === 0 ? (
          <Text style={s.empty}>{EMPTY_LABEL}</Text>
        ) : (
          admin.shown.map((p) => (
            <CustomerCard
              key={p.phone}
              person={p}
              note={admin.notes[p.name] ?? ''}
              isOpen={admin.open === p.name}
              onToggle={() => admin.toggle(p.name)}
              onNote={(v) => admin.setNote(p.name, v)}
              onHist={() => admin.openHist(p.name)}
            />
          ))
        )}
      </ScrollView>

      {admin.histFor ? (
        <HistorySheet name={admin.histFor} onClose={admin.closeHist} />
      ) : null}
    </AdminShell>
  );
}

const s = StyleSheet.create({
  search: {
    height: 44,
    borderRadius: 15,
    paddingHorizontal: 13,
    fontSize: 13.5,
    color: surface.ink,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.18)',
    textAlign: 'right',
  },
  filters: { flexDirection: 'row', gap: 6 },
  filter: { flex: 1 },
  body: { flex: 1 },
  pad: { gap: 9, paddingBottom: 120 },
  empty: { fontSize: 14, fontWeight: '500', color: '#A79FB2', textAlign: 'center', marginTop: 60 },
});
