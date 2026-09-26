import React from 'react';
import { S, SymCalendar, SymPencil, SymPhone, SymUser, SymUserSmall } from '../components/Sym';
import {
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text, TextInput } from '../ui/text';
import { ContinueButton } from '../components/ContinueButton';
import { INPUT_START } from '../theme/rtl';
import { NO_TOUCH } from '../theme/pointerEvents';
import { a, hues, radius, space, surface } from '../theme/tokens';
import { iconOrbShadow } from '../theme/glass';
import {
  EMPTY_ENQUIRY,
  EVENT_KINDS,
  enquiryLink,
  enquiryMissing,
  type Enquiry,
} from './enquiry';

/**
 * ״מתכננים אירוע?״ · טופס השארת הפרטים של גרסת הראווה.
 *
 * ⚠ **ההתאמה שביקשה שקד** · ראו את הפתק בראש `enquiry.ts`. השדות,
 * הכותרות והיעד זהים לכרטיס האירועים בעמוד הנחיתה.
 *
 * ⚠ **הנוסחים כאן הם של שקד · מ-`EVENT_CARD` בעמוד הנחיתה** ·
 * הכותרת, שורת ההדגשה וכיתוב הכפתור. תוויות השדות נכתבו על ידי
 * Claude, כמו בעמוד הנחיתה.
 *
 * ⚠ **אין שרת** · הלחיצה פותחת וואטסאפ עם ההודעה מוכנה. אם
 * הפתיחה נכשלת — אין וואטסאפ במכשיר, או שהמשתמשת ביטלה — נשארים
 * בטופס ומראים למה, במקום לסגור ולהשאיר את הלקוחה בלי מושג אם
 * הפרטים נשלחו.
 */

/** ⚠ הנוסח של שקד · מ-`EVENT_CARD` בעמוד הנחיתה */
const TITLE = 'מתכננים אירוע?';
const LEDE = 'אתם מביאים את הסיבה לחגוג, אנחנו מביאים את הטעם.';
const SEND = 'שליחה';

/** ⚠ נכתב על ידי Claude · מסביר לאן הפרטים הולכים */
const HINT = 'הפרטים נפתחים כהודעת וואטסאפ מוכנה — רק ללחוץ שליחה.';
/** ⚠ נכתב על ידי Claude · כשאין וואטסאפ במכשיר */
const FAIL = 'לא הצלחנו לפתוח וואטסאפ. אפשר להתקשר 052-505-6708';

const ACCENT = hues.cous;
const RING = 64;

/**
 * ⚠ **מוגדר מחוץ לרכיב, ובכוונה** · אותה תקלה בדיוק שמתועדת
 * ב-`LoginScreen`: רכיב שנוצר בתוך הרינדור מקבל טיפוס חדש בכל
 * הקלדה, ריאקט מפרק את ה-`TextInput` ומרכיב אותו מחדש, והשדה
 * מאבד פוקוס אחרי כל תו.
 */
type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  Icon: typeof SymUser;
  keyboard?: 'phone-pad' | 'number-pad';
  multiline?: boolean;
  invalid?: boolean;
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  Icon,
  keyboard,
  multiline,
  invalid,
}: FieldProps) {
  return (
    <View style={s.block}>
      <Text style={s.label}>{label}</Text>
      <View>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#B3ABBD"
          keyboardType={keyboard ?? 'default'}
          multiline={multiline}
          autoCapitalize="none"
          style={[s.input, multiline && s.inputTall, invalid && s.inputBad]}
        />
        <View style={[s.icon, multiline && s.iconTop, NO_TOUCH]}>
          <Icon size={18} color="#9A93A6" strokeWidth={1.8} />
        </View>
      </View>
    </View>
  );
}

