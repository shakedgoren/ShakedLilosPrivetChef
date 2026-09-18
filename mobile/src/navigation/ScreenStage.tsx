import React from 'react';
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNav, type Screen } from './store';
import { surface } from '../theme/tokens';

/**
 * ההנפשה של מעבר בין מסכים.
 *
 * ⚠ **שני מסכים במקום אחד · 17 בספטמבר 2026** · שקד דיווחה ״האפקטים
 * לא מורגשים… אני רוצה שיהיה לי ממש אפקט מעבר כמו שאני עוברת תמונה
 * בגלריה של האייפון״. עד אז הונפש רק המסך **הנכנס**, והיוצא נעלם
 * בפריים אחד. בגלריה של האייפון שתי התמונות זזות יחד — וזה ההבדל.
 *
 * ⚠ **המסך הולך אחרי האצבע · 17 בספטמבר 2026** · בקשה שנייה שלה:
 * ״שאני מחזירה אחורה עם האצבע את המסך אני אוכל לשלוט במהירות שאני
 * מזיזה את המסך… שזה יהיה כמו ב-iOS״. לכן החזרה אינה עוד הנפשה
 * שמתחילה **בסוף** המחווה: **המחווה עצמה היא ההנפשה**. המסך הקודם
 * מוצג מראש מתחת לנוכחי, שניהם זזים עם האצבע, וההרפיה מחליטה אם
 * להשלים או לבטל — לפי המרחק **ולפי המהירות**, כמו במערכת.
 *
 * ⚠ **חוצץ מתחלף ולא רינדור כפול** · שתי משבצות קבועות, `a` ו-`b`,
 * ובכל מעבר **המשבצת הפנויה** מקבלת את המסך החדש. המשבצת השנייה
 * מחזיקה את המסך היוצא **בלי להרכיב אותו מחדש** — אותו עץ ריאקט
 * ממשיך לחיות עד סוף התנועה, ולכן אין קריאות שרת כפולות ואין הבהוב.
 * זו גם הסיבה שהמחווה מסתיימת בלי הבהוב: המסך שהאצבע חשפה כבר יושב
 * במשבצת, ו-`back({ settled: true })` רק הופך אותה לחזית.
 *
 * ⚠ **המחווה אינה על הדרייבר הילידי** · אסור לקרוא `setValue` על ערך
 * שמחובר אליו (זה הבאג שתוקן ב-17 בספטמבר), והמחווה חייבת לעדכן ערך
 * בכל תזוזת אצבע. לכן הגרירה רצה על ה-JS, וההנפשות שאינן מחווה
 * נשארות ילידיות. אם תורגש גרירה מקרטעת במכשיר עמוס — הפתרון הוא
 * `react-native-reanimated`, והוא דורש בילד חדש.
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
 *
 * ⚠ **0.300 · נמדד מהסרטון של שקד ב-18 בספטמבר 2026** · היא שלחה
 * הקלטת מסך של ״מעבר אחורה״ מאפליקציית הקבצים. עקבתי בה אחרי התפר
 * שבין שני המסכים פריים-פריים, והתאמתי כל מסך לצילום נקי שלו: המסך
 * היוצא הוא **הזזה טהורה** אחרי האצבע, והמסך המתגלה יושב על
 * `0.300 × מה שנשאר` — אותו מספר בכל אחד מ-25 הפריימים שנמדדו,
 * בסטייה של פחות מאחוז. כאן ישב 0.26 שניחשתי.
 */
const PARALLAX = 0.3;

/**
 * ההחשכה על המסך **המתגלה** · שחור, כשבר.
 * ⚠ **נמדד באותו סרטון** · השוויתי פיקסלים לבנים של המסך המתגלה
 * מול צילום נקי שלו: 3.4% בהתחלת המחווה, 1.5% בשני שליש הדרך, אפס
 * בסוף. כלומר שכבה שחורה שמתחילה ב-4% ונמוגה ליניארית.
 */
const DIM = 0.04;

/**
 * הצל שהמסך היוצא מטיל על זה שמתחתיו.
 * ⚠ **נמדד** · כ-2% החשכה בדיוק בקצה, נמוגה על פני כ-25 נקודות.
 * רק הקצה האחורי נראה — שלושת האחרים מחוץ למסך.
 */
