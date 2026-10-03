import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { surface, type CategoryKey } from '../theme/tokens';
import type { Screen } from './store';
import { HomeScreen } from '../screens/HomeScreen';

const CATEGORY_SCREENS: CategoryKey[] = ['cous', 'schn', 'box', 'fruit', 'chef'];

function named(loader: () => Promise<Record<string, React.ComponentType<any>>>, exportName: string) {
  return React.lazy(async () => {
    const mod = await loader();
    return { default: mod[exportName] };
  });
}

const IconSheetScreen = named(() => import('../screens/IconSheetScreen'), 'IconSheetScreen');
const LoginScreen = named(() => import('../screens/LoginScreen'), 'LoginScreen');
const CategoryScreen = named(() => import('../screens/CategoryScreen'), 'CategoryScreen');
const CouscousScreen = named(() => import('../screens/couscous/CouscousScreen'), 'CouscousScreen');
const SchnitzelScreen = named(() => import('../screens/schnitzel/SchnitzelScreen'), 'SchnitzelScreen');
const FruitScreen = named(() => import('../screens/fruit/FruitScreen'), 'FruitScreen');
const BoxesScreen = named(() => import('../screens/boxes/BoxesScreen'), 'BoxesScreen');
const ChefScreen = named(() => import('../screens/chef/ChefScreen'), 'ChefScreen');
const MyOrdersScreen = named(() => import('../screens/orders/MyOrdersScreen'), 'MyOrdersScreen');
const ProfileScreen = named(() => import('../screens/profile/ProfileScreen'), 'ProfileScreen');
const AdminHomeScreen = named(() => import('../admin/AdminHomeScreen'), 'AdminHomeScreen');
const AdminOrdersScreen = named(() => import('../admin/AdminOrdersScreen'), 'AdminOrdersScreen');
const AdminDaysScreen = named(() => import('../admin/AdminDaysScreen'), 'AdminDaysScreen');
const AdminStockScreen = named(() => import('../admin/AdminStockScreen'), 'AdminStockScreen');
const AdminShoppingScreen = named(() => import('../admin/AdminShoppingScreen'), 'AdminShoppingScreen');
const AdminMoneyScreen = named(() => import('../admin/AdminMoneyScreen'), 'AdminMoneyScreen');
const AdminCustomersScreen = named(() => import('../admin/AdminCustomersScreen'), 'AdminCustomersScreen');
const AdminMenuScreen = named(() => import('../admin/AdminMenuScreen'), 'AdminMenuScreen');
const AdminCostsScreen = named(() => import('../admin/AdminCostsScreen'), 'AdminCostsScreen');
const AdminHistoryScreen = named(() => import('../admin/AdminHistoryScreen'), 'AdminHistoryScreen');
const AdminOrderHistoryScreen = named(
  () => import('../admin/AdminOrderHistoryScreen'),
  'AdminOrderHistoryScreen',
);
const AdminBoardScreen = named(() => import('../admin/AdminBoardScreen'), 'AdminBoardScreen');
const AdminExpensesScreen = named(() => import('../admin/AdminExpensesScreen'), 'AdminExpensesScreen');
const AdminIncomeScreen = named(() => import('../admin/AdminIncomeScreen'), 'AdminIncomeScreen');

/**
 * גוף המסך בדפדפן · דף הבית בבאנדל הראשון, כל השאר נטען בכניסה.
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
