import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiEnabled } from '../api/config';
import { me } from '../api/auth';
import { tokenStore } from '../api/storage';
import type { PublicUser } from '../api/types';

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
  /** רישום מטפל חזרה פנימי · ראו `back` */
  registerBack: (fn: (() => boolean) | null) => void;
  /** כיוון המעבר האחרון ומונה שלו · ראו `ScreenStage` */
  navDir: 'fwd' | 'back';
  navTick: number;
  signIn: (session?: Session) => void;
  signOut: () => void;
  setUser: (user: PublicUser) => void;
  canBack: boolean;
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

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [stack, setStack] = useState<Screen[]>([]);
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
      } catch {
        await tokenStore.clear();
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
  const [nav, setNav] = useState<{ dir: 'fwd' | 'back'; tick: number }>({
    dir: 'fwd',
    tick: 0,
  });


  const go = useCallback(
    (to: Screen, load?: Prefill) => {
      prefill.current = load ?? null;
      setLoginOverlay(false);
      setStack((s) => [...s, screen]);
      setNav((n) => ({ dir: 'fwd', tick: n.tick + 1 }));
      setScreen(to);
    },
    [screen],
  );

  const takePrefill = useCallback(() => {
    const p = prefill.current;
    prefill.current = null;
    return p;
  }, []);

  const goLogin = useCallback(() => setLoginOverlay(true), []);
  const closeLogin = useCallback(() => setLoginOverlay(false), []);

  /**
   * חזרה **בתוך** מסך · לפני שיוצאים ממנו.
   *
   * ⚠ **בקשה של שקד (17 בספטמבר 2026)** · ״אם אני נמצאת בספיישלים
   * ונכנסתי לתוך קטגוריה, חזרה אחורה צריכה להחזיר אותי לספיישלים
   * ולא לעמוד הבית. כנ״ל בפינת השף — שלב אחד לפני״.
   *
   * הסיבה שזה לא עבד: פתיחת מארז או מעבר שלב בשאלון הם **שינוי
   * מצב בתוך אותו מסך**, לא מסך חדש במחסנית. לכן החזרה קפצה ישר
   * החוצה. מסך שיש לו שלבים פנימיים רושם כאן מטפל, והוא נשאל
   * ראשון. `true` = טיפלתי, אל תצא מהמסך.
   */
  const [trap, setTrap] = useState<(() => boolean) | null>(null);
  const registerBack = useCallback(
    (fn: (() => boolean) | null) => setTrap(() => fn),
    [],
  );

  /**
   * ⚠ **בלי תופעות לוואי בתוך עדכון מצב · תוקן ב-17 בספטמבר 2026** ·
   * `setScreen` ו-`setNav` ישבו **בתוך** פונקציית העדכון של
   * `setStack`. ריאקט מריץ פונקציות עדכון בשלב הרינדור, ולפעמים
   * פעמיים, וקריאות מצב מתוכן אינן מובטחות.
   *
   * נמדד: אחרי מחוות חזרה רצה דווקא **הנפשת הכניסה** — כלומר
   * `navDir` מעולם לא התהפך ל-`back`.
   */
  const back = useCallback(() => {
    if (trap?.()) return;
    if (stack.length === 0) return;
    setNav((n) => ({ dir: 'back', tick: n.tick + 1 }));
    setScreen(stack[stack.length - 1]);
    setStack((s) => s.slice(0, -1));
  }, [trap, stack]);

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
      setStack([]);
      /* ⚠ **גם התחברות היא מעבר** · בלי המונה שכבת ההנפשה לא יודעת
         שהמסך התחלף · ראו `ScreenStage` */
      setNav((n) => ({ dir: 'fwd', tick: n.tick + 1 }));
      /* ⚠ המנהלת נכנסת לניהול · הגישה לניהול היא רק דרך ההתחברות שלה
         (החלטה 12), ולכן כניסה עם חשבון מנהלת לא נוחתת בבית של לקוחה. */
      setScreen(session?.user.role === 'admin' ? 'admin' : 'main');
    },
    [loginOverlay],
  );

  const signOut = useCallback(() => {
    setLoggedIn(false);
    setUser(null);
    void tokenStore.clear();
    setStack([]);
    setLoginOverlay(false);
    /* ⚠ גם התנתקות · ראו ההערה ב-`signIn` */
    setNav((n) => ({ dir: 'back', tick: n.tick + 1 }));
    setScreen('guest');
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
      registerBack,
      navDir: nav.dir,
      navTick: nav.tick,
      signIn,
      signOut,
      setUser: applyUser,
      /* ⚠ גם שלב פנימי הוא ״יש לאן לחזור״ · אחרת המחווה מושבתת */
      canBack: stack.length > 0 || trap !== null,
    }),
    [screen, loggedIn, user, go, takePrefill, goLogin, closeLogin, loginOverlay, back, registerBack, signIn, signOut, applyUser, stack.length, trap, nav],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNav(): Nav {
  const v = useContext(Ctx);
  if (!v) throw new Error('useNav חייב לשבת בתוך NavProvider');
  return v;
}
