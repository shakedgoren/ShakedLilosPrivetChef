import React from 'react';
import { AccessibilityInfo, Easing } from 'react-native';

/**
 * תנועה · חמש ההנפשות ששקד בחרה ב-15 בספטמבר 2026 מתוך שמונה
 * שהוצגו לה בתצוגה המקדימה.
 *
 * ⚠ **אינן מהקנבס** · בקנבס אין תנועה מלבד קפיצת הווי במסך הסיום
 * של פינת השף. המספרים כאן הם בדיוק אלה שרצו בתצוגה שאישרה.
 */

/** כניסה במדרגות · 320ms לשורה, הפרש 60ms, עלייה 10px */
/**
 * ⚠ **הואטה והודגשה** · שקד ביקשה (16 בספטמבר 2026): ״זה עולה
 * נורא מהר... שיעלה יותר באיטיות אחד אחרי השני״. השורה עצמה
 * 480ms במקום 320, ההפרש בין שורות 100ms במקום 60, והעלייה 16
 * פיקסלים במקום 10 — כך שכל שורה נראית עולה בנפרד ולא כולן יחד.
 * עם התקרה של שמונה שורות, האחרונה מסיימת אחרי 1.28 שניות.
 */
export const STEP_IN = { ms: 480, stagger: 100, rise: 16, maxSteps: 8 } as const;

/** סה״כ שמתגלגל · 400ms */
export const ROLL = { ms: 400 } as const;

/** מעקב הזמנה · 480ms לשלב */
export const TRACK = { ms: 480 } as const;

/** וי ההצלחה · קפיצת העיגול, ואחריה הווי שמצייר את עצמו */
export const POP = { ms: 620, delay: 120, from: 0.4 } as const;
export const DRAW = { ms: 460, delay: 300 } as const;
export const RING = { ms: 1000, delay: 260, from: 0.6, to: 2.1, alpha: 0.75, gap: 190 } as const;

/** פעמון שמתנדנד · 700ms, פעמיים, ציר בראש הפעמון */
export const SWING = { ms: 700, times: 2, deg: 14 } as const;

export const EASE_OUT = Easing.bezier(0.22, 0.9, 0.28, 1);
export const EASE_POP = Easing.bezier(0.34, 1.4, 0.5, 1);

/**
 * האם המכשיר ביקש פחות תנועה.
 *
 * ⚠ **כל חמש ההנפשות מכבדות את זה** · בדפדפן זה
 * `prefers-reduced-motion`, ובמכשיר זו הגדרת הנגישות. מי שכיבתה
 * תנועה רואה מיד את המצב הסופי במקום את הדרך אליו.
 */
export function useReducedMotion(): boolean {
  const [off, setOff] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (alive) setOff(v);
      })
      .catch(() => {
        /* הגדרה שלא נגישה אינה סיבה להפיל מסך · ממשיכים עם תנועה */
      });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setOff);
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);

  return off;
}
