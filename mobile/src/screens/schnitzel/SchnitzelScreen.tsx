import React, { useState } from 'react';
import { RollingTotal } from '../../components/RollingTotal';
import { StepIn } from '../../components/StepIn';
import { categoryName } from '../orders/format';
import { SaleClosedSheet } from '../../components/SaleClosedSheet';
import { useSaleGate } from '../../order/useSaleGate';
import { usePrefill } from '../../navigation/usePrefill';
import { BAR_BOTTOM_WITH_NAV } from '../../components/BottomNav';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import {
  COCOTTES,
  COCOTTE_PRICE,
  SCHNITZEL_FULFILLMENT,
  SCHNITZEL_FORMS,
  SCHNITZEL_MODES,
  SCHNITZEL_TYPES,
} from '../../data/schnitzel';
import { CategoryHeader } from '../../components/CategoryHeader';
import { LoginGate } from '../../components/LoginGate';
import { Photo } from '../../components/Photo';
import { Stepper } from '../../components/Stepper';
import { SCHNITZEL_BOX_PHOTOS, SCHNITZEL_UNIT_PHOTOS } from '../../data/photos';
import {
  FORM_CARD,
  GIFT_NOTE,
  COCOTTE_ROW,
  GIFT_SPACE,
  PICK_TYPE_LABEL,
  SCHNITZEL_DATE,
  SCHNITZEL_INTRO,
  SCHNITZEL_TITLE,
  TYPE_CARD,
} from '../../data/schnitzelCopy';
import { FulfillmentFlow } from '../../order/FulfillmentFlow';
import { useFulfillment } from '../../order/useFulfillment';
import { a, hues, radius, space, surface, type } from '../../theme/tokens';
import { FONT_BUMP, headRoom } from '../../theme/fontScale';
import { useNav } from '../../navigation/store';
import { useSchnitzelOrder } from './useSchnitzelOrder';
import { ToppingsSheet } from './ToppingsSheet';
import { Gift, PlatterFamily, PlatterSingles } from '../../icons';
import { TILE_EDGE, TILE_SHADOW } from '../../theme/glass';
import { ContinueButton } from '../../components/ContinueButton';

const ACCENT = hues.schn;

/** אייקון המתנה · 19 פיקסלים בקנבס */
const GIFT_GLYPH = 19;
/* נוסח שכתב Claude (אין כותרת לגוש בקנבס) · ✅ שקד אישרה ב-11 בספטמבר 2026 · אין לשנות */
const PICK_FORM_LABEL = 'בחירת צורה';
const PICK_BOX_LABEL = 'בחירת מארז';
/** כותרת גוש ההזמנה · שקד כתבה את הנוסח · מוצגת רק כשיש מה להציג */
const MY_ORDER_LABEL = 'ההזמנה שלי';

