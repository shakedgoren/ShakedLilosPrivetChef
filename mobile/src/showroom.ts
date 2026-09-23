import { Platform } from 'react-native';

/**
 * מצב תצוגה · האפליקציה כעמוד נחיתה.
 *
 * ⚠ **הרעיון של שקד · 23 בספטמבר 2026** · ״בדיוק אותו האתר כמו
 * האפליקצייה, אותו הדבר, חוץ מ — שלא תהיה אופצייה להזמין, הכרטיסים
 * של ה+ וה- לא יהיו, ובמקום כל כפתורי ההמשך יהיה כפתור ׳להזמנה׳
 * שיוביל להורדה של האפליקציה האמיתית״.
 *
 * ⚠ **למה זה מצב ולא אפליקציה שנייה** · התפריט, המחירים והתמונות
 * כתובים היום **פעמיים** — באפליקציה ובעמוד הנחיתה. כל שינוי מחיר
 * צריך להיעשות בשני מקומות, וזה מקור קבוע לסתירות. המצב הזה מבטל
 * את הכפילות: מקור אמת אחד, ושני מצבי הצגה.
 *
 * ⚠ **המצב הוא רק בווב** · באפליקציה שמותקנת מהחנות אין לזה מובן,
 * ולכן `Platform.OS !== 'web'` תמיד מחזיר `false`.
 *
 * ⚠ **שלוש דרכים להדליק, לפי סדר עדיפות:**
 *   1. `EXPO_PUBLIC_SHOWROOM=1` בזמן הבנייה · כך נבנית גרסת הראווה
 *   2. `?showroom=1` בכתובת · לבדיקות, בלי לבנות מחדש
 *   3. `?showroom=0` מכבה במפורש, גם אם נבנה עם הדגל
 */

const ENV_ON = process.env.EXPO_PUBLIC_SHOWROOM === '1';

function urlOverride(): boolean | null {
  if (typeof window === 'undefined' || !window.location) return null;
  try {
    const v = new URLSearchParams(window.location.search).get('showroom');
    if (v === '1' || v === 'true') return true;
    if (v === '0' || v === 'false') return false;
  } catch {
    /* כתובת פגומה · מתעלמים ונופלים לדגל הבנייה */
  }
  return null;
}

function resolve(): boolean {
  if (Platform.OS !== 'web') return false;
  const fromUrl = urlOverride();
  return fromUrl === null ? ENV_ON : fromUrl;
}

/**
 * האם אנחנו בגרסת הראווה.
 *
 * ⚠ נקרא פעם אחת בטעינה · הכתובת לא משתנה בלי רענון, והקבוע מונע
 * מצב שבו חלק מהמסך במצב אחד וחלק בשני.
 */
export const SHOWROOM: boolean = resolve();

/** הכיתוב שמחליף את כל כפתורי ההמשך בגרסת הראווה */
export const SHOWROOM_CTA = 'להזמנה';
