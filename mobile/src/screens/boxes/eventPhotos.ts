/**
 * תמונות כרטיסי ״סוג האירוע״ בחלה לכל אירוע.
 *
 * ⚠ **לא מהקנבס ולא מיוצר אוטומטית.** סעיף ה-`cards` ב-`Boxes.dc.html`
 * לא נושא שמות קבצים — שם הכרטיס מצויר כמציין מקום מקווקו, כי בזמן
 * העיצוב עוד לא היו תמונות. המיפוי הזה התקבל משקד ב-14 בספטמבר 2026
 * והועתק אחד לאחד מההודעה שלה. **אין להמציא כאן שמות.**
 *
 * המפתח הוא שם האירוע כפי שהוא ב-`EVENTS` ב-`data/boxes.ts`, כלומר
 * כפי שהוא בקנבס. שינוי שם אירוע בקנבס ישבור את ההתאמה בשקט —
 * `EVENT_PHOTO_KEYS` נועד לתפוס בדיוק את זה בבדיקת הטיפוסים.
 */
import { EVENTS } from '../../data/boxes';

export const EVENT_PHOTOS: Readonly<Record<string, string>> = {
  'ראש השנה': 'box-challah-1',
  'הפרשות חלה': 'box-challah-2',
  'ימי הולדת/אירועים': 'box-challah-3',
  'פינוק לגן/לכיתה': 'box-challah-4',
};

/** שמות האירועים שיש להם תמונה · נגזר מהטבלה, לא מוקלד */
const MAPPED = Object.keys(EVENT_PHOTOS);

/**
 * כמה מהאירועים בקנבס עדיין בלי תמונה · 0 כשהכל ממופה.
 * מיועד לבדיקה ידנית אחרי שינוי בקנבס, לא לזריקת שגיאה בזמן ריצה.
 */
export const UNMAPPED_EVENTS: string[] = EVENTS.filter((e) => !MAPPED.includes(e.n)).map(
  (e) => e.n,
);

/** מחזיר את שם קובץ התמונה, או undefined כשאין · אז נשאר מציין המקום */
export function eventPhoto(name: string): string | undefined {
  return EVENT_PHOTOS[name];
}
