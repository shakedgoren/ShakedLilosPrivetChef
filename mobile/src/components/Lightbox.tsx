import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Image, Modal, Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Close } from '../icons';
import { Photo } from './Photo';
import { photo } from '../data/photos';

/**
 * הגדלת תמונה · כל תמונה באפליקציה נפתחת בלחיצה על רקע מטושטש.
 *
 * ה-Provider יושב פעם אחת ב-App, ו-`Photo` עצמה קוראת לו. כך כל
 * מופע קיים של <Photo> קיבל את ההתנהגות בלי לגעת באף מסך.
 *
 * ⚠ הטשטוש · `backdrop-filter` קיים רק בווב, ושם הוא מועתק אחד
 * לאחד מהקנבס — blur(7px) saturate(120%) מעל rgba(42,36,48,0.34).
 * ב-React Native אין מקבילה בלי ספרייה נוספת, ולכן במכשיר נשאר
 * המסך הכהה בלבד. אם צריך טשטוש אמיתי גם שם — expo-blur.
 */
const SCRIM = 'rgba(42,36,48,0.34)';
/**
 * פינת התמונה המוגדלת · 18, אותו ערך של אריח הרצועה בדף הבית
 * ושל `radius.tile` בקרוסלת פינת השף. שקד ביקשה שהתמונה המוגדלת
 * תיראה ״באותה הצורה עם השוליים עגולים״ כמו בתצורה הקטנה.
 */
const SHOT_RADIUS = 18;
/** יחס ברירת מחדל · ריבוע, עד שהקובץ נמדד */
const FALLBACK_RATIO = 1;

/**
 * יחס הרוחב-גובה של קובץ התמונה · נמדד מהנכס עצמו ולא מוקלד.
 * בלי זה אי אפשר לתת למסגרת את צורת התמונה, והפינות העגולות
 * נחתכות על שטח שקוף במקום על התמונה.
 *
 * ⚠ **`Image.resolveAssetSource` לא קיים ב-`react-native-web`.**
 * קריאה ישירה אליו הפילה את כל האפליקציה למסך לבן
 * (`Image.default.resolveAssetSource is not a function`).
 * בווב ה-`require` מחזיר אובייקט שכבר נושא `width` ו-`height`,
 * ולכן קוראים אותו ישירות ונופלים ל-API הילידי רק אם הוא קיים.
 */
type AssetMeta = { width?: number; height?: number };

function ratioOf(name: string): number {
  const src = photo(name) as AssetMeta | number | string | undefined;
  if (!src) return FALLBACK_RATIO;

  /* ווב · ה-require כבר נושא את המידות */
  if (typeof src === 'object' && src.width && src.height) {
    return src.width / src.height;
  }

  /* ילידי · שם המידות מגיעות רק דרך רישום הנכסים */
  const resolve = (Image as unknown as {
    resolveAssetSource?: (s: unknown) => AssetMeta | undefined;
  }).resolveAssetSource;
  const meta = resolve?.(src);
  if (meta?.width && meta?.height) return meta.width / meta.height;

  return FALLBACK_RATIO;
}
const WEB_BLUR: ViewStyle =
  Platform.OS === 'web'
    ? ({ backdropFilter: 'blur(7px) saturate(120%)' } as ViewStyle)
    : {};

/**
 * מסך הטשטוש · `backdrop-filter` קיים רק בדפדפן.
 *
 * ⚠ **באפליקציה הרקע נשאר חד** · שקד דיווחה (16 בספטמבר 2026)
 * שכשלוחצים על תמונה בקרוסלה ״כל המאחורה לא נהיה מטושטש״.
 * `BlurView` של `expo-blur` עושה את זה ילידית (כלולה ב-Expo Go),
 * ומעליה נשאר אותו מסך כהה של הקנבס כדי שהגוון יישאר זהה
 * בשתי הפלטפורמות.
 */
function Scrim({ onPress }: { onPress: () => void }) {
  if (Platform.OS === 'web') {
    return <Pressable style={[s.scrim, WEB_BLUR]} onPress={onPress} />;
  }
  return (
    <>
      {/* ⚠ 7px בקנבס · `intensity` של expo-blur הוא 0–100 */}
      <BlurView intensity={28} tint="dark" style={s.scrimFill} pointerEvents="none" />
      <Pressable style={s.scrim} onPress={onPress} />
    </>
  );
}

