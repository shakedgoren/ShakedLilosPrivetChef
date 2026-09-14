import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Masthead } from '../components/Masthead';
import { CategoryCarousel } from '../components/CategoryCarousel';
import { CategoryRail } from '../components/CategoryRail';
import { PhotoReel, REEL_BOTTOM } from '../components/PhotoReel';
import { BAR_BOTTOM_WITH_NAV } from '../components/BottomNav';
import { PrimaryButton } from '../components/PrimaryButton';
import { GlassFill } from '../components/Glass';
import { CATEGORIES } from '../data/categories';
import { radius, space, surface, type } from '../theme/tokens';
import { GLASS_SHADOW, GLASS_STOPS } from '../theme/glass';
import { useNav, type Screen } from '../navigation/store';

/** הכיתוב על כפתור הכניסה · שקד ביקשה את הנוסח הזה */
const CTA_LABEL = 'להתחברות והזמנה';

/**
 * המכירה הקרובה · הכיתוב מוטבע בקנבס (`Main.dc.html`, שורה 57).
 * ⚠ `screen` ו-`open` נוספו כאן · בקנבס השורה אינה לחיצה. שקד ביקשה
 * שלחיצה על מכירה פתוחה תעביר לדף ההזמנה של אותה קטגוריה.
 * ⚠ הערכים עדיין לא מגיעים מהשרת · כשיהיה מקור אמת ליום המכירה
 * הקרוב, שלושת השדות האלה מוחלפים בו.
 */
/**
 * המרווח שמחליף את גוש הכפתור אחרי ההתחברות · בקשה של שקד.
 * ⚠ לא מהקנבס.
 */
const RAIL_GAP = 26;

/**
 * תחתית הדף אחרי ההתחברות.
 * ⚠ היה 120, ועם ה-40 של רצועת התמונות נוצרו 160 פיקסלים של
 * ״שטח מת״ שאפשר לגלול אליהם. הנאב-בר תופס 94 מהתחתית, ולכן
 * `BAR_BOTTOM_WITH_NAV` פחות ה-40 של הרצועה הוא בדיוק מה שצריך.
 */
const HOME_PAD_NAV = BAR_BOTTOM_WITH_NAV - REEL_BOTTOM;

const NEXT_SALE = {
  label: 'שלישי 25.8 · קוסקוס',
  stock: 'ניתן להזמין',
  screen: 'cous' as Screen,
  open: true,
};

/**
 * דף הבית · משמש גם לפני ההתחברות וגם אחריה.
 * ההבדל היחיד: לפני התחברות מוצג כפתור הכניסה,
 * אחרי התחברות מוצגת תיבת המכירה הקרובה — כמו בקנבס.
 */
export function HomeScreen() {
  const { loggedIn, go } = useNav();
  const [active, setActive] = useState(0);

  return (
    <ScrollView
      style={s.page}
      contentContainerStyle={[s.content, { paddingBottom: loggedIn ? HOME_PAD_NAV : 0 }]}
      showsVerticalScrollIndicator={false}
    >
      <Masthead />

      {loggedIn && (
        <Pressable
          disabled={!NEXT_SALE.open}
          onPress={() => go(NEXT_SALE.screen)}
          style={s.sale}
        >
          <GlassFill stops={GLASS_STOPS} radius={radius.field} />
          <Text style={s.saleTitle}>{NEXT_SALE.label}</Text>
          <View style={s.grow} />
          <View style={s.dot} />
          <Text style={s.saleStock}>{NEXT_SALE.stock}</Text>
        </Pressable>
      )}

      <CategoryCarousel
        items={CATEGORIES}
        active={active}
        onActiveChange={setActive}
        onOpen={(key) => go(key as Screen)}
      />

      <CategoryRail items={CATEGORIES} active={active} onActiveChange={setActive} />

      {!loggedIn && (
        <View style={s.cta}>
          <PrimaryButton label={CTA_LABEL} onPress={() => go('login')} />
        </View>
      )}

      {/* ⚠ לפני התחברות גוש הכפתור מפריד בין הקטגוריות לרצועה.
          אחריה אין כפתור, ולכן שקד ביקשה מרווח במקומו. */}
      {loggedIn && <View style={s.railGap} />}

      {/* רצועת התמונות · בקנבס היא יושבת מתחת לכפתורים */}
      <PhotoReel />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1 },
  content: { paddingHorizontal: space.lg, paddingTop: space.xxl },

  sale: {
    height: 46,
    borderRadius: radius.field,
    paddingHorizontal: 14,
    marginTop: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: 1,
    borderColor: surface.glassEdge,
    boxShadow: GLASS_SHADOW,
    overflow: 'hidden',
  },
  saleTitle: { fontSize: 13, fontWeight: '600', color: surface.ink },
  grow: { flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#437C59' },
  saleStock: { fontSize: type.label, color: '#437C59' },

  cta: { alignItems: 'center', paddingTop: 30, paddingBottom: 18 },
  railGap: { height: RAIL_GAP },
});
