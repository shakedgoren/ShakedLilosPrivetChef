import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { LOGIN_COPY } from '../screens/loginCopy';

/**
 * כניסה בזיהוי פנים.
 *
 * ⚠ **זיהוי פנים אינו מחליף סיסמה מול השרת** · Face ID מאמת שבעל
 * המכשיר נמצא מולו, ולא מי שהוא מול השרת. לכן הזרימה היא זו שקבעה
 * שקד (16 בספטמבר 2026): כניסה ראשונה עם סיסמה, ואז הצעה לשמור.
 * מי שמאשר — האסימון שלו נשמר בכספת של המכשיר, ובכניסה הבאה
 * לחיצה על שדה הסיסמה פותחת סריקה שמוציאה אותו משם.
 *
 * ⚠ **האסימון נשמר רק ב-SecureStore** · מחסן מוצפן של מערכת
 * ההפעלה (Keychain ב-iOS, Keystore באנדרואיד). לא ב-AsyncStorage,
 * שהוא קובץ רגיל.
 *
 * ⚠ **לא בדפדפן** · אין שם לא ביומטריה ולא כספת, וכל הפונקציות
 * כאן מחזירות ״אין״ בשקט.
 */

const KEY = 'biteandtell.session';
const NATIVE = Platform.OS !== 'web';

/** האם למכשיר יש חיישן ביומטרי **וגם** פנים או טביעה רשומות בו */
export async function faceAvailable(): Promise<boolean> {
  if (!NATIVE) return false;
  try {
    const [hardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hardware && enrolled;
  } catch {
    return false;
  }
}

/** האם כבר נשמר אסימון · כלומר האם להציע כניסה בפנים */
export async function faceArmed(): Promise<boolean> {
  if (!NATIVE) return false;
  try {
    return (await SecureStore.getItemAsync(KEY)) !== null;
  } catch {
    return false;
  }
}

/** שמירת האסימון · אחרי שהמשתמשת אישרה במפורש */
export async function armFace(token: string): Promise<boolean> {
  if (!NATIVE || !token) return false;
  try {
    await SecureStore.setItemAsync(KEY, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * הגדרת הכניסה בזיהוי פנים · **סורקת פעם אחת ורק אז שומרת**.
 *
 * ⚠ **נוסף ב-18 בספטמבר 2026** · שקד דיווחה: ״כשלוחצים על ׳כן׳
 * בזיהוי פנים זה לא מעביר להגדיר את הזיהוי פנים, זה מעביר לדף
 * הבית״. היא צודקת — ״כן, להגדיר״ קרא ל-`armFace`, שרק כותב את
 * האסימון לכספת. שום חלונית של המערכת לא נפתחה, ולכן מבחינתה שום
 * דבר לא ״הוגדר״.
 *
 * ⚠ **`disableDeviceFallback`** · בהגדרה חייבים את **הפנים**. עם
 * נפילה לקוד המכשיר אפשר היה להפעיל זיהוי פנים בלי לסרוק פנים
 * אפילו פעם אחת, וזה בדיוק מה שהיה.
 *
 * ⚠ **כישלון אינו חוסם כניסה** · היא כבר הוכיחה מי היא עם הסיסמה.
 * זיהוי הפנים הוא קיצור דרך לפעם הבאה, לא תנאי.
 */
export async function enrollFace(token: string): Promise<boolean> {
  if (!NATIVE || !token) return false;
  try {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: LOGIN_COPY.facePrompt,
      cancelLabel: LOGIN_COPY.close,
      disableDeviceFallback: true,
    });
    if (!res.success) return false;
    return await armFace(token);
  } catch {
    return false;
  }
}

/** ביטול · גם בהתנתקות, כדי שלא יישאר אסימון של מי שיצא */
export async function disarmFace(): Promise<void> {
  if (!NATIVE) return;
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    /* אין מה לעשות · ההתנתקות עצמה חשובה יותר */
  }
}

/**
 * סריקה · מחזיר את האסימון השמור כשהזיהוי הצליח, אחרת null.
 * ⚠ ביטול על ידי המשתמשת מחזיר null בדיוק כמו כישלון — למסך
 * אין צורך להבדיל, ובשני המקרים חוזרים להקלדת סיסמה.
 */
export async function unlockWithFace(): Promise<string | null> {
  if (!NATIVE) return null;
  try {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: LOGIN_COPY.facePrompt,
      cancelLabel: LOGIN_COPY.close,
      disableDeviceFallback: false,
    });
    if (!res.success) return null;
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}
