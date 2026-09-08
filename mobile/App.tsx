import React from 'react';
import { I18nManager, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavProvider, useNav, type Screen } from './src/navigation/store';
import { BottomNav } from './src/components/BottomNav';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { CategoryScreen } from './src/screens/CategoryScreen';
import { CouscousScreen } from './src/screens/couscous/CouscousScreen';
import { SchnitzelScreen } from './src/screens/schnitzel/SchnitzelScreen';
import { FruitScreen } from './src/screens/fruit/FruitScreen';
import { BoxesScreen } from './src/screens/boxes/BoxesScreen';
import { ChefScreen } from './src/screens/chef/ChefScreen';
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
import { AdminNav } from './src/admin/AdminNav';
import { surface } from './src/theme/tokens';
import type { CategoryKey } from './src/theme/tokens';

/* האפליקציה בעברית · RTL נדלק פעם אחת בעליית התהליך */
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

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
];

const TODO_TITLES: Partial<Record<Screen, string>> = {
  orders: 'ההזמנות שלי',
  profile: 'אזור אישי',
};

function Router() {
  const { screen, user, apiEnabled } = useNav();
  const gated = ADMIN_SCREENS.includes(screen) && apiEnabled && user?.role !== 'admin';
  const view = gated ? 'main' : screen;

  if (view === 'guest' || view === 'main') return <HomeScreen />;
  if (view === 'login') return <LoginScreen mode="in" />;
  if (view === 'signup') return <LoginScreen mode="up" />;
  if (view === 'cous') return <CouscousScreen />;
  if (view === 'schn') return <SchnitzelScreen />;
  if (view === 'fruit') return <FruitScreen />;
  if (view === 'box') return <BoxesScreen />;
  if (view === 'chef') return <ChefScreen />;
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
  if (CATEGORY_SCREENS.includes(view as CategoryKey))
    return <CategoryScreen categoryKey={view as CategoryKey} />;

  /* מסכים שטרם הועברו מהעיצוב */
  return (
    <View style={s.todo}>
      <Text style={s.todoText}>{TODO_TITLES[screen] ?? 'אזור אישי'}</Text>
      <Text style={s.todoSub}>המסך הזה עדיין לא הועבר מהעיצוב</Text>
    </View>
  );
}

/** הנאב-בר הנכון למסך הנוכחי · של הניהול או של הלקוחה */
function Chrome() {
  const { screen, user, apiEnabled } = useNav();
  if (screen === 'adminBoard') return null;
  const showAdmin = ADMIN_SCREENS.includes(screen) && (!apiEnabled || user?.role === 'admin');
  return showAdmin ? <AdminNav /> : <BottomNav />;
}

export default function App() {
  return (
    <NavProvider>
      <SafeAreaView style={s.root}>
        <StatusBar style="dark" />
        <Router />
        <Chrome />
      </SafeAreaView>
    </NavProvider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: surface.ground },
  todo: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  todoText: { fontSize: 20, fontWeight: '600', color: surface.ink },
  todoSub: { fontSize: 13, color: surface.muted },
});