const EDGE_SHADOW = '0 0 22px 0 rgba(58,44,84,0.03)';

/* ── המחווה ─────────────────────────────────────────── */

/** כמה קרוב לקצה הימני המחווה מתחילה · המוסכמה של אייפון */
const EDGE = 44;
/** תזוזה קטנה מזו היא רעד אצבע ולא גרירה */
const SLOP = 10;
/** מאיזה חלק מהמסך ההרפיה משלימה את החזרה */
const COMMIT_AT = 0.34;
/** ומאיזו מהירות היא משלימה גם בלי המרחק · נקודות לאלפית שנייה */
const COMMIT_VX = 0.45;
/**
 * ההתיישבות · קפיץ שממשיך את **מהירות האצבע**, לא הנפשה מתוזמנת.
 *
 * ⚠ **נמדד בסרטון · 18 בספטמבר 2026** · בשני מקומות: דחיפה קדימה
 * של המערכת נחה לפי דעיכה מעריכית של 0.79 לפריים (קבוע זמן 70
 * אלפיות), וביטול מחווה מעצירה מוחלטת חזר הביתה ב-100 אלפיות
 * בעקומת S. **בשניהם אין חריגה מעבר ליעד** — ולכן `overshootClamping`.
 * הערכים כאן יושבים בין השניים.
 */
const SPRING = {
  stiffness: 420,
  damping: 42,
  mass: 1,
  overshootClamping: true,
  restDisplacementThreshold: 0.002,
  restSpeedThreshold: 0.01,
} as const;
/** מסך בלי הצגה מראש · שם המחווה חוזרת להתנהגות הישנה, בלי גרירה */
const FIRE_AT = 60;

type Slot = 'a' | 'b';
type Pair = { a: Screen | null; b: Screen | null; front: Slot; tick: number };

