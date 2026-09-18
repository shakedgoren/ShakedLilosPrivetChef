import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiEnabled } from '../api/config';
import { me } from '../api/auth';
import { tokenStore } from '../api/storage';
import type { PublicUser } from '../api/types';
import { StackActions } from '@react-navigation/native';
import { navReady, navigationRef } from './ref';
import { ApiError } from '../api/types';

/**
 * מעטפת הניווט · מקבילה ל-App.dc.html בקנבס: מסך אחד בכל רגע,
 * עם מחסנית חזרה ומצב התחברות. מכוון להחלפה ב-react-navigation
 * כשנוסיף קישורים עמוקים — ה-API כאן זהה בכוונה (go / back).
 */
export const SCREENS = [
  'guest',
  'main',
  'login',
  'signup',
  'cous',
  'schn',
  'box',
  'fruit',
  'chef',
  'orders',
  'profile',
  /* צד הניהול · שקד בלבד */
  'admin',
  'adminOrders',
  'adminStock',
  'adminMoney',
  'adminDays',
  'adminShopping',
  'adminCustomers',
  'adminMenu',
  'adminCosts',
  'adminHistory',
  'adminOrderHistory',
  'adminBoard',
  'adminExpenses',
  'adminIncome',
  /* מסך בדיקה · גיליון האייקונים שנוצרו מהקנבס */
  'icons',
] as const;

export type Screen = (typeof SCREENS)[number];

type Session = { token: string; user: PublicUser };

/**
 * ⚠ מטען חד-פעמי לניווט · ״להזמין שוב״ פותח את מסך הקטגוריה
 * כשהפריטים של ההזמנה הקודמת כבר מסומנים. המסך צורך אותו פעם
 * אחת עם `takePrefill()` ואז הוא מתאפס.
 */
export type Prefill = { category: string; details: Record<string, unknown> };

type Nav = {
  screen: Screen;
  loggedIn: boolean;
  user: PublicUser | null;
  apiEnabled: boolean;
  go: (to: Screen, prefill?: Prefill) => void;
  /** המטען שהגיע עם הניווט · נצרך פעם אחת ומתאפס */
  takePrefill: () => Prefill | null;
  /** פתיחת ההתחברות כשכבה מעל המסך הנוכחי · המסך נשאר חי מאחוריה */
  goLogin: () => void;
  /** סגירת שכבת ההתחברות בלי להתחבר */
  closeLogin: () => void;
  /** האם שכבת ההתחברות פתוחה כרגע */
  loginOverlay: boolean;
  back: () => void;
  signIn: (session?: Session) => void;
  signOut: () => void;
  setUser: (user: PublicUser) => void;
  canBack: boolean;
  /**
   * ⚠ **פנימי** · השורש מדווח כאן על המסלול שהנוויגטור מציג, כדי
   * ש-`screen` יישאר נכון לכל מי שקורא אותו. ראו `App.tsx`.
   */
  syncRoute: (name: string) => void;
};

const Ctx = createContext<Nav | null>(null);

/**
 * פתיחה ישירה במסך מסוים · ?screen=adminOrders בדפדפן.
 * ⚠ נכתב על ידי Claude · פתח זמני לבדיקת מסכי הניהול עד שיהיה להם
 * שער כניסה אמיתי מ-Admin.dc.html. לא קיים במכשיר.
 */
function initialScreen(): Screen {
  if (typeof window === 'undefined' || !window.location) return 'guest';
  const want = new URLSearchParams(window.location.search).get('screen');
  return (SCREENS as readonly string[]).includes(want ?? '') ? (want as Screen) : 'guest';
}

/**
 * איפוס המחסנית למסך אחד.
 * ⚠ מחוץ לרכיב · אין לו תלות בשום מצב, והוא נקרא גם מהתחברות וגם
 * מהתנתקות.
 */
/**
 * שורשי הלשוניות · המסכים ששני הנאב-ברים מובילים אליהם.
 *
 * ⚠ **שלב 2ב׳ · 18 בספטמבר 2026** · לשונית **אינה דחיפה**. עד כה
 * `go()` דחף כל יעד, גם לחיצה על לשונית, ולכן ״בית ← הזמנות ← אזור
 * אישי ← בית״ בנה מחסנית באורך שלוש — וחזרה אחורה מהבית החזירה
 * ל״אזור אישי״ במקום לצאת. אותו דבר בדיוק בנאב-בר של הניהול.
 */
const TAB_ROOTS: readonly Screen[] = [
  'guest',
  'main',
  'orders',
  'profile',
  'admin',
  'adminShopping',
  'adminDays',
  'adminOrders',
  'adminMoney',
];

