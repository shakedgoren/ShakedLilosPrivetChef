import React from 'react';
import { S } from '../components/Sym';
import { RollingTotal } from '../components/RollingTotal';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import {
  BUSINESS_PHONE,
  PAYMENTS,
  SALE_DATE,
  deliveryFee,
  payLinkFor,
  shippingFeeFor,
} from '../data/shared';
import { PickupMaps } from '../components/PickupMaps';
import { a, radius, space, surface, type } from '../theme/tokens';
import { STEP, type Fulfillment } from './useFulfillment';
import { hhmm, type Accent, type OrderLine } from './types';
import { apiEnabled } from '../api/config';
import { COPY, orderError } from '../api/copy';
import { createOrder } from '../api/orders';
import { ApiError, type OrderDetails } from '../api/types';
import { Truck } from '../icons';
import { PayLogo } from '../components/PayLogo';
import { OptionGrid } from '../components/OptionGrid';
import { TimeWheel } from '../components/TimeWheel';
import { DateCalendar } from '../components/DateCalendar';
import { AddressField, type AddressValue } from '../components/AddressField';
import { TILE_SHADOW } from '../theme/glass';
import { ContinueButton } from '../components/ContinueButton';
import { Confetti } from '../components/Confetti';

/* מידות שורות המסירה · מהקנבס · האיסוף בגוון הקטגוריה, המשלוח אפור */
const OPTION_ICON = 21;
const OPTION_STROKE = 1.7;
const TRUCK_INK = '#8A8194';
/* שורת האיסוף · הרקע והמסגרת בגוון הקטגוריה · rgba(hue,0.08) ו-0.3 בקנבס */
const PICKUP_BG = 0.08;
const PICKUP_EDGE = 0.3;
const CHEV = 14;
const CHEV_INK = '#C1BBCB';
const CHEV_STROKE = 2.4;

/* דמי המשלוח · לתצוגה בלבד, החישוב ב-`deliveryFee` */
const SHIP_NEAR = shippingFeeFor('יבנה');
const SHIP_FAR = shippingFeeFor('אחר');

/**
 * ⚠ **״אישור״ ולא ״להמשך״ · 16 בספטמבר 2026** · בקשה של שקד בשני
 * השלבים — שעת האיסוף וכתובת המשלוח.
 */
const CONFIRM_LABEL = 'אישור';
/** אמצעי התשלום שמבוצעים בהעברה · ולא במזומן ביד */
const TRANSFER = new Set(['ביט', 'פייבוקס']);
/** מה שכתוב כשהכתובת בתוך אזור החלוקה */
const DELIVERY_OK = 'הכתובת בתוך אזור החלוקה';

type Props = {
  f: Fulfillment;
  lines: OrderLine[];
  total: number;
  accent: Accent;
  onHome: () => void;
  /** פרטי הקטגוריה לשמירה בשרת · בלי זה (או בלי API) ההזמנה נשארת מקומית */
  details?: OrderDetails;
};

