import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { HOME_PHOTOS } from '../data/photos';
import { IS_RTL } from '../theme/rtl';
import { Photo } from './Photo';

/* המידות מהקנבס · אריח 116×140, מרווח 10, פינה 18 */
const TILE_W = 116;
const TILE_H = 140;
const GAP = 10;
const PITCH = TILE_W + GAP;
/* הרצועה רצה סיבוב מלא ב-34 שניות · כמו reelRun בקנבס */
const LOOP_MS = 34000;

/** עשר תמונות הבית · מגיעות מ-photos.ts, לא מוקלדות כאן */
const SHOTS = HOME_PHOTOS;
/* גוון המותג · הרצועה אינה שייכת לקטגוריה אחת */
const REEL_RGB = '201,162,39';

/**
 * רצועת התמונות · נגללת בלולאה אינסופית, ולחיצה פותחת את התמונה במסך מלא.
 * הרצועה מוכפלת כדי שהלולאה תיסגר בלי קפיצה, בדיוק כמו בקנבס.
 */
export function PhotoReel() {
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    /* ב-RTL הרצועה זורמת לכיוון ההפוך · translateX שלילי מוציא אותה מהמסך */
    const span = SHOTS.length * PITCH * (IS_RTL ? 1 : -1);
    const run = Animated.loop(
      Animated.timing(x, {
        toValue: span,
        duration: LOOP_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    run.start();
    return () => run.stop();
  }, [x]);

  return (
    <View style={s.reel}>
        <Animated.View style={[s.track, { transform: [{ translateX: x }] }]}>
          {[...SHOTS, ...SHOTS].map((sh, i) => (
            <View key={`${sh}-${i}`} style={s.tile}>
              {/* ההגדלה מגיעה מ-Photo · הרצועה כבר לא מחזיקה חלונית משלה */}
              <Photo name={sh} rgb={REEL_RGB} style={s.tileImg} />
              {/* הצללה בתחתית · כמו הגרדיאנט שעל האריח בקנבס */}
              <Svg style={s.fade} width={TILE_W} height={TILE_H} pointerEvents="none">
                <Defs>
                  <LinearGradient id="tileFade" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="52%" stopColor="#14100C" stopOpacity={0} />
                    <Stop offset="100%" stopColor="#14100C" stopOpacity={0.34} />
                  </LinearGradient>
                </Defs>
                <Rect x={0} y={0} width={TILE_W} height={TILE_H} fill="url(#tileFade)" />
              </Svg>
            </View>
          ))}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  reel: { width: '100%', marginTop: 10, marginBottom: 40, borderRadius: 18, overflow: 'hidden' },
  track: { flexDirection: 'row', gap: GAP },
  tile: {
    width: TILE_W,
    height: TILE_H,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  /* התמונה ממלאת את כל האריח כולל מתחת למסגרת · כמו background-image בקנבס */
  tileImg: { position: 'absolute', top: 0, left: 0, width: TILE_W, height: TILE_H },
  fade: { position: 'absolute', top: 0, left: 0 },
});
