import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

/** גובה הצ׳יפ · חייב להיקבע במפורש, אחרת ה-ScrollView האופקי קורס או נמתח */
const RAIL_HEIGHT = 38;

/**
 * רצועת צ׳יפים אופקית נגללת.
 * ל-ScrollView של React Native יש flexGrow: 1, ובתוך עמודה הוא בולע
 * את הגובה הפנוי (או קורס ל-0 ואז הצ׳יפים דורסים את מה שמתחת).
 * הגובה הקבוע כאן מונע את שניהם.
 */
export function ChipRail({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={s.rail}
      contentContainerStyle={s.content}
    >
      {children}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  /* width מגביל את הרצועה לרוחב המסך · בלעדיו התוכן הרחב מותח את כל העמודה */
  rail: { flexGrow: 0, flexShrink: 0, height: RAIL_HEIGHT },
  content: { gap: 6, alignItems: 'center' },
});
