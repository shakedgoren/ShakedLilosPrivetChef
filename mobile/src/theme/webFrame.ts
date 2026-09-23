import { Platform } from 'react-native';

/**
 * מסגרת רוחב־טלפון לגרסת הדפדפן · **רק בווב, רק במסך רחב.**
 *
 * ⚠ **למה זה נחוץ · 23 בספטמבר 2026** · האפליקציה מעוצבת לרוחב
 * טלפון, וחלק מהגדלים נגזרים מרוחב החלון. כשפתחנו אותה ב-1440
 * הלוגו נמתח על כל המסך והתוכן נשאר זעיר באמצע. זו לא תקלה
 * בעיצוב — זה פשוט עיצוב שנבנה ל-390 שהוצג ב-1440.
 *
 * ⚠ **הפתרון הוא לתחום, לא לעצב מחדש** · האפליקציה נשארת בדיוק
 * כפי שהיא, בעמודה ברוחב טלפון במרכז המסך. זה מה שעושות רוב
 * האפליקציות שמוגשות גם בדפדפן, והמשתמשת מקבלת בדיוק את אותה
 * חוויה שתקבל בנייד.
 *
 * ⚠ **מתחת ל-900px לא נוגעים בכלום** · בטלפון ובטאבלט האפליקציה
 * ממלאת את המסך כרגיל, וזה הרוב המכריע של הלקוחות.
 *
 * ⚠ **אין כאן `height` קבוע** · `#root` כבר מקבל `height:100%`
 * מהאיפוס של Expo. הגדרה נוספת כאן שברה את הגלילה הפנימית.
 */

/** מעבר לרוחב הזה מציגים את האפליקציה בעמודה ולא על כל המסך */
const DESKTOP_MIN_WIDTH = 900;

/** רוחב העמודה · אותו רוחב שלו האפליקציה עוצבה, עם קצת אוויר */
const APP_COLUMN_WIDTH = 480;

const STYLE_ID = 'bt-web-frame';

const CSS = `
@media (min-width: ${DESKTOP_MIN_WIDTH}px) {
  body {
    background: #EDE7F6;
  }
  #root {
    width: 100%;
    max-width: ${APP_COLUMN_WIDTH}px;
    margin-inline: auto;
    background: #F3EFFA;
    box-shadow: 0 0 60px -20px rgba(42, 36, 48, 0.35);
    overflow: hidden;
  }
}
`;

/**
 * ⚠ **שם הלשונית · 23 בספטמבר 2026** · הניווט מחליף את
 * `document.title` לשם המסך הפנימי, ולכן בטאב של הדפדפן הופיע
 * ״guest״ במקום שם העסק. השם נקבע כאן מחדש, ומשקיף שומר עליו
 * גם אחרי מעבר מסך — בלי זה הוא היה חוזר ל״guest״ בכל ניווט.
 */
const TITLE = 'BITE & TELL';

function keepTitle(): void {
  const head = document.querySelector('head');
  if (!head) return;

  const set = () => {
    if (document.title !== TITLE) document.title = TITLE;
  };
  set();

  /* `childList` על head · הניווט מחליף את אלמנט ה-title כולו */
  new MutationObserver(set).observe(head, { childList: true, subtree: true });
}

export function enableWebFrame(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);

  keepTitle();
}
