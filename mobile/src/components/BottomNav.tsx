import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { radius, type } from '../theme/tokens';
import { INDIGO_70, S, type SYM } from './Sym';
import { useNav } from '../navigation/store';

/**
 * סרגל הניווט התחתון · מופיע אך ורק כשהמשתמשת מחוברת,
 * בדיוק כמו בקנבס. כשלא מחוברים הוא לא מרונדר בכלל.
 *
 * ⚠ **עיצוב ״גלולה״ · נבחר ב-16 בספטמבר 2026** · שקד ראתה את עיצוב
 * המגרעת (האייקון הפעיל שיוצא לעיגול מרחף) על המכשיר, לא אהבה, וקיבלה
 * חמש אפשרויות חדשות. היא בחרה את ״גלולה״: גלולה לבנה מרחפת, והלשונית
 * הפעילה מקבלת כרית סגולה רכה מאחוריה.
 *
 * ⚠ **בלי SVG** · כל הצורה היא `View` עם `borderRadius` — אין כאן
 * מגרעת ואין עיגול מרחף, ולכן אין צורך במסלול מצויר.
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

/* צבעי הלשונית · הפעילה סגולה ועבה יותר */
const ON_INK = '#7B5CBC';
const OFF_INK = '#918A9E';
/** הכרית מאחורי הלשונית הפעילה */
const CUSHION = 'rgba(123,92,188,0.14)';
/**
 * ⚠ **לבן כמעט אטום** · זכוכית הקנבס (0.66) נעלמת מעל רצועת
 * התמונות בדף הבית. נמדד בפיקסלים ב-16 בספטמבר 2026.
 */
const BAR_BG = 'rgba(255,255,255,0.95)';
const BAR_SHADOW =
  'inset 0 0 0 1px rgba(255,255,255,0.9), 0 12px 26px -18px rgba(96,80,132,0.6)';

export function BottomNav() {
  const { screen, loggedIn, go } = useNav();
  if (!loggedIn) return null;

  return (
    <View style={s.bar}>
      {TABS.map((t) => {
        const on = screen === t.key;
        return (
          <Pressable key={t.key} onPress={() => go(t.key)} style={s.tab}>
            {/* הכרית · מאחורי האייקון והכיתוב, לא מסביב ללשונית כולה */}
            {on ? <View style={s.cushion} /> : null}
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
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: BAR_BG,
    boxShadow: BAR_SHADOW,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 8,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  /* ⚠ מרחפת מאחור · `inset` כדי שתתפוס את כל הלשונית פחות מרווח */
  cushion: {
    position: 'absolute',
    top: 7,
    bottom: 7,
    right: 8,
    left: 8,
    borderRadius: radius.pill,
    backgroundColor: CUSHION,
  },
  label: { fontSize: type.tiny },
});
