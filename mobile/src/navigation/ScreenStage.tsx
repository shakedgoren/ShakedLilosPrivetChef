import React from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useNav, type Screen } from './store';

/**
 * ההנפשה של מעבר בין מסכים.
 *
 * ⚠ **נכתב מחדש ב-17 בספטמבר 2026 · שני מסכים במקום אחד** · שקד
 * דיווחה ״האפקטים לא מורגשים… אני רוצה שיהיה לי ממש אפקט מעבר כמו
 * שאני עוברת תמונה בגלריה של האייפון״.
 *
 * זו הייתה **הסיבה** שהתנועה לא נראתה: עד עכשיו רק המסך **הנכנס**
 * הונפש, והיוצא נעלם בפריים אחד. בגלריה של האייפון שתי התמונות זזות
 * יחד — וזה מה שנותן את התחושה. בדיוק כמו בתצוגה המקדימה שהיא בחרה
 * ממנה, שבה `.scr.top` ו-`.scr.under` מונפשים שניהם.
 *
 * ⚠ **חוצץ מתחלף ולא רינדור כפול** · שתי משבצות קבועות, `a` ו-`b`,
 * ובכל מעבר **המשבצת הפנויה** מקבלת את המסך החדש. המשבצת השנייה
 * מחזיקה את המסך היוצא **בלי להרכיב אותו מחדש** — אותו עץ ריאקט
 * ממשיך לחיות עד סוף התנועה, ולכן אין קריאות שרת כפולות ואין הבהוב.
 * זו הסיבה היחידה שהמבנה כאן אינו `{children}` פשוט.
 *
 * ⚠ **המסך היוצא מתעמעם** · המסכים שקופים (השטיפה מאחוריהם היא
 * שנראית), ובלי העמעום שני התכנים היו נראים זה דרך זה בזמן החפיפה.
 */

/**
 * ⚠ **המשכים · 17 בספטמבר 2026** · היו 300 ו-280, ושקד אמרה שזה
 * ״לא מורגש״. בתצוגה המקדימה שהיא אישרה חלק התנועה ארך כשנייה,
 * וזה ארוך מדי למסך שלם. אלה הערכים שבאמצע, ונמדדו על הסימולטור.
 */
const FWD_MS = 500;
const BACK_MS = 420;
/** האטה לקראת הסוף · אותו עקום של שאר התנועות באפליקציה */
const EASE = Easing.bezier(0.22, 0.9, 0.28, 1);

/**
 * כמה המסך **המתגלה** זז בחזרה, כשבר מרוחב המסך.
 * ⚠ זה ההבדל בין ״שתי שקופיות״ לבין גלריה · באייפון המסך שמתגלה
 * זז לאט יותר מזה שעוזב, והעומק הזה הוא מה שהעין קוראת כ״אחורה״.
 */
const PARALLAX = 0.26;

type Slot = 'a' | 'b';
type Pair = { a: Screen | null; b: Screen | null; front: Slot; tick: number };

const other = (s: Slot): Slot => (s === 'a' ? 'b' : 'a');

