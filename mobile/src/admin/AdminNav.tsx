import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius } from '../theme/tokens';
import { LAV, SOFT_SHADOW } from './home/NightSky';
import { Bars, Calendar, Cart, Home, Receipt, type IconProps } from '../icons';
import { useNav, type Screen } from '../navigation/store';

/**
 * הנאב-בר של צד הניהול · ארבע לשוניות, בדיוק כמו בתחתית Admin.dc.html.
 * נפרד מהנאב-בר של הלקוחה — לשקד יש מסכים אחרים.
 *
 * ⚠ **נוספו האייקונים** · שקד ביקשה (15 בספטמבר 2026) נאב-בר עם
 * אייקונים ״בדיוק כמו בקנבס״. קודם היו כאן ארבע מילים בלבד בתוך
 * פס בגובה 68, ולכן הוא נראה ריק וגבוה. האייקונים והמידות כאן
 * הם אלה של הקנבס: 22 פיקסלים, רווח 4 מהכיתוב, ולשונית בגובה 56.
 */

const ON = LAV.accent;
const OFF = LAV.faint;
const ICON = 22;

/**
 * ⚠ **חמש לשוניות** · שקד ביקשה (15 בספטמבר 2026) בית · קניות ·
 * ימי מכירה · הזמנות · כספים. ״מלאי״ ירד מכאן ועבר לאריחים בדף
 * הבית, וקניות וימי מכירה עלו לכאן מהאריחים.
 */
const TABS: { key: Screen; label: string; Icon: (p: IconProps) => React.JSX.Element }[] = [
  { key: 'admin', label: 'בית', Icon: Home },
  { key: 'adminShopping', label: 'קניות', Icon: Cart },
  { key: 'adminDays', label: 'ימי מכירה', Icon: Calendar },
  { key: 'adminOrders', label: 'הזמנות', Icon: Receipt },
  { key: 'adminMoney', label: 'כספים', Icon: Bars },
];

export function AdminNav() {
  const { screen, go } = useNav();
  return (
    <View style={s.bar}>
      {TABS.map(({ key, label, Icon }) => {
        const on = screen === key;
        return (
          <Pressable key={key} onPress={() => go(key)} style={[s.tab, on && s.tabOn]}>
            {/* ⚠ עובי הקו משתנה עם המצב · 2 בפעילה ו-1.7 בשאר, כמו בקנבס */}
            <Icon size={ICON} color={on ? ON : OFF} strokeWidth={on ? 2 : 1.7} />
            <Text style={[s.label, { color: on ? ON : OFF, fontWeight: on ? '700' : '400' }]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 26,
    right: 18,
    left: 18,
    height: 68,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    boxShadow: SOFT_SHADOW,
    elevation: 8,
    zIndex: 20,
  } as never,
  /* ⚠ צר יותר · חמש לשוניות במקום ארבע, ו-52+12 לא נכנסו */
  tab: {
    minWidth: 44,
    height: 56,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabOn: { backgroundColor: LAV.pill },
  label: { fontSize: 10.5 },
});
