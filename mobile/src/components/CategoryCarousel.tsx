import React, { useEffect, useMemo, useRef } from 'react';
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
 * ⚠ תיקון שני · הכרטיס עצמו הוא Pressable, והוא תפס את ה-responder
 * כבר בנגיעה. ברגע שילד הוא ה-responder, ההורה כבר לא נשאל שוב
 * ב-`onMoveShouldSetPanResponder` — רק שלב ה-capture רץ לפניו.
 * בלי `onMoveShouldSetPanResponderCapture` הגרירה לא הגיעה לעולם
 * למסלול, והקרוסלה לא זזה בכלל. ה-capture מחזיר true רק אחרי
 * DRAG_SLOP אופקי, כך שלחיצה רגילה על הכרטיס ממשיכה לעבוד.
 */

/** מרחק ההחלקה שממנו מחליפים כרטיס · SWIPE_MIN בקנבס */
const SWIPE_MIN = 45;
/** תזוזה קטנה מזו נחשבת ללחיצה ולא לגרירה · DRAG_SLOP בקנבס */
const DRAG_SLOP = 6;
/** המרחק בין מרכזי כרטיסים · רוחב הכרטיס ועוד המרווח */
const PITCH = CARD.width + CARD.gap;
/** מעבר הכרטיס · 560ms בקנבס */
const GLIDE_MS = 560;

/**
 * גרירה אופקית · רק אם היא אופקית בבירור. ScrollView אנכי עוטף את
 * הקרוסלה, ובלי הבדיקה הזו גלילה אנכית הייתה מזיזה כרטיסים.
 */
export function isHorizontal(dx: number, dy: number): boolean {
  return Math.abs(dx) > DRAG_SLOP && Math.abs(dx) > Math.abs(dy);
}

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
  /* מיקום המסלול · ערך אנימציה אחד שגם הגרירה וגם המעבר כותבים אליו */
  const x = useRef(new Animated.Value(active * PITCH)).current;
  /* ה-ref מחזיק את הערך העדכני · ה-PanResponder נבנה פעם אחת */
  const activeRef = useRef(active);
  activeRef.current = active;

  /* החלקה למקום · גם אחרי מעבר כרטיס וגם בחזרה כשההחלקה לא הספיקה */
  const glideTo = React.useCallback(
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

  const pan = useMemo(
    () =>
      PanResponder.create({
        /* לחיצה רגילה ממשיכה לכרטיס · רק תנועה נחטפת */
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponderCapture: (_e, g) => isHorizontal(g.dx, g.dy),
        onMoveShouldSetPanResponder: (_e, g) => isHorizontal(g.dx, g.dy),
        /* ה-ScrollView האנכי לא ייקח את הגרירה באמצע */
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_e, g) => x.setValue(activeRef.current * PITCH + g.dx),
        onPanResponderRelease: (_e, g) => {
          const next = nextIndex(activeRef.current, g.dx, items.length);
          /* גם כשההחלקה לא הספיקה צריך להחזיר את המסלול · אחרת הוא
             נשאר תקוע במקום שאליו נגררה האצבע, כי active לא השתנה */
          glideTo(next);
          onActiveChange(next);
        },
        onPanResponderTerminate: () => glideTo(activeRef.current),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items.length, glideTo, onActiveChange],
  );

  return (
    <View style={s.window}>
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
  window: { marginHorizontal: -18, paddingHorizontal: 18, paddingVertical: space.lg, overflow: 'hidden' },
  track: { flexDirection: 'row', gap: CARD.gap },
});