/**
 * מעבר ללשונית.
 *
 * ⚠ **`popTo` לפני `reset`** · אם הלשונית כבר במחסנית — למשל דף
 * הבית כשנמצאים בתוך קטגוריה — חוזרים **אל המסך הקיים** ולא בונים
 * אותו מחדש. כך הוא שומר על מצבו, וזה גם מה ששקד ביקשה ב-17
 * בספטמבר: ״כשאני חוזרת אחורה לדף הראשי, שהספיישל יהיה זה שבקטגוריה
 * הראשית״.
 *
 * ⚠ **`reset` ולא `push` כשהיא אינה במחסנית** · לשונית היא **שורש**,
 * לא שלב. בלי זה המחסנית גדלה בכל לחיצה.
 */
function goTab(to: Screen) {
  if (!navReady()) return;
  const routes = navigationRef.getRootState()?.routes ?? [];
  const here = routes[routes.length - 1]?.name;
  if (here === to) {
    /* כבר שם · לחיצה חוזרת מחזירה לשורש, כמו בלשוניות של iOS */
    if (routes.length > 1) navigationRef.dispatch(StackActions.popToTop());
    return;
  }
  if (routes.some((r) => r.name === to)) {
    navigationRef.dispatch(StackActions.popTo(to));
    return;
  }
  navigationRef.reset({ index: 0, routes: [{ name: to }] });
}

function resetTo(name: Screen) {
  if (navReady()) navigationRef.reset({ index: 0, routes: [{ name }] });
}

