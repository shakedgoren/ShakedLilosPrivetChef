import React from 'react';
import { Modal, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { FONTS } from './src/theme/fonts';
import { applyFonts } from './src/theme/applyFonts';
import { NavProvider, useNav, type Screen } from './src/navigation/store';
import { BottomNav } from './src/components/BottomNav';
import { PageWash } from './src/components/PageWash';
import { LightboxProvider } from './src/components/Lightbox';
import { LogoutButton } from './src/components/LogoutButton';
import { HomeScreen } from './src/screens/HomeScreen';
import { IconSheetScreen } from './src/screens/IconSheetScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { CategoryScreen } from './src/screens/CategoryScreen';
import { CouscousScreen } from './src/screens/couscous/CouscousScreen';
import { SchnitzelScreen } from './src/screens/schnitzel/SchnitzelScreen';
import { FruitScreen } from './src/screens/fruit/FruitScreen';
import { BoxesScreen } from './src/screens/boxes/BoxesScreen';
import { ChefScreen } from './src/screens/chef/ChefScreen';
import { MyOrdersScreen } from './src/screens/orders/MyOrdersScreen';
import { ProfileScreen } from './src/screens/profile/ProfileScreen';
import { AdminHomeScreen } from './src/admin/AdminHomeScreen';
import { AdminOrdersScreen } from './src/admin/AdminOrdersScreen';
import { AdminDaysScreen } from './src/admin/AdminDaysScreen';
import { AdminStockScreen } from './src/admin/AdminStockScreen';
import { AdminShoppingScreen } from './src/admin/AdminShoppingScreen';
import { AdminMoneyScreen } from './src/admin/AdminMoneyScreen';
import { AdminCustomersScreen } from './src/admin/AdminCustomersScreen';
import { AdminMenuScreen } from './src/admin/AdminMenuScreen';
import { AdminCostsScreen } from './src/admin/AdminCostsScreen';
import { AdminHistoryScreen } from './src/admin/AdminHistoryScreen';
import { AdminBoardScreen } from './src/admin/AdminBoardScreen';
import { AdminExpensesScreen } from './src/admin/AdminExpensesScreen';
import { AdminIncomeScreen } from './src/admin/AdminIncomeScreen';
import { AdminNav } from './src/admin/AdminNav';
import { enableRTL } from './src/theme/rtl';
import { surface } from './src/theme/tokens';
import type { CategoryKey } from './src/theme/tokens';

enableRTL();

const CATEGORY_SCREENS: CategoryKey[] = ['cous', 'schn', 'box', 'fruit', 'chef'];

/* מסכי הניהול · נאב-בר משלהם, נפרד מזה של הלקוחה */
const ADMIN_SCREENS: Screen[] = [
  'admin',
  'adminOrders',
  'adminStock',
  'adminMoney',
  'adminDays',
  'adminShopping',
  'adminCustomers',
  'adminMenu',
  'adminCosts',
  'adminHistory',
  'adminBoard',
  'adminExpenses',
  'adminIncome',
];

function Router() {
  const { screen, user, apiEnabled } = useNav();
  const gated = ADMIN_SCREENS.includes(screen) && apiEnabled && user?.role !== 'admin';
  const view = gated ? 'main' : screen;

  if (view === 'icons') return <IconSheetScreen />;
  if (view === 'guest' || view === 'main') return <HomeScreen />;
  if (view === 'login') return <LoginScreen mode="in" />;
  if (view === 'signup') return <LoginScreen mode="up" />;
  if (view === 'cous') return <CouscousScreen />;
  if (view === 'schn') return <SchnitzelScreen />;
  if (view === 'fruit') return <FruitScreen />;
  if (view === 'box') return <BoxesScreen />;
  if (view === 'chef') return <ChefScreen />;
  if (view === 'orders') return <MyOrdersScreen />;
  if (view === 'profile') return <ProfileScreen />;
  if (view === 'admin') return <AdminHomeScreen />;
  if (view === 'adminOrders') return <AdminOrdersScreen />;
  if (view === 'adminDays') return <AdminDaysScreen />;
  if (view === 'adminStock') return <AdminStockScreen />;
  if (view === 'adminShopping') return <AdminShoppingScreen />;
  if (view === 'adminMoney') return <AdminMoneyScreen />;
  if (view === 'adminCustomers') return <AdminCustomersScreen />;
  if (view === 'adminMenu') return <AdminMenuScreen />;
  if (view === 'adminCosts') return <AdminCostsScreen />;
  if (view === 'adminHistory') return <AdminHistoryScreen />;
  if (view === 'adminBoard') return <AdminBoardScreen />;
  if (view === 'adminExpenses') return <AdminExpensesScreen />;
  if (view === 'adminIncome') return <AdminIncomeScreen />;
  if (CATEGORY_SCREENS.includes(view as CategoryKey))
    return <CategoryScreen categoryKey={view as CategoryKey} />;

  /* כל 22 המסכים מנותבים · הענף הזה נשאר כרשת ביטחון בלבד */
  return (
    <View style={s.todo}>
      <Text style={s.todoText}>{screen}</Text>
      <Text style={s.todoSub}>מסך לא מוכר</Text>
    </View>
  );
}

/** הנאב-בר הנכון למסך הנוכחי · של הניהול או של הלקוחה */
/** שטיפת הרקע · במסכי הקטגוריות היא נצבעת בגוון הקטגוריה */
function Wash() {
  const { screen } = useNav();
  const key = CATEGORY_SCREENS.includes(screen as CategoryKey) ? (screen as CategoryKey) : undefined;
  return <PageWash categoryKey={key} />;
}

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
  /* הגופן מוחל פעם אחת · לפני הרינדור הראשון של טקסט כלשהו */
  if (fontsLoaded) applyFonts();
  /* עד שהגופן נטען לא מרנדרים · אחרת הטקסט קופץ מגופן המערכת ל-Assistant */
  if (!fontsLoaded) return null;

  return (
    <NavProvider>
      <LightboxProvider>
        {/* ⚠ **השטיפה מתעלמת מה-SafeArea** · בקשה של שקד (15 בספטמבר
            2026). `SafeAreaView` מרפד במכשיר את המגרעת ואת פס הבית,
            וכשהוא היה השורש גם הרקע נעצר שם — נשארו פסים בצבע
            `surface.ground` השטוח למעלה ולמטה. עכשיו השורש הוא
            `View` שממלא את כל המסך, השטיפה נצבעת מקצה לקצה,
            וה-`SafeAreaView` עטוף רק סביב התוכן כך שהוא עדיין לא
            נכנס מתחת למגרעת.
            ⚠ ה-`SafeAreaView` שקוף · אחרת הוא היה מכסה את השטיפה. */}
        <View style={s.root}>
          <StatusBar style="dark" />
          <Wash />
          <SafeAreaView style={s.safe}>
            <Router />
            {/* ⚠ מותקן פעם אחת · שקד ביקשה שההתנתקות תופיע בכל רחבי
                האפליקציה, ולא רק ב״ההזמנות שלי״ וב״אזור אישי״ כמו
                בקנבס. חייב להיות **לפני** שכבת ההתחברות, שאחרת הוא
                מרחף מעליה.
                ⚠ נשאר **בתוך** ה-SafeArea · הוא יושב בפינה העליונה,
                ומחוצה לו הוא היה נכנס מתחת למגרעת. */}
            <LogoutButton />
            <LoginOverlay />
          </SafeAreaView>

          {/* ⚠ **הנאב-בר מתעלם מה-SafeArea התחתון** · הקנבס מציב אותו
              ב-`bottom: 26`, אבל בתוך ה-`SafeAreaView` ה-26 נמדדו
              מתחתית **האזור הבטוח** ולא מתחתית **המסך** — ובאייפון
              עם פס בית זה הוסיף עוד כ-34 פיקסלים והנאב ריחף באוויר.
              מחוץ לו הוא יושב בדיוק היכן שהקנבס אומר. */}
          <Chrome />
        </View>
      </LightboxProvider>
    </NavProvider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: surface.ground },
  /* ⚠ שקוף · השטיפה שמתחתיו היא שנראית */
  safe: { flex: 1 },
  todo: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  todoText: { fontSize: 20, fontWeight: '600', color: surface.ink },
  todoSub: { fontSize: 13, color: surface.muted },
});
