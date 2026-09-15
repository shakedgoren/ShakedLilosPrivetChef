import { CITIES } from './shared';

/**
 * השלמת כתובות מרשימת הרחובות של מדינת ישראל.
 *
 * המקור הוא `data.gov.il` — המאגר הממשלתי הפתוח, **בחינם ובלי
 * מפתח**. ⚠ זו הבחירה שהמלצתי עליה מול Google Places שעולה כסף;
 * שקד לא בחרה במפורש, וביקשה ״תפתור את זה עם המקור החינמי שמצאת״.
 *
 * המאגר: ״רשימת רחובות בישראל - מתעדכן״. הוא מחזיר שם רחוב ושם
 * יישוב, בלי מספרי בתים — מספר הבית נכתב ביד.
 */

const BASE = 'https://data.gov.il/api/3/action/datastore_search';
/** מזהה המשאב · אומת מול ה-API ב-15 בספטמבר 2026 */
const RESOURCE = '9ad3862c-8391-4b2f-84a4-2d4c68625f4b';
const STREET_FIELD = 'שם_רחוב';
const CITY_FIELD = 'שם_ישוב';

/** כמה תוצאות מבקשים מהשרת · ממנו מסננים ומדרגים */
const FETCH_LIMIT = 60;
/** כמה הצעות מוצגות ללקוחה */
export const SUGGEST_LIMIT = 8;
/** מתחת לזה לא שולחים בקשה · שתי אותיות מחזירות חצי מדינה */
export const MIN_QUERY = 2;

export type AddressHit = { street: string; city: string };

/**
 * אזור החלוקה.
 * ⚠ **הגבולות מהניסוח של שקד** · אשדוד בדרום, ראשון לציון בצפון
 * וגדרה במזרח. רשימת היישובים עצמה היא זו שבקנבס (`CITIES`),
 * ובקנבס גם כתוב ״אזור החלוקה: מאשדוד ועד ראשון לציון״.
 * **אין להוסיף כאן יישוב בלי אישור שלה.**
 */
export const DELIVERY_CITIES: readonly string[] = CITIES;

export const inDeliveryZone = (city: string): boolean =>
  DELIVERY_CITIES.includes(city.trim());

/** ⚠ נוסח שביקשה שקד, מילה במילה */
export const OUT_OF_ZONE = 'אין משלוחים לאיזור הזה';

const norm = (s: string) => s.replace(/\s+/g, ' ').trim();

/**
 * חיפוש רחובות · מחזיר קודם את היישובים שבאזור החלוקה, ואחריהם
 * את השאר, כדי שהכתובת הנפוצה תעלה למעלה אבל אפשר עדיין לבחור
 * כתובת מחוץ לאזור (ואז היא תסומן באדום).
 */
export async function searchStreets(q: string, signal?: AbortSignal): Promise<AddressHit[]> {
  const term = norm(q);
  if (term.length < MIN_QUERY) return [];

  const url =
    `${BASE}?resource_id=${RESOURCE}` +
    `&q=${encodeURIComponent(term)}` +
    `&limit=${FETCH_LIMIT}`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`address_lookup_${res.status}`);
  const body = (await res.json()) as {
    success?: boolean;
    result?: { records?: Record<string, unknown>[] };
  };
  if (!body.success) throw new Error('address_lookup_failed');

  const seen = new Set<string>();
  const hits: AddressHit[] = [];
  for (const rec of body.result?.records ?? []) {
    const street = norm(String(rec[STREET_FIELD] ?? ''));
    const city = norm(String(rec[CITY_FIELD] ?? ''));
    /* המאגר מחזיק שורות ריקות ושורות ״רחוב״ ללא שם · נשמטות */
    if (!street || !city || street === city) continue;
    const key = `${street}|${city}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({ street, city });
  }

  /* היישובים שבאזור החלוקה קודם · בתוך כל קבוצה נשמר סדר המאגר */
  const inZone = hits.filter((h) => inDeliveryZone(h.city));
  const rest = hits.filter((h) => !inDeliveryZone(h.city));
  return [...inZone, ...rest].slice(0, SUGGEST_LIMIT);
}

/** ״נופר 25, יבנה״ · הצורה שנשמרת ונשלחת */
export const formatAddress = (street: string, house: string, city: string): string =>
  `${street}${house.trim() ? ' ' + house.trim() : ''}, ${city}`;