export function NavProvider({ children }: { children: React.ReactNode }) {
  /**
   * המסך שמוצג כרגע.
   *
   * ⚠ **מראה ולא מקור · 18 בספטמבר 2026** · עד שלב 2 זה היה **מקור
   * האמת** של הניווט. מרגע שיש נוויגטור נייטיבי, מקור האמת הוא
   * המחסנית של המערכת, וכאן נשמר רק מה שהיא מציגה — כדי ש-36
   * הקבצים שקוראים `screen` לא ישתנו בכלל.
   */
  const [screen, setScreen] = useState<Screen>(initialScreen);
  /**
   * האם יש לאן לחזור.
   * ⚠ **נגזר מהנוויגטור ולא ממערך שלנו** · `canGoBack()` אינו ערך
   * שריאקט עוקב אחריו, ולכן הוא נדגם בכל שינוי מסלול — שזה בדיוק
   * הרגע היחיד שבו הוא יכול להשתנות.
   */
  const [canBack, setCanBack] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  /**
   * שכבת ההתחברות.
   * ⚠ חסם ההתחברות מבטיח ״הבחירות שלך נשמרות · אחרי ההתחברות חוזרים
   * בדיוק לכאן״. מעבר אמיתי למסך ההתחברות מפרק את מסך ההזמנה ומאפס
   * את הבחירות — נמדד ב-14 בספטמבר: חזרנו לקוסקוס עם סל ריק.
   * לכן ההתחברות נפתחת **מעל** המסך, והמסך נשאר מרונדר מאחוריה.
   */
  const [loginOverlay, setLoginOverlay] = useState(false);
  const [user, setUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    if (!apiEnabled) return;
    let live = true;
    (async () => {
      const token = await tokenStore.get();
      if (!token) return;
      try {
        const { user: meUser } = await me(token);
        if (!live) return;
        setUser(meUser);
        setLoggedIn(true);
        const home = meUser.role === 'admin' ? 'admin' : 'main';
        setScreen((cur) => (cur === 'guest' || cur === 'login' || cur === 'signup' ? home : cur));
      } catch (e) {
        /**
         * ⚠ **רק אסימון פסול מנתק · 19 בספטמבר 2026** · קודם עמד
         * כאן `catch` ריק שמחק את האסימון על **כל** תקלה, כולל
         * ״אין חיבור לשרת״. נתקלנו בזה בפועל: האפליקציה עלתה
         * מחדש בזמן שהשרת היה למטה לרגע, והמשתמשת נותקה לגמרי
         * ונאלצה להתחבר שוב.
         *
         * ⚠ **בפרודקשן זה היה מנתק לקוחות** בכל הפסקה קטנה
         * ברשת או בכל פריסה מחדש של השרת.
         *
         * 401 ו-403 הם ״האסימון כבר לא תקף״ — שם באמת צריך
         * לנקות. כל השאר הוא תקלה זמנית, והאסימון נשאר.
         */
        const dead = e instanceof ApiError && (e.status === 401 || e.status === 403);
        if (dead) await tokenStore.clear();
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  /* המטען מגיע עם הניווט ונצרך פעם אחת · ref ולא state, כדי
     שהצריכה לא תגרור רינדור נוסף */
  const prefill = React.useRef<Prefill | null>(null);

  /**
   * כיוון המעבר האחרון ומונה שלו · ההנפשה קוראת אותם.
   * ⚠ המונה נחוץ · מעבר למסך שכבר מוצג לא היה מפעיל את התנועה
   * בלעדיו. ראו `ScreenStage`.
   * ⚠ **חייב להיות לפני `go`** · הוא קורא ל-`setNav`.
   */
  /**
   * מעבר למסך · **דחיפה על המחסנית הנייטיבית**.
   *
   * ⚠ **שלב 2 · 18 בספטמבר 2026** · כאן ישבה דחיפה למערך מקומי.
   * עכשיו זו דחיפה אמיתית, ולכן המעבר, מחוות החזרה והצל מגיעים
   * מ-UIKit ולא מקוד שלנו.
   *
   * ⚠ **`push` ולא `navigate`** · `navigate` היה קופץ אחורה אל מסך
   * שכבר במחסנית במקום לפתוח אותו מחדש, וזה שינוי התנהגות שלא
   * ביקשנו כאן. שמירת ההתנהגות הקיימת היא כל הרעיון בשלב הזה.
   */
  const go = useCallback((to: Screen, load?: Prefill) => {
    prefill.current = load ?? null;
    setLoginOverlay(false);
    if (!navReady()) return;
    /* ⚠ לשונית אינה דחיפה · ראו `goTab` */
    if (TAB_ROOTS.includes(to)) {
      goTab(to);
      return;
    }
    navigationRef.dispatch(StackActions.push(to));
  }, []);

  const takePrefill = useCallback(() => {
    const p = prefill.current;
    prefill.current = null;
    return p;
  }, []);

  const goLogin = useCallback(() => setLoginOverlay(true), []);
  const closeLogin = useCallback(() => setLoginOverlay(false), []);

  /**
   * חזרה אחורה.
   *
   * ⚠ **המלכודת הפנימית עברה למסך · ראו `useScreenBack`** · קודם היא
   * ישבה כאן, ולכן רצה **רק** כשמישהו קרא ל-`back()` בקוד. מרגע
   * שהחזרה מגיעה גם ממחוות המערכת, מלכודת כזו הייתה נעקפת בשקט.
   * עכשיו היא יושבת על `beforeRemove` של המסך עצמו, שנורה בכל דרך
   * יציאה — כפתור, מחווה או קוד.
   *
   * ⚠ **בלי ארגומנטים** · `onPress={back}` מעביר אירוע לחיצה, וקודם
   * היה כאן שדה שחייב היה להיות `=== true` בגללו. אין בו יותר צורך.
   */
  const back = useCallback(() => {
    if (navReady() && navigationRef.canGoBack()) navigationRef.goBack();
  }, []);

  /** ⚠ פנימי · השורש מדווח מה הנוויגטור מציג · ראו `App.tsx` */
  const syncRoute = useCallback((name: string) => {
    if ((SCREENS as readonly string[]).includes(name)) setScreen(name as Screen);
    setCanBack(navReady() && navigationRef.canGoBack());
  }, []);

  /**
   * התחברות מאפסת את המחסנית · הבית המחובר הוא ההתחלה החדשה,
   * **אלא אם** הגענו להתחברות מתוך הזמנה — אז חוזרים לאותו מסך.
   */
  const signIn = useCallback(
    (session?: Session) => {
      if (session) {
        setUser(session.user);
        void tokenStore.set(session.token);
      }
      setLoggedIn(true);
      /* התחברות מתוך שכבה · המסך שמאחוריה נשאר בדיוק כפי שהיה */
      if (loginOverlay && session?.user.role !== 'admin') {
        setLoginOverlay(false);
        return;
      }
      setLoginOverlay(false);
      /* ⚠ המנהלת נכנסת לניהול · הגישה לניהול היא רק דרך ההתחברות שלה
         (החלטה 12), ולכן כניסה עם חשבון מנהלת לא נוחתת בבית של לקוחה. */
      const home: Screen = session?.user.role === 'admin' ? 'admin' : 'main';
      /* ⚠ **איפוס ולא דחיפה** · הבית המחובר הוא ההתחלה החדשה, ואסור
         שהחלקה אחורה תחזיר למסך ההתחברות. */
      resetTo(home);
    },
    [loginOverlay],
  );

  const signOut = useCallback(() => {
    setLoggedIn(false);
    setUser(null);
    void tokenStore.clear();
    setLoginOverlay(false);
    /* ⚠ גם כאן איפוס · אחרי התנתקות אין לאן לחזור */
    resetTo('guest');
  }, []);

  const applyUser = useCallback((next: PublicUser) => {
    setUser(next);
  }, []);

  const value = useMemo(
    () => ({
      screen,
      loggedIn,
      user,
      apiEnabled,
      go,
      takePrefill,
      goLogin,
      closeLogin,
      loginOverlay,
      back,

      signIn,
      signOut,
      setUser: applyUser,
      /* ⚠ גם שלב פנימי הוא ״יש לאן לחזור״ · אחרת המחווה מושבתת */
      canBack,
      syncRoute,
    }),
    [screen, loggedIn, user, go, takePrefill, goLogin, closeLogin, loginOverlay, back, signIn, signOut, applyUser, canBack, syncRoute],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNav(): Nav {
  const v = useContext(Ctx);
  if (!v) throw new Error('useNav חייב לשבת בתוך NavProvider');
  return v;
}
