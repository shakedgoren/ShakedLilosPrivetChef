import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Text } from './src/ui/text';
/**
 * ⚠ **לא ה-`SafeAreaView` של react-native** · לזה שלו אין `edges`,
 * והוא מרפד תמיד את כל ארבעת הצדדים. שקד ביקשה
 * `ignoresSafeArea(_:edges:)` — כלומר להתעלם מצד אחד ולא מכולם —
 * ולכן צריך את הגרסה עם `edges`. החבילה כלולה ב-Expo Go.
 */
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { FONTS } from './src/theme/fonts';
import { NavProvider, useNav, type Screen } from './src/navigation/store';
import { BottomNav } from './src/components/BottomNav';
import { PageWash } from './src/components/PageWash';
import { LightboxProvider } from './src/components/Lightbox';
import { LogoutButton } from './src/components/LogoutButton';
import { HomeScreen } from './src/screens/HomeScreen';
import { IconSheetScreen } from './src/screens/IconSheetScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { BackSwipe } from './src/components/BackSwipe';
import { ScreenStage } from './src/navigation/ScreenStage';
import { CheerProvider } from './src/components/Cheer';
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

/**
 * המסכים שמוותרים על הריפוד העליון.
 *
 * ⚠ **בקשה של שקד · 16 בספטמבר 2026** · ״Safe area מלמעלה בדף של
 * ההתחברות״ ו״בצד הניהולי צריך להסיר Safe area מלמעלה״. בשני
 * המסכים האלה התוכן העליון הוא רקע מלא — הכוכבים בניהול, והשטיפה
 * במסך ההתחברות — ולכן הריפוד יצר שם פס בהיר.
 *
 * ⚠ **דף הבית של הלקוחה אינו ברשימה** · נמדד בסימולטור ב-16
 * בספטמבר: בלעדיו הכותרת נכנסת מתחת למגרעת וחופפת לשעון.
 */
const NO_TOP_INSET = (screen: string) => screen === 'login' || screen.startsWith('admin');

/* ⚠ קבועים ולא מערך חדש בכל רינדור · `SafeAreaView` משווה הפניות */
const EDGES_TOP = ['top'] as const;
const EDGES_NONE = [] as const;

export default function App() {
  const [fontsLoaded] = useFonts(FONTS);
  /**
   * עד שהגופן נטען לא מרנדרים · אחרת הטקסט קופץ מגופן המערכת ל-Assistant.
   * ⚠ הגופן עצמו מוחל ב-`src/ui/text.tsx` · היה כאן `applyFonts()` שדרס
   * את `Text.render`, וזה **לא עבד במכשיר** (ראו את ההערה שם).
   */
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <NavProvider>
      <LightboxProvider>
      {/* ⚠ החגיגה מעל הכל · ראו `Cheer` · הניווט לא קוטע אותה */}
      <CheerProvider>
        {/**
          * ⚠ **הרקע מתעלם מהשוליים, התוכן שומר על העליון** · שקד
          * ביקשה (15 בספטמבר 2026) לבטל את שני הצדדים, ואז דיווחה
          * (16 בספטמבר) שהכיתוב נחתך למעלה — כי בלי הריפוד
          * העליון הכותרת נכנסה מתחת למגרעת. ההפרדה פותרת את שניהם:
          * ה-`Wash` יושב **מחוץ** ל-`SafeAreaView` ולכן נצבע מקצה
          * לקצה מתחת למגרעת ומתחת לפס הבית, וה-`SafeAreaView`
          * שומר רק על `top` כדי שהתוכן לא ייחתך. התחתית נשארת
          * מבוטלת — התוכן נמשך עד קצה המסך.
          * ⚠ נמדד בסימולטור · לפני התיקון נשאר פס אחיד של 102
          * פיקסלים בתחתית (‎34 נקודות ב-@3x), בדיוק מידת פס הבית.
          */}
        <Shell />
      </CheerProvider>
      </LightboxProvider>
      </NavProvider>
    </SafeAreaProvider>
  );
}

/**
 * גוף האפליקציה · **בתוך** `NavProvider`, כי הריפוד העליון תלוי
 * במסך הפעיל. ראו `NO_TOP_INSET`.
 */
function Shell() {
  const { screen } = useNav();
  const topEdges = NO_TOP_INSET(screen) ? EDGES_NONE : EDGES_TOP;

  return (
        <View style={s.root}>
          <StatusBar style="dark" />
          <Wash />
          {/**
            * ⚠ **האזור הבטוח העליון חזר · 16 בספטמבר 2026** · שקד
            * ביקשה להסיר אותו, ונמדד בסימולטור שאז ״BITE & TELL״
            * נכנס **מתחת למגרעת וחופף לשעון** — הכותרת לא נקראה.
            *
            * מה שהיא ראתה ורצתה להעלים היה **פס בהיר מעל השטיפה**
            * בראש העמוד, לא הריפוד עצמו. עם הרקע הלילכי הפס הזה כבר
            * לא קיים: `PageWash` יושב **מחוץ** ל-SafeAreaView וצובע
            * מקצה לקצה, כולל מתחת למגרעת. לכן הצבע רץ עד הקצה
            * **והכותרת נשארת קריאה**.
            */}
          <SafeAreaView style={s.safe} edges={topEdges}>
            {/* ⚠ גרירה מהקצה הימני שמאלה = חזרה · בקשה של שקד */}
            <BackSwipe>
              {/* ⚠ ההנפשה שבחרה · ״קיפול החוצה״ קדימה ו״החלקה
                  אופקית״ אחורה · ראו `ScreenStage` */}
              <ScreenStage>
                <Router />
              </ScreenStage>
            </BackSwipe>
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
