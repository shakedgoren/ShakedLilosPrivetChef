import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { HOME_PHOTOS } from '../data/photos';
import { a, surface } from '../theme/tokens';
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
  const [shot, setShot] = useState(-1);
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const span = SHOTS.length * PITCH;
    const run = Animated.loop(
      Animated.timing(x, {
        toValue: -span,
        duration: LOOP_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    run.start();
    return () => run.stop();
  }, [x]);

  const open = shot >= 0 ? SHOTS[shot] : null;

  return (
    <>
      <View style={s.reel}>
        <Animated.View style={[s.track, { transform: [{ translateX: x }] }]}>
          {[...SHOTS, ...SHOTS].map((sh, i) => (
            <Pressable key={`${sh}-${i}`} onPress={() => setShot(i % SHOTS.length)} style={s.tile}>
              <Photo name={sh} rgb={REEL_RGB} style={s.tileImg} />
              {/* הצללה בתחתית · כמו הגרדיאנט שעל האריח בקנבס */}
              <Svg style={s.fade} width={TILE_W} height={TILE_H}>
                <Defs>
                  <LinearGradient id="tileFade" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="52%" stopColor="#14100C" stopOpacity={0} />
                    <Stop offset="100%" stopColor="#14100C" stopOpacity={0.34} />
                  </LinearGradient>
                </Defs>
                <Rect x={0} y={0} width={TILE_W} height={TILE_H} fill="url(#tileFade)" />
              </Svg>
            </Pressable>
          ))}
        </Animated.View>
      </View>

      {open ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setShot(-1)}>
          <Pressable style={s.scrim} onPress={() => setShot(-1)} />
          <View style={s.shotWrap} pointerEvents="box-none">
            <Photo
              name={open}
              rgb={REEL_RGB}
              style={[s.shotImg, { backgroundColor: a(REEL_RGB, 0.2) }]}
            />
          </View>
          <Pressable onPress={() => setShot(-1)} style={s.close} hitSlop={8}>
            <Text style={s.closeGlyph}>✕</Text>
          </Pressable>
        </Modal>
      ) : null}
    </>
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

  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(28,23,20,0.5)' },
  shotWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 24,
  },
  shotImg: {
    width: '100%',
    height: 400,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  close: {
    position: 'absolute',
    left: 18,
    top: 30,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGlyph: { fontSize: 14, color: '#FFFFFF' },
});
