import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { surface, type CategoryKey } from '../theme/tokens';
import type { Screen } from './store';

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
import { AdminOrderHistoryScreen } from '../admin/AdminOrderHistoryScreen';
import { AdminBoardScreen } from '../admin/AdminBoardScreen';
import { AdminExpensesScreen } from '../admin/AdminExpensesScreen';
import { AdminIncomeScreen } from '../admin/AdminIncomeScreen';

const CATEGORY_SCREENS: CategoryKey[] = ['cous', 'schn', 'box', 'fruit', 'chef'];

/**
 * גוף המסך במכשיר · ייבוא סטטי, כמו שהיה.
 * בדפדפן screenBody.web.tsx טוען את מה שאינו דף הבית רק בכניסה אליו.
 */
export function ScreenBody({ screen }: { screen: Screen }) {
  if (screen === 'icons') return <IconSheetScreen />;
  if (screen === 'guest' || screen === 'main') return <HomeScreen />;
  if (screen === 'login') return <LoginScreen mode="in" />;
  if (screen === 'signup') return <LoginScreen mode="up" />;
  if (screen === 'cous') return <CouscousScreen />;
  if (screen === 'schn') return <SchnitzelScreen />;
  if (screen === 'fruit') return <FruitScreen />;
  if (screen === 'box') return <BoxesScreen />;
  if (screen === 'chef') return <ChefScreen />;
  if (screen === 'orders') return <MyOrdersScreen />;
  if (screen === 'profile') return <ProfileScreen />;
  if (screen === 'admin') return <AdminHomeScreen />;
  if (screen === 'adminOrders') return <AdminOrdersScreen />;
  if (screen === 'adminDays') return <AdminDaysScreen />;
  if (screen === 'adminStock') return <AdminStockScreen />;
  if (screen === 'adminShopping') return <AdminShoppingScreen />;
  if (screen === 'adminMoney') return <AdminMoneyScreen />;
  if (screen === 'adminCustomers') return <AdminCustomersScreen />;
  if (screen === 'adminMenu') return <AdminMenuScreen />;
  if (screen === 'adminCosts') return <AdminCostsScreen />;
  if (screen === 'adminHistory') return <AdminHistoryScreen />;
  if (screen === 'adminOrderHistory') return <AdminOrderHistoryScreen />;
  if (screen === 'adminBoard') return <AdminBoardScreen />;
  if (screen === 'adminExpenses') return <AdminExpensesScreen />;
  if (screen === 'adminIncome') return <AdminIncomeScreen />;
  if (CATEGORY_SCREENS.includes(screen as CategoryKey))
    return <CategoryScreen categoryKey={screen as CategoryKey} />;

  return (
    <View style={s.todo}>
      <Text style={s.todoText}>{screen}</Text>
      <Text style={s.todoSub}>מסך לא מוכר</Text>
    </View>
  );
}

const s = StyleSheet.create({
  todo: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  todoText: { fontSize: 20, fontWeight: '600', color: surface.ink },
  todoSub: { fontSize: 13, color: surface.muted },
});
