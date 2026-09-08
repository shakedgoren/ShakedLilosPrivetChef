import React from 'react';
import { I18nManager, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavProvider, useNav } from './src/navigation/store';
import { BottomNav } from './src/components/BottomNav';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { CategoryScreen } from './src/screens/CategoryScreen';
import { CouscousScreen } from './src/screens/couscous/CouscousScreen';
import { SchnitzelScreen } from './src/screens/schnitzel/SchnitzelScreen';
import { FruitScreen } from './src/screens/fruit/FruitScreen';
import { surface } from './src/theme/tokens';
import type { CategoryKey } from './src/theme/tokens';

/* האפליקציה בעברית · RTL נדלק פעם אחת בעליית התהליך */
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const CATEGORY_SCREENS: CategoryKey[] = ['cous', 'schn', 'box', 'fruit', 'chef'];

function Router() {
  const { screen } = useNav();

  if (screen === 'guest' || screen === 'main') return <HomeScreen />;
  if (screen === 'login') return <LoginScreen mode="in" />;
  if (screen === 'signup') return <LoginScreen mode="up" />;
  if (screen === 'cous') return <CouscousScreen />;
  if (screen === 'schn') return <SchnitzelScreen />;
  if (screen === 'fruit') return <FruitScreen />;
  if (CATEGORY_SCREENS.includes(screen as CategoryKey))
    return <CategoryScreen categoryKey={screen as CategoryKey} />;

  /* הזמנות ואזור אישי · טרם הועברו מהעיצוב */
  return (
    <View style={s.todo}>
      <Text style={s.todoText}>{screen === 'orders' ? 'ההזמנות שלי' : 'אזור אישי'}</Text>
      <Text style={s.todoSub}>המסך הזה עדיין לא הועבר מהעיצוב</Text>
    </View>
  );
}

export default function App() {
  return (
    <NavProvider>
      <SafeAreaView style={s.root}>
        <StatusBar style="dark" />
        <Router />
        <BottomNav />
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
