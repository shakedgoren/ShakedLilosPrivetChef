import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { LAV, SOFT_SHADOW } from './NightSky';

/**
 * הכרטיס · הרקע החוזר של כל לוח בדשבורד.
 *
 * ⚠ **עבר מזכוכית ל-Soft 3D** · שקד בחרה (15 בספטמבר 2026) את
 * ערכת ״לבנדר״ בהשראת ה-Soft 3D ששלחה. פינות שמנות יותר (26),
 * וצל רך בשתי שכבות במקום צל אחד — שכבה אחת נראית שטוחה.
 * הגוון עצמו מגיע מהמשתמש בכרטיס, לפי מקומו בגרדיאנט של הדף.
 */
export function GlassCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}) {
  return <View style={[s.card, style]}>{children}</View>;
}

const s = StyleSheet.create({
  card: {
    borderRadius: 26,
    backgroundColor: LAV.tints[1],
    borderWidth: 1,
    borderColor: LAV.edge,
    boxShadow: SOFT_SHADOW,
  } as never,
});
