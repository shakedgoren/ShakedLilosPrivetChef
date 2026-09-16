import React from 'react';
import { INPUT_START } from '../theme/rtl';
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text, TextInput } from '../ui/text';
import {
  DELIVERY_CITIES,
  MIN_QUERY,
  OUT_OF_ZONE,
  inDeliveryZone,
  searchStreets,
  type AddressHit,
} from '../data/israelAddresses';
import { a, surface } from '../theme/tokens';

/**
 * שדה כתובת עם השלמה אוטומטית מרשימת הרחובות של ישראל.
 *
 * ⚠ **אינו מהקנבס** · שם העיר היא `select` קבוע והרחוב שדה חופשי.
 * שקד ביקשה שהלקוחה תתחיל להקליד והכתובת תיבחר מתוך רשימה אמיתית.
 *
 * `zone` מדליק את בדיקת אזור החלוקה: כתובת בתוך האזור מסומנת
 * בירוק, וכתובת מחוצה לו באדום עם ההערה של שקד.
 *
 * ⚠ **מסלול ידני · 16 בספטמבר 2026** · שקד דיווחה ״לא מצליח לטעון
 * כתובות…״. נמדד: המאגר הממשלתי `data.gov.il` **אינו עונה** —
 * המשאב מחזיר 404 בשלוש בקשות רצופות, ושאר נקודות ה-CKAN נתקעות
 * עד פסק זמן. זו תקלה במקור ולא בקוד כאן.
 *
 * מה שנוסף הוא **הגנה**: כשהחיפוש נכשל השדה אינו חוסם עוד. מופיעות
 * ערי אזור החלוקה, הלקוחה בוחרת עיר, ומה שהקלידה נחשב לשם הרחוב.
 * כך אפשר להשלים הזמנה גם כשהמאגר למטה.
 */

const FIELD_H = 48;
const ROW_H = 44;
const OK = '#3E8E5A';
const BAD = '#B95349';
const OK_BG = 'rgba(62,142,90,0.08)';
const BAD_BG = 'rgba(185,83,73,0.07)';
const IDLE_BD = 'rgba(130,112,162,0.18)';
/** השהיה לפני שליחת בקשה · כל הקלדה מבטלת את הקודמת */
const DEBOUNCE_MS = 250;
/** גובה מרבי לרשימת ההצעות · מעבר לזה היא נגללת */
const LIST_MAX_H = ROW_H * 4.5;
/**
 * רוחב מרבי · שקד ביקשה (16 בספטמבר 2026) ״את הכרטיסייה של הרחוב
 * תצמצם מעט ברוחב״. השדה היה נמתח לכל רוחב העמוד, והוא היחיד בטופס
 * שאין לצידו כלום. גם רשימת ההצעות מצטמצמת איתו כדי שהשתיים
 * יישארו באותו קו.
 */
const MAX_W = 322;

export type AddressValue = { street: string; city: string } | null;

type Props = {
  /** הכתובת שנבחרה · null כל עוד לא נבחרה */
  value: AddressValue;
  onPick: (v: AddressValue) => void;
  /** מספר הבית · נכתב ביד, המאגר לא מחזיק מספרי בתים */
  house: string;
  onHouse: (h: string) => void;
  /** בדיקת אזור החלוקה · כבויה בטופס השף, דלוקה במשלוח */
  zone?: boolean;
  /** מה שכתוב מתחת לשדה כשהכתובת בתוך האזור */
  okNote?: string;
  placeholder?: string;
};