export function ScreenStage({ render }: { render: (screen: Screen) => React.ReactNode }) {
  const { screen, navDir, navTick } = useNav();
  const { width, height } = useWindowDimensions();

  const [pair, setPair] = React.useState<Pair>(() => ({
    a: screen,
    b: null,
    front: 'a',
    tick: navTick,
  }));

  /**
   * ⚠ **עדכון בזמן הרינדור ולא ב-`useEffect`** · זה הדפוס הרשמי של
   * ריאקט להתאמת מצב לשינוי קלט. עם `useEffect` היה נשאר פריים אחד
   * שבו המסך החדש עוד לא מרונדר — כלומר הבהוב בתחילת כל מעבר.
   */
  if (pair.tick !== navTick) {
    const front = other(pair.front);
    setPair({ ...pair, [front]: screen, front, tick: navTick });
  } else if (pair[pair.front] !== screen) {
    /**
     * ⚠ **החלפה במקום, בלי הנפשה · תוקן ב-17 בספטמבר 2026** · שקד
     * דיווחה שאחרי ״לא עכשיו״ בזיהוי פנים המסך **לא נסגר ולא עובר
     * לדף הבית**, ושאחרי ״כן״ הוא חוזר להתחברות.
     *
     * זו הייתה רגרסיה שלי: `signIn` ו-`signOut` מחליפים את המסך
     * **בלי** להגדיל את מונה המעברים, ומאז שהשכבה הזו עובדת לפי
     * המונה היא פשוט לא שמה לב. הענף הזה הוא רשת הביטחון — כל
     * החלפת מסך שאינה מעבר מנווט נתפסת כאן.
     */
    setPair({ ...pair, [pair.front]: screen });
  }

  const t = React.useMemo(() => new Animated.Value(0), [navTick]);
  const [reduce, setReduce] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setReduce(v))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    /* סוף התנועה · משחררים את המסך היוצא, אבל רק אם לא התחיל מעבר חדש */
    const dropTail = () =>
      setPair((p) => {
        if (p.tick !== navTick) return p;
        const tail = other(p.front);
        if (p[tail] === null) return p;
        return { ...p, [tail]: null };
      });

    if (reduce) {
      t.setValue(1);
      dropTail();
      return;
    }
    const anim = Animated.timing(t, {
      toValue: 1,
      duration: navDir === 'back' ? BACK_MS : FWD_MS,
      easing: EASE,
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished) dropTail();
    });
    return () => anim.stop();
  }, [t, navDir, navTick, reduce]);

  /**
   * ״צניחה למעלה״ · הבקשה של שקד: אפקט 04 מהתצוגה, הפוך.
   * שם המסך **נופל מטה** ונעלם; כאן הוא **עולה מלמטה** ומתיישב.
   */
  const rise = t.interpolate({ inputRange: [0, 1], outputRange: [height, 0] });
  /**
   * היוצא נמוג מוקדם · מתחת למסך שעולה אין מה לראות דרכו.
   * ⚠ **נמדד בסימולטור** · עם [0, 0.45, 1] → [1, 0.3, 0] דף הבית עוד
   * נראה ב-30% מאחורי המסך שעולה, והקרוסלה שלו הציצה בין השורות.
   */
  const fadeOut = t.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 0.16, 0] });

  /* ״החלקה אופקית״ · שניהם זזים שמאלה, עם האצבע שמושכת מהקצה */
  const slideIn = t.interpolate({ inputRange: [0, 1], outputRange: [width * PARALLAX, 0] });
  const slideOut = t.interpolate({ inputRange: [0, 1], outputRange: [0, -width] });
  /* היוצא שקוף, ולכן הוא מתעמעם בחלק שבו הוא עדיין חופף לנכנס */
  const slideFade = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.55, 0] });

  const isBack = navDir === 'back';

  /**
   * ⚠ **סדר הציור נקבע ב-`zIndex` ולא בסדר הילדים** · המשבצות
   * מתחלפות בכל מעבר, ולכן אי אפשר להסתמך על מי מהן מרונדרת שנייה.
   * קדימה — הנכנס עולה **מעל**; אחורה — היוצא מחליק **מעל** ומגלה
   * את הקודם מתחתיו, כמו באייפון.
   */
  const frontStyle = isBack
    ? { zIndex: 1, transform: [{ translateX: slideIn }] }
    : { zIndex: 2, transform: [{ translateY: rise }] };

  const tailStyle = isBack
    ? { zIndex: 2, opacity: slideFade, transform: [{ translateX: slideOut }] }
    : { zIndex: 1, opacity: fadeOut };

  const styleFor = (slot: Slot) => (slot === pair.front ? frontStyle : tailStyle);

  return (
    <View style={s.fill}>
      {/* ⚠ שתי המשבצות תמיד באותו מקום במערך · כך המשבצת ששורדת
          מעבר **אינה מורכבת מחדש** ושומרת על המצב שבתוכה */}
      <Layer style={styleFor('a')} screen={pair.a} render={render} />
      <Layer style={styleFor('b')} screen={pair.b} render={render} />
    </View>
  );
}

type Move = Animated.AnimatedInterpolation<number>;
type LayerStyle = {
  zIndex: number;
  opacity?: Move;
  transform?: ({ translateX: Move } | { translateY: Move })[];
};

function Layer({
  screen,
  style,
  render,
}: {
  screen: Screen | null;
  style: LayerStyle;
  render: (screen: Screen) => React.ReactNode;
}) {
  if (!screen) return null;
  return <Animated.View style={[s.layer, style]}>{render(screen)}</Animated.View>;
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  /* ⚠ שתי השכבות זו על זו · אחרת הן היו נערמות אנכית */
  layer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
});
