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
import { AdminOrdersScreen } from './src/admin/AdminOrdersScreen';
import { AdminNav } from './src/admin/AdminNav';
import { surface } from './src/theme/tokens';
import type { CategoryKey } from './src/theme/tokens';

/* האפליקציה בעברית · RTL נדלק פעם אחת בעליית התהליך */
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const CATEGORY_SCREENS: CategoryKey[] = ['cous', 'schn', 'box', 'fruit', 'chef'];

/* מסכי הניהול · נאב-בר משלהם, נפרד מזה של הלקוחה */
const ADMIN_SCREENS: Screen[] = ['admin', 'adminOrders', 'adminStock', 'adminMoney'];

const TODO_TITLES: Partial<Record<Screen, string>> = {
  orders: 'ההזמנות שלי',
  profile: 'אזור אישי',
  admin: 'בית · ניהול',
  adminStock: 'ניהול · מלאי',
  adminMoney: 'ניהול · כספים',
};

function Router() {
  const { screen } = useNav();

  if (screen === 'guest' || screen === 'main') return <HomeScreen />;
  if (screen === 'login') return <LoginScreen mode="in" />;
  if (screen === 'signup') return <LoginScreen mode="up" />;
  if (screen === 'cous') return <CouscousScreen />;
  if (screen === 'schn') return <SchnitzelScreen />;
  if (screen === 'fruit') return <FruitScreen />;
  if (screen === 'box') return <BoxesScreen />;
  if (screen === 'chef') return <ChefScreen />;
  if (screen === 'adminOrders') return <AdminOrdersScreen />;
  if (CATEGORY_SCREENS.includes(screen as CategoryKey))
    return <CategoryScreen categoryKey={screen as CategoryKey} />;

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
  const { screen } = useNav();
  return ADMIN_SCREENS.includes(screen) ? <AdminNav /> : <BottomNav />;
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