type Shot = { name: string; title?: string };
type Ctx = { open: (name: string, title?: string) => void };

const LightboxCtx = createContext<Ctx | null>(null);
/**
 * האם יש תמונה פתוחה · הופרד מהפעולות בכוונה. `Photo` צורכת רק
 * את הפעולות, וכך עשרות מופעי Photo לא מרונדרים מחדש בכל פתיחה.
 * רק `PhotoReel` מקשיבה למצב, כדי לעצור את הריצה.
 */
const LightboxOpenCtx = createContext(false);

export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [shot, setShot] = useState<Shot | null>(null);
  const close = useCallback(() => setShot(null), []);
  const value = useMemo<Ctx>(
    () => ({ open: (name: string, title?: string) => setShot({ name, title }) }),
    [],
  );

  return (
    <LightboxCtx.Provider value={value}>
      <LightboxOpenCtx.Provider value={shot !== null}>
        {children}
        {/* ⚠ `animationType="none"` ולא `fade` · שקד דיווחה שהטשטוש
            ״לוקח שנייה++״. ה-fade של Modal מדהה פנימה את כל השכבה,
            ו-`backdrop-filter` מתחיל להרכיב רק כשהיא כבר גלויה —
            ולכן הטשטוש נבנה בהדרגה. בלי האנימציה הכל מופיע בפריים אחד. */}
        {shot && (
          <Modal visible transparent animationType="none" onRequestClose={close}>
            <Scrim onPress={close} />
            <View style={s.stage} pointerEvents="box-none">
              {/* שם התמונה · מעל התמונה במרכז, כמו `shotName` בקנבס.
                  מוצג רק כשיש שם ב-`photoTitles.ts`. */}
              {shot.title ? <Text style={s.title}>{shot.title}</Text> : null}
              {/* ⚠ שקד ביקשה ששתי הדרכים יסגרו · גם האיקס וגם לחיצה
                  על התמונה עצמה. לכן התמונה עטופה ב-Pressable.
                  ⚠ המסגרת מקבלת את יחס התמונה מ-`resolveAssetSource`,
                  ולכן `cover` לא חותך כלום והפינות העגולות באמת נראות.
                  קודם היה גובה קבוע 78% עם `contain`, והתמונה ריחפה
                  בתוך מסגרת שקופה — ולכן היא יצאה בפינות מרובעות. */}
              <Pressable onPress={close} style={[s.shotPress, { aspectRatio: ratioOf(shot.name) }]}>
                <Photo name={shot.name} style={s.shot} zoom={false} />
              </Pressable>
            </View>
            <Pressable onPress={close} style={s.close} hitSlop={10}>
              <Close size={15} color="#FFFFFF" strokeWidth={2.4} />
            </Pressable>
          </Modal>
        )}
      </LightboxOpenCtx.Provider>
    </LightboxCtx.Provider>
  );
}

/** מחזיר null כשאין Provider · כך Photo עובדת גם מחוץ לאפליקציה */
export function useLightbox(): Ctx | null {
  return useContext(LightboxCtx);
}

/** האם תמונה פתוחה כרגע · משמש את רצועת התמונות כדי לעצור */
export function useLightboxOpen(): boolean {
  return useContext(LightboxOpenCtx);
}

const s = StyleSheet.create({
  scrim: { position: 'absolute', inset: 0, backgroundColor: SCRIM },
  /* שכבת הטשטוש הילידית · מתחת למסך הכהה */
  scrimFill: { position: 'absolute', inset: 0 },
  stage: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  /* המידות מהקנבס · כותרת 24 בולטת עם צל טקסט, ותת-כותרת מתחתיה */
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 14,
    textShadowColor: 'rgba(20,16,12,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  /**
   * ⚠ העטיפה חייבת מידות · Pressable בלי מידות מתכווץ לאפס.
   * הרוחב מלא, הגובה נגזר מ-`aspectRatio` של התמונה עצמה, והתקרה
   * מונעת מתמונה עומדת לגלוש מעל הכותרת ומתחת לקצה המסך.
   */
  shotPress: {
    width: '100%',
    maxHeight: '78%',
    borderRadius: SHOT_RADIUS,
    overflow: 'hidden',
  },
  shot: { width: '100%', height: '100%' },
  close: {
    position: 'absolute',
    left: 18,
    top: 30,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
