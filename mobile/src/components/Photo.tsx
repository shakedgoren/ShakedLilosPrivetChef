import React from 'react';
import { S } from './Sym';
import { Image, Platform, Pressable, StyleSheet, View, type ImageStyle, type ViewStyle } from 'react-native';
import { photo, type PhotoTier } from '../data/photos';
import { useLightbox } from './lightboxContext';
import { photoTitle } from '../data/photoTitles';
import { a, deepRgbOf } from '../theme/tokens';

type Props = {
  /** שם הקובץ בלי הסיומת · למשל 'cat-couscous' */
  name?: string;
  style?: ViewStyle | ImageStyle | (ViewStyle | ImageStyle)[];
  /** גוון מציין המקום · כשאין תמונה בשם הזה */
  rgb?: string;
  /** cover ממלא את המסגרת וחותך · ברירת המחדל בכל המסכים */
  resizeMode?: 'cover' | 'contain';
  /**
   * לחיצה מגדילה את התמונה · דלוק כברירת מחדל בכל האפליקציה.
   * מכובה כשהתמונה יושבת בתוך כרטיס שכולו כפתור, כדי שהלחיצה
   * תמשיך לעשות מה שהכרטיס אמור לעשות.
   */
  zoom?: boolean;
  /**
   * שם התמונה · מוצג מעל התמונה כשהיא נפתחת בגודל מלא.
   * כשלא מועבר — נשלף לבד מ-`photoTitles.ts` לפי שם הקובץ,
   * ולכן כל תמונה באפליקציה מקבלת את שמה בלי שהמסך יטפל בזה.
   */
  title?: string;
  /**
   * גודל הקובץ בדפדפן · sm לרצועה, md לכרטיס, lg למסך מלא.
   * במכשיר אין הבדל.
   */
  tier?: PhotoTier;
  /**
   * בדפדפן לא מורידים את הקובץ עד שהאריח מתקרב למסך.
   * במכשיר מתעלמים · שם אין מה לחסוך בטעינה הראשונה.
   */
  lazy?: boolean;
};

/* מציין המקום בקנבס · אייקון בגודל 26 בגוון הכהה של הקטגוריה */
const MARK = 26;
const MARK_STROKE = 1.4;
const MARK_ALPHA = 0.5;
const EDGE_ALPHA = 0.34;

/**
 * תמונה של שקד · נופלת בחזרה למציין מקום כשהקובץ עדיין לא הועלה.
 * גם כשכל התמונות קיימות המצב נשאר · כרטיסי השדרוגים בקנבס עצמם
 * מציגים מציין מקום לכל שם שאין לו מיפוי ב-extraPhotos.ts.
 *
 * ⚠ מציין המקום הראה את המילה ״תמונה״ · היא לא קיימת בקנבס, שבו
 * יש רק את האייקון בתוך המסגרת המקווקוות. הוסרה כדי להתאים.
 */
export function Photo({
  name,
  style,
  rgb = '130,112,162',
  resizeMode = 'cover',
  zoom = true,
  title,
  tier = 'md',
  lazy = false,
}: Props) {
  const src = name ? photo(name, tier) : undefined;
  const lightbox = useLightbox();
  const shotTitle = title ?? (name ? photoTitle(name) : undefined);
  const hold = useNearScreen(lazy);

  if (!src) {
    return (
      <View style={[s.placeholder, { borderColor: a(rgb, EDGE_ALPHA) }, style as ViewStyle]}>
        <S k="image" size={MARK} color={a(deepRgbOf(rgb), MARK_ALPHA)} />
      </View>
    );
  }

  /* האריח שומר על המידות גם לפני שהתמונה נטענת, כדי שהרצועה לא תקפוץ */
  if (hold) return <View ref={hold} style={style as ViewStyle} />;

  if (!zoom || !lightbox || !name) {
    return <Image source={src} style={style as ImageStyle} resizeMode={resizeMode} />;
  }

  /**
   * המסגרת על ה-Pressable והתמונה ממלאת אותה.
   *
   * ⚠ המסך חייב לתת לתמונה מידות · בלי רוחב או גובה העטיפה
   * מתכווצת לאפס והתמונה נעלמת. הניסיון להעביר את אותו סגנון
   * לשניהם פתר את זה אבל מתח את התמונה ל-800 פיקסלים וחתך אותה,
   * ולכן הוא לא הדרך. במקום זה כל קורא מספק מידות.
   */
  return (
    <Pressable onPress={() => lightbox.open(name, shotTitle)} style={style as ViewStyle}>
      <Image source={src} style={s.fill} resizeMode={resizeMode} />
    </Pressable>
  );
}

/**
 * בדפדפן · מחזיר ref כל עוד האריח מחוץ למסך, ו-null ברגע שהוא נכנס.
 * כך `new Image()` של ריאקט-נייטיב-ווב לא רץ על תמונות שעוד לא רואים.
 */
function scrollRoot(node: Element): Element | null {
  let p = node.parentElement;
  while (p) {
    const oy = getComputedStyle(p).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight + 8) return p;
    p = p.parentElement;
  }
  return null;
}

function useNearScreen(lazy: boolean) {
  const ref = React.useRef<View>(null);
  const [waiting, setWaiting] = React.useState(lazy && Platform.OS === 'web');

  React.useEffect(() => {
    if (!waiting) return;
    const node = ref.current as unknown as Element | null;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setWaiting(false);
      return;
    }
    /*
     * שורש הגלילה ולא חלון הדפדפן · אחרת שוליים לא חודרים
     * את ה-ScrollView, והרצועה שיושבת ממש מתחת לקפל נשארת ריקה.
     */
    const root = scrollRoot(node);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setWaiting(false);
          io.disconnect();
        }
      },
      { root, rootMargin: '220px 60px' },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [waiting]);

  return waiting ? ref : null;
}

const s = StyleSheet.create({
  fill: { width: '100%', height: '100%' },
  placeholder: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
