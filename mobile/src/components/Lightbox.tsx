import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
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

type Ctx = { open: (name: string) => void };
const LightboxCtx = createContext<Ctx | null>(null);

export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [shot, setShot] = useState<string | null>(null);
  const close = useCallback(() => setShot(null), []);
  const value = useMemo<Ctx>(() => ({ open: setShot }), []);

  return (
    <LightboxCtx.Provider value={value}>
      {children}
      {shot && (
        <Modal visible transparent animationType="fade" onRequestClose={close}>
          <Pressable style={[s.scrim, WEB_BLUR]} onPress={close} />
          <View style={s.stage} pointerEvents="box-none">
            <Photo name={shot} style={s.shot} resizeMode="contain" zoom={false} />
          </View>
          <Pressable onPress={close} style={s.close} hitSlop={10}>
            <Close size={15} color="#FFFFFF" strokeWidth={2.4} />
          </Pressable>
        </Modal>
      )}
    </LightboxCtx.Provider>
  );
}

/** מחזיר null כשאין Provider · כך Photo עובדת גם מחוץ לאפליקציה */
export function useLightbox(): Ctx | null {
  return useContext(LightboxCtx);
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
  shot: { width: '100%', height: '78%' },
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