/** זרימת המסירה והתשלום · משותפת לכל הקטגוריות */
export function FulfillmentFlow({ f, lines, total, accent, onHome, details }: Props) {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');

  /* ההזמנה נסגרה · ראו את ההערה על ה-X */
  const done = f.step === STEP.done || f.step === STEP.confirm;
  const closeHome = () => {
    f.reset();
    onHome();
  };

  if (f.step === STEP.closed) return null;

  const onPay = async (p: string) => {
    if (busy) return;
    if (!apiEnabled || !details || !f.ship || !f.time) {
      f.pickPay(p);
      return;
    }
    setBusy(true);
    setErr('');
    try {
      await createOrder({
        ship: f.ship === 'deliv' ? 'deliv' : 'self',
        time: f.time,
        city: f.city,
        address: f.addr,
        pay: p,
        saleDate: SALE_DATE,
        details,
      });
      f.pickPay(p);
    } catch (e) {
      setErr(e instanceof ApiError ? orderError(e.code, e.message) : COPY.orderFail);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={f.reset}>
      <View style={s.scrim}>
        <View style={s.sheet}>
          <View style={s.head}>
            <Text style={s.title}>{titleFor(f)}</Text>
            {/* ⚠ **במסך האישור ה-X מחזיר הביתה · 17 בספטמבר 2026** ·
                בקשה של שקד. בשאר השלבים הוא רק סוגר את החלונית
                ומשאיר את ההזמנה כפי שהיא. */}
            <Pressable onPress={done ? closeHome : f.reset} hitSlop={10}>
              <S k="close" size={13} color="#6E6478" />
            </Pressable>
          </View>

          <ScrollView style={s.body} contentContainerStyle={s.bodyPad}>
            {f.step === STEP.ship && <ShipStep f={f} accent={accent} />}
            {f.step === STEP.time &&
              (f.isDelivery ? <SlotsStep f={f} accent={accent} /> : <ClockStep f={f} accent={accent} />)}
            {f.step === STEP.address && <AddressStep f={f} accent={accent} />}
            {f.step === STEP.pay && (
              <PayStep busy={busy} err={err} onPay={onPay} accent={accent} due={total + deliveryFee(f.ship ?? '', f.city)} />
            )}
            {(f.step === STEP.done || f.step === STEP.confirm) && (
              <ConfirmStep f={f} lines={lines} total={total} accent={accent} onHome={onHome} />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const titleFor = (f: Fulfillment) => {
  if (f.step === STEP.ship) return 'איך תרצי לקבל?';
  if (f.step === STEP.time) return f.isDelivery ? 'שעת משלוח' : 'שעת איסוף';
  if (f.step === STEP.address) return 'כתובת למשלוח';
  if (f.step === STEP.pay) return 'אמצעי תשלום';
  /* ⚠ **ריק במסך האישור · בקשת שקד** · ״למחוק את הכיתוב ההזמנה
     התקבלה״ · הבשורה עברה לכותרת הגדולה שבתוך המסך עצמו. */
  return '';
};

const window = (from: number, to: number) => `${hhmm(from)}–${hhmm(to)}`;

function ShipStep({ f, accent }: { f: Fulfillment; accent: Accent }) {
  const { pickupFrom, pickupTo, deliverySlots, minMealsForDelivery } = f.cfg;
  const first = deliverySlots[0];
  const last = deliverySlots[deliverySlots.length - 1];

  return (
    <View style={s.stack}>
      <Pressable
        onPress={f.wantPickup}
        style={[
          s.option,
          { backgroundColor: a(accent.rgb, PICKUP_BG), borderColor: a(accent.rgb, PICKUP_EDGE) },
        ]}
      >
        {/* ⚠ SF Symbols · mappin.and.ellipse לאיסוף עצמי */}
        <S k="pickup" size={OPTION_ICON} color={accent.hue} />
        <View style={s.optionText}>
          <Text style={s.optionTitle}>איסוף עצמי</Text>
          <Text style={s.optionSub}>נופר 25, יבנה · {window(pickupFrom, pickupTo)}</Text>
        </View>
        <S k="chevronLeft" size={CHEV} color={CHEV_INK} />
      </Pressable>

      <Pressable onPress={f.wantDelivery} style={[s.option, s.optionPlain]}>
        {/* ⚠ SF Symbols · paperplane למשלוח, כפי שביקשה שקד */}
        <S k="delivery" size={OPTION_ICON} color={TRUCK_INK} />
        <View style={s.optionText}>
          <Text style={s.optionTitle}>משלוח</Text>
          <Text style={s.optionSub}>
            {minMealsForDelivery !== undefined ? `מ־${minMealsForDelivery} מנות · ` : ''}
            {first}–{last}
          </Text>
          {/* ⚠ המחירון נוסף כאן · הלקוחה לא ידעה כמה עולה משלוח
              עד שההזמנה כבר נשלחה */}
          <Text style={s.optionSub}>
            {SHIP_NEAR} ₪ בתוך יבנה · {SHIP_FAR} ₪ מחוצה לה
          </Text>
        </View>
        <S k="chevronLeft" size={CHEV} color={CHEV_INK} />
      </Pressable>

      {f.toast && (
        <Text style={s.toast}>משלוח מתחיל מ־{minMealsForDelivery} מנות</Text>
      )}
    </View>
  );
}

/**
 * שעת האיסוף.
 *
 * ⚠ **גלגל במקום שדה טקסט · 16 בספטמבר 2026** · בקשה של שקד:
 * ״בבחירה של שעת איסוף זה צריך להיות כמו הבחירה של שעה בשעון
 * מעורר שאפשר להזיז את הספרות עם האצבע״. אותו `TimeWheel` שכבר
 * משמש את מגשי הפירות.
 *
 * ⚠ **״אישור״ ממורכז ובלי חץ** · גם זו בקשה מפורשת, במקום ״להמשך״.
 *
 * ⚠ **לוח תאריכים למארזים** · ראו `pickDate` ב-`FulfillmentConfig`.
 */
function ClockStep({ f, accent }: { f: Fulfillment; accent: Accent }) {
  return (
    <View style={s.stack}>
      {f.cfg.pickDate ? (
        <DateCalendar
          value={f.date ?? undefined}
          onPick={f.setDate}
          accent={accent}
        />
      ) : null}

      <TimeWheel
        value={f.clock}
        onChange={f.setClock}
        from={f.cfg.pickupFrom}
        to={f.cfg.pickupTo}
        accent={accent}
      />
      <Text style={s.hint}>בין {hhmm(f.cfg.pickupFrom)} ל־{hhmm(f.cfg.pickupTo)}</Text>

      <ContinueButton
        onPress={f.clockNext}
        accent={accent}
        label={CONFIRM_LABEL}
        disabled={!f.clockReady}
        bare
      />
    </View>
  );
}

function SlotsStep({ f, accent }: { f: Fulfillment; accent: Accent }) {
  return (
    <View style={s.slots}>
      {f.cfg.deliverySlots.map((t) => (
        <Pressable
          key={t}
          onPress={() => f.pickSlot(t)}
          style={[s.slot, { backgroundColor: a(accent.rgb, 0.1) }]}
        >
          <Text style={[s.slotText, { color: accent.deep }]}>{t}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/**
 * כתובת המשלוח.
 *
 * ⚠ **הוחלפה ב-`AddressField` · 16 בספטמבר 2026** · בקשה של שקד:
 * ״במשלוח צריך להתאים את הכתובת לאיך שהיא מוצגת בשאר האפליקציה״.
 * כאן היו גלולות ערים ושדה טקסט חופשי, בעוד שבפינת השף ובמגשי
 * הפירות כבר עובד שדה אחד עם השלמה, בדיקת אזור חלוקה ומספר בית
 * באותה כרטיסייה.
 *
 * העיר נגזרת מהכתובת שנבחרה ונשמרת ב-`f.city`, כי דמי המשלוח
 * מחושבים לפיה.
 *
 * ⚠ **״אישור״ ממורכז ובלי חץ** · בקשה מפורשת, במקום ״להמשך״.
 */
function AddressStep({ f, accent }: { f: Fulfillment; accent: Accent }) {
  const [picked, setPicked] = React.useState<AddressValue>(null);
  const [house, setHouse] = React.useState('');

  /* הכתובת המלאה חוזרת ל-`f` בכל שינוי · שם היא נשמרת ונשלחת */
  React.useEffect(() => {
    if (!picked) {
      f.setAddr('');
      return;
    }
    f.setCity(picked.city);
    f.setAddr(`${picked.street} ${house}`.trim());
  }, [picked, house]);

  return (
    <View style={s.stack}>
      <AddressField
        value={picked}
        onPick={setPicked}
        house={house}
        onHouse={setHouse}
        zone
        okNote={DELIVERY_OK}
      />

      <ContinueButton
        onPress={f.addressNext}
        accent={accent}
        label={CONFIRM_LABEL}
        disabled={!f.addressOk}
        bare
      />
    </View>
  );
}

/**
 * אמצעי תשלום.
 *
 * ⚠ **אינו מהקנבס** · שם כל אמצעי תשלום הוא שורה ברוחב מלא עם
 * נקודה, שם וחץ. שקד ביקשה אייקון מעל השם, שניים בשורה, ומסגרת
 * בהירה יותר.
 * ⚠ **עכשיו אלה הלוגואים האמיתיים** · שקד שלחה את ארבעת הקבצים
 * (16 בספטמבר 2026). קודם היו כאן אייקוני קו ניטרליים דווקא מפני
 * שאלה סימני מסחר; היא ביקשה את הלוגואים עצמם. ראו `PayLogo.tsx`.
 */

/**
 * ⚠ **שלושה בשורה אחת · 16 בספטמבר 2026** · בקשה של שקד: ״אני רוצה
 * ששלושתם יופיעו באותה השורה כאשר האייקונים שלהם צריכים להיות
 * גדולים יותר ומתחת לכל אייקון הכיתוב המתאים״.
 * היה 24 בשתי עמודות.
 */
const PAY_GLYPH = 38;
/** ⚠ הרוחב המרבי בתוך האריח · ראו `maxWidth` ב-`PayLogo` */
const PAY_MAX_W = 84;
const PAY_COLS = 3;
/** ⚠ בהיר יותר · המסגרת הרגילה היא 0.16, ושקד ביקשה שתהיה עדינה */
const PAY_EDGE = 'rgba(130,112,162,0.1)';
const PAY_EDGE_ON = 0.3;

function PayStep({
  busy,
  err,
  onPay,
  accent,
  due,
}: {
  busy: boolean;
  err: string;
  onPay: (p: string) => void;
  accent: Accent;
  /** הסכום לתשלום · נשלח לאפליקציית התשלום */
  due: number;
}) {
  /**
   * ⚠ **מסלול העברה ידנית · 17 בספטמבר 2026** · שקד מסרה את מספר
   * העסק, ואי אפשר לגזור ממנו קישור תשלום — לביט ולפייבוקס אין
   * סכמה ציבורית שמקבלת ״שלם לטלפון X סכום Y״.
   *
   * עד שיהיה לה קישור אישי, הלחיצה **מציגה את המספר ואת הסכום**
   * במקום לפתוח אפליקציה שלא תדע מה לעשות. ההזמנה נרשמת רק אחרי
   * אישור, כדי שהלקוחה לא תאשר לפני שראתה לאן להעביר.
   */
  const [manual, setManual] = React.useState<string | null>(null);
  /**
   * ⚠ **מעבר לאפליקציית התשלום · בקשה של שקד** · ״בלחיצה על ביט או
   * פייבוקס זה צריך להעביר לאפליקציה עם הסכום המתאים״.
   * ⚠ הקישורים עדיין ריקים · ראו `PAY_LINKS` ב-`data/shared.ts`.
   * כל עוד הם ריקים הלחיצה מתנהגת כפי שהתנהגה עד היום.
   */
  const choose = (p: string) => {
    const link = payLinkFor(p, due);
    if (link) {
      void Linking.openURL(link).catch(() => undefined);
      onPay(p);
      return;
    }
    /* ⚠ אין קישור · מציגים את המספר והסכום · ראו `PAY_LINKS` */
    if (TRANSFER.has(p)) {
      setManual(p);
      return;
    }
    onPay(p);
  };

  return (
    <View style={s.stack}>
      <OptionGrid cols={PAY_COLS} gap={9}>
        {PAYMENTS.map((p) => {
          const payLogo = p;
          return (
            <Pressable
              key={p}
              disabled={busy}
              onPress={() => choose(p)}
              style={[s.pay, { opacity: busy ? 0.45 : 1 }]}
            >
              <PayLogo method={payLogo} size={PAY_GLYPH} maxWidth={PAY_MAX_W} />
              <Text style={s.payLabel}>{p}</Text>
            </Pressable>
          );
        })}
      </OptionGrid>
      {/* ⚠ ההעברה הידנית · ראו ההערה למעלה */}
      {manual ? (
        <View style={[s.transfer, { borderColor: a(accent.rgb, 0.3) }]}>
          <Text style={s.transferHead}>{`להעברה ב${manual}`}</Text>
          <Text style={[s.transferPhone, { color: accent.deep }]}>{BUSINESS_PHONE}</Text>
          <Text style={s.transferSum}>{`${Math.round(due)} ₪`}</Text>
          <ContinueButton
            onPress={() => {
              setManual(null);
              onPay(manual);
            }}
            accent={accent}
            label={CONFIRM_LABEL}
            disabled={busy}
            bare
          />
        </View>
      ) : null}

      {err ? <Text style={s.toast}>{err}</Text> : null}
    </View>
  );
}

function ConfirmStep({
  f,
  lines,
  total,
  accent,
  onHome,
}: {
  f: Fulfillment;
  lines: OrderLine[];
  total: number;
  accent: Accent;
  onHome: () => void;
}) {
  const fee = deliveryFee(f.ship ?? '', f.city);

  return (
    <View style={s.stack}>
      {/* ⚠ **החליף את ״נשלח לך אישור לוואטסאפ״ · 16 בספטמבר 2026** ·
          בקשה מפורשת של שקד: ״במקום הכיתוב נשלח לך אישור לוואטצפ
          לכתוב בגדול במיקום שם ההזמנה התקבלה! (עם קונפטי)״. */}
      <Text style={s.doneTitle}>ההזמנה התקבלה!</Text>
      <Confetti />

      <View style={s.summary}>
        <Text style={s.summaryHead}>סיכום ההזמנה</Text>

        {lines.map((l) => (
          <View key={l.name} style={s.line}>
            {/* ⚠ **בלי ״1×״ · 17 בספטמבר 2026** · שקד ביקשה שהסלטים
                ייכתבו בגרמים ״ולא את x״. כמות אחת אינה מוסיפה מידע
                בשום שורה, ולכן היא יורדת בכל הקטגוריות. */}
            {l.qty > 1 ? <Text style={s.lineQty}>{l.qty}×</Text> : null}
            <Text style={s.lineName}>{l.name}</Text>
            <Text style={s.lineSum}>{l.sum} ₪</Text>
          </View>
        ))}

        {/* ⚠ **שורה חדשה** · דמי המשלוח לא הופיעו בסיכום בכלל,
            והלקוחה ראתה רק את מחיר הפריטים. 20 בתוך יבנה, 60
            מחוצה לה — נמסר על ידי שקד ב-15 בספטמבר 2026. */}
        {fee > 0 ? (
          <View style={s.line}>
            <Text style={s.lineName}>משלוח · {f.city}</Text>
            <Text style={s.lineSum}>{fee} ₪</Text>
          </View>
        ) : null}

        <View style={s.rule} />
        <View style={s.line}>
          <Text style={s.totalLabel}>סה״כ</Text>
          <RollingTotal value={total + fee} style={s.total} />
          <Text style={s.currency}>₪</Text>
        </View>

        <View style={s.rule} />
        <Row k={f.isDelivery ? 'משלוח' : 'איסוף עצמי'} v={f.time ?? ''} />
        {f.isDelivery && <Row k="כתובת" v={`${f.addr}, ${f.city}`} />}
        <Row k="תשלום" v={f.pay ?? ''} />
        <Row k="מועד" v={SALE_DATE} />

        {!f.isDelivery && <PickupMaps rgb={accent.rgb} ink={accent.deep} />}
      </View>

      {/* ⚠ **בלי חץ · 16 בספטמבר 2026** · בקשה של שקד. החץ מבטיח
          המשך, והלחיצה כאן מסיימת וחוזרת הביתה. */}
      <ContinueButton onPress={onHome} accent={accent} label="חזרה לדף הבית" bare style={s.homeCta} />
    </View>
  );
}

const Row = ({ k, v }: { k: string; v: string }) => (
  <View style={s.line}>
    <Text style={s.rowKey}>{k}</Text>
    <Text style={s.rowVal}>{v}</Text>
  </View>
);

const s = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(42,36,48,0.34)', justifyContent: 'center', padding: space.lg },
  sheet: { maxHeight: '86%', borderRadius: 28, backgroundColor: '#FEFCFB', padding: space.lg },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  title: { flex: 1, fontSize: 18, fontWeight: '600', color: surface.ink },
  close: { fontSize: 16, color: surface.faint },
  body: { marginTop: space.md },
  bodyPad: { paddingBottom: space.sm },
  stack: { gap: space.md },

  /* המידות מהקנבס · גובה 66, פינה 20, ריפוד אופקי 16 ומרווח 13 */
  option: {
    height: 66,
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  optionPlain: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderColor: 'rgba(130,112,162,0.16)',
    boxShadow: TILE_SHADOW,
  },
  /* הטקסט תופס את מה שנשאר · האייקון והחץ נשארים בקצוות */
  optionText: { flexGrow: 1, flexShrink: 1, gap: 3 },
  optionTitle: { fontSize: 15.5, fontWeight: '600', color: surface.ink },
  optionSub: { fontSize: type.label, color: surface.muted },
  toast: { fontSize: type.label, color: '#B95349', textAlign: 'center' },

  hint: { fontSize: 11.5, color: surface.muted },

  slots: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 9 },
  slot: { width: '30%', height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  slotText: { fontSize: 14, fontWeight: '600' },


  /* כרטיס אמצעי תשלום · אייקון מעל השם, מסגרת בהירה */
  pay: {
    flex: 1,
    minHeight: 104,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: PAY_EDGE,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  payLabel: { fontSize: 13, fontWeight: '600', color: surface.ink, textAlign: 'center' },
  /* ⚠ ההעברה הידנית · ראו את ההערה ב-`PayStep` */
  transfer: {
    marginTop: 4,
    borderRadius: 18,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 6,
  },
  transferHead: { fontSize: 12.5, color: surface.muted },
  transferPhone: { fontSize: 24, fontWeight: '700', letterSpacing: 0.5 },
  transferSum: { fontSize: 15, fontWeight: '600', color: surface.ink, marginBottom: 6 },

  cta: { height: 50, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },

  /* ⚠ הוגדל והוחלף · ראו ההערה ב-`ConfirmStep` */
  doneTitle: {
    fontSize: 27,
    fontWeight: '700',
    color: surface.ink,
    textAlign: 'center',
    marginBottom: 2,
  },
  summary: { borderRadius: 24, padding: space.lg, backgroundColor: 'rgba(255,255,255,0.8)', gap: 8 },
  summaryHead: { fontSize: 10.5, letterSpacing: 2, fontWeight: '600', color: '#A69EAE' },
  /* מיקום בלבד · הכפתור במסך האישור ממורכז עם רווח מעליו */
  homeCta: { alignSelf: 'center', marginTop: 6 },
  line: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  lineQty: { fontSize: type.body, fontWeight: '500', color: surface.inkSoft },
  lineName: { flex: 1, fontSize: type.body, color: surface.inkSoft },
  lineSum: { fontSize: type.body, fontWeight: '600', color: surface.ink },
  rule: { height: 1, backgroundColor: surface.hairline },
  totalLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: surface.ink },
  total: { fontSize: 20, fontWeight: '600', color: surface.ink },
  currency: { fontSize: 13, color: '#7A7080' },
  rowKey: { flex: 1, fontSize: type.label, color: surface.muted },
  rowVal: { fontSize: type.body, fontWeight: '600', color: surface.ink },
});
