import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { FONTS } from './src/theme/fonts';
import { NavProvider, useNav } from './src/navigation/store';
import { navigationRef } from './src/navigation/ref';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ADMIN_SCREENS } from './src/navigation/routes';
import { BottomNav } from './src/components/BottomNav';
import { PageWash } from './src/components/PageWash';
import { LightboxProvider } from './src/components/Lightbox';
import { LogoutButton } from './src/components/LogoutButton';
import { LoginScreen } from './src/screens/LoginScreen';
import { CheerProvider } from './src/components/Cheer';
import { AdminNav } from './src/admin/AdminNav';
import { registerForPush } from './src/lib/push';
import { enableRTL } from './src/theme/rtl';
import { surface } from './src/theme/tokens';

enableRTL();

/** הנאב-בר הנכון למסך הנוכחי · של הניהול או של הלקוחה */
function Chrome() {
  const { screen, user, apiEnabled } = useNav();
  if (screen === 'adminBoard') return null;
  const showAdmin = ADMIN_SCREENS.includes(screen) && (!apiEnabled || user?.role === 'admin');
  return showAdmin ? <AdminNav /> : <BottomNav />;
}

/**
 * שכבת ההתחברות · נפתחת מעל המסך הנוכחי מתוך חסם ההתחברות.
 * ⚠ חייבת להיות שכבה ולא מסך · מעבר אמיתי מפרק את מסך ההזמנה
 * ומאפס את הבחירות, בניגוד למה שהחסם מבטיח.
 * ⚠ **נשארת `Modal` ידנית בשלב הזה** · המרה להצגה נייטיבית היא
 * שלב 4 בתוכנית, יחד עם שאר 14 החלוניות.
 */
function LoginOverlay() {
  const { loginOverlay, closeLogin } = useNav();
  if (!loginOverlay) return null;
  return (
    <Modal visible transparent={false} animationType="slide" onRequestClose={closeLogin}>
      <PageWash />
      <LoginScreen mode="in" />
    </Modal>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts(FONTS);
  /**
   * עד שהגופן נטען לא מרנדרים · אחרת הטקסט קופץ מגופן המערכת ל-Assistant.
   * ⚠ הגופן עצמו מוחל ב-`src/ui/text.tsx` · היה כאן `applyFonts()` שדרס
   * את `Text.render`, וזה **לא עבד במכשיר** (ראו את ההערה שם).
   */
  if (!fontsLoaded) return null;

  return (
    /**
     * ⚠ **שורש המחוות · שלב 1 במעבר לניווט נייטיבי** · מספק את
     * ההקשר שכל מחווה של הספרייה מחפשת ומאתחל את Fabric. בלעדיו
     * מחוות אינן עובדות, ובשקט — ולכן הוא החיצוני ביותר.
     */
    <GestureHandlerRootView style={s.gestureRoot}>
      <SafeAreaProvider>
        <NavProvider>
          <LightboxProvider>
            {/* ⚠ החגיגה מעל הכל · ראו `Cheer` · הניווט לא קוטע אותה */}
            <CheerProvider>
              <Shell />
            </CheerProvider>
          </LightboxProvider>
        </NavProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * גוף האפליקציה · **בתוך** `NavProvider`.
 *
 * ⚠ **שלב 2 · 18 בספטמבר 2026** · כאן ישבו `SafeAreaView` אחד לכל
 * האפליקציה ו-`ScreenStage` בן 563 שורות שהזיז שני מסכים ביד.
 * שניהם ירדו: האזור הבטוח עבר לכל מסלול בנפרד (ראו `routes.tsx`),
 * והמעברים והמחוות מגיעים עכשיו מ-UIKit.
 */
function Shell() {
  const { syncRoute, loggedIn } = useNav();

  /**
   * ⚠ **המסלול מדווח לחנות** · 36 קבצים קוראים `screen` מהחנות,
   * ולא נגעתי באף אחד מהם. השורש מעדכן אותה במה שהנוויגטור מציג,
   * ולכן הם ממשיכים לעבוד בדיוק כפי שעבדו.
   */
  const onRoute = React.useCallback(() => {
    const route = navigationRef.getCurrentRoute();
    if (route) syncRoute(route.name);
  }, [syncRoute]);

  /**
   * ⚠ **רישום להתראות · 18 בספטמבר 2026** · ברגע שיש לקוחה מחוברת,
   * ולא לפני: השרת שומר את האסימון לפי משתמשת. ראו `lib/push.ts`.
   */
  React.useEffect(() => {
    if (!loggedIn) return;
    void registerForPush();
  }, [loggedIn]);

  return (
    <View style={s.root}>
      <StatusBar style="dark" />
      <NavigationContainer ref={navigationRef} onReady={onRoute} onStateChange={onRoute}>
        <RootNavigator />
      </NavigationContainer>

      {/* ⚠ מותקן פעם אחת · שקד ביקשה שההתנתקות תופיע בכל רחבי
          האפליקציה. חייב להיות **לפני** שכבת ההתחברות, שאחרת הוא
          מרחף מעליה. הוא מחשב את האזור הבטוח בעצמו. */}
      <LogoutButton />
      <LoginOverlay />

      {/* ⚠ **הנאב-בר מתעלם מה-SafeArea התחתון** · הקנבס מציב אותו
          ב-`bottom: 26`, ובתוך אזור בטוח ה-26 נמדדו מתחתית **האזור**
          ולא מתחתית **המסך** — ואז הוא ריחף באוויר. */}
      <Chrome />
    </View>
  );
}

const s = StyleSheet.create({
  /* ⚠ שורש המחוות · ראו ההערה ב-`App` */
  gestureRoot: { flex: 1 },
  root: { flex: 1, backgroundColor: surface.ground },
});
