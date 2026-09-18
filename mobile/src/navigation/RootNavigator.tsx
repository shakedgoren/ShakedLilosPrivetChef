import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SCREENS } from './store';
import { SCREEN_COMPONENTS } from './routes';

/**
 * מחסנית הניווט של האפליקציה.
 *
 * ⚠ **נוצרה ב-18 בספטמבר 2026 · שלב 2 במעבר לניווט נייטיבי** · כאן
 * ישבה שכבה בת 563 שורות שהזיזה שני מסכים ביד עם `Animated`
 * ו-`PanResponder`. כל המעברים והמחוות מגיעים עכשיו מ-UIKit עצמו.
 *
 * ⚠ **`headerShown: false`** · לאפליקציה יש כותרות משלה
 * (`CategoryHeader`, `AdminShell`) שעוצבו בקנבס. הן נשארות.
 *
 * ⚠ **המעבר הוא ברירת המחדל של המערכת** · לא מוגדר כאן `animation`
 * בכוונה: ברירת המחדל של `native-stack` ב-iOS היא הדחיפה של
 * `UINavigationController`, כולל מחוות החזרה האינטראקטיבית מהקצה,
 * הפרלקסה על המסך שמתגלה, והצל — כל מה שנמדד בסרטון של שקד.
 *
 * ⚠ **ימין-לשמאל** · האפליקציה כפויה ל-RTL, ו-UIKit מהפך את כיוון
 * הדחיפה ואת צד המחווה מעצמו. אין כאן מה להגדיר.
 *
 * ⚠ **הצניחה מלמטה ירדה** · שקד אישרה במפורש ב-18 בספטמבר. כניסה
 * לקטגוריה היא דחיפה אופקית, כי זה מה שמאפשר את מחוות החזרה.
 */

const Stack = createNativeStackNavigator();

/**
 * ⚠ **מסך אחד לכל שם, מראש** · המסלולים אינם נבנים דינמית בזמן
 * ריצה; `SCREENS` הוא המקור, וכך שם שמתווסף שם מקבל מסלול מעצמו.
 */
export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="guest" screenOptions={{ headerShown: false }}>
      {SCREENS.map((name) => (
        <Stack.Screen key={name} name={name} component={SCREEN_COMPONENTS[name]} />
      ))}
    </Stack.Navigator>
  );
}
