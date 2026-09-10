import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { CARD, CategoryCard } from './CategoryCard';
import { SWIPE_SURFACE, useCategorySwipe } from './useCategorySwipe';
import type { Category } from '../data/categories';

/**
 * קרוסלת הקטגוריות בדף הבית.
 *
 * ⚠ לא גלילה מקורית · בקנבס המסלול זז ב-transform, ולא ב-scroll.
 * הגלילה המקורית נשברה ב-RTL: `contentOffset.x` יוצא שלילי בדפדפן
 * (0 עד ‎-1419), האינדקס שחושב ממנו נחתך ל-0, ושורת הבועות שמתחת
 * לא התעדכנה אף פעם. המסלול המוזז פותר את זה בשתי הפלטפורמות.
 *
 * ⚠ אין כאן `overflow: hidden` · הכרטיס הפעיל נושא הילה של 40px
 * וצל של 44px, והחלון החתוך גזר אותם מלמעלה ומלמטה. הכרטיסים
 * הרדומים נחתכים ממילא בקצה המסך על ידי גלילת הדף.
 */

/** המרחק בין מרכזי כרטיסים · רוחב הכרטיס ועוד המרווח */
const PITCH = CARD.width + CARD.gap;
/** מעבר הכרטיס · 560ms בקנבס */
const GLIDE_MS = 560;
/**
 * מקום לזוהר · הצל הארוך של הכרטיס הפעיל הוא 0 22px 44px,
 * וההילה 40px. בלי הריפוד הזה הם נחתכים בקצה הרכיב.
 */
const GLOW_ROOM = 46;

type Props = {
  items: Category[];
  active: number;
  onActiveChange: (next: number) => void;
  onOpen: (key: string) => void;
};

export function CategoryCarousel({ items, active, onActiveChange, onOpen }: Props) {
  /* מיקום המסלול · ערך אנימציה אחד שגם הגרירה וגם המעבר כותבים אליו */
  const x = useRef(new Animated.Value(active * PITCH)).current;

  const glideTo = useCallback(
    (index: number) => {
      Animated.timing(x, {
        toValue: index * PITCH,
        duration: GLIDE_MS,
        useNativeDriver: true,
      }).start();
    },
    [x],
  );

  useEffect(() => glideTo(active), [active, glideTo]);

  const pan = useCategorySwipe({
    active,
    count: items.length,
    onChange: onActiveChange,
    onDrag: (dx) => x.setValue(active * PITCH + dx),
    onSettle: glideTo,
  });

  return (
    <View style={[s.window, SWIPE_SURFACE]}>
      <Animated.View {...pan.panHandlers} style={[s.track, { transform: [{ translateX: x }] }]}>
        {items.map((c, i) => (
          <CategoryCard key={c.key} item={c} active={i === active} onPress={() => onOpen(c.key)} />
        ))}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  /* החלון גולש אל מחוץ לריפוד הדף · כמו margin שלילי בקנבס */
  window: {
    marginHorizontal: -18,
    paddingHorizontal: 18,
    paddingVertical: GLOW_ROOM,
  },
  track: { flexDirection: 'row', gap: CARD.gap },
});
