import React from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { SymbolView, type SFSymbol, type SymbolViewProps } from 'expo-symbols';

/**
 * אייקוני אפל · SF Symbols.
 *
 * שקד ביקשה (16 בספטמבר 2026) להעביר את האייקונים ל-SF Symbols,
 * כולם ב-indigo בשקיפות 70%, עם אפקט תנועה לכל אחד.
 *
 * ⚠ **מה שנתמך ומה שלא** · נבדק מול הקוד של `expo-symbols@57.0.3`
 * שמותקן כאן, ולא מהתיעוד:
 *
 * · `AnimationType` הוא **`'bounce' | 'pulse' | 'scale'` בלבד**.
 *   ה-bounce שביקשה עובר אחד לאחד, כולל `wholeSymbol` מול `byLayer`
 *   ו-`nonRepeating`.
 * · **wiggle, rotate, drawOn ו-appear אינם קיימים** בגשר של אקספו.
 *   מי שביקשה אותם מקבלת כאן תנועה שכתבתי ב-`Animated` — הסמל הוא
 *   של אפל, התנועה היא קירוב שלי. מסומן בטבלה למטה.
 * · `animationSpec` הוא **iOS בלבד**. באנדרואיד ובדפדפן הסמל סטטי.
 *
 * ⚠ **בדפדפן ובאנדרואיד אלה אינם SF Symbols** · `expo-symbols` ממפה
 * שם ל-Material Symbols של גוגל. הצורות דומות אך לא זהות, ולכן מה
 * ששקד רואה בדפדפן אינו בדיוק מה שתראה באייפון.
 */

/** systemIndigo של אפל בשקיפות 70% · הבקשה של שקד */
export const INDIGO_70 = 'rgba(88,86,214,0.7)';

/** התנועות שהגשר של אקספו באמת יודע */
type NativeMotion = 'bounceWhole' | 'bounceLayer' | 'bounceRepeat';
/** התנועות שאפל מגדירה ואקספו אינו חושף · נכתבו כאן ב-Animated */
type OurMotion = 'wiggle' | 'wiggleRepeat' | 'rotate' | 'drawOn' | 'appear';
export type Motion = NativeMotion | OurMotion | 'none';

const NATIVE: Record<NativeMotion, SymbolViewProps['animationSpec']> = {
  bounceWhole: { effect: { type: 'bounce', wholeSymbol: true, direction: 'up' }, repeating: false },
  bounceLayer: { effect: { type: 'bounce', wholeSymbol: false, direction: 'up' }, repeating: false },
  bounceRepeat: { effect: { type: 'bounce', wholeSymbol: true, direction: 'up' }, repeating: true },
};
const isNative = (m: Motion): m is NativeMotion => m in NATIVE;

type Props = {
  ios: SFSymbol;
  /** שם ב-Material Symbols · לאנדרואיד ולדפדפן */
  other?: string;
  size?: number;
  color?: string;
  motion?: Motion;
  /** ציור משלנו כשאין סמל מתאים בפלטפורמה */
  fallback?: React.ReactNode;
};

/**
 * עטיפת התנועה · רק למה שאקספו אינו יודע לעשות.
 * ⚠ רצה גם בדפדפן, ולכן דווקא שם היא מה שנותן חיים לסמלים.
 */
function Moving({ motion, children }: { motion: OurMotion; children: React.ReactNode }) {
  const v = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const once = (duration: number, easing = Easing.out(Easing.cubic)) =>
      Animated.timing(v, { toValue: 1, duration, easing, useNativeDriver: true });

    const anim =
      motion === 'wiggleRepeat'
        ? Animated.loop(
            Animated.sequence([
              Animated.timing(v, { toValue: 1, duration: 140, useNativeDriver: true }),
              Animated.timing(v, { toValue: 0, duration: 140, useNativeDriver: true }),
              Animated.delay(2600),
            ]),
          )
        : motion === 'wiggle'
          ? Animated.sequence([
              Animated.timing(v, { toValue: 1, duration: 130, useNativeDriver: true }),
              Animated.timing(v, { toValue: 0, duration: 130, useNativeDriver: true }),
            ])
          : once(motion === 'rotate' ? 620 : 420);
    anim.start();
    return () => anim.stop();
  }, [motion, v]);

  const style =
    motion === 'wiggle' || motion === 'wiggleRepeat'
      ? { transform: [{ rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '13deg'] }) }] }
      : motion === 'rotate'
        ? { transform: [{ rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }
        : motion === 'drawOn'
          ? { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }
          : { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) }] };

  return <Animated.View style={style}>{children}</Animated.View>;
}

