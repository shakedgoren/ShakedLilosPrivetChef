import { useMemo, useRef } from 'react';
import { PanResponder, Platform, type PanResponderInstance, type ViewStyle } from 'react-native';

/**
 * החלקה בין קטגוריות · משותפת לכרטיס בקרוסלה ולשורת הבועות.
 *
 * ⚠ שני דברים חייבים להיות כאן, ובלעדיהם ההחלקה פשוט לא עובדת:
 *
 * 1 · `onMoveShouldSetPanResponderCapture` · הכרטיס והבועה הם Pressable
 *   והם תופסים את ה-responder כבר בנגיעה. ברגע שילד הוא ה-responder
 *   ההורה לא נשאל שוב ב-onMoveShouldSetPanResponder — רק שלב ה-capture
 *   רץ לפניו.
 *
 * 2 · `touchAction: 'pan-y'` על המכל · בלעדיו הדפדפן במכשיר מגע לוקח
 *   לעצמו את המחווה האופקית ושולח touchcancel, וההחלקה מתה לפני
 *   שהיא מגיעה לקוד. זה מה שקרה באצבע בעוד שהזרקת אירועים עבדה.
 *   הערך מיוצא כאן כדי ששני המשתמשים יחילו אותו.
 */

/** מרחק ההחלקה שממנו מחליפים קטגוריה · SWIPE_MIN בקנבס */
export const SWIPE_MIN = 45;
/** תזוזה קטנה מזו נחשבת ללחיצה ולא לגרירה · DRAG_SLOP בקנבס */
export const DRAG_SLOP = 6;

/**
 * סגנון המכל של אזור ההחלקה · `touch-action: pan-y` קיים רק בווב
 * ואינו חלק מ-ViewStyle, ולכן ההמרה יושבת כאן במקום אחד בלבד.
 * הדפדפן שומר לעצמו את הגלילה האנכית, והאופקית נשארת שלנו.
 */
export const SWIPE_SURFACE: ViewStyle =
  Platform.OS === 'web' ? ({ touchAction: 'pan-y' } as ViewStyle) : {};

/** גרירה אופקית · רק אם היא אופקית בבירור, אחרת גלילת העמוד נפגעת */
export function isHorizontal(dx: number, dy: number): boolean {
  return Math.abs(dx) > DRAG_SLOP && Math.abs(dx) > Math.abs(dy);
}

/**
 * הקטגוריה שאליה עוברים אחרי החלקה.
 * החלקה ימינה (dx חיובי) מקדמת לקטגוריה הבאה.
 *
 * ⚠ **מעגלי ולא נעצר בקצוות** · בחירה של שקד (15 בספטמבר 2026).
 * קודם הערך נחתך ל-[0, count-1], כלומר מהקטגוריה האחרונה אי אפשר
 * היה להתקדם — בעוד שהדק מסדר את הכרטיסים במעגל ומציג את הראשונה
 * מציצה מאחור. הלקוחה ראתה כרטיס, ניסתה להחליק אליו, וכלום לא קרה.
 */
export function nextIndex(active: number, dx: number, count: number): number {
  const wrap = (n: number) => ((n % count) + count) % count;
  if (dx > SWIPE_MIN) return wrap(active + 1);
  if (dx < -SWIPE_MIN) return wrap(active - 1);
  return active;
}

type Options = {
  active: number;
  count: number;
  onChange: (next: number) => void;
  /* משוב חי בזמן הגרירה · הקרוסלה מזיזה את המסלול, השורה לא צריכה */
  onDrag?: (dx: number) => void;
  onSettle?: (index: number) => void;
};

export function useCategorySwipe({ active, count, onChange, onDrag, onSettle }: Options): PanResponderInstance {
  /* ה-ref מחזיק את הערך העדכני · ה-PanResponder נבנה פעם אחת */
  const activeRef = useRef(active);
  activeRef.current = active;
  const cb = useRef({ onChange, onDrag, onSettle });
  cb.current = { onChange, onDrag, onSettle };

  return useMemo(
    () =>
      PanResponder.create({
        /* לחיצה רגילה ממשיכה לילד · רק תנועה אופקית נחטפת */
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponderCapture: (_e, g) => isHorizontal(g.dx, g.dy),
        onMoveShouldSetPanResponder: (_e, g) => isHorizontal(g.dx, g.dy),
        /* ה-ScrollView האנכי לא ייקח את הגרירה באמצע */
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_e, g) => cb.current.onDrag?.(g.dx),
        onPanResponderRelease: (_e, g) => {
          const next = nextIndex(activeRef.current, g.dx, count);
          /* גם כשההחלקה לא הספיקה צריך להחזיר את המסלול · אחרת הוא
             נשאר תקוע במקום שאליו נגררה האצבע, כי active לא השתנה */
          cb.current.onSettle?.(next);
          cb.current.onChange(next);
        },
        onPanResponderTerminate: () => cb.current.onSettle?.(activeRef.current),
      }),
    [count],
  );
}