export function AddressField({
  value,
  onPick,
  house,
  onHouse,
  zone = false,
  okNote,
  placeholder = 'התחילו להקליד שם רחוב…',
}: Props) {
  const [text, setText] = React.useState(value ? `${value.street}, ${value.city}` : '');
  const [hits, setHits] = React.useState<AddressHit[]>([]);
  /**
   * ⚠ **הרשימה נפתחת למעלה כשהשדה נמוך · 16 בספטמבר 2026** · שקד
   * דיווחה פעמיים ש״המקלדת מסתירה את האופציות אם כן הופיעו״, וש״לא
   * ממלא אוטומטית״ — וזו אותה תקלה: היא פשוט מעולם לא ראתה את
   * ההצעות. ההשלמה עצמה תקינה, **נמדד**: הקלדת ״נופר״ בדפדפן
   * מחזירה שמונה רחובות, יבנה ראשונה.
   *
   * המקלדת תופסת את החצי התחתון של המסך. כשהשדה יושב שם, רשימה
   * שנפתחת **מתחתיו** נמצאת מאחוריה תמיד — בלי קשר לגלילה.
   * `automaticallyAdjustKeyboardInsets` נותן מקום לגלול, אבל לא
   * מזיז את הרשימה. כאן היא פשוט נפתחת כלפי מעלה.
   */
  const wrapRef = React.useRef<View>(null);
  const [above, setAbove] = React.useState(false);
  const win = useWindowDimensions();
  const [busy, setBusy] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  /* איפה השדה יושב על המסך · נקבע כשהרשימה נפתחת */
  const decideSide = React.useCallback(() => {
    wrapRef.current?.measureInWindow((_x, y) => setAbove(y > win.height * 0.42));
  }, [win.height]);

  React.useEffect(() => {
    /* כתובת שכבר נבחרה · לא מחפשים שוב עד שמקלידים מחדש */
    if (value && text === `${value.street}, ${value.city}`) return;
    if (text.trim().length < MIN_QUERY) {
      setHits([]);
      setBusy(false);
      return;
    }
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      setBusy(true);
      setFailed(false);
      try {
        const found = await searchStreets(text, ctrl.signal);
        setHits(found);
        decideSide();
        setOpen(true);
      } catch (e) {
        /* ביטול אינו שגיאה · רק כישלון אמיתי מדליק את ההודעה */
        if (!(e instanceof DOMException && e.name === 'AbortError')) {
          setHits([]);
          setFailed(true);
        }
      } finally {
        setBusy(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [text, value, decideSide]);

  /**
   * בחירה ידנית · מה שהוקלד הוא הרחוב, והעיר נבחרת מהרשימה.
   * ⚠ פעיל רק כשהחיפוש נכשל · ראו ההערה בראש הקובץ.
   */
  const pickManual = (city: string) => {
    const street = text.trim();
    if (!street) return;
    onPick({ street, city });
  };

  const pick = (h: AddressHit) => {
    setText(`${h.street}, ${h.city}`);
    setHits([]);
    setOpen(false);
    onPick(h);
  };

  const outside = zone && !!value && !inDeliveryZone(value.city);
  const inside = zone && !!value && inDeliveryZone(value.city);

  const edge = outside ? BAD : inside ? OK : IDLE_BD;
  const fill = outside ? BAD_BG : inside ? OK_BG : '#FFFFFF';

  return (
    <View ref={wrapRef} style={s.wrap}>
      <View style={[s.field, { borderColor: edge, backgroundColor: fill }]}>
        <TextInput
          value={text}
          onChangeText={(t) => {
            setText(t);
            /* כל שינוי מבטל את הבחירה · אחרת נשארת עיר ישנה */
            if (value) onPick(null);
          }}
          placeholder={placeholder}
          placeholderTextColor="#B3ABBD"
          style={s.input}
        />

        {/* ⚠ **מספר הבית באותה כרטיסייה · 16 בספטמבר 2026** · שקד:
            ״אני לא רוצה שזה יהיה מופרד לרחוב ועיר ואז למספר — אני
            רוצה את כל הכתובת יחד בכרטיסייה אחת בלבד״. הוא היה שדה
            נפרד מתחת. המאגר הממשלתי אינו מחזיק מספרי בתים, ולכן
            הוא עדיין נכתב ביד — רק שעכשיו הוא יושב באותה שורה,
            מופרד בקו דק, וכל הכתובת נקראת כיחידה אחת. */}
        {value ? (
          <>
            <View style={s.divider} />
            <TextInput
              value={house}
              onChangeText={onHouse}
              placeholder="מס׳"
              placeholderTextColor="#B3ABBD"
              keyboardType="number-pad"
              style={s.house}
            />
          </>
        ) : null}

        {busy ? <ActivityIndicator size="small" color={surface.faint} /> : null}
      </View>

      {open && hits.length > 0 ? (
        <View style={[s.list, above ? s.listAbove : s.listBelow]}>
          {hits.map((h) => (
            <Pressable key={`${h.street}|${h.city}`} onPress={() => pick(h)} style={s.row}>
              <Text style={s.rowStreet}>{h.street}</Text>
              <Text style={[s.rowCity, zone && !inDeliveryZone(h.city) && s.rowCityOut]}>
                {h.city}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}



      {outside ? <Text style={[s.note, s.noteBad]}>{OUT_OF_ZONE}</Text> : null}
      {inside && okNote ? <Text style={[s.note, s.noteOk]}>{okNote}</Text> : null}
      {/* ⚠ מסלול ידני · ראו ההערה בראש הקובץ */}
      {failed && !value ? (
        <View style={s.manual}>
          <Text style={s.note}>רשימת הרחובות לא נטענה · בחרי עיר ומה שהקלדת יישמר כרחוב</Text>
          <View style={s.cityRow}>
            {DELIVERY_CITIES.map((c) => (
              <Pressable key={c} onPress={() => pickManual(c)} style={s.cityChip} hitSlop={4}>
                <Text style={s.cityChipText}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 7, width: '100%', maxWidth: MAX_W, alignSelf: 'center' },
  manual: { gap: 7 },
  cityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cityChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(130,112,162,0.1)',
  },
  cityChipText: { fontSize: 12.5, color: surface.inkSoft },
  field: {
    minHeight: FIELD_H,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: { flexGrow: 1, flexShrink: 1, fontSize: 15, textAlign: INPUT_START, color: surface.ink },
  /* מספר הבית · קופסה צרה באותה שורה, אחרי הקו המפריד */
  house: { width: 54, fontSize: 15, textAlign: 'center', color: surface.ink },
  divider: { width: 1, alignSelf: 'stretch', marginVertical: 9, backgroundColor: IDLE_BD },

  /**
   * ⚠ **מרחפת ולא בזרימה** · בזרימה היא דוחפת את שדה מספר הבית
   * למטה בכל הקלדה, והמסך קופץ. כשהיא מרחפת היא גם יכולה להיפתח
   * כלפי מעלה, מעל המקלדת.
   */
  list: {
    position: 'absolute',
    right: 0,
    left: 0,
    zIndex: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: IDLE_BD,
    backgroundColor: '#FFFFFF',
    maxHeight: LIST_MAX_H,
    overflow: 'hidden',
    boxShadow: '0 12px 28px -14px rgba(60,48,84,0.5)',
  },
  listBelow: { top: FIELD_H + 6 },
  listAbove: { bottom: '100%', marginBottom: 6 },
  row: {
    height: ROW_H,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: a('130,112,162', 0.1),
  },
  rowStreet: { flexGrow: 1, fontSize: 14, fontWeight: '500', color: surface.ink },
  rowCity: { fontSize: 12, fontWeight: '300', color: surface.muted },
  /* יישוב מחוץ לאזור · מסומן כבר ברשימה, לפני הבחירה */
  rowCityOut: { color: BAD },

  note: { fontSize: 11.5, fontWeight: '300', color: surface.muted, paddingHorizontal: 4 },
  noteBad: { color: BAD, fontWeight: '500' },
  noteOk: { color: OK, fontWeight: '500' },
});
