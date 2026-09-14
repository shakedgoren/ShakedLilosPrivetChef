import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Close } from '../icons';
import { Photo } from './Photo';

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
const WEB_BLUR: ViewStyle =
  Platform.OS === 'web'
    ? ({ backdropFilter: 'blur(7px) saturate(120%)' } as ViewStyle)
    : {};

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
        {shot && (
          <Modal visible transparent animationType="fade" onRequestClose={close}>
            <Pressable style={[s.scrim, WEB_BLUR]} onPress={close} />
            <View style={s.stage} pointerEvents="box-none">
              {/* שם התמונה · מעל התמונה במרכז, כמו `shotName` בקנבס.
                  מוצג רק כשיש שם ב-`photoTitles.ts`. */}
              {shot.title ? <Text style={s.title}>{shot.title}</Text> : null}
              {/* ⚠ שקד ביקשה ששתי הדרכים יסגרו · גם האיקס וגם לחיצה
                  על התמונה עצמה. לכן התמונה עטופה ב-Pressable. */}
              <Pressable onPress={close} style={s.shotPress}>
                <Photo name={shot.name} style={s.shot} resizeMode="contain" zoom={false} />
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
  /* ⚠ העטיפה חייבת מידות · Pressable בלי מידות מתכווץ לאפס */
  shotPress: { width: '100%', height: '78%' },
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
