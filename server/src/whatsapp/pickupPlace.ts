/**
 * איך מגיעים · מפת ההגעה וסיכת המיקום, אחרי אישור של איסוף עצמי.
 *
 * ⚠ **בקשת שקד · 11 באוקטובר 2026** · ״אפשר לשלוח בוואטצפ עם
 * ההזמנה של איסוף עצמי גם תמונה של המיקום?״. היא בחרה מפה אחת
 * מורכבת **וגם** סיכת מיקום.
 *
 * ⚠⚠ **הנוסח שאושר לא נגוע** · `confirmPickupText` נשלח כפי שהוא,
 * והתוכן כאן הוא **הודעות נוספות אחריו**. זה לא קוסמטי: חמשת
 * הנוסחים הם טקסטים של שקד מאז 8 באוקטובר, וכלל הברזל חל עליהם.
 * הכיתוב של התמונה הוא `PICKUP.note` — גם הוא שלה, מילה במילה,
 * ומגיע מאותו מקום שממנו האפליקציה קוראת אותו.
 *
 * ⚠ **התמונה אינה מהאפליקציה** · גרסת הדפדפן מגישה את הנכסים שלה
 * תחת שמות עם חתימה שמשתנים בכל בנייה. הקובץ שנשלח כאן הוא
 * `landing/img/pickup-map.jpg`, שכתובתו יציבה — נוצר בידי
 * `scripts/build-pickup-map.py` מאותן ארבע מפות.
 *
 * ⚠ **למה לא ארבע הודעות** · באפליקציה הלקוחה מחליקה בין ארבע
 * המפות. בוואטסאפ כל קובץ הוא התראה, וארבע התראות על הזמנה אחת
 * הן יותר מדי. זו הסיבה לתמונה המורכבת.
 *
 * ⚠ **כישלון כאן אינו מכשיל את ההזמנה** · אותה מדיניות של
 * `notify.ts` · אף שליחה לא זורקת.
 */

import { PICKUP } from '../../../mobile/src/data/categories.ts';
import { env } from '../env.ts';
import { sendFileByUrl, sendLocation } from './client.ts';

/** הקובץ · ראו `scripts/build-pickup-map.py` */
const MAP_FILE = 'pickup-map.jpg';

/**
 * ⚠ **שם המקום בסיכה · נכתב על ידי Claude** · שקד לא כתבה אותו.
 * זה שם העסק כפי שהוא מופיע כבר בחתימת ההודעות (`SIGN`), ולא
 * ניסוח חדש.
 */
const PIN_NAME = 'BITE & TELL';

export function pickupMapUrl(): string {
  return `${env.pickup.siteUrl}/img/${MAP_FILE}`;
}

/**
 * מפת ההגעה ואחריה הסיכה.
 * ⚠ **בסדר הזה** · קודם מה שמסביר, ואז מה שמנווט.
 */
export async function sendPickupPlace(phone: string): Promise<void> {
  await sendFileByUrl(phone, 'pickupMap', {
    urlFile: pickupMapUrl(),
    fileName: MAP_FILE,
    /* ⚠ הטקסט של שקד · ראו ההערה למעלה */
    caption: PICKUP.note,
  });

  /* ⚠ בלי קואורדינטות אין סיכה · ראו `env.pickup` */
  if (!env.pickup.hasPin) return;

  await sendLocation(phone, 'pickupPin', {
    nameLocation: PIN_NAME,
    address: PICKUP.address,
    latitude: env.pickup.lat,
    longitude: env.pickup.lng,
  });
}
