import React from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

/**
 * כניסה מדורגת · כל אובייקט מופיע אחרי קודמו.
 *
 * ⚠ **בקשה של שקד (17 בספטמבר 2026)** · ״האפקט הראשוני של
 * האפליקצייה של דף הבית אני רוצה שיהיה אפקט שכל האובייקטים
 * מופיעים על המסך אחד אחד״.
 *
 * ⚠ **פעם אחת בלבד, בפתיחת האפליקציה** · היא ביקשה את ה**אפקט
 * הראשוני**, ולא תנועה בכל חזרה הביתה. חזרה מהקטגוריה כבר מנפישה
 * את המסך כולו (״החלקה אופקית״), ושתי תנועות יחד נראות עמוסות.
 * הדגל יושב ברמת המודול ולכן מתאפס רק בהפעלה מחדש.
 */

/**
 * ⚠ **הודגש · 17 בספטמבר 2026** · שקד: ״כשהאפליקציה מעלה את דף
 * הבית האפקט לא מספיק מורגש״. היו 90 / 420 / 16 — ההפרש בין
 * אובייקט לאובייקט היה קצר מזמן העלייה עצמו, ולכן כולם עלו כמעט
 * יחד והעין ראתה גוש אחד. עכשיו ההפרש קרוב לרבע מזמן העלייה,
 * והעלייה עצמה כפולה ומלווה בהתרחבות קלה.
 */
/** ההפרש בין אובייקט לאובייקט */
const STEP_MS = 130;
const DUR_MS = 520;
/** כמה האובייקט עולה בדרך פנימה */
const RISE = 30;
/** מאיזה קנה מידה הוא נפתח · עדין בכוונה, רק כדי להוסיף עומק */
const FROM_SCALE = 0.94;

let played = false;

export function Appear({
  index = 0,
  children,
}: {
  /** המקום בתור · 0 ראשון */
  index?: number;
  children: React.ReactNode;
}) {
  /* ⚠ נקבע פעם אחת בעלייה · אחרת רינדור חוזר היה מפעיל שוב */
  const first = React.useRef(!played);
  const t = React.useRef(new Animated.Value(first.current ? 0 : 1)).current;

  React.useEffect(() => {
    if (!first.current) return;
    played = true;
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduce) => {
        if (!alive) return;
        if (reduce) {
          t.setValue(1);
          return;
        }
        Animated.timing(t, {
          toValue: 1,
          duration: DUR_MS,
          delay: index * STEP_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      })
      .catch(() => t.setValue(1));
    return () => {
      alive = false;
    };
  }, [index, t]);

  if (!first.current) return <>{children}</>;

  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [RISE, 0] });
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [FROM_SCALE, 1] });

  return (
    <Animated.View style={{ opacity: t, transform: [{ translateY }, { scale }] }}>
      {children}
    </Animated.View>
  );
}
