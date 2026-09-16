import { BREATH_FAMILY, DISPLAY_FAMILY, HOME_FAMILY, SIGNATURE_FAMILY } from './fonts';

/**
 * ארבעת סגנונות הכותרת · ״BITE & TELL״.
 *
 * ⚠ **שלושה מהם הם מועמדים · 16 בספטמבר 2026** · שקד ראתה עשר
 * תצוגות מקדימות, כל אחת בגופן אחר, ובחרה שלוש שהיא רוצה לראות
 * על דף הבית עצמו: 03 ״נשימה״, 05 ״חתימה״ ו-10 ״בית״.
 * `anton` הוא מה שיש היום, והוא נשאר ברירת המחדל עד שתחליט.
 *
 * ⚠ **המילים לא השתנו** · בשניים מהסגנונות הן כתובות באות גדולה
 * ראשונה בלבד (״Bite & Tell״) במקום בכולן. זה חלק מהעיצוב שהיא
 * בחרה מהתצוגות, ולא שינוי נוסח.
 */
export type MarkStyle = {
  /** מה שכתוב · אותן מילים, לפעמים בצורת אותיות אחרת */
  text: string;
  family: string;
  size: number;
  /** קו הבסיס · נמדד מראש ה-SVG */
  baseline: number;
  /** גובה השטח שהכותרת תופסת */
  height: number;
  /**
   * רוחב כפוי לכיתוב · `textLength` ב-SVG.
   * ⚠ **אסור בגופן מחובר** · הוא פורם את החיבור בין האותיות, ולכן
   * ״חתימה״ נשארת ברוחבה הטבעי.
   */
  textWidth?: number;
  /** קווים אופקיים משני צדי הכיתוב · ״נשימה״ */
  flank?: boolean;
  /** נקודה וקו קצר משני הצדדים · ״בית״ */
  ornaments?: boolean;
  /** רוחב הקו הדק שמתחת לשם · `null` כשאין */
  rule: number | null;
};

export const MARK_STYLES = {
  /** מה שיש היום · Anton צפוף וגדול */
  anton: {
    text: 'BITE & TELL',
    family: DISPLAY_FAMILY,
    size: 36,
    baseline: 36,
    height: 46,
    letterSpacing: 1.8,
    rule: 188,
  },

  /** 03 · נשימה · סריף דק מאוד, מרווח, עם קווים אל הקצוות */
  breath: {
    text: 'BITE & TELL',
    family: BREATH_FAMILY,
    size: 34,
    baseline: 32,
    height: 44,
    textWidth: 248,
    flank: true,
    rule: null,
  },

  /** 05 · חתימה · כתב יד. ⚠ בלי `textWidth` · ראו ההערה למעלה */
  signature: {
    text: 'Bite & Tell',
    family: SIGNATURE_FAMILY,
    size: 58,
    baseline: 54,
    height: 76,
    rule: null,
  },

  /** 10 · בית · סריף עגלגל עם נקודה וקו משני הצדדים */
  home: {
    text: 'Bite & Tell',
    family: HOME_FAMILY,
    size: 42,
    baseline: 40,
    height: 54,
    textWidth: 232,
    ornaments: true,
    rule: null,
  },
} as const satisfies Record<string, MarkStyle & { letterSpacing?: number }>;

export type MarkStyleKey = keyof typeof MARK_STYLES;
