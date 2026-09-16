import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { radius } from '../theme/tokens';
import { LAV, SOFT_SHADOW } from './home/NightSky';
import { INDIGO_70, S, type SYM } from '../components/Sym';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
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
/** ⚠ SF Symbols · בקשה של שקד (16 בספטמבר 2026) */
const TABS: { key: Screen; label: string; sym: keyof typeof SYM }[] = [
  { key: 'admin', label: 'בית', sym: 'home' },
  { key: 'adminShopping', label: 'קניות', sym: 'shopping' },
  { key: 'adminDays', label: 'ימי מכירה', sym: 'saleDays' },
  { key: 'adminOrders', label: 'הזמנות', sym: 'orders' },
  { key: 'adminMoney', label: 'כספים', sym: 'money' },
];

/**
 * ⚠ **Liquid Glass אמיתי · 16 בספטמבר 2026** · בקשה של שקד:
 * ״גם להתאים את הנאב בר להיות של ממש׳ ios בתצורה liqueed glass עם
 * כל התכונות שלו״ — בדיוק כמו שכבר נעשה בצד הלקוחה.
 * `expo-glass-effect` חושף את הזכוכית **של המערכת**, עם השבירה
 * וההשתקפות, ו-`isInteractive` מגיב למגע.
 * ⚠ **דורש iOS 26** · מתחתיו נשאר בדיוק הפס הלבן שהיה.
 */
const GLASS_TINT = 'rgba(255,255,255,0.18)';

export function AdminNav() {
  const { screen, go } = useNav();

  const tabs = TABS.map(({ key, label, sym }) => {
    const on = screen === key;
    return (
      <Pressable key={key} onPress={() => go(key)} style={[s.tab, on && s.tabOn]}>
        {/* ⚠ עובי הקו משתנה עם המצב · 2 בפעילה ו-1.7 בשאר, כמו בקנבס */}
        <S k={sym} size={ICON} color={on ? ON : INDIGO_70} />
        <Text style={[s.label, { color: on ? ON : OFF, fontWeight: on ? '700' : '400' }]}>
          {label}
        </Text>
      </Pressable>
    );
  });

  if (isLiquidGlassAvailable()) {
    return (
      <GlassView style={[s.bar, s.glass]} glassEffectStyle="regular" isInteractive tintColor={GLASS_TINT}>
        {tabs}
      </GlassView>
    );
  }

  return <View style={s.bar}>{tabs}</View>;
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
  /* ⚠ הזכוכית מביאה רקע וצל משלה · המילוי והצל שלנו יורדים */
  glass: { backgroundColor: 'transparent', boxShadow: undefined, elevation: 0 } as never,
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
  label: { fontSize: 12 },
});
