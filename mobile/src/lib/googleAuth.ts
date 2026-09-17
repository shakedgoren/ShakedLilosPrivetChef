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
 * ⚠ **הטעינה עטופה ב-`try` · תוקן ב-17 בספטמבר 2026** · שקד דיווחה
 * שהאפליקציה **קורסת בלחיצה על ״התחברות״**. הסיבה: `expo-auth-session`
 * נשען על `expo-web-browser` ו-`expo-crypto`, שהם **מודולים טבעיים**.
 * הבילד שרץ אצלה נבנה לפני שהם נוספו, ולכן `require` שלהם זרק —
 * וזה קרה בדיוק ברגע שמסך ההתחברות נטען.
 *
 * עכשיו כישלון טעינה מוריד את הכפתור ולא את האפליקציה. אחרי בילד
 * חדש הוא יידלק מעצמו.
 *
 * ⚠ **דורש מזהי לקוח מגוגל** · שקד צריכה ליצור פרויקט ב-
 * Google Cloud Console ולהגדיר שלושה משתני סביבה:
 * · `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
 * · `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
 * · `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
 * ובשרת את אותם מזהים ב-`GOOGLE_CLIENT_ID`.
 * **אי אפשר להמציא אותם** — הם קשורים לחשבון שלה.
 */

type IdTokenHook = (config: {
  iosClientId?: string;
  androidClientId?: string;
  webClientId?: string;
}) => [unknown, unknown, () => Promise<{ type: string; params?: { id_token?: string } }>];

/**
 * ⚠ **`require` ולא `import`** · `import` נפתר בזמן הידור ומפיל את
 * המודול כולו כשהחבילה הטבעית חסרה. `require` בתוך `try` נכשל
 * בשקט ומשאיר את שאר האפליקציה עומדת.
 */
let idTokenHook: IdTokenHook | null = null;
try {
  /* סוגר את חלון הדפדפן אחרי החזרה · חייב לרוץ פעם אחת בטעינה */
  (require('expo-web-browser') as { maybeCompleteAuthSession?: () => void })
    .maybeCompleteAuthSession?.();
  idTokenHook = (require('expo-auth-session/providers/google') as {
    useIdTokenAuthRequest: IdTokenHook;
  }).useIdTokenAuthRequest;
} catch {
  /* המודול הטבעי אינו בבילד · הכפתור יישאר מושבת */
  idTokenHook = null;
}

const IOS = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
const ANDROID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';
const WEB = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

/** האם הוגדרו מזהי לקוח · בלעדיהם אין טעם להציג את הכפתור כפעיל */
export const googleConfigured = Boolean(IOS || ANDROID || WEB);

/** האם החבילה הטבעית קיימת בבילד הנוכחי */
export const googleAvailable = idTokenHook !== null;

export type GoogleAuth = {
  /** מוכן ללחיצה · החבילה קיימת, המזהים מוגדרים, והבקשה נבנתה */
  ready: boolean;
  /** פותח את גוגל ומחזיר `idToken`, או `null` אם בוטל או נכשל */
  signIn: () => Promise<string | null>;
};

export function useGoogleIdToken(): GoogleAuth {
  /**
   * ⚠ **קריאה מותנית להוק · מותרת כאן בלבד** · `idTokenHook` נקבע
   * פעם אחת בטעינת המודול ואינו משתנה לעולם, ולכן סדר ההוקים זהה
   * בכל רינדור לאורך חיי התהליך — וזה מה שריאקט דורש.
   */
  const live = idTokenHook && googleConfigured ? idTokenHook({
    iosClientId: IOS || undefined,
    androidClientId: ANDROID || undefined,
    webClientId: WEB || undefined,
  }) : null;

  const request = live?.[0] ?? null;
  const prompt = live?.[2] ?? null;

  const signIn = React.useCallback(async () => {
    if (!prompt) return null;
    const res = await prompt();
    /* ⚠ ביטול אינו שגיאה · הלקוחה סגרה את החלון */
    if (res.type !== 'success') return null;
    return res.params?.id_token ?? null;
  }, [prompt]);

  return { ready: !!request && !!prompt, signIn };
}
