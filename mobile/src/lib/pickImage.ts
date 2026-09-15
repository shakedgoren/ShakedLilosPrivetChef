import * as ImagePicker from 'expo-image-picker';

/**
 * בחירת תמונה מהמכשיר · מחזירה `data:` URL מוכן לשליחה.
 *
 * ⚠ **זה מה שהיה חסר** · באזור האישי היה אייקון מצלמה מצויר בלבד,
 * בלי שום לחיצה ובלי בורר קבצים, ולכן ״להוסיף תמונה״ לא עשה כלום.
 * השרת כבר תמך בזה כל הזמן (`POST /users/me/photo`).
 *
 * `expo-image-picker` עובד גם בדפדפן (בורר קבצים) וגם במכשיר
 * (גלריה, אחרי בקשת הרשאה).
 */

/** ריבוע · התמונה מוצגת בעיגול 92, ולכן חיתוך ריבועי מונע עיוות */
const ASPECT: [number, number] = [1, 1];
/** איכות · 2MB הוא המקסימום בשרת, 0.7 מספיק בשביל 92 פיקסלים */
const QUALITY = 0.7;

export type PickResult =
  | { ok: true; dataUrl: string }
  | { ok: false; reason: 'cancelled' | 'denied' | 'failed' };

export async function pickAvatar(): Promise<PickResult> {
  try {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return { ok: false, reason: 'denied' };

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: ASPECT,
      quality: QUALITY,
      base64: true,
    });
    if (res.canceled) return { ok: false, reason: 'cancelled' };

    const asset = res.assets?.[0];
    if (!asset) return { ok: false, reason: 'failed' };

    /* בדפדפן ה-`uri` הוא כבר `data:` · במכשיר בונים אותו מ-base64 */
    if (asset.uri.startsWith('data:')) return { ok: true, dataUrl: asset.uri };
    if (!asset.base64) return { ok: false, reason: 'failed' };
    const mime = asset.mimeType ?? 'image/jpeg';
    return { ok: true, dataUrl: `data:${mime};base64,${asset.base64}` };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}
