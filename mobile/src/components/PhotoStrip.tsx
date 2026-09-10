import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Photo } from './Photo';
import { ChevronLeft, ChevronRight } from '../icons';
import { IS_RTL } from '../theme/rtl';
import { radius } from '../theme/tokens';

type Props = {
  names: readonly string[];
  /** גובה האריח */
  height: number;
  /** רוחב אריח · בלי זה כל תמונה ממלאת את הרוחב */
  tileWidth?: number;
  rgb?: string;
  /**
   * כמה פיקסלים תופסים הריפודים משני הצדדים עד לקרוסלה.
   * ⚠ נחוץ · onLayout על העוטף מחזיר כאן 0, ו-Photo עוטפת את
   * התמונה ב-Pressable בשביל ההגדלה — עטיפה בלי רוחב מתכווצת
   * לאפס והקרוסלה נעלמת. הרוחב נגזר מרוחב המסך פחות הריפודים.
   */
  inset?: number;
};

/* מעל הסף הזה הנקודות נעשות עמוסות · מחליקים בלעדיהן */
const MAX_DOTS = 6;
/* המרווח בין אריחים · חייב להתאים ל-s.gap */
const TILE_GAP = 10;

/**
 * חצי הניווט · המידות מהקרוסלה של מפות ההגעה בקנבס — עיגול 30,
 * לבן 0.92 עם צל, וחץ 15 בעובי 2.4.
 * ⚠ הכיוון שונה מהקנבס · שם החצים מצביעים פנימה, ושקד ביקשה
 * שיצביעו החוצה — ימינה בצד ימין ושמאלה בצד שמאל.
 */
const ARROW = 30;
const ARROW_GLYPH = 15;
const ARROW_STROKE = 2.4;

/** ⚠ ב-RTL ההיסט האופקי שלילי · הכיוון נגזר מ-rtl.ts ולא מהמדידה */
const DIR = IS_RTL ? -1 : 1;

/** קרוסלת תמונות אופקית · בית, שף וטאבון */
export function PhotoStrip({ names, height, tileWidth, rgb, inset = 0 }: Props) {
  const [i, setI] = useState(0);
  const [pageW, setPageW] = useState(0);
  const strip = useRef<ScrollView>(null);
  const win = useWindowDimensions();
  if (names.length === 0) return null;

  const paging = tileWidth == null;
  /* המדידה גוברת כשהיא מגיעה · אחרת רוחב המסך פחות הריפודים */
  const shotW = tileWidth ?? (pageW || Math.max(0, win.width - inset));
  /* מרווח בין מרכזי אריחים · זהה לחישוב ב-onMomentumScrollEnd */
  const pitch = tileWidth ? tileWidth + TILE_GAP : pageW;

  const last = names.length - 1;

  /* לחיצה על נקודה או על חץ מגלגלת לתמונה · בלי זה המחוון זז והתמונה נשארת */
  const jump = (k: number) => {
    const next = Math.max(0, Math.min(last, k));
    setI(next);
    /* ⚠ בלי animated · גלילה חלקה אל היסט שלילי ב-RTL נחסמת בדפדפן
       והמסלול נשאר במקום. השמה ישירה עובדת, ונמדדה. */
    if (pitch) strip.current?.scrollTo({ x: DIR * next * pitch, animated: false });
  };

  return (
    /**
     * ⚠ הרוחב חייב להימדד כאן · Photo עוטפת את התמונה ב-Pressable
     * בשביל ההגדלה, ועטיפה בלי מידות מתכווצת לאפס. כשהמדידה על
     * ה-ScrollView או על גודל התוכן נוצר מעגל — הרוחב תלוי בילדים
     * והילדים תלויים ברוחב — והקרוסלה קרסה.
     */
    <View onLayout={(e) => setPageW(e.nativeEvent.layout.width)}>
      <ScrollView
        ref={strip}
        horizontal
        pagingEnabled={paging}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={tileWidth ? tileWidth + TILE_GAP : undefined}
        contentContainerStyle={tileWidth ? s.gap : undefined}
        onMomentumScrollEnd={(e) => {
          const w = tileWidth ? tileWidth + TILE_GAP : e.nativeEvent.layoutMeasurement.width;
          if (!w) return;
          /* ⚠ ב-RTL ההיסט יוצא שלילי · בלי abs האינדקס נחתך ל-0 */
          setI(Math.round(Math.abs(e.nativeEvent.contentOffset.x) / w));
        }}
      >
        {names.map((name) => (
          <Photo
            key={name}
            name={name}
            rgb={rgb}
            style={[s.shot, { height, width: shotW, borderRadius: radius.tile }]}
          />
        ))}
      </ScrollView>

      {/* החצים · בלעדיהם לא היה מובן שיש עוד תמונות בקרוסלה */}
      {names.length > 1 ? (
        <>
          <Pressable
            onPress={() => jump(i - 1)}
            style={[s.arrow, s.arrowRight, { top: height / 2 - ARROW / 2 }, i === 0 && s.arrowOff]}
            hitSlop={6}
          >
            <ChevronRight size={ARROW_GLYPH} color={ARROW_INK} strokeWidth={ARROW_STROKE} />
          </Pressable>
          <Pressable
            onPress={() => jump(i + 1)}
            style={[s.arrow, s.arrowLeft, { top: height / 2 - ARROW / 2 }, i === last && s.arrowOff]}
            hitSlop={6}
          >
            <ChevronLeft size={ARROW_GLYPH} color={ARROW_INK} strokeWidth={ARROW_STROKE} />
          </Pressable>
        </>
      ) : null}

      {paging && names.length > 1 && names.length <= MAX_DOTS ? (
        <View style={s.dots}>
          {names.map((name, k) => (
            <Pressable
              key={name}
              onPress={() => jump(k)}
              style={[s.dot, { width: k === i ? 16 : 5, opacity: k === i ? 1 : 0.35 }]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** גוון החץ · הכתום הכהה של השף, כמו בקנבס */
const ARROW_INK = '#7A3D18';

const s = StyleSheet.create({
  gap: { gap: TILE_GAP },
  arrow: {
    position: 'absolute',
    width: ARROW,
    height: ARROW,
    borderRadius: ARROW / 2,
    backgroundColor: 'rgba(255,255,255,0.92)',
    boxShadow: '0 3px 9px -4px rgba(20,16,12,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowRight: { right: 8 },
  arrowLeft: { left: 8 },
  arrowOff: { opacity: 0.35 },
  shot: { overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.5)' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
  dot: { height: 5, borderRadius: 999, backgroundColor: '#A85A28' },
});
