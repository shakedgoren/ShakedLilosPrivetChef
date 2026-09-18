import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../ui/text';
import { PageWash } from '../components/PageWash';
import { useNav, SCREENS, type Screen } from './store';
import { surface, type CategoryKey } from '../theme/tokens';

import { HomeScreen } from '../screens/HomeScreen';
import { IconSheetScreen } from '../screens/IconSheetScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { CategoryScreen } from '../screens/CategoryScreen';
import { CouscousScreen } from '../screens/couscous/CouscousScreen';
import { SchnitzelScreen } from '../screens/schnitzel/SchnitzelScreen';
import { FruitScreen } from '../screens/fruit/FruitScreen';
import { BoxesScreen } from '../screens/boxes/BoxesScreen';
import { ChefScreen } from '../screens/chef/ChefScreen';
import { MyOrdersScreen } from '../screens/orders/MyOrdersScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { AdminHomeScreen } from '../admin/AdminHomeScreen';
import { AdminOrdersScreen } from '../admin/AdminOrdersScreen';
import { AdminDaysScreen } from '../admin/AdminDaysScreen';
import { AdminStockScreen } from '../admin/AdminStockScreen';
import { AdminShoppingScreen } from '../admin/AdminShoppingScreen';
import { AdminMoneyScreen } from '../admin/AdminMoneyScreen';
import { AdminCustomersScreen } from '../admin/AdminCustomersScreen';
import { AdminMenuScreen } from '../admin/AdminMenuScreen';
import { AdminCostsScreen } from '../admin/AdminCostsScreen';
import { AdminHistoryScreen } from '../admin/AdminHistoryScreen';
import { AdminBoardScreen } from '../admin/AdminBoardScreen';
import { AdminExpensesScreen } from '../admin/AdminExpensesScreen';
import { AdminIncomeScreen } from '../admin/AdminIncomeScreen';

/**
 * המסכים · שם המסך אל הרכיב שלו.
 *
 * ⚠ **עבר לכאן מ-`App.tsx` · 18 בספטמבר 2026** · מרגע שיש נוויגטור
 * אמיתי, הניתוב הוא עניין של שכבת הניווט ולא של שורש האפליקציה.
 */

const CATEGORY_SCREENS: CategoryKey[] = ['cous', 'schn', 'box', 'fruit', 'chef'];

/* מסכי הניהול · נאב-בר משלהם, נפרד מזה של הלקוחה */
export const ADMIN_SCREENS: Screen[] = [
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

/**
 * ⚠ **המסך מגיע כמאפיין ולא מההקשר** · כל מסלול בנוויגטור יודע מי
 * הוא, ואינו שואל ״מה המסך הנוכחי״ — מה שנכון גם כששני מסכים חיים
 * יחד באמצע מעבר.
 */
function Router({ screen }: { screen: Screen }) {
  const { user, apiEnabled } = useNav();
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

  /* כל המסכים מנותבים · הענף הזה נשאר כרשת ביטחון בלבד */
  return (
    <View style={s.todo}>
      <Text style={s.todoText}>{screen}</Text>
      <Text style={s.todoSub}>מסך לא מוכר</Text>
    </View>
  );
}

/** גוון השטיפה של מסך · במסכי הקטגוריות היא נצבעת בגוון הקטגוריה */
const washOf = (screen: Screen) =>
  CATEGORY_SCREENS.includes(screen as CategoryKey) ? (screen as CategoryKey) : undefined;

/**
 * המסכים שמוותרים על הריפוד העליון.
 *
 * ⚠ **בקשה של שקד · 16 בספטמבר 2026** · ״Safe area מלמעלה בדף של
 * ההתחברות״ ו״בצד הניהולי צריך להסיר Safe area מלמעלה״. בשני
 * המסכים האלה התוכן העליון הוא רקע מלא, ולכן הריפוד יצר שם פס בהיר.
 */
const NO_TOP_INSET = (screen: string) => screen === 'login' || screen.startsWith('admin');

/* ⚠ קבועים ולא מערך חדש בכל רינדור · `SafeAreaView` משווה הפניות */
const EDGES_TOP = ['top'] as const;
const EDGES_NONE = [] as const;

/**
 * מסך שלם · השטיפה שלו, האזור הבטוח שלו, ותוכנו.
 *
 * ⚠ **האזור הבטוח ירד מהשורש · 18 בספטמבר 2026** · הוא ישב פעם אחת
 * מסביב לכל האפליקציה, ולכן היה חייב לדעת מיהו המסך הנוכחי. עכשיו
 * לכל מסלול יש משלו, והוא פשוט יודע מי הוא.
 *
 * ⚠ **השטיפה **מחוץ** לאזור הבטוח** · כך היא נצבעת מקצה לקצה, כולל
 * מתחת למגרעת ומתחת לפס הבית. זו הסיבה שאין כאן יותר `bleed`:
 * הקופסה שלה היא כל המסך מלכתחילה.
 */
function Page({ screen }: { screen: Screen }) {
  const noTop = NO_TOP_INSET(screen);
  return (
    <View style={s.page}>
      <PageWash categoryKey={washOf(screen)} />
      <SafeAreaView style={s.safe} edges={noTop ? EDGES_NONE : EDGES_TOP}>
        <Router screen={screen} />
      </SafeAreaView>
    </View>
  );
}

/**
 * רכיב לכל מסלול · **נוצר פעם אחת**.
 * ⚠ רכיב שנוצר בתוך רינדור מפרק ומרכיב את המסך בכל שינוי מצב,
 * וריאקט-נוויגיישן מזהיר על כך במפורש.
 */
export const SCREEN_COMPONENTS: Record<string, React.ComponentType> = Object.fromEntries(
  SCREENS.map((name) => [name, () => <Page screen={name} />]),
);

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: surface.ground },
  /* ⚠ שקוף · השטיפה שמתחתיו היא שנראית */
  safe: { flex: 1 },
  todo: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  todoText: { fontSize: 20, fontWeight: '600', color: surface.ink },
  todoSub: { fontSize: 13, color: surface.muted },
});
