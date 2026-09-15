import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { STOCK_SUB, STOCK_TITLE } from '../data/adminStock';
import { AdminShell } from './ui/AdminShell';
import { SupplyStock } from './stock/SupplyStock';
import { AddItemSheet } from './stock/AddItemSheet';
import { useAdminStock } from './stock/useAdminStock';
import { Plus, Refresh } from '../icons';

/**
 * מלאי · **לוגיסטי בלבד**.
 *
 * ⚠ **לשונית ״מלאי מכירה״ ירדה** · שקד ביקשה (15 בספטמבר 2026)
 * להסיר אותה: המכסות מתעדכנות ממילא במסך ימי מכירה, ושתי דרכים
 * לאותו נתון הן כפילות שמזמינה סתירה. מה שהיה שם עבר לשם —
 * גם המכסות וגם הורדת מנות שהתקלקלו.
 */
export function AdminStockScreen() {
  const admin = useAdminStock();

  return (
    <AdminShell
      title={STOCK_TITLE}
      sub={STOCK_SUB.supply}
      /* ⚠ אייקונים ולא מילים · ״+״ להוספה ואייקון ביטול להחזרת
         פריט שנמחק בטעות. בקשה של שקד (15 בספטמבר 2026). */
      actions={[
        { label: 'ביטול מחיקה', onPress: admin.undoDrop, icon: Refresh, off: !admin.canUndo },
        { label: 'פריט', onPress: admin.openAdd, icon: Plus, primary: true },
      ]}
    >
      <ScrollView style={s.body} contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
        <SupplyStock admin={admin} />
      </ScrollView>

      {admin.addOpen ? <AddItemSheet admin={admin} /> : null}
    </AdminShell>
  );
}

const s = StyleSheet.create({
  body: { flex: 1 },
  pad: { paddingBottom: 120 },
});
