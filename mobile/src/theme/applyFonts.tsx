import { StyleSheet, Text, TextInput } from 'react-native';
import { DEFAULT_FAMILY, fontFor } from './fonts';

/**
 * מחיל את Assistant על כל טקסט באפליקציה.
 *
 * באפליקציה מאות רכיבי Text, וכל אחד מגדיר fontWeight משלו. במקום
 * להוסיף fontFamily בכל אחד — ולשכוח באחד — עוטפים כאן את Text ואת
 * TextInput פעם אחת ומזריקים את המשפחה שמתאימה למשקל שבסגנון.
 *
 * ההזרקה נעשית ל-props בכניסה ולא לאלמנט ביציאה, כי ביציאה כבר יש
 * אלמנט DOM שלא יודע לקרוא מערך סגנונות. הסגנון המקורי נשאר אחרון
 * ולכן סגנון שמגדיר fontFamily בעצמו (הכותרת ב-Anton) עדיין גובר.
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
      const withFont = { ...props, style: [{ fontFamily: fontFor(flat?.fontWeight) }, props.style] };
      return original.call(this, withFont, ref);
    };
  }
}

export { DEFAULT_FAMILY };
