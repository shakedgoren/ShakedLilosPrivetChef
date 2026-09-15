import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { CARD, CategoryDeckCard } from './CategoryDeckCard';
import { DOT, DOT_OFF } from './CategoryCard';
import { SWIPE_SURFACE, useCategorySwipe } from './useCategorySwipe';
import type { Category } from '../data/categories';

/**
 * קרוסלת הקטגוריות בדף הבית · ״דק״.
 *
 * ⚠ **אינה מהקנבס** · שם המסלול זז הצידה וכל הכרטיסים באותו גודל.
 * שקד בחרה (15 בספטמבר 2026), אחרי חמישה סבבי תצוגות מקדימות,
 * בתנועה של אנימציית `Slideshow` מלוטי: הכרטיס הקדמי במרכז בגודל
 * מלא, והשכנים מציצים מאחוריו מוקטנים, מטושטשים ונמוגים.
 *
 * המספרים חולצו מקובץ הלוטי עצמו · שכן ב-64%, יציאה הצידה ודעיכה.
 * הטשטוש על השכנים הוא בחירה שלה, וכך גם המעבר הידני בלבד.
 */

/**
 * שתי מדרגות בלבד · הקדמי ושכן אחד מכל צד.
 * ⚠ הייתה כאן מדרגה שלישית (44% ואטימות 0.2), ואז נראו **ארבעה**
 * כרטיסים מטושטשים בבת אחת. שקד ביקשה אחד ראשי ושניים מאחוריו.
 */
const STEPS = [
  { x: 0, scale: 1, opacity: 1 },
  { x: 46, scale: 0.64, opacity: 0.45 },
] as const;

/** המעבר · אותו עקום של הלוטי */
const GLIDE_MS = 480;

/**
 * הצד שבו ממתינה הקטגוריה הבאה.
 * ⚠ **-1 · משמאל** · בחירה של שקד (15 בספטמבר 2026) מתוך השוואה
 * של שני הכיוונים. האצבע הולכת ימינה, והתוכן זז ימינה **איתה** —
 * הכרטיס החדש נכנס משמאל והישן יוצא ימינה, כמו דחיפת חפיסת קלפים.
 * קודם היה הפוך, והתוכן זז נגד האצבע.
 */
const NEXT_SIDE = -1;

/**
 * הטשטוש על השכנים · מה שמבליט את הקדמי.
 * ⚠ `filter` נתמך ב-React Native מגרסה 0.76. בדפדפן הוא נוחת
 * כמו שהוא ב-CSS. אם פלטפורמה כלשהי לא תתמוך — הכרטיס פשוט
 * יישאר חד, וההקטנה והדעיכה עדיין מבדילות אותו.
 */
const NEIGHBOUR_FILTER = { filter: 'blur(2.4px) saturate(0.72)' } as unknown as ViewStyle;

/** מקום לצל · 52px למטה בכרטיס הקדמי */
const SHADOW_ROOM = 30;
/**
 * ⚠ הרווח מתחת לנקודות · בלעדיו שורת הבועות עלתה על הנקודות.
 * נמדד בדפדפן: הן חפפו.
 */
const RAIL_GAP = 20;

type Props = {
  items: Category[];
  active: number;
  onActiveChange: (next: number) => void;
  onOpen: (key: string) => void;
};

export function CategoryCarousel({ items, active, onActiveChange, onOpen }: Props) {
  const n = items.length;

  /**
   * ⚠ **אין ניגון אוטומטי** · הכרטיסים מתחלפים רק בהחלקת אצבע,
   * בלחיצה על בועת הקטגוריה או על נקודה. בקשה מפורשת של שקד —
   * קרוסלה שרצה מעצמה נלחמת במי שמנסה לקרוא.
   */
  const pan = useCategorySwipe({
    active,
    count: n,
    onChange: onActiveChange,
    onDrag: () => {},
    onSettle: () => {},
  });

  return (
    <View style={[s.window, SWIPE_SURFACE]} pointerEvents="box-none">
      <View {...pan.panHandlers} style={s.deck}>
        {items.map((c, i) => {
          /* המרחק המחזורי מהמרכז · הדק מקיף */
          let d = i - active;
          if (d > n / 2) d -= n;
          if (d < -n / 2) d += n;
          const far = Math.min(Math.abs(d), STEPS.length - 1);
          const step = STEPS[far];
          const dir = d === 0 ? 0 : d > 0 ? 1 : -1;
          const on = d === 0;

          return (
            <View
              key={c.key}
              pointerEvents={on ? 'auto' : 'none'}
              style={[
                s.slot,
                !on && NEIGHBOUR_FILTER,
                {
                  opacity: Math.abs(d) >= STEPS.length ? 0 : step.opacity,
                  zIndex: 5 - far,
                  transform: [
                    { translateX: (NEXT_SIDE * dir * step.x * CARD.width) / 100 },
                    { scale: step.scale },
                  ],
                },
              ]}
            >
              <CategoryDeckCard item={c} active={on} onPress={() => onOpen(c.key)} />
            </View>
          );
        })}
      </View>

      {/* הנקודות · הפעילה רחבה ובגוון הקטגוריה, כמו בקנבס */}
      <View style={s.dots}>
        {items.map((c, i) => (
          <Pressable
            key={c.key}
            onPress={() => onActiveChange(i)}
            hitSlop={8}
            style={[
              s.dot,
              {
                width: i === active ? DOT.wide : DOT.size,
                backgroundColor: i === active ? items[active].hue : DOT_OFF,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  window: { alignItems: 'center', gap: 12, marginBottom: RAIL_GAP },
  deck: {
    width: '100%',
    height: CARD.height + SHADOW_ROOM,
    alignItems: 'center',
  },
  /**
   * ⚠ כל הכרטיסים באותו מקום · הדק מסודר ב-`transform` ולא בזרימה,
   * ולכן כל אחד מהם absolute במרכז. המעבר על שלושת המאפיינים יחד.
   */
  slot: {
    position: 'absolute',
    top: 0,
    width: CARD.width,
    transitionProperty: 'transform, opacity',
    transitionDuration: `${GLIDE_MS}ms`,
    transitionTimingFunction: 'cubic-bezier(0.22, 0.9, 0.28, 1)',
  } as unknown as ViewStyle,

  dots: { flexDirection: 'row', gap: DOT.gap },
  dot: { height: DOT.size, borderRadius: 999 },
});
