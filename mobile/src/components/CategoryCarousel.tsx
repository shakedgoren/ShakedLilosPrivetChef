import React, { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import { CARD, CategoryCard } from './CategoryCard';
import type { Category } from '../data/categories';
import { space } from '../theme/tokens';

/**
 * קרוסלת הקטגוריות בדף הבית.
 *
 * ⚠ לא גלילה מקורית · בקנבס המסלול זז ב-transform, ולא ב-scroll.
 * הגלילה המקורית נשברה ב-RTL: `contentOffset.x` יוצא שלילי בדפדפן
 * (0 עד ‎-1419), האינדקס שחושב ממנו נחתך ל-0, ושורת הבועות שמתחת
 * לא התעדכנה אף פעם. המסלול המוזז פותר את זה בשתי הפלטפורמות.
 *
 * הסף להחלקה והמרווח בין הכרטיסים לקוחים מהקנבס.
 */

/** מרחק ההחלקה שממנו מחליפים כרטיס · SWIPE_MIN בקנבס */
const SWIPE_MIN = 45;
/** תזוזה קטנה מזו נחשבת ללחיצה ולא לגרירה · DRAG_SLOP בקנבס */
const DRAG_SLOP = 6;
/** המרחק בין מרכזי כרטיסים · רוחב הכרטיס ועוד המרווח */
const PITCH = CARD.width + CARD.gap;

/**
 * הכרטיס שאליו עוברים אחרי החלקה.
 * ⚠ ב-RTL הכרטיס הבא יושב משמאל · החלקה ימינה (dx חיובי) מושכת אותו
 * פנימה, בדיוק כמו dragEnd בקנבס. מיוצא כדי שאפשר יהיה לבדוק אותו.
 */
export function nextIndex(active: number, dx: number, count: number): number {
  const clamp = (n: number) => Math.max(0, Math.min(count - 1, n));
  if (dx > SWIPE_MIN) return clamp(active + 1);
  if (dx < -SWIPE_MIN) return clamp(active - 1);
  return active;
}

type Props = {
  items: Category[];
  active: number;
  onActiveChange: (next: number) => void;
  onOpen: (key: string) => void;
};

export function CategoryCarousel({ items, active, onActiveChange, onOpen }: Props) {
  const [dragDx, setDragDx] = useState(0);
  /* ה-ref מחזיק את הערך העדכני · ה-PanResponder נבנה פעם אחת */
  const activeRef = useRef(active);
  activeRef.current = active;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > DRAG_SLOP,
        onPanResponderMove: (_e, g) => setDragDx(g.dx),
        onPanResponderRelease: (_e, g) => {
          setDragDx(0);
          onActiveChange(nextIndex(activeRef.current, g.dx, items.length));
        },
        onPanResponderTerminate: () => setDragDx(0),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items.length],
  );

  return (
    <View style={s.window}>
      <Animated.View
        {...pan.panHandlers}
        style={[s.track, { transform: [{ translateX: active * PITCH + dragDx }] }]}
      >
        {items.map((c, i) => (
          <CategoryCard key={c.key} item={c} active={i === active} onPress={() => onOpen(c.key)} />
        ))}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  /* החלון גולש אל מחוץ לריפוד הדף · כמו margin שלילי בקנבס */
  window: { marginHorizontal: -18, paddingHorizontal: 18, paddingVertical: space.lg, overflow: 'hidden' },
  track: { flexDirection: 'row', gap: CARD.gap },
});