export function Sym({ ios, other, size = 24, color = INDIGO_70, motion = 'none', fallback }: Props) {
  const name = other ? ({ ios, android: other, web: other } as SymbolViewProps['name']) : ios;

  const symbol = (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
      type="monochrome"
      resizeMode="scaleAspectFit"
      animationSpec={isNative(motion) ? NATIVE[motion] : undefined}
      fallback={fallback ?? <View style={{ width: size, height: size }} />}
      style={{ width: size, height: size }}
    />
  );

  if (motion === 'none' || isNative(motion)) return symbol;
  return <Moving motion={motion}>{symbol}</Moving>;
}

/**
 * מפת הסמלים · שם אחד למקום אחד, כדי שלא יתפזרו בקוד.
 * המפתחות בעברית הם מה ששקד כתבה בבקשה.
 */
export const SYM = {
  personalArea: { ios: 'person.fill', other: 'person', motion: 'bounceLayer' },
  orders: { ios: 'receipt.fill', other: 'receipt_long', motion: 'bounceWhole' },
  home: { ios: 'house', other: 'home', motion: 'bounceLayer' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', other: 'logout', motion: 'bounceWhole' },
  camera: { ios: 'camera.fill', other: 'photo_camera', motion: 'bounceWhole' },
  eyeShut: { ios: 'eye.fill', other: 'visibility', motion: 'bounceWhole' },
  eyeOpen: { ios: 'eye.slash.fill', other: 'visibility_off', motion: 'bounceWhole' },
  phone: { ios: 'phone.fill', other: 'call', motion: 'bounceWhole' },
  /* ⚠ wiggle אינו בגשר · התנועה כאן שלי */
  lock: { ios: 'lock.fill', other: 'lock', motion: 'wiggle' },
  /**
   * ⚠ **שונה ב-16.9.2026** · היו plus/minus.arrow.trianglehead, שמגיעים
   * עם טבעת משלהם. שקד ראתה את זה בתוך העיגול הקיים, לא אהבה, וביקשה
   * לחזור לעיגול עם אייקון פשוט בתוכו. ⚠ `drawOn` אינו קיים בגשר של
   * אקספו — התנועה כאן נכתבה ב-Animated והיא קירוב.
   */
  plus: { ios: 'plus', other: 'add', motion: 'drawOn' },
  minus: { ios: 'minus', other: 'remove', motion: 'drawOn' },
  faceId: { ios: 'faceid', other: 'face', motion: 'bounceWhole' },
  male: { ios: 'mustache', other: 'face', motion: 'bounceWhole' },
  female: { ios: 'mouth', other: 'mood', motion: 'bounceWhole' },
  other: { ios: 'brain', other: 'psychology', motion: 'bounceWhole' },
  /* ⚠ wiggle חוזר · שקד ביקשה חזרה מחזורית */
  bell: { ios: 'bell.and.waves.left.and.right.fill', other: 'notifications_active', motion: 'wiggleRepeat' },
  /* ⚠ drawOn אינו בגשר · קירוב */
  pickup: { ios: 'mappin.and.ellipse', other: 'location_on', motion: 'drawOn' },
  /* ⚠ rotate אינו בגשר · קירוב */
  delivery: { ios: 'paperplane', other: 'send', motion: 'rotate' },
  shopping: { ios: 'cart', other: 'shopping_cart', motion: 'wiggle' },
  saleDays: { ios: 'calendar.and.person', other: 'event', motion: 'wiggle' },
  /* ⚠ appear אינו בגשר · קירוב */
  money: { ios: 'chart.bar.xaxis', other: 'bar_chart', motion: 'appear' },
} as const satisfies Record<string, { ios: SFSymbol; other: string; motion: Motion }>;

/** קיצור · <S k="home" size={22} /> */
export function S({ k, size, color }: { k: keyof typeof SYM; size?: number; color?: string }) {
  const c = SYM[k];
  return <Sym ios={c.ios} other={c.other} motion={c.motion} size={size} color={color} />;
}

export const symStyles = StyleSheet.create({});
