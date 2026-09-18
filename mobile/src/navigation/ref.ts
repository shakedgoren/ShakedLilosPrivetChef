import { createNavigationContainerRef } from '@react-navigation/native';

/**
 * הפניה לנוויגטור · הדרך לנווט **מחוץ** למסך.
 *
 * ⚠ **נוצר ב-18 בספטמבר 2026 · שלב 2 במעבר לניווט נייטיבי** · חנות
 * הניווט (`store.tsx`) אינה יושבת בתוך מסך, ולכן `useNavigation`
 * אינו זמין לה. ההפניה היא הדפוס הרשמי למקרה הזה.
 *
 * ⚠ **טיפוס רופף בכוונה** · טיפוס הדוק היה מחייב לייבא את `Screen`
 * מהחנות, והחנות מייבאת את ההפניה הזו — מעגל. שמות המסכים נשמרים
 * בכל מקרה על ידי `SCREENS` בחנות.
 */
export const navigationRef = createNavigationContainerRef<Record<string, undefined>>();

/** ניווט בטוח · לפני שהמכל עלה אין למי לפנות */
export const navReady = (): boolean => navigationRef.isReady();
