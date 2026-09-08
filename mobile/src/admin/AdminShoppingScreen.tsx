import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { surface } from '../theme/tokens';
import {
  ACT_TAG,
  AREA,
  AREAS,
  CLOSE_LABEL,
  CLOSE_SUB_NONE,
  CLOSE_SUB_PREFIX,
  CLOSE_SUB_SUFFIX,
  EST_TAG,
  PROG_LABEL,
} from '../data/adminShopping';
import { useNav } from '../navigation/store';
import { AdminShell } from './ui/AdminShell';
import { Chip } from './ui/Chip';
import { ProgressBar } from './ui/ProgressBar';
import { ShopTable } from './shopping/ShopTable';
import { AddShopSheet } from './shopping/AddShopSheet';
import { nf, useAdminShopping } from './shopping/useAdminShopping';

const PLUM = { rgb: '123,92,188', deep: '#43307A', hue: '#7B5CBC' };

export function AdminShoppingScreen() {
  const { go } = useNav();
  const admin = useAdminShopping();

  return (
    <AdminShell
      title={admin.title}
      sub={`${admin.doneCount} מתוך ${admin.items.length} נרכשו`}
      actions={[
        { label: 'היסטוריה', onPress: () => go('adminHistory') },
        { label: 'פריט', onPress: admin.openAdd, primary: true },
      ]}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.areas}>
        {AREAS.map((a) => (
          <Chip
            key={a.id}
            label={a.n}
            on={admin.area === a.id}
            tint={PLUM}
            onPress={() => admin.setArea(a.id)}
          />
        ))}
      </ScrollView>

      <View style={s.prog}>
        <View style={s.progHead}>
          <Text style={s.progLabel}>{PROG_LABEL}</Text>
          <Text style={s.progCount}>{`${admin.doneCount} מתוך ${admin.items.length}`}</Text>
        </View>
        <ProgressBar fill={admin.pct / 100} hue={PLUM.hue} height={8} />
        <View style={s.sums}>
          <View>
            <Text style={s.sumTag}>{EST_TAG}</Text>
            <Text style={s.estValue}>{`${nf(admin.estSum)} ₪`}</Text>
          </View>
          <View style={s.sumRule} />
          <View>
            <Text style={s.sumTag}>{ACT_TAG}</Text>
            <Text style={s.actValue}>{`${nf(admin.actSum)} ₪`}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={s.body} contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
        <ShopTable groups={admin.groups} onToggle={admin.toggle} onDrop={admin.drop} />
      </ScrollView>

      <Pressable
        onPress={admin.closeList}
        style={[s.close, { backgroundColor: admin.canClose ? '#C6B3EC' : 'rgba(130,112,162,0.11)' }]}
      >
        <Text style={[s.closeLabel, { color: admin.canClose ? '#43307A' : '#A79FB2' }]}>
          {CLOSE_LABEL}
        </Text>
        <Text style={[s.closeSub, { color: admin.canClose ? '#5B4794' : '#A79FB2' }]}>
          {admin.canClose
            ? `${CLOSE_SUB_PREFIX}${nf(admin.actSum)}${CLOSE_SUB_SUFFIX}`
            : CLOSE_SUB_NONE}
        </Text>
      </Pressable>

      {admin.addOpen ? <AddShopSheet admin={admin} /> : null}
    </AdminShell>
  );
}

const s = StyleSheet.create({
  areas: { gap: 6, paddingBottom: 2 },
  prog: {
    borderRadius: 20,
    padding: 14,
    gap: 9,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  progHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  progLabel: { fontSize: 12.5, fontWeight: '600', color: surface.inkSoft },
  progCount: { fontSize: 12.5, fontWeight: '500', color: surface.muted },
  sums: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  sumTag: { fontSize: 10.5, color: '#A79FB2' },
  estValue: { fontSize: 15, fontWeight: '600', color: surface.muted, marginTop: 1 },
  actValue: { fontSize: 15, fontWeight: '600', color: '#43307A', marginTop: 1 },
  sumRule: { width: 1, height: 26, backgroundColor: 'rgba(130,112,162,0.16)' },

  body: { flex: 1 },
  pad: { paddingBottom: 12 },
  close: {
    height: 52,
    borderRadius: 999,
    marginBottom: 106,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLabel: { fontSize: 15, fontWeight: '600' },
  closeSub: { fontSize: 11, fontWeight: '300' },
});
