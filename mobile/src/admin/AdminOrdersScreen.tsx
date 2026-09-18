import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { surface } from '../theme/tokens';
import { CANCELLED, HUES, ORDERS_SUBTITLE } from '../data/adminOrders';
import { AdminShell, KpiRow } from './ui/AdminShell';
import { BOARD_LABEL } from '../data/adminOrders';
import { useNav } from '../navigation/store';
import { Chip } from './ui/Chip';
import { OrderCard } from './OrderCard';
import { CancelSheet } from './CancelSheet';
import { NewOrderSheet } from './NewOrderSheet';
import { SentNotice } from './SentNotice';
import { RollSheet } from './RollSheet';
import { useAdminOrders } from './useAdminOrders';
import { Calendar, Clock, Plus } from '../icons';
import { upcomingSale } from '../data/saleWeek';

const ALL = 'הכל';
const COUS = HUES.cous;

/**
 * לשוניות הסינון · בדיוק חמש, לפי בקשה של שקד (15 בספטמבר 2026):
 * הכל · חדשה · בהכנה · מוכנה · נמסרה.
 *
 * ⚠ **״בוטלה״ אינה לשונית** · שקד ביקשה (15 בספטמבר 2026) ״נמסרה״
 * במקומה. הזמנה מבוטלת עדיין קיימת ונראית תחת ״הכל״.
 * ⚠ **״מאושרת״ אינה לשונית** · היא עדיין מצב חוקי בשרת
 * (`KITCHEN_FLOW`), ולכן הזמנה במצב הזה נראית תחת ״הכל״ בלבד.
 * אם היא לא נחוצה יותר — צריך להוריד אותה גם מהשרת.
 */
const TABS = [ALL, 'חדשה', 'בהכנה', 'מוכנה', 'נמסרה'];