/** שישי של מטעמים · חלות בודדות או מארז, עם תוספות וקוקוטים */
export function SchnitzelScreen() {
  const { go, goLogin, loggedIn } = useNav();
  const o = useSchnitzelOrder();
  /* ⚠ ״להזמין שוב״ · הפריטים של ההזמנה הקודמת כבר מסומנים */
  usePrefill('schn', o.loadDetails);
  /* רוחב הכרטיס נמדד · הנוסחה בקנבס היא (100% − רווח) ÷ 2 */
  const [gridW, setGridW] = useState(0);
  const typeCardW = gridW ? (gridW - TYPE_CARD.gridGap) / 2 : undefined;
  /* `meals` נדרש למינימום המשלוח · מארז נחשב חמש מנות */
  const f = useFulfillment({ ...SCHNITZEL_FULFILLMENT, meals: o.meals });
  /* ⚠ יום מכירה סגור · מתריעים כאן ולא בשלב התשלום */
  const saleGate = useSaleGate('schn');
  const [gate, setGate] = useState(false);

  const onContinue = () => {
    if (!loggedIn) setGate(true);
    else if (o.total > 0) void saleGate.guard(f.open);
  };

  return (
    <View style={s.page}>
      <CategoryHeader title={SCHNITZEL_TITLE} date={SCHNITZEL_DATE} />

      <Text style={s.intro}>{SCHNITZEL_INTRO}</Text>

      <View style={s.modes}>
        {SCHNITZEL_MODES.map((label, k) => (
          <Pressable
            key={label}
            onPress={() => o.setMode(k)}
            style={[s.mode, o.mode === k && s.modeOn]}
          >
            <Text style={[s.modeText, o.mode === k && { color: ACCENT.deep, fontWeight: '600' }]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        {/* כרטיס המתנה · האייקון היה בקנבס ולא הועבר */}
        <View style={s.gift}>
          <Gift size={GIFT_GLYPH} color={ACCENT.hue} strokeWidth={1.6} />
          <Text style={s.giftText}>{GIFT_NOTE}</Text>
        </View>

        {/**
          * ⚠ **ההזמנה שלי יצאה מהלשוניות** · קודם כל לשונית הציגה רק את
          * הפריטים שלה, ולכן הסה״כ המאוחד היה מראה סכום של פריטים שאינם
          * על המסך. עכשיו הרשימה אחת: חלות בודדות ומארזים יחד, והלשוניות
          * מחליפות רק את הבורר שמתחת.
          */}
        {o.basket.length + o.boxes.length > 0 && (
          <Text style={s.sectionTitle}>{MY_ORDER_LABEL}</Text>
        )}
        {o.basket.map((b, i) => (
          <View key={`roll-${b.type}-${i}`} style={s.row}>
            <Photo name={SCHNITZEL_UNIT_PHOTOS[b.type]} rgb={ACCENT.rgb} style={s.shot} />
            <View style={s.rowText}>
              <Text style={s.name}>
                חלה {i + 1} · {SCHNITZEL_TYPES[b.type].short}
              </Text>
              <Text style={s.tops}>{b.tops.length ? b.tops.join(' · ') : 'בלי תוספות'}</Text>
            </View>
            <Text style={s.price}>{SCHNITZEL_TYPES[b.type].unit} ₪</Text>
            <Pressable onPress={() => o.openEdit(i)} hitSlop={8}>
              <Text style={s.action}>עריכה</Text>
            </Pressable>
            <Pressable onPress={() => o.removeRoll(i)} hitSlop={8}>
              <Text style={s.remove}>✕</Text>
            </Pressable>
          </View>
        ))}
        {o.boxes.map((b, i) => (
          <View key={`box-${b.type}-${i}`} style={s.row}>
            <Photo name={SCHNITZEL_BOX_PHOTOS[b.type]} rgb={ACCENT.rgb} style={s.shot} />
            <View style={s.rowText}>
              <Text style={s.name}>
                מארז {i + 1} · {SCHNITZEL_TYPES[b.type].short}
              </Text>
              <Text style={s.tops}>{b.tops.length ? b.tops.join(' · ') : 'בלי תוספות'}</Text>
            </View>
            <Text style={s.price}>{SCHNITZEL_TYPES[b.type].box} ₪</Text>
            <Pressable onPress={() => o.openBoxEdit(i)} hitSlop={8}>
              <Text style={s.action}>עריכה</Text>
            </Pressable>
            <Pressable onPress={() => o.removeBox(i)} hitSlop={8}>
              <Text style={s.remove}>✕</Text>
            </Pressable>
          </View>
        ))}

        {o.isUnit ? (
          <>
            <Text style={s.sectionTitle}>{PICK_TYPE_LABEL}</Text>
            {/* שתי עמודות · תמונה מלמעלה, בדיוק כמו בקנבס */}
            <View style={s.grid} onLayout={(e) => setGridW(e.nativeEvent.layout.width)}>
              {SCHNITZEL_TYPES.map((t, k) => (
                <StepIn key={t.name} index={k} style={{ width: typeCardW }}>
                  <Pressable onPress={() => o.openAdd(k)} style={[s.typeCard, { width: typeCardW }]}>
                    <Photo name={SCHNITZEL_UNIT_PHOTOS[k]} rgb={ACCENT.rgb} style={s.typeShot} zoom={false} />
                    <Text style={s.typeName}>{t.name}</Text>
                    <Text style={s.typePrice}>{t.unit} ₪</Text>
                  </Pressable>
                </StepIn>
              ))}
            </View>
          </>
        ) : (
          <>
            {/* ⚠ שקד ביקשה שהמארזים שנבחרו יופיעו מעל ״בחירת צורה״ · בקנבס
                הם יושבים מתחתיה. הרשימה עלתה לגוש ההזמנה המשותף שמעל. */}
            {/* צורת המארז · SCHNITZEL_FORMS בקנבס · קדם לבחירת המארז */}
            <Text style={s.sectionTitle}>{PICK_FORM_LABEL}</Text>
            <View style={s.grid} onLayout={(e) => setGridW(e.nativeEvent.layout.width)}>
              {SCHNITZEL_FORMS.map((name, k) => {
                const on = o.form === k;
                const Glyph = k === 0 ? PlatterSingles : PlatterFamily;
                return (
                  <Pressable
                    key={name}
                    onPress={() => o.setForm(k)}
                    style={[s.formCard, { width: typeCardW }, on ? s.pickOn : s.pickOff]}
                  >
                    <Glyph size={FORM_CARD.glyph} color={on ? ACCENT.deep : '#8A8194'} strokeWidth={1.6} />
                    <Text style={[s.formName, on && s.pickedText]}>{name}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* בחירת מארז · אותו כרטיס בדיוק של ״בחר סוג חלה״ */}
            <Text style={s.sectionTitle}>{PICK_BOX_LABEL}</Text>
            <View style={s.grid}>
              {SCHNITZEL_TYPES.map((t, k) => (
                <StepIn key={t.name} index={k} style={{ width: typeCardW }}>
                  <Pressable onPress={() => o.openBox(k)} style={[s.typeCard, { width: typeCardW }]}>
                    <Photo name={SCHNITZEL_BOX_PHOTOS[k]} rgb={ACCENT.rgb} style={s.typeShot} zoom={false} />
                    <Text style={s.typeName}>{t.name}</Text>
                    <Text style={s.typePrice}>{t.box} ₪</Text>
                  </Pressable>
                </StepIn>
              ))}
            </View>
          </>
        )}

        <Text style={s.sectionTitle}>רטבים בקוקוט · {COCOTTE_PRICE} ₪ ליחידה</Text>
        {COCOTTES.map((name, i) => (
          <StepIn key={name} index={i} style={[s.row, s.cocotteRow]}>
            <Text style={[s.name, s.rowText]}>{name}</Text>
            <Stepper value={o.cocottes[i]} onChange={(n) => o.bumpCocotte(i, n - o.cocottes[i])} />
          </StepIn>
        ))}
      </ScrollView>

      <View style={[s.bar, loggedIn && s.barWithNav]}>
        <View style={s.totalBox}>
          <Text style={s.totalLabel}>סה״כ :</Text>
          <RollingTotal value={o.total} style={s.total} />
          <Text style={s.currency}>₪</Text>
        </View>
        <ContinueButton onPress={onContinue} accent={ACCENT} disabled={o.total === 0} />
      </View>

      <ToppingsSheet pop={o.pop} onToggle={o.toggleTop} onCancel={o.closePop} onSave={o.commitPop} />

      {/* ⚠ יום המכירה עדיין לא נפתח · חלונית הפעמון */}

      <SaleClosedSheet

        open={!!saleGate.closed}

        categoryName={categoryName('schn')}

        accent={ACCENT}

        note={saleGate.note}

        busy={saleGate.busy}

        err={saleGate.err}

        reminded={saleGate.reminded}
        onUnremind={() => void saleGate.unremind()}
        onRemind={() => {
          void saleGate.remind();
          go('main');
        }}

        onClose={() => {
          saleGate.close();
          go('main');
        }}

      />

      {/* ⚠ קונפטי במקום חלונית ״נרשמת״ · בקשה של שקד */}
      {/* ⚠ **החגיגה עברה לשכבה גלובלית · 17 בספטמבר 2026** · ראו
          `Cheer`. המסך חוזר הביתה **מיד**, והקונפטי והפעמון
          ממשיכים לרוץ מעליו — קודם הניווט קטע אותם, ומשם נולדה
          ההשהיה ששקד קראה לה איטית. */}


      <FulfillmentFlow
        f={f}
        lines={o.lines}
        total={o.total}
        accent={ACCENT}
        details={{
          category: 'schn',
          mode: o.isUnit ? 'unit' : 'box',
          rolls: o.basket,
          boxes: o.boxes,
          cocottes: o.cocottes,
        }}
        onHome={() => {
          f.reset();
          go(loggedIn ? 'main' : 'guest');
        }}
      />

      <LoginGate
        visible={gate}
        accent={ACCENT}
        onCancel={() => setGate(false)}
        onLogin={() => {
          setGate(false);
          /* goLogin ולא go · כך ההתחברות מחזירה בדיוק לכאן */
          goLogin();
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  intro: {
    fontSize: 13.5,
    fontWeight: '300',
    lineHeight: 22,
    color: surface.inkSoft,
    textAlign: 'center',
    paddingHorizontal: space.lg,
    marginBottom: 12,
  },
  gift: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 15,
    backgroundColor: a(ACCENT.rgb, 0.08),
    borderWidth: 1,
    borderColor: a(ACCENT.rgb, 0.2),
    marginTop: GIFT_SPACE.before,
    marginBottom: GIFT_SPACE.after,
  },
  giftText: { flex: 1, fontSize: 14.5, fontWeight: '600', lineHeight: 20, color: ACCENT.deep },

  /* שתי עמודות · תמונה מלמעלה · משותפת לחלות, לצורות ולמארזים */
  /**
   * ⚠ **`stretch` במפורש · 18 בספטמבר 2026** · זו ברירת המחדל של
   * יוגה, אבל כאן היא **נושאת משמעות**: היא זו שמיישרת את שתי
   * הכרטיסיות שבשורה לגובה הגבוהה שבהן. ראו `typeCard`.
   */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    gap: TYPE_CARD.gridGap,
  },
  formCard: {
    /**
     * ⚠ **`minHeight` ולא `height` · 18 בספטמבר 2026** · גובה קבוע
     * גובר על המתיחה של השורה, וגם חותך את הכיתוב מרגע שהכתב גדל
     * ב-`FONT_BUMP`. עם מינימום הכרטיס נושם ושתי הצורות יוצאות
     * באותו גובה.
     */
    minHeight: FORM_CARD.height,
    borderRadius: FORM_CARD.radius,
    padding: FORM_CARD.padding,
    gap: FORM_CARD.gap,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  formName: { fontSize: 12.5, textAlign: 'center', lineHeight: 15.6, color: '#8A8194' },
  /* הנבחר והלא-נבחר · chip() בקנבס */
  pickOn: { backgroundColor: a(ACCENT.rgb, 0.1), borderColor: a(ACCENT.rgb, 0.42) },
  pickOff: { backgroundColor: 'rgba(255,255,255,0.7)', borderColor: 'rgba(130,112,162,0.16)' },
  pickedText: { color: ACCENT.deep, fontWeight: '600' },
  typeCard: {
    /**
     * ⚠ **ממלא את המשבצת · 18 בספטמבר 2026** · בקשה של שקד:
     * ״הכרטיסיות של השניצלים גם בבודד וגם במארזים צריכות להיות
     * באותו הגודל״.
     *
     * הסיבה: `StepIn` (המעטפת שמנפישה את הכניסה) כן נמתחה לגובה
     * השורה, אבל הכרטיס **שבתוכה** הצטמצם לגובה התוכן שלו. שם מנה
     * שנשבר לשתי שורות האריך כרטיס אחד והשאיר את השני נמוך.
     * `flex: 1` ממלא את המעטפת, ולכן כל כרטיסי השורה שווים.
     */
    flex: 1,
    borderRadius: TYPE_CARD.radius,
    paddingVertical: TYPE_CARD.padV,
    /**
     * ⚠ **רווח נוסף מתחת · בקשה של שקד (18 בספטמבר 2026)** ·
     * ״להוסיף מעט רווח כי הגדלנו את הכתב וזה נחתך מלמטה״. הריפוד
     * מהקנבס נקבע לכתב המקורי; התוספת מחזירה בדיוק את מה שהגדלת
     * הכתב בלעה, ותישאר נכונה גם בשינוי הבא.
     */
    paddingBottom: TYPE_CARD.padV + FONT_BUMP,
    paddingHorizontal: TYPE_CARD.padH,
    gap: TYPE_CARD.gap,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.74)',
  },
  typeShot: {
    width: '100%',
    height: TYPE_CARD.shotHeight,
    borderRadius: TYPE_CARD.shotRadius,
    overflow: 'hidden',
  },
  typeName: { fontSize: 13, fontWeight: '600', lineHeight: 16, textAlign: 'center', color: surface.ink },
  /**
   * ⚠ שקד ביקשה שהמחירים יובלטו · המשקל עלה מ-600 ל-700.
   *
   * ⚠ **נדחף לתחתית הכרטיס · 18 בספטמבר 2026** · בקשה שלה:
   * ״שהמחירים יופיעו באותה השורה״. שם שנשבר לשתי שורות דחף את
   * המחיר שלו שורה נמוך יותר מזה שלצידו. `marginTop: 'auto'`
   * מצמיד את שניהם לתחתית — ומכיוון ששני הכרטיסים כבר באותו גובה
   * (ראו `typeCard`), המחירים נוחתים על אותו קו בדיוק.
   */
  typePrice: { marginTop: 'auto', fontSize: 13, fontWeight: '700', color: ACCENT.deep },

  /* ⚠ `headRoom` מחזיר את הרווח שהגדלת הכתב בלעה · ראו שם */
  page: { flex: 1, paddingHorizontal: space.lg, paddingTop: 88 + headRoom(1) },
  modes: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: space.sm,
    /**
     * ⚠ **רווח מתחת לבחירה · 18 בספטמבר 2026** · בקשה של שקד:
     * ״להוסיף את הרווח לא מעל הכנפי עוף, אלא במסך של ׳לפי יחידה
     * ומארז׳ מתחת לבחירה הזו״. קודם הוספתי אותו בתוך כרטיסי
     * המנות; הרווח שייך כאן, מתחת ללשוניות עצמן.
     */
    marginBottom: space.sm,
    padding: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(130,112,162,0.09)',
  },
  mode: { paddingVertical: 8, paddingHorizontal: 22, borderRadius: radius.pill },
  modeOn: { backgroundColor: '#FFFFFF' },
  modeText: { fontSize: 14, color: '#8A8194' },

  list: { paddingTop: space.sm, paddingBottom: space.lg, gap: space.sm },
  sectionTitle: {
    fontSize: type.label,
    color: surface.muted,
    textAlign: 'center',
    marginTop: space.sm,
    marginBottom: 2,
  },
  /* שורת הרטב · נמוכה יותר משורת החלה, לבקשת שקד */
  cocotteRow: {
    paddingVertical: COCOTTE_ROW.padV,
    paddingHorizontal: COCOTTE_ROW.padH,
    borderRadius: COCOTTE_ROW.radius,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: 20,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: TILE_EDGE,
    boxShadow: TILE_SHADOW,
  },
  shot: { width: 58, height: 58, borderRadius: radius.field, overflow: 'hidden' },
  rowText: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '500', color: surface.ink },
  tops: { fontSize: 12, color: surface.muted },
  /* ⚠ שקד ביקשה שהמחירים יובלטו · היה ללא משקל ובגוון מעומעם */
  price: { fontSize: type.label, fontWeight: '700', color: surface.ink },
  action: { fontSize: 12.5, fontWeight: '600', color: ACCENT.deep },
  remove: { fontSize: 14, color: '#B95349' },

  bar: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, marginBottom: 30 },
  /* כשהנאב-בר מוצג השורה עולה מעליו · המיקום מהקנבס */
  barWithNav: { marginBottom: BAR_BOTTOM_WITH_NAV },
  totalBox: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  totalLabel: { fontSize: 19, fontWeight: '600', color: surface.ink },
  total: { fontSize: 19, fontWeight: '600', color: surface.ink },
  currency: { fontSize: 15, color: '#7A7080' },
});
