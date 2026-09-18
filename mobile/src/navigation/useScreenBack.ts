import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

/**
 * חזרה **בתוך** מסך · השלב הפנימי לפני היציאה.
 *
 * ⚠ **בקשה של שקד (17 בספטמבר 2026)** · ״אם אני נמצאת בספיישלים
 * ונכנסתי לתוך קטגוריה, חזרה אחורה צריכה להחזיר אותי לספיישלים ולא
 * לעמוד הבית. כנ״ל בפינת השף — שלב אחד לפני״.
 *
 * ⚠ **שתי דרכי יציאה, ושתי תשובות שונות · נמדד ב-18 בספטמבר 2026**
 *
 * מרגע שהניווט נייטיבי יש שתי דרכים לצאת ממסך, והן **לא מתנהגות
 * אותו דבר**:
 *
 * · **כפתור או קוד** — עוברים דרך `beforeRemove`, ושם `preventDefault`
 *   באמת עוצר. כאן אפשר לטפל בשלב הפנימי.
 * · **מחוות המערכת** — הקפיצה כבר קרתה ב-UIKit כשהאירוע מגיע, ולכן
 *   `preventDefault` **אינו עוצר אותה**. נמדד: החלקה מתוך שלב פנימי
 *   בספיישלים יצאה עד דף הבית במקום לחזור לרשימה.
 *
 * לכן המחווה **מכובה** כל עוד יש שלב פנימי לחזור אליו, ונדלקת שוב
 * ברגע שאין. במצב הזה החץ הוא הדרך חזרה — וזו גם ההתנהגות הנכונה:
 * מחווה שמדלגת על שלב הייתה מפילה את מה ששקד ביקשה.
 *
 * ⚠ **`onBack` חייב להיות יציב** · עטפי ב-`useCallback`.
 */
export function useScreenBack(active: boolean, onBack: () => void) {
  const navigation = useNavigation();

  /* המחווה · אי אפשר לעצור אותה באמצע, ולכן מכבים מראש */
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !active } as never);
  }, [active, navigation]);

  /* כפתור וקוד · כאן דווקא אפשר לעצור ולטפל */
  useEffect(() => {
    if (!active) return;
    return navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
      onBack();
    });
  }, [active, navigation, onBack]);
}