export function AdminOrdersScreen() {
  const { go } = useNav();
  const admin = useAdminOrders();

  /**
   * ⚠ **רק המכירה הנוכחית · 18 בספטמבר 2026** · בקשה של שקד:
   * ״בעמוד ההזמנות לראות רק את ההזמנות הפתוחות שקשורות לאותה המכירה
   * הנוכחית. את כל השאר שיהיו בהיסטוריית הזמנות״.
   *
   * ⚠ **נגזר ולא נשאל מהשרת** · `upcomingSale` כבר מחזיק את הקטגוריה
   * ואת התאריך, וזה אותו מקור שמזין את לוח יום המכירה. שאילתה נוספת
   * הייתה יכולה להחזיר תאריך אחר ולפצל את שני המסכים.
   */
  const sale = React.useMemo(() => upcomingSale(new Date()), []);

  /**
   * ⚠ **הזמנה בלי תאריך נחשבת למכירה הנוכחית** · הזמנות הקנבס
   * ומצב ההדגמה אינן נושאות `saleDate`, ובלי הנפילה הזו המסך היה
   * נראה ריק לגמרי בלי שרת.
   */
  const dayOf = (o: { saleDate?: string }) => o.saleDate ?? sale.date;

  const every = admin.allOrders.map((o, i) => ({ o, i, status: admin.statusOf(i) }));
  const all = every.filter((x) => dayOf(x.o) === sale.date);

  /**
   * ⚠ **הזמנות פתוחות ממכירה קודמת · החלטה שלי, לא בקשה** · סינון
   * קפדני למכירה הנוכחית היה **מעלים** הזמנה משלישי שעדיין לא נמסרה
   * ברגע שהמכירה הבאה היא שישי — כלומר עבודה שנופלת בין הכיסאות.
   * לכן היא מופיעה כאן בנפרד ובכותרת משלה. להסרה — מחיקת הגוש.
   */
  const stale = every.filter(
    (x) => dayOf(x.o) !== sale.date && x.status !== CANCELLED && x.status !== 'נמסרה',
  );

  const shown = admin.tab === ALL ? all : all.filter((x) => x.status === admin.tab);

  const live = all.filter((x) => x.status !== CANCELLED);
  const kpis = [
    { k: 'הזמנות במכירה', v: all.length, fg: surface.ink },
    { k: 'עוד לא נמסרו', v: live.filter((x) => x.status !== 'נמסרה').length, fg: '#A65E2A' },
    { k: 'מחזור נוכחי', v: live.reduce((s, x) => s + x.o.sum, 0), fg: COUS.deep },
  ];

  const [staleOpen, setStaleOpen] = React.useState(false);

  const cancelTarget = admin.cancelling >= 0 ? admin.allOrders[admin.cancelling] : null;

  return (
    <AdminShell
      title="הזמנות"
      sub={ORDERS_SUBTITLE}
      /* ⚠ **אייקונים ולא מילים** · בקשה של שקד (15 בספטמבר 2026):
         ״+״ להזמנה ידנית, ואייקון ימי המכירה ללוח. המילים נשארות
         כשמות הנגישות. שני עיגולים של 38 נכנסים בשורת הכותרת
         בלי לדרוס אותה, מה שהגלולות הרחבות לא יכלו. */
      actions={[
        /* ⚠ השער להיסטוריה · אותו דפוס של אייקון השעון במסך הקניות */
        { label: 'היסטוריית הזמנות', onPress: () => go('adminOrderHistory'), icon: Clock },
        { label: BOARD_LABEL, onPress: () => go('adminBoard'), icon: Calendar },
        { label: 'הזמנה ידנית', onPress: admin.openNew, icon: Plus, primary: true },
      ]}
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
              key={x.o.id ?? x.i}
              order={x.o}
              status={x.status}
              isOpen={admin.open === x.i}
              note={admin.noteOf(x.i)}
              flow={admin.flow}
              onToggle={() => admin.toggle(x.i)}
              onAdvance={() => admin.advance(x.i)}
              onCancel={() => admin.askCancel(x.i)}
            />
          ))
        )}
        {/* ⚠ הזמנות פתוחות ממכירה קודמת · ראו ההערה ליד `stale` ·
            **מקופל כברירת מחדל** כדי שהמסך יישאר ״רק המכירה
            הנוכחית״ כפי שביקשה, בלי לאבד עבודה פתוחה. */}
        {stale.length > 0 ? (
          <>
            <Pressable
              onPress={() => setStaleOpen((v) => !v)}
              accessibilityRole="button"
              accessibilityState={{ expanded: staleOpen }}
              style={s.staleHead}
            >
              <Text style={s.staleText}>
                {staleOpen ? '▾' : '▸'}  פתוחות ממכירות קודמות · {stale.length}
              </Text>
            </Pressable>
            {staleOpen && stale.map((x) => (
              <OrderCard
                key={x.o.id ?? x.i}
                order={x.o}
                status={x.status}
                isOpen={admin.open === x.i}
                note={admin.noteOf(x.i)}
                flow={admin.flow}
                onToggle={() => admin.toggle(x.i)}
                onAdvance={() => admin.advance(x.i)}
                onCancel={() => admin.askCancel(x.i)}
              />
            ))}
          </>
        ) : null}
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

      {/* ⚠ אישור שהודעת הוואטסאפ יצאה ללקוח · בקשה של שקד */}
      <SentNotice who={admin.notified} onClose={admin.clearNotified} />

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
  staleHead: { marginTop: 14, marginBottom: 2, paddingVertical: 6 },
  staleText: { fontSize: 13, fontWeight: '600', color: '#A65E2A', textAlign: 'center' },
  tabs: { flexDirection: 'row', gap: 6 },
  tab: { flex: 1 },
  list: { flex: 1 },
  listPad: { gap: 9, paddingBottom: 120 },
  empty: { fontSize: 16, fontWeight: '500', color: '#A79FB2', textAlign: 'center', marginTop: 60 },
});
