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

  const go = useCallback(
    (to: Screen, load?: Prefill) => {
      prefill.current = load ?? null;
      setLoginOverlay(false);
      setStack((s) => [...s, screen]);
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

  const back = useCallback(() => {
    setStack((s) => {
      if (s.length === 0) return s;
      setScreen(s[s.length - 1]);
      return s.slice(0, -1);
    });
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
      setStack([]);
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
      signIn,
      signOut,
      setUser: applyUser,
      canBack: stack.length > 0,
    }),
    [screen, loggedIn, user, go, takePrefill, goLogin, closeLogin, loginOverlay, back, signIn, signOut, applyUser, stack.length],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNav(): Nav {
  const v = useContext(Ctx);
  if (!v) throw new Error('useNav חייב לשבת בתוך NavProvider');
  return v;
}
