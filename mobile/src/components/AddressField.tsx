import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
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
  const [busy, setBusy] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [open, setOpen] = React.useState(false);

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
  }, [text, value]);

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
    <View style={s.wrap}>
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
        {busy ? <ActivityIndicator size="small" color={surface.faint} /> : null}
      </View>

      {open && hits.length > 0 ? (
        <View style={s.list}>
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

      {/* מספר הבית · המאגר הממשלתי אינו מחזיק מספרי בתים */}
      {value ? (
        <TextInput
          value={house}
          onChangeText={onHouse}
          placeholder="מספר בית"
          placeholderTextColor="#B3ABBD"
          keyboardType="number-pad"
          style={[s.field, s.house, { borderColor: edge }]}
        />
      ) : null}

      {outside ? <Text style={[s.note, s.noteBad]}>{OUT_OF_ZONE}</Text> : null}
      {inside && okNote ? <Text style={[s.note, s.noteOk]}>{okNote}</Text> : null}
      {failed ? <Text style={s.note}>לא הצלחנו לטעון כתובות · אפשר לנסות שוב</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 7 },
  field: {
    minHeight: FIELD_H,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: { flexGrow: 1, flexShrink: 1, fontSize: 15, textAlign: 'right', color: surface.ink },
  house: { backgroundColor: '#FFFFFF', fontSize: 15, textAlign: 'right', color: surface.ink },

  list: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: IDLE_BD,
    backgroundColor: '#FFFFFF',
    maxHeight: LIST_MAX_H,
    overflow: 'hidden',
  },
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
