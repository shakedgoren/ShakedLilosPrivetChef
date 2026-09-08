import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

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
] as const;

export type Screen = (typeof SCREENS)[number];

type Nav = {
  screen: Screen;
  loggedIn: boolean;
  go: (to: Screen) => void;
  back: () => void;
  signIn: () => void;
  signOut: () => void;
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

  const go = useCallback(
    (to: Screen) => {
      setStack((s) => [...s, screen]);
      setScreen(to);
    },
    [screen],
  );

  const back = useCallback(() => {
    setStack((s) => {
      if (s.length === 0) return s;
      setScreen(s[s.length - 1]);
      return s.slice(0, -1);
    });
  }, []);

  /* התחברות מאפסת את המחסנית · הבית המחובר הוא ההתחלה החדשה */
  const signIn = useCallback(() => {
    setLoggedIn(true);
    setStack([]);
    setScreen('main');
  }, []);

  const signOut = useCallback(() => {
    setLoggedIn(false);
    setStack([]);
    setScreen('guest');
  }, []);

  const value = useMemo(
    () => ({ screen, loggedIn, go, back, signIn, signOut, canBack: stack.length > 0 }),
    [screen, loggedIn, go, back, signIn, signOut, stack.length],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNav(): Nav {
  const v = useContext(Ctx);
  if (!v) throw new Error('useNav חייב לשבת בתוך NavProvider');
  return v;
}
