import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';

/**
 * התחברות עם גוגל · מחזירה `idToken` שהשרת מאמת.
 *
 * ⚠ **נוספה ב-16 בספטמבר 2026** · בקשה של שקד: ״צריך להוסיף חיבור
 * התחברות עם גוגל״. הכפתור כבר היה במסך, אבל הוא קרא ל-`googleStub`
 * ששולח **טוקן ריק** — והשרת החזיר 501. כלומר הכפתור נראה ולא עבד.
 *
 * צד השרת היה מוכן מלכתחילה · `/auth/google` מאמת טוקן אמיתי מול
 * `GOOGLE_CLIENT_ID`. מה שחסר היה רק הצד של האפליקציה.
 *
 * ⚠ **דורש מזהי לקוח מגוגל** · שקד צריכה ליצור פרויקט ב-
 * Google Cloud Console ולהגדיר שלושה משתני סביבה:
 * · `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
 * · `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
 * · `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
 * ובשרת את אותם מזהים ב-`GOOGLE_CLIENT_ID`.
 * **אי אפשר להמציא אותם** — הם קשורים לחשבון שלה.
 *
 * עד שהם מוגדרים `ready` הוא `false`, הכפתור מושבת, ואין ניסיון
 * התחברות שנכשל בשקט.
 *
 * ⚠ **`expo-web-browser` הוא מודול טבעי** · הוא נוסף כתלות חדשה,
 * ולכן צריך בילד חדש.
 */

/* ⚠ חייב לרוץ פעם אחת בטעינת המודול · סוגר את חלון הדפדפן אחרי החזרה */
WebBrowser.maybeCompleteAuthSession();

const IOS = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
const ANDROID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';
const WEB = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

/** האם הוגדרו מזהי לקוח · בלעדיהם אין טעם להציג את הכפתור כפעיל */
export const googleConfigured = Boolean(IOS || ANDROID || WEB);

export type GoogleAuth = {
  /** מוכן ללחיצה · מזהים מוגדרים והבקשה נבנתה */
  ready: boolean;
  /** פותח את גוגל ומחזיר `idToken`, או `null` אם בוטל או נכשל */
  signIn: () => Promise<string | null>;
};

export function useGoogleIdToken(): GoogleAuth {
  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: IOS || undefined,
    androidClientId: ANDROID || undefined,
    webClientId: WEB || undefined,
  });

  const signIn = React.useCallback(async () => {
    if (!googleConfigured || !request) return null;
    const res = await promptAsync();
    /* ⚠ ביטול אינו שגיאה · הלקוחה סגרה את החלון */
    if (res.type !== 'success') return null;
    return res.params?.id_token ?? null;
  }, [request, promptAsync]);

  return { ready: googleConfigured && !!request, signIn };
}