export function EnquirySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [v, setV] = React.useState<Enquiry>(EMPTY_ENQUIRY);
  const [tried, setTried] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  /* ⚠ עדכון בלי מוטציה · העתק חדש בכל הקלדה */
  const set = React.useCallback(
    <K extends keyof Enquiry>(k: K) =>
      (next: string) => {
        setFailed(false);
        setV((prev) => ({ ...prev, [k]: next }));
      },
    [],
  );

  /* ⚠ הטופס מתאפס בכל פתיחה · לא משאירים פרטים של פנייה קודמת */
  React.useEffect(() => {
    if (!open) return;
    setV(EMPTY_ENQUIRY);
    setTried(false);
    setFailed(false);
  }, [open]);

  const missing = enquiryMissing(v);

  const send = React.useCallback(() => {
    setTried(true);
    if (enquiryMissing(v)) return;
    setFailed(false);
    Linking.openURL(enquiryLink(v)).then(
      () => onClose(),
      /* ⚠ לא נבלע בשקט · הלקוחה חייבת לדעת שההודעה לא נשלחה */
      () => setFailed(true),
    );
  }, [v, onClose]);

  if (!open) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.scrim}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.lift}
        >
          <View style={s.sheet}>
            <Pressable onPress={onClose} style={s.close} hitSlop={8}>
              <S k="close" size={13} color="#6E6478" />
            </Pressable>

            <ScrollView
              contentContainerStyle={s.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={[s.ring, { backgroundColor: a(ACCENT.rgb, 0.12) }]}>
                <S k="gift" size={26} color={ACCENT.deep} />
              </View>

              <Text style={s.title}>{TITLE}</Text>
              <Text style={s.lede}>{LEDE}</Text>

              <Field
                label="שם מלא"
                value={v.name}
                onChange={set('name')}
                placeholder="מה השם שלך?"
                Icon={SymUser}
                invalid={tried && missing === 'name'}
              />
              <Field
                label="טלפון"
                value={v.phone}
                onChange={set('phone')}
                placeholder="050-0000000"
                Icon={SymPhone}
                keyboard="phone-pad"
                invalid={tried && missing === 'phone'}
              />

              <View style={s.block}>
                <Text style={s.label}>סוג האירוע</Text>
                <View style={s.chips}>
                  {EVENT_KINDS.map((k) => {
                    const on = v.kind === k;
                    return (
                      <Pressable
                        key={k}
                        onPress={() => set('kind')(on ? '' : k)}
                        style={[
                          s.chip,
                          on && { backgroundColor: a(ACCENT.rgb, 0.14), borderColor: ACCENT.hue },
                        ]}
                      >
                        <Text style={[s.chipText, on && s.chipOn]}>{k}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Field
                label="תאריך משוער"
                value={v.date}
                onChange={set('date')}
                placeholder="14.11, או ״סוף נובמבר״"
                Icon={SymCalendar}
              />
              <Field
                label="מספר אורחים"
                value={v.guests}
                onChange={set('guests')}
                placeholder="20"
                Icon={SymUserSmall}
                keyboard="number-pad"
              />
              <Field
                label="עוד משהו שכדאי לדעת"
                value={v.note}
                onChange={set('note')}
                placeholder="תפריט, אלרגיות, שעה, כל דבר.."
                Icon={SymPencil}
                multiline
              />

              {failed ? <Text style={s.err}>{FAIL}</Text> : null}
              {tried && missing ? (
                <Text style={s.err}>
                  {missing === 'name' ? 'צריך שם' : 'צריך טלפון'} כדי שנוכל לחזור אליך
                </Text>
              ) : null}

              {/* ⚠ **בלי חץ** · בקשה של שקד על ״שליחה בוואטסאפ״ במגשי
                  הפירות: ״שהוא לא יהיה עם חץ בסופו זה מבלבל״. החץ
                  מבטיח שלב הבא, והלחיצה כאן שולחת. */}
              <ContinueButton
                onPress={send}
                accent={ACCENT}
                label={SEND}
                bare
                keepInShowroom
                style={s.send}
              />

              <Text style={s.hint}>{HINT}</Text>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(42,36,48,0.34)',
    justifyContent: 'center',
    padding: space.md,
  },
  lift: { justifyContent: 'center' },
  sheet: {
    borderRadius: 28,
    backgroundColor: '#FEFCFB',
    /* ⚠ גובה מוגבל · שש שדות ומקלדת לא נכנסים למסך טלפון */
    maxHeight: '88%',
    boxShadow: '0 26px 60px -22px rgba(60,48,84,0.72)',
  },
  body: { padding: space.lg, paddingTop: 26, alignItems: 'stretch', gap: 2 },
  close: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(130,112,162,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    boxShadow: iconOrbShadow('130,112,162'),
  },
  ring: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: surface.ink,
    textAlign: 'center',
    marginTop: 8,
  },
  lede: {
    fontSize: 13,
    fontWeight: '300',
    lineHeight: 19.5,
    color: surface.muted,
    textAlign: 'center',
    marginBottom: 12,
  },

  block: { marginBottom: 11 },
  label: { fontSize: 11, fontWeight: '500', color: surface.faint, marginBottom: 4 },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.2)',
    backgroundColor: '#FFFFFF',
    paddingLeft: 14,
    paddingRight: 44,
    fontSize: 15,
    textAlign: INPUT_START,
    color: surface.ink,
  },
  inputTall: { height: 86, paddingTop: 13, textAlignVertical: 'top' },
  /* ⚠ שדה חסר · מסגרת ולא רק טקסט, כדי שיהיה ברור לאן להסתכל */
  inputBad: { borderColor: '#D08C84' },
  /* ⚠ `right` פיזי · האייקון בקצה שאליו נכתב הטקסט, בשתי הפלטפורמות */
  icon: { position: 'absolute', right: 11, top: 0, bottom: 0, justifyContent: 'center' },
  iconTop: { bottom: undefined, top: 15 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.2)',
    backgroundColor: '#FFFFFF',
  },
  chipText: { fontSize: 12.5, color: surface.muted },
  chipOn: { color: surface.ink, fontWeight: '600' },

  err: { fontSize: 11.5, color: '#B95349', textAlign: 'center', marginBottom: 6 },
  send: { alignSelf: 'center', marginTop: 4 },
  hint: {
    fontSize: 11,
    fontWeight: '300',
    color: surface.faint,
    textAlign: 'center',
    marginTop: 10,
  },
});
