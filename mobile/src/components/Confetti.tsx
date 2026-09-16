import React from 'react';
import { StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { NO_TOUCH } from '../theme/pointerEvents';

/**
 * קונפטי · אנימציית Lottie.
 *
 * ⚠ **הוחלף ב-16 בספטמבר 2026** · לפני כן היה כאן קונפטי שנבנה ביד
 * מ-22 פתיתים, לפי `CONFETTI` ו-`@keyframes cfall` בקנבס. שקד ראתה
 * אותו במכשיר, לא אהבה, ושלחה קישור לאנימציה שהיא רוצה:
 * `lottiefiles.com/free-animation/confetti-3ofTs67sBx`
 * (״Confetti״ מאת Shubh Dubey). הקובץ הורד משם והונח ב-
 * `assets/lottie/confetti.json`.
 *
 * ⚠ **`lottie-react-native` הוא מודול טבעי** · הוא נוסף כתלות חדשה,
 * ולכן **הבילד הקיים בטלפון לא יריץ אותו** — צריך בילד חדש. שקד
 * אישרה את זה מראש.
 *
 * ⚠ הקוד הישן של הפתיתים הוסר · הוא לא היה בשימוש אחרי ההחלפה.
 */

/** משך האנימציה במקור · 126 פריימים ב-25 fps */
const DURATION_MS = (126 / 25) * 1000;

export function Confetti({ onDone }: { onDone?: () => void } = {}) {
  React.useEffect(() => {
    if (!onDone) return;
    const id = setTimeout(onDone, DURATION_MS + 150);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <View style={[s.layer, NO_TOUCH]}>
      <LottieView
        source={require('../../assets/lottie/confetti.json')}
        autoPlay
        loop={false}
        resizeMode="cover"
        style={s.anim}
      />
    </View>
  );
}

const s = StyleSheet.create({
  layer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 50 },
  anim: { width: '100%', height: '100%' },
});
