import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { STOCK_SUB, STOCK_TABS, STOCK_TITLE } from '../data/adminStock';
import { AdminShell } from './ui/AdminShell';
import { Segmented } from './ui/Segmented';
import { SaleStock } from './stock/SalePanel';
import { SupplyStock } from './stock/SupplyStock';
import { AddItemSheet } from './stock/AddItemSheet';
import { useAdminStock } from './stock/useAdminStock';

export function AdminStockScreen() {
  const admin = useAdminStock();
  const isSale = admin.tab === 'sale';

  return (
    <AdminShell
      title={STOCK_TITLE}
      sub={isSale ? STOCK_SUB.sale : STOCK_SUB.supply}
      actions={isSale ? [] : [{ label: 'פריט', onPress: admin.openAdd, primary: true }]}
    >
      <Segmented tabs={STOCK_TABS} value={admin.tab} onChange={admin.setTab} />

      <ScrollView style={s.body} contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
        {isSale ? <SaleStock admin={admin} /> : <SupplyStock admin={admin} />}
      </ScrollView>

      {admin.addOpen ? <AddItemSheet admin={admin} /> : null}
    </AdminShell>
  );
}

const s = StyleSheet.create({
  body: { flex: 1 },
  pad: { paddingBottom: 120 },
});
