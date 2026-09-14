import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { CategoryCard, CARD, DOT, DOT_OFF, type Dot } from './CategoryCard';
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
/**
 * ⚠ לא מהקנבס · שקד ביקשה לצמצם את הרווח מעל הכרטיס (מהכיתוב
 * ״אוכל ביתי · ארוחות שף · עמדת טאבון״) ומתחתיו (לשורת הקטגוריות).
 * הריפוד של GLOW_ROOM נשאר כדי שהצל וההילה לא ייחתכו, והמרווח
 * הנראה מצטמצם במרג׳ין שלילי.
 * נמדד: מעל 58→44→32, מתחת 46→32.
 */
const TIGHTEN_TOP = 26;
const TIGHTEN_BOTTOM = 14;

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

  /* הנקודות זהות בכל הכרטיסים · מחושבות פעם אחת, בדיוק כמו בקנבס */
  const dots: Dot[] = items.map((_, i) => ({
    w: i === active ? DOT.wide : DOT.size,
    bg: i === active ? items[active].hue : DOT_OFF,
  }));

  return (
    /* ⚠ box-none · לחלון יש ריפוד של GLOW_ROOM ומרג׳ין שלילי, ולכן
       הוא מכסה את שורת המכירה שמעליו. בלי זה הוא בולע את הלחיצות
       עליה — נמדד: אף נקודה בשורה לא הגיעה אליה. המחוות ממילא
       יושבות על המסלול הפנימי, אז החלון עצמו לא צריך מגע. */
    <View style={[s.window, SWIPE_SURFACE]} pointerEvents="box-none">
      <Animated.View {...pan.panHandlers} style={[s.track, { transform: [{ translateX: x }] }]}>
        {items.map((c, i) => (
          <CategoryCard
            key={c.key}
            item={c}
            active={i === active}
            dots={dots}
            onPress={() => onOpen(c.key)}
          />
        ))}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  /* החלון גולש אל מחוץ לריפוד הדף · כמו margin שלילי בקנבס */
  window: {
    marginHorizontal: -18,
    marginTop: -TIGHTEN_TOP,
    marginBottom: -TIGHTEN_BOTTOM,
    paddingHorizontal: 18,
    paddingVertical: GLOW_ROOM,
  },
  track: { flexDirection: 'row', gap: CARD.gap },
});
