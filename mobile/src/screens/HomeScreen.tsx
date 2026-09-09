import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Masthead } from '../components/Masthead';
import { CategoryCarousel } from '../components/CategoryCarousel';
import { CategoryRail } from '../components/CategoryRail';
import { PhotoReel } from '../components/PhotoReel';
import { PrimaryButton } from '../components/PrimaryButton';
import { GlassFill } from '../components/Glass';
import { CATEGORIES } from '../data/categories';
import { radius, space, surface, type } from '../theme/tokens';
import { GLASS_SHADOW, GLASS_STOPS } from '../theme/glass';
import { useNav, type Screen } from '../navigation/store';

/** הכיתוב על כפתור הכניסה · שקד ביקשה את הנוסח הזה */
const CTA_LABEL = 'להתחברות והזמנה';

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
      contentContainerStyle={[s.content, { paddingBottom: loggedIn ? 120 : 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <Masthead />

      {loggedIn && (
        <View style={s.sale}>
          <GlassFill stops={GLASS_STOPS} radius={radius.field} />
          <Text style={s.saleTitle}>שלישי 25.8 · קוסקוס</Text>
          <View style={s.grow} />
          <View style={s.dot} />
          <Text style={s.saleStock}>ניתן להזמין</Text>
        </View>
      )}

      <CategoryCarousel
        items={CATEGORIES}
        active={active}
        onActiveChange={setActive}
        onOpen={(key) => go(key as Screen)}
      />

      <CategoryRail items={CATEGORIES} activeKey={CATEGORIES[active].key} onPick={setActive} />

      {!loggedIn && (
        <View style={s.cta}>
          <PrimaryButton label={CTA_LABEL} onPress={() => go('login')} />
        </View>
      )}

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
});
