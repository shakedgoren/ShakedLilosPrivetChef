import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, type } from '../theme/tokens';
import { NAV_EDGE, NAV_SHADOW, NAV_STOPS } from '../theme/glass';
import { GlassFill } from './Glass';
import { INDIGO_70, S, type SYM } from './Sym';
import { useNav } from '../navigation/store';

/**
 * סרגל הניווט התחתון · מופיע אך ורק כשהמשתמשת מחוברת,
 * בדיוק כמו בקנבס. כשלא מחוברים הוא לא מרונדר בכלל.
 */
/**
 * ⚠ **SF Symbols** · בקשה של שקד (16 בספטמבר 2026), עם התנועה
 * שהיא הגדירה לכל אחד. ראו `Sym.tsx` למה נתמך ומה קירוב.
 */
const TABS = [
  { key: 'main', label: 'בית', sym: 'home' },
  { key: 'orders', label: 'הזמנות', sym: 'orders' },
  { key: 'profile', label: 'אזור אישי', sym: 'personalArea' },
] as const satisfies readonly { key: string; label: string; sym: keyof typeof SYM }[];

/**
 * המרווח שמסך עם שורה תחתונה חייב להשאיר לנאב-בר.
 * מהקנבס (`Order.dc.html`): הנאב יושב ב-`bottom: 26` בגובה 68,
 * ושורת הסה״כ יושבת ב-`bottom: 102` — שמונה פיקסלים מעליו.
 * ⚠ בלי זה הנאב עולה על שורת הסה״כ ועל כפתור ההמשך, ואי אפשר
 * ללחוץ עליו. שקד דיווחה על זה ב-14 בספטמבר.
 */
export const BAR_BOTTOM_WITH_NAV = 102;

/**
 * ריפוד תחתון לאזור גלילה שממשיך עד תחתית המסך.
 * ⚠ בלי זה התוכן האחרון נחתך מתחת לנאב-בר ואי אפשר ללחוץ עליו.
 */
export const SCROLL_PAD_NAV = BAR_BOTTOM_WITH_NAV;

/* צבעי הלשונית · מהקנבס · הפעילה סגולה ועבה יותר */
const ON_INK = '#7B5CBC';
const OFF_INK = '#918A9E';
const ON_STROKE = 2;
const OFF_STROKE = 1.7;

export function BottomNav() {
  const { screen, loggedIn, go } = useNav();
  if (!loggedIn) return null;

  return (
    <View style={s.bar}>
      <GlassFill stops={NAV_STOPS} radius={radius.pill} />
      {TABS.map((t) => {
        const on = screen === t.key;
        return (
          <Pressable key={t.key} onPress={() => go(t.key)} style={[s.tab, on && s.tabOn]}>
            {/* ⚠ הלשונית הפעילה מקבלת את האינדיגו המלא · הרדומה שקופה יותר */}
            <S k={t.sym} size={22} color={on ? ON_INK : INDIGO_70} />
            <Text style={[s.label, { color: on ? ON_INK : OFF_INK, fontWeight: on ? '700' : '400' }]}>
              {t.label}
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
    borderWidth: 1,
    borderColor: NAV_EDGE,
    boxShadow: NAV_SHADOW,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  tab: {
    minWidth: 62,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabOn: { backgroundColor: 'rgba(155,127,212,0.13)' },
  label: { fontSize: type.tiny },
});
