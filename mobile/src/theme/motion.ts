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
export const STEP_IN = { ms: 320, stagger: 60, rise: 10, maxSteps: 8 } as const;

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
