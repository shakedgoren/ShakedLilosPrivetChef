import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiEnabled } from '../api/config';
import { registerPushToken } from '../api/orders';

/**
 * התראה אמיתית לטלפון.
 *
 * ⚠ **נבנה ב-18 בספטמבר 2026** · שקד: ״שמתי תזכורת לזה שמכירה
 * תתחיל שאני אקבל התראה, אבל המכירה החלה ולא קיבלתי שום התראה״.
 * עד כה התזכורת הייתה **בתוך האפליקציה** בלבד — החלטה שלה מ-15
 * בספטמבר — והיא אישרה במפורש להוסיף את זו.
 *
 * ⚠ **שלוש חוליות, וכולן חייבות להתקיים**
 * 1. בילד חדש · `expo-notifications` הוא מודול **ילידי**, ולא קיים
 *    בבילד שרץ היום.
 * 2. `projectId` של EAS · בלעדיו Expo לא מנפיק אסימון.
 * 3. מפתח APNs בחשבון ה-Expo של שקד · בלעדיו ההודעה יוצאת מהשרת
 *    ונעצרת אצל Expo.
 *
 * ⚠ **הייבוא עצל בכוונה · נמדד ב-18 בספטמבר 2026** · ייבוא רגיל
 * של `expo-notifications` הפיל את האפליקציה **במסך אדום** על
 * הבילד הקיים: ״Cannot find native module 'ExpoPushTokenManager'״.
 * מודול ילידי שאינו בבילד מתפוצץ ברגע הטעינה, עוד לפני שמישהו
 * קרא לפונקציה. לכן הוא נטען **רק אם שלוש החוליות קיימות**, ועד
 * אז האפליקציה מתנהגת בדיוק כפי שהתנהגה.
 */

/** מזהה פרויקט ה-EAS · ראו חוליה 2 למעלה */
const projectId =
  (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
  (Constants.easConfig as { projectId?: string } | undefined)?.projectId;

/** האם בכלל אפשר לבקש אסימון · בלי זה אין טעם להטריד ברשות */
export const pushPossible = (): boolean =>
  apiEnabled && Platform.OS !== 'web' && Boolean(projectId);

type Mod = typeof import('expo-notifications');
let cached: Mod | null | undefined;

/**
 * טעינת המודול הילידי · פעם אחת, ובתוך `try`.
 * ⚠ מחזיר `null` כשהוא אינו בבילד · ראו ההערה למעלה.
 */
function load(): Mod | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-notifications') as Mod;
    /* ⚠ **מוצג גם כשהאפליקציה פתוחה** · בלי זה ההתראה נבלעת בשקט
       כשהלקוחה כבר בתוך האפליקציה, ואז ״לא קיבלתי שום התראה״ חוזר */
    cached.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {
    cached = null;
  }
  return cached;
}

/**
 * רישום המכשיר · נקרא אחרי כניסה מוצלחת.
 *
 * ⚠ **כישלון אינו מפיל ואינו מטריד** · בילד ישן, סירוב לרשות, רשת
 * שנפלה או היעדר `projectId` — כולם חוזרים `false` בשקט. ההתראה
 * שבתוך האפליקציה ממשיכה לעבוד בכל מקרה.
 */
export async function registerForPush(): Promise<boolean> {
  if (!pushPossible()) return false;
  const N = load();
  if (!N) return false;
  try {
    const have = await N.getPermissionsAsync();
    const status =
      have.granted || have.status === 'granted' ? have : await N.requestPermissionsAsync();
    if (!(status.granted || status.status === 'granted')) return false;

    const { data } = await N.getExpoPushTokenAsync({ projectId });
    if (!data) return false;
    await registerPushToken(data, Platform.OS);
    return true;
  } catch {
    /* ראו ההערה למעלה */
    return false;
  }
}
