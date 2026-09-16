import { StyleSheet, Text, TextInput } from 'react-native';
import { DEFAULT_FAMILY, fontFor } from './fonts';
import { IS_RTL, TEXT_START } from './rtl';

/**
 * מחיל את Assistant ואת כיוון הכתיבה על כל טקסט באפליקציה.
 *
 * באפליקציה מאות רכיבי Text, וכל אחד מגדיר fontWeight משלו. במקום
 * להוסיף fontFamily בכל אחד — ולשכוח באחד — עוטפים כאן את Text ואת
 * TextInput פעם אחת ומזריקים את המשפחה שמתאימה למשקל שבסגנון.
 *
 * ההזרקה נעשית ל-props בכניסה ולא לאלמנט ביציאה, כי ביציאה כבר יש
 * אלמנט DOM שלא יודע לקרוא מערך סגנונות. הסגנון המקורי נשאר אחרון
 * ולכן סגנון שמגדיר fontFamily בעצמו (הכותרת ב-Anton) עדיין גובר.
 *
 * ⚠ כיוון הכתיבה · react-native-web גוזר את כיוון הטקסט מהתוכן.
 * מחרוזת שמתחילה בספרה — ״45 ₪״, ״052-2958511״, כל מחיר וכל מונה —
 * מסומנת ltr, ואז `text-align: start` מיישר אותה שמאלה בזמן ששאר
 * הטקסט מיושר ימינה. המחיר בקוסקוס נראה תלוי באוויר בגלל זה.
 * `writingDirection` נכפה כאן פעם אחת על כל Text, ולכן אף מחרוזת
 * מספרית באפליקציה לא תיפול שוב לכיוון ההפוך.
 *
 * ⚠ **וגם היישור** · שקד דיווחה (16 בספטמבר 2026) על כיתוב שיושב
 * בשמאל במקום בימין, למשל ״* כל מנה מגיעה לצד סלט חמוצים אישי.״
 * בקוסקוס. `writingDirection` לבדו אינו מיישר — הוא רק קובע את
 * סדר התווים. מחרוזת שמתחילה בתו ניטרלי (כוכבית, מקף, ספרה) נפלה
 * ליישור שמאלה. האפליקציה בעברית בלבד, ולכן ימין הוא ברירת המחדל
 * הנכונה; כל סגנון שמגדיר `textAlign` בעצמו עדיין גובר, כי הבסיס
 * נכנס **ראשון** במערך.
 */
type Renderable = { render?: (props: { style?: unknown }, ref: unknown) => unknown };

let patched = false;

export function applyFonts() {
  if (patched) return;
  patched = true;

  for (const Comp of [Text, TextInput] as unknown as Renderable[]) {
    const original = Comp.render;
    if (typeof original !== 'function') continue;

    Comp.render = function patchedRender(props, ref) {
      const flat = StyleSheet.flatten(props.style) as { fontWeight?: string } | undefined;
      const base = {
        fontFamily: fontFor(flat?.fontWeight),
        writingDirection: IS_RTL ? ('rtl' as const) : ('ltr' as const),
        textAlign: TEXT_START,
      };
      const withFont = { ...props, style: [base, props.style] };
      return original.call(this, withFont, ref);
    };
  }
}

export { DEFAULT_FAMILY };
