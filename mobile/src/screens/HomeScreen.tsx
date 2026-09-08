import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Masthead } from '../components/Masthead';
import { CARD, CategoryCard } from '../components/CategoryCard';
import { CategoryRail } from '../components/CategoryRail';
import { CATEGORIES } from '../data/categories';
import { radius, space, surface, type } from '../theme/tokens';
import { useNav, type Screen } from '../navigation/store';

/**
 * דף הבית · משמש גם לפני ההתחברות וגם אחריה.
 * ההבדל היחיד: לפני התחברות מוצגים שני כפתורי הכניסה,
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
          <Text style={s.saleTitle}>שלישי 25.8 · קוסקוס</Text>
          <View style={s.grow} />
          <View style={s.dot} />
          <Text style={s.saleStock}>ניתן להזמין</Text>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD.width + CARD.gap}
        decelerationRate="fast"
        contentContainerStyle={s.track}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / (CARD.width + CARD.gap));
          setActive(Math.max(0, Math.min(CATEGORIES.length - 1, i)));
        }}
      >
        {CATEGORIES.map((c, i) => (
          <CategoryCard key={c.key} item={c} active={i === active} onPress={() => go(c.key as Screen)} />
        ))}
      </ScrollView>

      <CategoryRail items={CATEGORIES} activeKey={CATEGORIES[active].key} onPick={setActive} />

      {!loggedIn && (
        <View style={s.cta}>
          <Pressable onPress={() => go('signup')} style={[s.btn, s.btnGo]}>
            <Text style={s.btnGoText}>מתחילים את המסע</Text>
          </Pressable>
          <Pressable onPress={() => go('login')} style={[s.btn, s.btnPlain]}>
            <Text style={s.btnPlainText}>להתחברות</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: surface.ground },
  content: { paddingHorizontal: space.lg, paddingTop: space.xxl },
  track: { gap: CARD.gap, paddingVertical: space.lg },

  sale: {
    height: 46,
    borderRadius: radius.field,
    paddingHorizontal: 14,
    marginTop: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: 'rgba(255,255,255,0.66)',
    borderWidth: 1,
    borderColor: surface.glassEdge,
  },
  saleTitle: { fontSize: 13, fontWeight: '600', color: surface.ink },
  grow: { flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#437C59' },
  saleStock: { fontSize: type.label, color: '#437C59' },

  cta: { alignItems: 'center', gap: space.md, paddingTop: 30 },
  btn: {
    width: 250,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGo: { backgroundColor: '#BCA7E6' },
  btnGoText: { fontSize: 20, fontWeight: '600', color: '#FFFFFF' },
  btnPlain: { backgroundColor: '#FFFFFF' },
  btnPlainText: { fontSize: 20, fontWeight: '600', color: '#6E6480' },
});
