import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import Svg, { Path } from 'react-native-svg';
import { PASTA_SHAPES, PASTA_UP_EXTRA, T_PASTA_UPS } from '../../data/chef';
import { radius } from '../../theme/tokens';
import { iconOrbShadow } from '../../theme/glass';
import { NO_TOUCH } from '../../theme/pointerEvents';

/** גווני הבחירה של פינת השף · `chip()` ב-Chef.dc.html */
const HUE_DEEP = '#7A3D18';
const SEL_BG = 'rgba(168,90,40,0.1)';
const SEL_BD = 'rgba(168,90,40,0.42)';
const IDLE_BG = 'rgba(255,255,255,0.7)';
const IDLE_BD = 'rgba(130,112,162,0.16)';
const IDLE_FG = '#4A4254';

export type PastaPick = { sauce: string; shape: string | null; up: string | null; edit?: boolean };

/**
 * חלונית סוג הפסטה · נפתחת מיד אחרי בחירת רוטב, כמו בקנבס
 * (`pickSauce` → `pastaOpen`). המידות מ-`Chef.dc.html`: לוח בין
 * 46 מלמעלה ל-46 מלמטה, 16 מהצדדים, פינה 28 וריפוד 18.
 *
 * ⚠ **או צורה או שדרוג, לא שניהם** · `pastaPick` בקנבס מנקה את
 * השדה השני בכל בחירה, ולחיצה חוזרת מבטלת.
 */
type Props = {
  pop: PastaPick | null;
  onPick: (field: 'shape' | 'up', value: string) => void;
  onClose: () => void;
  onCommit: () => void;
};

export function PastaPopup({ pop, onPick, onClose, onCommit }: Props) {
  const ready = !!(pop && (pop.shape || pop.up));
  return (
    <Modal visible={!!pop} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.scrim} onPress={onClose} />
      {/* ⚠ **מרכז את הלוח** · בלי המכל הזה הלוח היה נעוץ ל-top/bottom
          ונמתח לגובה המסך כולו. */}
      <View style={[s.stage, NO_TOUCH]}>
        <View style={s.panel}>
        <View style={s.head}>
          <View style={s.headText}>
            <Text style={s.title}>{pop?.sauce ?? ''}</Text>
            <Text style={s.sub}>בחרו סוג פסטה או שדרוג</Text>
          </View>
          <Pressable onPress={onClose} style={s.x}>
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
              <Path d="M6 6l12 12M18 6L6 18" stroke="#6E6478" strokeWidth={2.6} strokeLinecap="round" />
            </Svg>
          </Pressable>
        </View>

        <ScrollView style={s.body} contentContainerStyle={s.bodyPad} showsVerticalScrollIndicator={false}>
          <View style={s.shapes}>
            {PASTA_SHAPES.map((sh) => {
              const on = pop?.shape === sh.n;
              return (
                <Pressable
                  key={sh.n}
                  onPress={() => onPick('shape', sh.n)}
                  style={[s.shape, { backgroundColor: on ? SEL_BG : IDLE_BG, borderColor: on ? SEL_BD : IDLE_BD }]}
                >
                  <Svg width={26} height={26} viewBox="0 0 32 32" fill="none">
                    {sh.paths.map((q, i) => (
                      <Path
                        key={i}
                        d={q.d}
                        stroke={on ? HUE_DEEP : '#9A93A6'}
                        strokeWidth={q.thin ? 0.9 : 1.6}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}
                  </Svg>
                  <Text style={[s.shapeName, { color: on ? HUE_DEEP : IDLE_FG, fontWeight: on ? '600' : '400' }]}>
                    {sh.n}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={s.upHead}>שדרוג מנת פסטה · {PASTA_UP_EXTRA} ₪ לסועד</Text>
          <Text style={s.upSub}>אופציונלי · נבחר בנוסף לרוטב</Text>

          {T_PASTA_UPS.map((o) => {
            const on = pop?.up === o;
            return (
              <Pressable
                key={o}
                onPress={() => onPick('up', o)}
                style={[s.up, { backgroundColor: on ? SEL_BG : IDLE_BG, borderColor: on ? SEL_BD : IDLE_BD }]}
              >
                <Text style={[s.upText, { color: on ? HUE_DEEP : IDLE_FG, fontWeight: on ? '600' : '400' }]}>{o}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ⚠ עמום עד שנבחרה צורה או שדרוג · `pastaOpacity` בקנבס */}
          <Pressable onPress={onCommit} disabled={!ready} style={[s.cta, { opacity: ready ? 1 : 0.45 }]}>
            <Text style={s.ctaText}>אישור</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim: { position: 'absolute', inset: 0, backgroundColor: 'rgba(42,36,48,0.34)' },
  /**
   * ⚠ **הגובה לפי התוכן · תוקן ב-16 בספטמבר 2026** · הלוח היה
   * `position: absolute` עם `top: 46` ו-`bottom: 46`, כלומר **נמתח
   * לגובה המסך כולו** בלי קשר לכמה תוכן יש בו. שקד דיווחה על
   * ״סתם רווח מיותר״ בחלונית הפסטות, וזה המקור.
   * `maxHeight` שומר שגם רשימה ארוכה לא תגלוש מהמסך — אז ה-`ScrollView`
   * שבפנים מקבל גלילה.
   */
  stage: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', padding: 16 },
  panel: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '84%',
    borderRadius: 28,
    padding: 18,
    backgroundColor: '#FEFCFB',
    boxShadow: '0 26px 60px -22px rgba(60,48,84,0.72)',
    /* ⚠ מבטל את ה-`NO_TOUCH` של המכל · הלוח עצמו כן לחיץ */
    pointerEvents: 'auto',
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  /* הריפוד מאזן את כפתור הסגירה כדי שהכותרת תישאר במרכז הלוח */
  headText: { flex: 1, minWidth: 0, alignItems: 'center', gap: 2, paddingStart: 32 },
  title: { fontWeight: '600', fontSize: 17, lineHeight: 21.25, textAlign: 'center' },
  sub: { fontSize: 12, fontWeight: '300', color: '#7D7488', textAlign: 'center' },
  x: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(130,112,162,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  boxShadow: iconOrbShadow('130,112,162'),
  },
  /* ⚠ `flexShrink` ולא `flex: 1` · אחרת הרשימה מותחת את הלוח לגובה מלא */
  body: { flexShrink: 1, marginTop: 14 },
  bodyPad: { gap: 7 },
  shapes: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 7 },
  shape: {
    width: 72,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 7,
    paddingHorizontal: 3,
    alignItems: 'center',
    gap: 3,
  },
  shapeName: { fontSize: 10.5, textAlign: 'center', lineHeight: 12.6 },
  upHead: { marginTop: 10, fontSize: 13, fontWeight: '600', textAlign: 'center', color: '#2A2430' },
  upSub: { fontSize: 11.5, fontWeight: '300', color: '#7D7488', textAlign: 'center' },
  up: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 252,
    minHeight: 40,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upText: { fontSize: 13, textAlign: 'center' },
  cta: {
    alignSelf: 'center',
    height: 50,
    marginTop: 14,
    paddingHorizontal: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EACAAB',
    boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.5), 0 12px 24px -14px rgba(150,100,55,0.75)',
  },
  ctaText: { color: HUE_DEEP, fontWeight: '600', fontSize: 15.5 },
});
