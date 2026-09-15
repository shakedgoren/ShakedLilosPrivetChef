import React from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
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
 * שלוש מדרגות · הקדמי, שכן מכל צד, ומדרגת המתנה **שקופה לגמרי**.
 *
 * ⚠ **המדרגה השלישית קיימת רק בשביל התנועה** · עם שתי מדרגות
 * בלבד, כרטיס במרחק 2 ישב באותו x של מרחק 1 — ולכן כשהוא נכנס
 * פנימה הוא רק דהה במקום, בלי לזוז. התוצאה: התנועה נראתה
 * **רק בצד אחד**, וזה מה ששקד דיווחה (16 בספטמבר 2026).
 * האטימות שלה 0, ולכן היא אינה מוסיפה כרטיס נראה — בניגוד
 * לניסיון קודם שבו היא הייתה 0.2 ונראו ארבעה כרטיסים יחד.
 *
 * ⚠ **השכנים גדלו** · 0.70 במקום 0.64, ו-44% במקום 46% — בקשה
 * של שקד לנוכחות גדולה יותר, ועדיין נשארים בתוך רוחב המסך.
 */
const STEPS = [
  { x: 0, scale: 1, opacity: 1 },
  { x: 44, scale: 0.7, opacity: 0.45 },
  { x: 76, scale: 0.55, opacity: 0 },
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

/** המצב החזותי של כרטיס לפי מרחקו מהמרכז */
function targetOf(i: number, active: number, n: number) {
  let d = i - active;
  if (d > n / 2) d -= n;
  if (d < -n / 2) d += n;
  const far = Math.min(Math.abs(d), STEPS.length - 1);
  const step = STEPS[far];
  const dir = d === 0 ? 0 : d > 0 ? 1 : -1;
  return {
    d,
    far,
    on: d === 0,
    x: (NEXT_SIDE * dir * step.x * CARD.width) / 100,
    scale: step.scale,
    opacity: Math.abs(d) >= STEPS.length ? 0 : step.opacity,
  };
}

export function CategoryCarousel({ items, active, onActiveChange, onOpen }: Props) {
  const n = items.length;

  /**
   * ⚠ **`Animated` ולא מעבר CSS** · הגלישה נבנתה עם
   * `transitionProperty` / `transitionDuration`, וזה קיים **רק
   * בדפדפן**. באפליקציה הכרטיסים פשוט קפצו בלי תנועה — שקד דיווחה
   * (16 בספטמבר 2026) ש״אין את האנימציה של העברת קטגוריות״.
   * `Animated` רץ בשתי הפלטפורמות, ועל `transform` ו-`opacity`
   * הוא יכול לרוץ על הדרייבר הילידי.
   */
  const anims = React.useRef(
    items.map((_, i) => {
      const t = targetOf(i, active, items.length);
      return {
        x: new Animated.Value(t.x),
        scale: new Animated.Value(t.scale),
        opacity: new Animated.Value(t.opacity),
      };
    }),
  ).current;

  const [reduce, setReduce] = React.useState(false);
  React.useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setReduce(v))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    const ms = reduce ? 0 : GLIDE_MS;
    Animated.parallel(
      anims.flatMap((a, i) => {
        const t = targetOf(i, active, n);
        const cfg = {
          duration: ms,
          /* אותו עקום של הלוטי · cubic-bezier(0.22, 0.9, 0.28, 1) */
          easing: Easing.bezier(0.22, 0.9, 0.28, 1),
          useNativeDriver: true,
        };
        return [
          Animated.timing(a.x, { ...cfg, toValue: t.x }),
          Animated.timing(a.scale, { ...cfg, toValue: t.scale }),
          Animated.timing(a.opacity, { ...cfg, toValue: t.opacity }),
        ];
      }),
    ).start();
  }, [active, anims, n, reduce]);

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
          const t = targetOf(i, active, n);
          const a = anims[i];

          return (
            <Animated.View
              key={c.key}
              pointerEvents={t.on ? 'auto' : 'none'}
              style={[
                s.slot,
                !t.on && NEIGHBOUR_FILTER,
                {
                  opacity: a.opacity,
                  zIndex: 5 - t.far,
                  transform: [{ translateX: a.x }, { scale: a.scale }],
                },
              ]}
            >
              <CategoryDeckCard item={c} active={t.on} onPress={() => onOpen(c.key)} />
            </Animated.View>
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
  /* ⚠ בלי `transitionProperty` · הוא קיים רק בדפדפן · ראו ההערה למעלה */
  slot: {
    position: 'absolute',
    top: 0,
    width: CARD.width,
  },

  dots: { flexDirection: 'row', gap: DOT.gap },
  dot: { height: DOT.size, borderRadius: 999 },
});
