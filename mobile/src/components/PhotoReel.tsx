import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { HOME_PHOTOS } from '../data/photos';
import { IS_RTL } from '../theme/rtl';
import { Photo } from './Photo';
import { useLightboxOpen } from './lightboxContext';
import { photoTitle } from '../data/photoTitles';
import { NO_TOUCH } from '../theme/pointerEvents';

/* המידות מהקנבס · אריח 116×140, מרווח 10, פינה 18 */
const TILE_W = 116;
const TILE_H = 140;
const GAP = 10;
const PITCH = TILE_W + GAP;
/* הרצועה רצה סיבוב מלא ב-34 שניות · כמו reelRun בקנבס */
const LOOP_MS = 34000;

/** עשר תמונות הבית · מגיעות מ-photos.ts, לא מוקלדות כאן */
const SHOTS = HOME_PHOTOS;
/** המרווח מתחת לרצועה · `margin-bottom: 40px` בקנבס */
export const REEL_BOTTOM = 40;
/* גוון המותג · הרצועה אינה שייכת לקטגוריה אחת */
const REEL_RGB = '201,162,39';

/**
 * רצועת התמונות · נגללת בלולאה אינסופית, ולחיצה פותחת את התמונה במסך מלא
 * **ועוצרת את הריצה** עד שהתמונה נסגרת.
 * הרצועה מוכפלת כדי שהלולאה תיסגר בלי קפיצה, בדיוק כמו בקנבס.
 *
 * ⚠ **אין כיתוב על האריח** · היה כאן שם על כל תמונה, ושקד ביקשה
 * שהשם יופיע **רק** בתצוגה המלאה. הוא ממשיך לעבור ל-`Lightbox`
 * דרך `title`, ולכן לחיצה עדיין פותחת את התמונה עם שמה.
 */
export function PhotoReel() {
  const x = useRef(new Animated.Value(0)).current;
  /* המיקום הנוכחי · נדרש כדי להמשיך מאותה נקודה אחרי עצירה */
  const at = useRef(0);
  const anim = useRef<Animated.CompositeAnimation | null>(null);
  /**
   * ⚠ שקד ביקשה שהרצועה תיעצר כשנפתחת תמונה. `Animated.loop` לא
   * ניתן להשהיה ולהמשך, ולכן הלולאה נבנית ידנית: כל סיבוב הוא
   * timing אחד שמפעיל את הבא. עצירה משאירה את המיקום, וההמשך
   * מחשב את הזמן שנותר לפי המרחק שנותר.
   */
  const paused = useLightboxOpen();

  /* ב-RTL הרצועה זורמת לכיוון ההפוך · translateX שלילי מוציא אותה מהמסך */
  const span = SHOTS.length * PITCH * (IS_RTL ? 1 : -1);

  const runFrom = useCallback(
    (from: number) => {
      const left = 1 - Math.abs(from) / Math.abs(span);
      x.setValue(from);
      const step = Animated.timing(x, {
        toValue: span,
        duration: Math.max(0, LOOP_MS * left),
        easing: Easing.linear,
        useNativeDriver: true,
      });
      anim.current = step;
      step.start(({ finished }) => {
        if (finished) runFrom(0);
      });
    },
    [span, x],
  );

  useEffect(() => {
    const id = x.addListener(({ value }) => {
      at.current = value;
    });
    return () => x.removeListener(id);
  }, [x]);

  useEffect(() => {
    if (paused) {
      anim.current?.stop();
      return;
    }
    runFrom(at.current);
    return () => anim.current?.stop();
  }, [paused, runFrom]);

  return (
    <View style={s.reel}>
        <Animated.View style={[s.track, { transform: [{ translateX: x }] }]}>
          {[...SHOTS, ...SHOTS].map((sh, i) => (
            <View key={`${sh}-${i}`} style={s.tile}>
              {/* ההגדלה מגיעה מ-Photo · הרצועה כבר לא מחזיקה חלונית משלה */}
              <Photo name={sh} rgb={REEL_RGB} style={s.tileImg} title={photoTitle(sh)} />
              {/* הצללה בתחתית · כמו הגרדיאנט שעל האריח בקנבס */}
              <Svg style={[s.fade, NO_TOUCH]} width={TILE_W} height={TILE_H}>
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
  reel: { width: '100%', marginTop: 10, marginBottom: REEL_BOTTOM, borderRadius: 18, overflow: 'hidden' },
  track: { flexDirection: 'row', gap: GAP },
  tile: {
    width: TILE_W,
    height: TILE_H,
    /* ⚠ סמן היד על כל האריח · הוא הגיע עד עכשיו מה-Pressable
       שבתוך `Photo` בלבד, ולכן המסגרת ושוליה נשארו בסמן רגיל.
       בנייד אין סמן והמאפיין פשוט לא חל. */
    cursor: 'pointer',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  /* התמונה ממלאת את כל האריח כולל מתחת למסגרת · כמו background-image בקנבס */
  tileImg: { position: 'absolute', top: 0, left: 0, width: TILE_W, height: TILE_H },
  fade: { position: 'absolute', top: 0, left: 0 },
});
