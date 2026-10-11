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
/**
 * ⚠ **הפס הלבן מלמעלה ומלמטה · 11 באוקטובר 2026** · שקד צילמה את
 * האתר באייפון: ״יש פס לבן למעלה ולמטה״. ל-html ול-body אין רקע
 * כלל (נמדד: \`rgba(0,0,0,0)\`), ולכן הם לבנים — וכל שטח שהאפליקציה
 * עצמה לא צובעת מראה את הלבן הזה.
 *
 * ⚠ **למה זה לא נראה בדפדפן במחשב** · האיפוס של Expo נותן
 * \`height: 100%\` ל-html, ל-body ול-#root. במחשב החלון קבוע, ולכן
 * השלושה בדיוק בגודל המסך ואין מה לראות מאחוריהם. בספארי בטלפון
 * סרגל הכתובת נפתח ונסגר תוך כדי גלילה, גובה הצפייה משתנה, ו-100%
 * שנקבע לפי הגובה הקטן משאיר רצועה חשופה — למעלה, למטה, ובקצה
 * הגלילה הגמישה.
 *
 * ⚠ **רקע ולא גובה** · הפיתוי היה לתקן את הגובה, אבל כל נגיעה
 * ב-\`height\` של #root שוברת את הגלילה הפנימית (ראו ההערה למעלה).
 * צביעת הרקע פותרת את מה שנראה בלי לגעת בפריסה: מה שייחשף ייחשף
 * בלילך ולא בלבן.
 */
html, body {
  background-color: #F3EFFA;
}

/* ⚠ גלילה גמישה · בלעדיה הקפיצה בקצה מגלה את רקע הדפדפן */
body {
  overscroll-behavior: none;
}

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
