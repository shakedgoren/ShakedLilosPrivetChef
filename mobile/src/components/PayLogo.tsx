import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

/**
 * לוגו אמצעי התשלום · תמונות אמיתיות ולא אייקוני קו.
 *
 * ⚠ שקד שלחה את ארבעת הקבצים (16 בספטמבר 2026). אלה סימני מסחר של
 * החברות, ולכן הם מוצגים כמו שהם ולא נצבעים.
 *
 * ⚠ **המיפוי לפי אמצעי התשלום ולא לפי שם הרכיב הישן** · ברשימה
 * ששקד שלחה כל קובץ הוצמד לשם של אייקון קיים, אבל השמות ההם היו
 * מחוברים לאמצעי תשלום **אחרים**: `PayPhone` שימש את ביט, `PayWallet`
 * את פייבוקס ו-`PayContactless` את אפל פיי. מיפוי מילולי לפי השם
 * היה שם את הלוגו של אפל פיי על ביט. כאן ההצמדה היא לפי מה שכתוב
 * בעברית לצד כל קובץ, וזו הכוונה.
 *
 * ⚠ `Bit_logo.svg` הומר ל-`bit-logo.png` · ריאקט-נייטיב אינו טוען
 * קובצי SVG בלי טרנספורמר ב-Metro, והמרה אחת חוסכת תלות שלמה.
 *
 * ⚠ **הקובץ מבוקש בלי `@3x`** · זו מוסכמת הצפיפות של Metro: הוא
 * מקבל את השם הבסיסי ובוחר בעצמו את הווריאנט. בקשה ישירה של
 * `Pay-box-logo@3x.webp` נכשלת ב-UnableToResolveError, והאפליקציה
 * עולה ריקה. נמדד.
 */

const LOGOS: Record<string, { src: number; ratio: number }> = {
  'מזומן': { src: require('../../assets/money.png'), ratio: 1 },
  'אפל פיי': { src: require('../../assets/apple-pay.png'), ratio: 1 },
  'ביט': { src: require('../../assets/bit-logo.png'), ratio: 1 },
  'פייבוקס': { src: require('../../assets/Pay-box-logo.webp'), ratio: 414 / 114 },
};

export const PAY_METHODS = Object.keys(LOGOS);

type Props = {
  method: string;
  size?: number;
  /**
   * הרוחב המרבי · הלוגו מתכווץ כדי להיכנס.
   * ⚠ **בקשה של שקד (17 בספטמבר 2026)** · ״האייקון של פייבוקס
   * צריך להיות קטן יותר שלא יצא מהמסגרת״. פייבוקס מלבני ביחס
   * 414:114, ולכן בגובה 38 הוא יצא ברוחב 138 — רחב מהאריח עצמו.
   */
  maxWidth?: number;
};

/**
 * הגובה הוא מה שקובע · רוחב נגזר מיחס הצדדים של הקובץ, כדי
 * שהלוגו המלבני של פייבוקס לא ייראה מעוך לצד הריבועיים.
 */
export function PayLogo({ method, size = 24, maxWidth }: Props) {
  const logo = LOGOS[method];
  if (!logo) return <View style={{ width: size, height: size }} />;
  /* הגובה יורד כשהרוחב לא נכנס · היחס נשמר */
  const h = maxWidth ? Math.min(size, maxWidth / logo.ratio) : size;
  return (
    <View style={[s.box, { height: h, width: h * logo.ratio }]}>
      <Image source={logo.src} style={s.img} resizeMode="contain" accessibilityLabel={method} />
    </View>
  );
}

const s = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  img: { width: '100%', height: '100%' },
});