const other = (s: Slot): Slot => (s === 'a' ? 'b' : 'a');
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function ScreenStage({ render }: { render: (screen: Screen) => React.ReactNode }) {
  const { screen, navDir, navTick, navSettled, peekBack, back, canBack } = useNav();
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

  /**
   * ⚠ **מתחיל ב-1 כשהמחווה סיימה** · אחרת היה נשאר פריים אחד שבו
   * המסך שהאצבע כבר הביאה למקומו קופץ בחזרה לתחילת המעבר.
   */
  const t = React.useMemo(() => new Animated.Value(navSettled ? 1 : 0), [navTick]);
  const [reduce, setReduce] = React.useState(false);

  /* ── גרירה עם האצבע ─────────────────────────────── */

  /** המסך שהאצבע חושפת · `null` כשאין גרירה כרגע */
  const [dragTo, setDragTo] = React.useState<Screen | null>(null);
  /** ⚠ ב-ref ולא רק במצב · ה-`PanResponder` נבנה פעם אחת */
  const dragging = React.useRef(false);
  const dragT = React.useRef(new Animated.Value(0)).current;
  /**
   * ⚠ **מחווה שנייה בזמן שהקודמת עוד מתיישבת · נמדד ב-17 בספטמבר
   * 2026** · שתי החלקות רצופות נתנו מסך שלא זז בכלל. הסיבה:
   * הנפשת ההתיישבות של הראשונה עדיין רצה, המחווה החדשה אתחלה את
   * אותו ערך, ואז ה-callback של הישנה התעורר וניקה את מצב החדשה.
   * המונה מזהה ״מי קרא לי״, וההנפשה הישנה נעצרת מיד.
   */
  const settle = React.useRef<Animated.CompositeAnimation | null>(null);
  const gesture = React.useRef(0);

  /* ⚠ המחווה נבנית פעם אחת · הערכים המשתנים נקראים דרך `ref` */
  const live = React.useRef({ peekBack, back, canBack, width, reduce });
  live.current = { peekBack, back, canBack, width, reduce };

  /**
   * סוף הגרירה · בין אם הושלמה ובין אם בוטלה.
   *
   * ⚠ **חייב לשחרר גם את המשבצת · נמדד ב-17 בספטמבר 2026** · בלי
   * `drop` המסך שהוצג מראש נשאר **מורכב לנצח** אחרי ביטול: שקוף,
   * מחוץ למסך, ועם כל האפקטים שלו חיים. בסדרה של ביטול ואז השלמה
   * זה הגיע למצב שבו דף הבית נשאר תלוי בלי תוכן.
   *
   * ⚠ **בהשלמה לא משחררים** · שם המשבצת הזו היא המסך החדש עצמו,
   * ו-`back({ settled: true })` בדיוק הפך אותה לחזית.
   */
  const clearDrag = React.useCallback(
    (drop: boolean) => {
      dragging.current = false;
      setDragTo(null);
      dragT.setValue(0);
      if (!drop) return;
      setPair((p) => {
        const free = other(p.front);
        return p[free] === null ? p : { ...p, [free]: null };
      });
    },
    [dragT],
  );

  const pan = React.useMemo(
    () =>
      PanResponder.create({
        /* ⚠ תמיד false · אחרת שום לחיצה באפליקציה לא הייתה עוברת */
        onStartShouldSetPanResponderCapture: () => false,
        /**
         * ⚠ **`Capture` ולא הרגיל** · ברגע שילד — `ScrollView`,
         * `Pressable` — תפס את ה-responder, ההורה כבר לא נשאל
         * ב-`onMoveShouldSetPanResponder`. רק שלב ה-capture רץ לפניו.
         *
         * ⚠ **מהקצה הימני בלבד** · באפליקציה יש שורות נגללות לרוחב
         * (התוספות בקוסקוס, הקרוסלה בדף הבית), וגרירה חופשית באמצע
         * המסך הייתה בולעת אותן. הקצה הוא גם המוסכמה של אייפון.
         */
        onMoveShouldSetPanResponderCapture: (e, g) => {
          const { canBack: able, reduce: still } = live.current;
          if (!able || still) return false;
          const w = Dimensions.get('window').width;
          const fromEdge = e.nativeEvent.pageX >= w - EDGE || g.x0 >= w - EDGE;
          return fromEdge && g.dx < -SLOP && Math.abs(g.dx) > Math.abs(g.dy);
        },
        onPanResponderGrant: () => {
          /* ⚠ עוצרים התיישבות שעדיין רצה · ראו `settle` */
          settle.current?.stop();
          settle.current = null;
          gesture.current += 1;
          const to = live.current.peekBack;
          if (!to) return;
          dragging.current = true;
          dragT.setValue(0);
          setDragTo(to);
          /* המסך הקודם עולה למשבצת הפנויה · משם הוא ייחשף */
          setPair((p) => ({ ...p, [other(p.front)]: to }));
        },
        onPanResponderMove: (_e, g) => {
          if (!dragging.current) return;
          /* ⚠ האצבע נמשכת שמאלה · לכן `-dx` הוא ההתקדמות */
          dragT.setValue(clamp(-g.dx / live.current.width, 0, 1));
        },
        onPanResponderRelease: (_e, g) => {
          const { width: w, back: goBack } = live.current;
          if (!dragging.current) {
            /* מסך בלי הצגה מראש (שלב פנימי) · חזרה רגילה, בלי גרירה */
            if (g.dx < -FIRE_AT) goBack();
            return;
          }
          const at = clamp(-g.dx / w, 0, 1);
          const vx = -g.vx;
          const commit = at > COMMIT_AT || vx > COMMIT_VX;
          /**
           * ⚠ **המהירות של האצבע נמסרת לקפיץ · 18 בספטמבר 2026** ·
           * כאן ישבה הנפשה מתוזמנת שהמשך שלה חושב מהמהירות. זה עבד,
           * אבל זה לא מה שקורה ב-iOS: שם האצבע **משחררת לתוך קפיץ**,
           * והמהירות ממשיכה רציפה לרגע שאחרי השחרור. זה ההבדל שנראה
           * בסרטון — מסך שמשוחרר במעוף ממשיך במעוף, ולא מתחיל מחדש
           * בתאוצה משלו. `vx` בנקודות לאלפית שנייה, והקפיץ מבקש
           * יחידות של הערך לשנייה.
           */
          const mine = gesture.current;
          const anim = Animated.spring(dragT, {
            toValue: commit ? 1 : 0,
            velocity: (vx / w) * 1000,
            ...SPRING,
            useNativeDriver: false,
          });
          settle.current = anim;
          anim.start(({ finished }) => {
            /* ⚠ מחווה חדשה כבר התחילה · הישנה לא נוגעת במצב */
            if (!finished || mine !== gesture.current) return;
            settle.current = null;
            /* ⚠ המסך כבר במקומו · ראו `settled` ב-`back` */
            if (commit) goBack({ settled: true });
            clearDrag(!commit);
          });
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [clearDrag, dragT],
  );

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

    if (reduce || navSettled) {
      t.setValue(1);
      dropTail();
      return;
    }
    const anim = Animated.timing(t, {
      toValue: 1,
      duration: navDir === 'back' ? BACK_MS : FWD_MS,
      easing: EASE,
      /**
       * ⚠ **דרייבר אחד לכל השכבה · נמדד ב-18 בספטמבר 2026** · כאן
       * ישב `true`, וזה היה **הבאג שבגללו האפקטים לא הורגשו**.
       *
       * שתי משבצות המסך הן שני `View` קבועים שחיים לאורך כל הריצה.
       * המעבר המתוזמן הניע אותם על **הדרייבר הילידי**, והמחווה חייבת
       * להניע אותם על **ה-JS** (אסור `setValue` על ערך ילידי). מרגע
       * שה-`View` חובר פעם אחת לדרייבר הילידי, הוא המשיך להחזיק את
       * התכונות — ושינוי מצד ה-JS כבר לא צייר אותו מחדש.
       *
       * ⚠ **נמדד ולא שוער** · הקפאתי את המעבר על 0.5 וצילמתי:
       * עם `true` המסך היוצא ישב על **0 פיקסלים** — כלומר לא זז בכלל
       * ורק ״קפץ״ בסוף; עם `false` הוא ישב על **603 פיקסלים**, שהם
       * בדיוק חצי מ-1206. זה בדיוק מה ששקד תיארה פעמיים — ״האפקטים
       * לא מורגשים״ ו״משהו שם באפקט לא מסתדר טוב״.
       *
       * המחיר הוא הנפשה שרצה על ה-JS. למעבר של 420 אלפיות זה בסדר,
       * והמחווה ממילא רצה שם.
       */
      useNativeDriver: false,
    });
    anim.start(({ finished }) => {
      if (finished) dropTail();
    });
    return () => anim.stop();
  }, [t, navDir, navTick, navSettled, reduce]);

  const drag = dragTo !== null;
  /* ⚠ בגרירה הערך הוא האצבע · אחרת הוא ההנפשה המתוזמנת */
  const v = drag ? dragT : t;

  /**
   * ״צניחה למעלה״ · הבקשה של שקד: אפקט 04 מהתצוגה, הפוך.
   * שם המסך **נופל מטה** ונעלם; כאן הוא **עולה מלמטה** ומתיישב.
   */
  const rise = t.interpolate({ inputRange: [0, 1], outputRange: [height, 0] });
  /* ״החלקה אופקית״ · שניהם זזים שמאלה, עם האצבע שמושכת מהקצה */
  const slideIn = v.interpolate({ inputRange: [0, 1], outputRange: [width * PARALLAX, 0] });
  const slideOut = v.interpolate({ inputRange: [0, 1], outputRange: [0, -width] });
  /* ההחשכה על המסך המתגלה · נמוגה ככל שהוא מגיע · ראו `DIM` */
  const dim = v.interpolate({ inputRange: [0, 1], outputRange: [DIM, 0] });

  const isBack = navDir === 'back' || drag;

  /**
   * ⚠ **סדר הציור נקבע ב-`zIndex` ולא בסדר הילדים** · המשבצות
   * מתחלפות בכל מעבר, ולכן אי אפשר להסתמך על מי מהן מרונדרת שנייה.
   * קדימה — הנכנס עולה **מעל**; אחורה — היוצא מחליק **מעל** ומגלה
   * את הקודם מתחתיו, כמו באייפון.
   */
  const inStyle = isBack
    ? { zIndex: 1, transform: [{ translateX: slideIn }] }
    : { zIndex: 2, transform: [{ translateY: rise }] };

  /**
   * ⚠ **היוצא אינו נמוג יותר · 18 בספטמבר 2026** · כאן ישבו שתי
   * עמעום: `slideFade` בחזרה ו-`fadeOut` קדימה. הם היו שם כי שכבת
   * המסך הייתה **שקופה**, והשטיפה ישבה מתחת לשתיהן — בלי עמעום היו
   * רואים את שני המסכים זה דרך זה.
   *
   * בסרטון שקד שלחה המסך היוצא **אינו משנה שקיפות בכלל**: התאמתי
   * אותו לצילום נקי שלו ב-25 פריימים וקיבלתי הפרש של פחות מיחידת
   * בהירות אחת. זו הזזה טהורה. לכן השטיפה ירדה מהשורש ועברה
   * **לתוך כל שכבה** (ראו `App.tsx`), השכבות אטומות, והעמעום מיותר.
   * במקומו נשארו שני הדברים שכן נמדדו — הצל בקצה וההחשכה על מי
   * שמתגלה.
   */
  const outStyle = isBack
    ? { zIndex: 2, boxShadow: EDGE_SHADOW, transform: [{ translateX: slideOut }] }
    : { zIndex: 1 };

  /**
   * ⚠ **בגרירה התפקידים הפוכים** · במעבר רגיל החזית היא המסך
   * **הנכנס**; בגרירה החזית היא המסך **שעוזב**, והמשבצת הפנויה
   * מחזיקה את זה שנחשף מתחתיו.
   */
  const leaving = drag ? pair.front : other(pair.front);
  const styleFor = (slot: Slot) => (slot === leaving ? outStyle : inStyle);

  return (
    <View style={s.fill} {...pan.panHandlers}>
      {/* ⚠ שתי המשבצות תמיד באותו מקום במערך · כך המשבצת ששורדת
          מעבר **אינה מורכבת מחדש** ושומרת על המצב שבתוכה */}
      <Layer
        style={styleFor('a')}
        dim={isBack && 'a' !== leaving ? dim : null}
        screen={pair.a}
        render={render}
      />
      <Layer
        style={styleFor('b')}
        dim={isBack && 'b' !== leaving ? dim : null}
        screen={pair.b}
        render={render}
      />
    </View>
  );
}

type Move = Animated.AnimatedInterpolation<number>;
type LayerStyle = {
  zIndex: number;
  boxShadow?: string;
  transform?: ({ translateX: Move } | { translateY: Move })[];
};

function Layer({
  screen,
  style,
  dim,
  render,
}: {
  screen: Screen | null;
  style: LayerStyle;
  /** ההחשכה על מסך שנחשף · `null` לכל מצב אחר */
  dim: Move | null;
  render: (screen: Screen) => React.ReactNode;
}) {
  if (!screen) return null;
  return (
    <Animated.View style={[s.layer, style]}>
      {render(screen)}
      {/* ⚠ **מעל התוכן ולא מתחתיו** · זו החשכה של מסך שעוד לא הגיע,
          כמו באייפון · `NO_TOUCH` כדי שלא תבלע לחיצות */}
      {dim ? <Animated.View pointerEvents="none" style={[s.dim, { opacity: dim }]} /> : null}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  /**
   * ⚠ שתי השכבות זו על זו · אחרת הן היו נערמות אנכית.
   * ⚠ **אטומה · 18 בספטמבר 2026** · השטיפה שבתוך כל שכבה כבר צובעת
   * אותה, וזו רשת הביטחון: `react-native-svg` באחוזים אינו אמין
   * במכשיר (נמדד כאן פעמיים), ובלי הצבע שכבה שהשטיפה נכשלה בה
   * הייתה חוזרת להיות שקופה — ואיתה חוזר בדיוק המראה שביקשנו
   * להעלים.
   */
  layer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: surface.ground,
  },
  dim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#000' },
});
