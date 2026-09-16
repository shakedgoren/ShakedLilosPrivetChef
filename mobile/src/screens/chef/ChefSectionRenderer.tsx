import React from 'react';
import { INPUT_START } from '../../theme/rtl';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../../ui/text';
import { TIER_LINES, tierPrices, type ChefSection } from '../../data/chef';
import { Stepper } from '../../components/Stepper';
import { a, hues, radius, space, surface, type } from '../../theme/tokens';
import type { Picks } from './useChefOrder';
import type { PastaPick } from './PastaPopup';
import { TILE_EDGE, TILE_SHADOW } from '../../theme/glass';
import { OptionGrid } from '../../components/OptionGrid';
import { ChefExtraCard } from '../../components/ChefExtraCard';
import { ChefTierCard } from '../../components/ChefTierCard';
import { DateCalendar } from '../../components/DateCalendar';
import { dayPartOpen } from '../../data/calendar';
import { AddressField, type AddressValue } from '../../components/AddressField';
import { formatAddress } from '../../data/israelAddresses';
import { detailFilled, detailRequired } from './useChefOrder';
import { isPhone, maskPhone, normalizePhone } from '../../lib/phone';

const ACCENT = hues.chef;
/** האדום של השגיאות באפליקציה · אותו גוון של `err` במסכי ההתחברות */
const MISSING = '#B95349';
const MISSING_HINT = 'rgba(185,83,73,0.6)';

/* גווני הסטפר · המינוס אפור והפלוס בגוון הקטגוריה, כמו בקנבס */
const STEP_TONE = {
  plusBg: a(ACCENT.rgb, 0.13),
  plusInk: ACCENT.deep,
  minusBg: 'rgba(130,112,162,0.09)',
  minusInk: '#6E6478',
  key: 32,
  glyph: 13,
  plusRgb: ACCENT.rgb,
} as const;

type Api = {
  picks: Picks;
  perHead: number;
  select: (id: string, v: string) => void;
  toggle: (id: string, v: string, cap?: number | null, note?: string) => void;
  /** בחירת רוטב · פותחת את חלונית הצורה/שדרוג */
  pickSauce: (s: ChefSection, sauce: string) => void;
  setValue: (id: string, v: unknown) => void;
  stylesFor: (concept: string) => string[];
};

/**
 * מספר העמודות לכל סוג סעיף · הנוסחאות מ-`Chef.dc.html`:
 * `grid` → `cols || (n <= 3 ? n : 2)` · `multi` → `cols || 3`
 * `tiers` → תמיד 3 · `pair` → `cols || 2` · `cards` → `one ? 1 : 2`
 */
/**
 * ⚠ **שונה מהקנבס** · שם שדרוגי הטאבון יושבים שניים בשורה. שקד
 * ביקשה שכל אחד מארבעתם יהיה בשורה משלו, כדי שהתמונה תיכנס בגודל
 * מתאים. שדרוגי ארוחת השף כבר מסומנים `one` בקנבס עצמו.
 */
const ONE_PER_ROW = ['textras'];

/* גובה מזערי לכרטיס רוטב · 9+17+2+16+2+16+9 */
const SAUCE_MIN_H = 71;
const isOnePerRow = (s: ChefSection) => !!s.one || ONE_PER_ROW.includes(String(s.id));

/**
 * ⚠ **עקיפת סדר ומספר עמודות · 16 בספטמבר 2026** · שקד ביקשה סדר
 * מדויק לשלוש שורות ב״מנות ראשונות״:
 *   קרפצ׳יו סלק · קרפצ׳יו חציל · חציל בפנקו מטוגן
 *   כרובית מטוגנת · מגש גבינות · מגש ירקות
 *   אנטיפסטי בטאבון · ארטישוק א-לה רומנה
 *
 * בקנבס הסעיף מוגדר `cols: 2` ובסדר אחר, ו-`chef.ts` **נוצר
 * אוטומטית מהקנבס ואין לערוך אותו ביד**. לכן העקיפה יושבת כאן.
 *
 * ⚠ **המקום הנכון לזה בסוף הוא הקנבס** · ברגע שהסדר יעודכן שם,
 * אפשר למחוק את הבלוק הזה לגמרי.
 * ⚠ `maxw` מבוטל · 292 פיקסלים בשלוש עמודות הוציאו כרטיסים צרים מדי.
 */
const CANVAS_OVERRIDE: Record<string, { cols: number; maxw?: number; order: readonly string[] }> = {
  firsts: {
    cols: 3,
    order: [
      'קרפצ׳יו סלק',
      'קרפצ׳יו חציל',
      'חציל בפנקו מטוגן',
      'כרובית מטוגנת',
      'מגש גבינות',
      'מגש ירקות',
      'אנטיפסטי בטאבון',
      'ארטישוק א-לה רומנה',
    ],
  },
};

/** מסדר אפשרויות לפי העקיפה · מה שאינו ברשימה נשאר בסוף, בסדר המקורי */
function ordered<T>(id: string | undefined, opts: T[]): T[] {
  const ov = CANVAS_OVERRIDE[id ?? ''];
  if (!ov) return opts;
  const rank = new Map(ov.order.map((n, i) => [n, i]));
  return [...opts].sort((a, b) => {
    const ra = rank.get(nameOf(a)) ?? Number.MAX_SAFE_INTEGER;
    const rb = rank.get(nameOf(b)) ?? Number.MAX_SAFE_INTEGER;
    return ra - rb;
  });
}

const colsFor = (s: ChefSection, n: number): number => {
  const ov = CANVAS_OVERRIDE[s.id ?? ''];
  if (ov) return ov.cols;
  if (s.cols) return +s.cols;
  if (s.kind === 'tiers') return 3;
  if (s.kind === 'pair') return 2;
  if (s.kind === 'cards') return isOnePerRow(s) ? 1 : 2;
  if (s.kind === 'multi') return 3;
  /* grid · עד שלוש אפשרויות בשורה אחת, מעבר לזה שתי עמודות */
  return n <= 3 ? n : 2;
};

/** הצרת הרשת · `narrow` בקנבס הוא 272, ו-`maxw` נותן ערך מפורש */
const maxWidthFor = (s: ChefSection): number | undefined => {
  const ov = CANVAS_OVERRIDE[s.id ?? ''];
  if (ov) return ov.maxw;
  if (s.maxw) return parseFloat(String(s.maxw));
  return s.narrow ? NARROW : undefined;
};

/** רוחב הרשת המוצרת בקנבס */
const NARROW = 272;

/** המרווח בין כרטיסי השדרוגים · `--g: 10px` בקנבס */
const CARD_GAP = 10;

/**
 * שדה הכתובת בטופס יצירת הקשר · עוטף את `AddressField` ושומר את
 * התוצאה כמחרוזת אחת, כמו שהשאלון מצפה.
 *
 * ⚠ **בלי בדיקת אזור חלוקה** · השף מגיע לכל מקום. ההגבלה
 * הגיאוגרפית נאמרה על משלוחי מגשי הפירות בלבד.
 */
function ChefAddress({ s: sec, api }: { s: ChefSection; api: Api }) {
  const [place, setPlace] = React.useState<AddressValue>(null);
  const [house, setHouse] = React.useState('');
  const setValue = api.setValue;
  const id = sec.id;

  React.useEffect(() => {
    setValue(id, place ? formatAddress(place.street, house, place.city) : '');
  }, [place, house, id, setValue]);

  return (
    <AddressField
      value={place}
      onPick={setPlace}
      house={house}
      onHouse={setHouse}
      placeholder={sec.ph ?? 'התחילו להקליד שם רחוב…'}
    />
  );
}

const nameOf = (o: unknown) => (typeof o === 'string' ? o : (o as { n: string }).n);
const descOf = (o: unknown) => (typeof o === 'string' ? undefined : (o as { d?: string }).d);

/** מצייר סעיף אחד מתוך שאלון השף · כל 17 סוגי הסעיפים שהקנבס מגדיר */
export function ChefSectionRenderer({ s, api }: { s: ChefSection; api: Api }) {
  if (s.when && api.picks[s.when.id] !== s.when.is) return null;

  switch (s.kind) {
    case 'head':
      return (
        <View style={st.headRow}>
          <Text style={st.head}>{s.label}</Text>
          {s.cap != null && s.link ? (
            <Text style={st.headHint}>
              {(api.picks[s.link] || []).length} מתוך {s.cap}
            </Text>
          ) : null}
        </View>
      );

    case 'title':
      return (
        /* `12px 2px 0` בקנבס · `flush: true` מבטל את המרווח העליון */
        <View style={[st.titleRow, !s.flush && st.titlePad]}>
          <Text style={st.title}>{s.label}</Text>
          {s.cap != null && s.link ? (
            <Text style={st.hint}>
              {(api.picks[s.link] || []).length} מתוך {s.cap}
            </Text>
          ) : null}
        </View>
      );

    case 'note':
      return <Text style={[st.note, s.tight && st.tight]}>{s.label}</Text>;

    case 'price':
      /* `live: 'taboon'` · המחיר לסועד משתנה עם מספר הסועדים */
      return (
        <Text style={st.price}>
          {s.live === 'taboon' ? `${api.perHead} ש״ח לסועד` : s.label}
        </Text>
      );

    case 'fine':
      return <Text style={st.fine}>{s.label}</Text>;

    case 'gap':
      return <View style={st.gap} />;

    case 'text': {
      /* ⚠ ״חסר משהו״ · כל עוד לא כתבו מה חסר, השדה מסומן באדום
         ו״המשך״ נעול. בקשה של שקד (16 בספטמבר 2026). */
      const mustFill = detailRequired(api.picks, s.id) && !detailFilled(api.picks, s.id);
      return (
        <TextInput
          value={api.picks[s.id] ?? ''}
          onChangeText={(v) => api.setValue(s.id, v)}
          placeholder={s.ph}
          placeholderTextColor={mustFill ? MISSING_HINT : '#B3ABBD'}
          multiline
          style={[st.field, mustFill && st.fieldMissing]}
        />
      );
    }

    case 'addr':
      /* ⚠ היה שדה טקסט חופשי · שקד ביקשה שהכתובת תושלם מרשימת
         הכתובות של מדינת ישראל תוך כדי הקלדה.
         ⚠ **בלי בדיקת אזור חלוקה** · השף מגיע לכל מקום, וההגבלה
         הגיאוגרפית נאמרה על משלוחי מגשי הפירות בלבד. */
      return <ChefAddress s={s} api={api} />;

    case 'cal':
      /* ⚠ היה שדה טקסט חופשי · הקנבס מגדיר לוח שנה מלא, והוא פשוט
         לא הועבר לאפליקציה. עכשיו הוא כאן, עם הימים החסומים באפור. */
      return <DateCalendar value={api.picks[s.id]} onPick={(k) => api.setValue(s.id, k)} />;

    case 'pairtext':
      return (
        <View style={st.pairText}>
          {(s.ids as string[]).map((id, i) => {
            const raw = String(api.picks[id] ?? '');
            /* ⚠ שדה הטלפון · מסכה חיה, נרמול ביציאה, ומסגרת אדומה
               כשהמספר אינו תקין. בקשה של שקד (16 בספטמבר 2026). */
            const phone = id === 'phone';
            const bad = phone && raw.trim() !== '' && !isPhone(raw);
            return (
              <View key={id} style={st.grow}>
                <Text style={st.smallLabel}>{s.labels?.[i]}</Text>
                <TextInput
                  value={raw}
                  onChangeText={(v) => api.setValue(id, phone ? maskPhone(v) : v)}
                  onBlur={phone ? () => api.setValue(id, normalizePhone(raw)) : undefined}
                  keyboardType={phone ? 'phone-pad' : 'default'}
                  placeholder={s.phs?.[i]}
                  placeholderTextColor={bad ? MISSING_HINT : '#B3ABBD'}
                  style={[st.field, st.oneLine, bad && st.fieldMissing]}
                />
                {bad ? <Text style={st.badNote}>מספר טלפון לא תקין</Text> : null}
              </View>
            );
          })}
        </View>
      );

    case 'stepper': {
      const v = api.picks[s.id] ?? s.min ?? 0;
      return (
        <View style={st.stepperBox}>
          <Stepper
            value={v}
            min={s.min ?? 0}
            tone={STEP_TONE}
            /* המספר והיחידה טור אחד · בקנבס היחידה יושבת מתחת למספר
               בתוך אותה עמודה, ולא לצידו */
            center={
              <View style={st.numCol}>
                <Text style={st.num}>{v}</Text>
                {s.unit ? <Text style={st.stepperUnit}>{s.unit}</Text> : null}
              </View>
            }
            onChange={(n) => {
              const step = s.step ?? 1;
              const raw = n > v ? v + step : v - step;
              const lo = s.min ?? 0;
              const hi = s.max ?? Number.MAX_SAFE_INTEGER;
              api.setValue(s.id, Math.max(lo, Math.min(hi, raw)));
            }}
          />
        </View>
      );
    }

    /* שלוש הדרגות · כל כרטיס מציג את המחיר לסועד שלו */
    case 'tiers': {
      const opts = (s.options ?? []) as string[];
      /* ⚠ נעול ולא מוסתר · הכרטיסים נשארים על המסך באפור, כמו בקנבס */
      const locked = !!s.lock && !api.picks[s.lock];
      const prices = tierPrices(api.picks);
      return (
        <OptionGrid cols={colsFor(s, opts.length)} maxWidth={maxWidthFor(s)}>
          {opts.map((n, k) => (
            <ChefTierCard
              key={n}
              name={n}
              lines={TIER_LINES[k] ?? []}
              price={prices[k] ?? null}
              on={api.picks[s.id] === n}
              locked={locked}
              onPress={() => api.select(s.id, n)}
            />
          ))}
        </OptionGrid>
      );
    }

    /* בחירה יחידה · הסגנונות שאינם זמינים נשארים על המסך, באפור */
    case 'grid':
    case 'pair': {
      const opts: unknown[] = s.options ?? [];
      /* סעיף נעול · עוד לא נבחרה הבחירה שהוא תלוי בה */
      const locked = !!s.lock && !api.picks[s.lock];
      /**
       * ⚠ **אין סינון** · הגרסה הקודמת השמיטה סגנונות שאינם זמינים,
       * ושקד ביקשה שכולם יישארו על המסך. בקנבס האפשרות שאינה זמינה
       * מקבלת רקע, מסגרת וטקסט אפורים ואטימות 0.55 — ולא נעלמת.
       * הסגנונות הזמינים תלויים בציר · בשרי פותח את כולם.
       */
      const allowed = s.id === 'style' ? api.stylesFor(api.picks.concept) : null;
      /**
       * ⚠ **חסימה לפי התאריך** · שקד ביקשה ״שישי ערב חסום, שבת בוקר
       * וצהריים חסומים״. זו חסימה ברמת חלק היום ולא ברמת היום, ולכן
       * שבת נשארת פתוחה בלוח והחסימה יורדת לכאן.
       */
      const byDate = s.id === 'daypart' ? (n: string) => !dayPartOpen(api.picks.date, n) : null;
      const boxy = s.kind !== 'pair';
      /**
       * ⚠ **בוקר · צהריים · ערב** · שקד ביקשה (16 בספטמבר 2026) שהשלושה
       * יהיו ״בגודל אחיד ופחות מעוגלות״. `minHeight` לבדו נתן להם
       * גבהים שונים ברגע שמילה אחת נשברה לשתי שורות, ו-`boxy` הגדיל
       * את הפינה ל-18 — יותר מהגלולה הרגילה ולא פחות.
       */
      const uniform = s.id === 'daypart';
      return (
        <OptionGrid cols={colsFor(s, opts.length)} maxWidth={maxWidthFor(s)}>
          {opts.map((o) => {
            const n = nameOf(o);
            const d = descOf(o);
            const on = api.picks[s.id] === n;
            const off =
              locked || (allowed != null && !allowed.includes(n)) || (byDate != null && byDate(n));
            return (
              <Pressable
                key={n}
                onPress={off ? undefined : () => api.select(s.id, n)}
                disabled={off}
                /* `grow` מותח את הכרטיס לרוחב שהרשת קבעה ולגובה השכן */
                style={[
                  st.grow,
                  boxy ? st.chip : st.card,
                  s.boxy && st.boxy,
                  /* ⚠ אחרי `boxy` · הוא זה שמחזיר את הפינה ל-12 */
                  uniform && st.uniform,
                  on && !off && st.on,
                  off && st.off,
                ]}
              >
                <Text
                  style={[
                    boxy ? st.chipText : st.cardName,
                    on && !off && st.onText,
                    off && st.offText,
                  ]}
                >
                  {n}
                </Text>
                {d ? <Text style={[st.cardDesc, off && st.offText]}>{d}</Text> : null}
              </Pressable>
            );
          })}
        </OptionGrid>
      );
    }

    /* כרטיסי השדרוגים · תמונה עם מדרג, מחיר ותג · `isCards` בקנבס */
    case 'cards': {
      const opts = (s.options ?? []) as { n: string; d?: string; p?: string; add?: string }[];
      const multi = !!s.multi;
      const cur: string[] = multi ? api.picks[s.id] || [] : [];
      const one = isOnePerRow(s);
      return (
        <OptionGrid cols={colsFor(s, opts.length)} gap={CARD_GAP}>
          {opts.map((o) => (
            <ChefExtraCard
              key={o.n}
              name={o.n}
              desc={o.d}
              /* `add` בקנבס · ״+X ש״ח ליח׳״, ואם אין — המחיר עצמו */
              badge={o.add ? `+${o.add} ש״ח ליח׳` : o.p}
              one={one}
              on={multi ? cur.includes(o.n) : api.picks[s.id] === o.n}
              onPress={() => (multi ? api.toggle(s.id, o.n, s.cap ?? null, s.note) : api.select(s.id, o.n))}
            />
          ))}
        </OptionGrid>
      );
    }

    /* בחירה מרובה · עם מכסה או בלי */
    case 'multi':
    case 'multicap':
    case 'sauces': {
      const opts: unknown[] = ordered(s.id, s.options ?? []);
      const cur: string[] = api.picks[s.id] || [];

      const cap = s.cap ?? null;
      /* ⚠ `multicap` ו-`sauces` הם `isRows` בקנבס · שורות ברוחב מלא,
         ולא גלולות ברוחב התוכן. ככה הסלטים, הפסטה והקינוחים יוצאים
         ברוחב אחיד. `multi` הוא רשת עמודות. */
      const asRows = s.kind !== 'multi';

      /**
       * ⚠ בפסטות הרשימה היא אובייקטים (`{sauce, shape, up}`) ולא שמות,
       * ולכן הסימון נבדק לפי `sauce`. הלחיצה פותחת את החלונית.
       */
      const isSauce = s.kind === 'sauces';
      const picked = (name: string) =>
        isSauce
          ? (cur as unknown as PastaPick[]).find((x) => x.sauce === name)
          : undefined;

      const tile = (o: unknown) => {
        const n = nameOf(o);
        const d = descOf(o);
        const mine = picked(n);
        const on = isSauce ? !!mine : cur.includes(n);
        /* ״פנה · רביולי גבינות • שדרוג״ · בדיוק `extra` בקנבס */
        const extra = mine
          ? [mine.shape, mine.up ? `${mine.up} • שדרוג` : ''].filter(Boolean).join(' · ')
          : '';
        return (
          <Pressable
            key={n}
            onPress={() => (isSauce ? api.pickSauce(s, n) : api.toggle(s.id, n, cap, s.note))}
            style={[
              st.grow,
              asRows ? st.card : st.chip,
              /* ⚠ שורת הצורה/השדרוג מוסיפה שורה שלישית · בלי גובה
                 מזערי הכרטיס נשאר בגובה של שכניו בעלי שתי השורות
                 והשורה השלישית נחתכה. נמדד: הטקסט נגמר ב-388
                 והכרטיס ב-382.8. */
              isSauce && st.sauceCard,
              on && st.on,
            ]}
          >
            <Text style={[asRows ? st.cardName : st.chipText, on && st.onText]}>{n}</Text>
            {d ? <Text style={st.cardDesc}>{d}</Text> : null}
            {extra ? <Text style={st.extra}>{extra}</Text> : null}
          </Pressable>
        );
      };

      return (
        <>
          {/* ⚠ אין כאן שורת `s.note` · בקנבס היא מזינה רק את חלונית
              הכמות המקסימלית. הדפסתה כאן שכפלה את שורת ה-`note`
              שמעל הרשימה — זו ״השורה הכפולה״ שביקשת למחוק. */}
          {asRows ? (
            <View style={st.cards}>{opts.map(tile)}</View>
          ) : (
            <OptionGrid cols={colsFor(s, opts.length)} maxWidth={maxWidthFor(s)}>
              {opts.map(tile)}
            </OptionGrid>
          )}
        </>
      );
    }

    default:
      return null;
  }
}

const st = StyleSheet.create({
  /* כותרות · ממורכזות עם הרמז לצידן · 18 ו-15.5 בקנבס */
  headRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 2,
    paddingTop: 2,
  },
  head: { fontSize: 18, fontWeight: '600', color: surface.ink, textAlign: 'center' },
  headHint: { fontSize: 13, fontWeight: '600', color: ACCENT.hue },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },
  title: { fontSize: 15.5, fontWeight: '600', color: surface.ink, textAlign: 'center' },
  /* המרווח העליון של כותרת פנימית · `12px 2px 0` בקנבס */
  titlePad: { paddingTop: 12 },
  hint: { fontSize: 11.5, fontWeight: '400', color: ACCENT.hue },
  note: {
    fontSize: 12.5,
    fontWeight: '300',
    lineHeight: 20,
    color: surface.muted,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  tight: { marginTop: -4 },
  /* `isPrice` בקנבס · 12.5, משקל 600, בגוון השף */
  price: {
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 18.75,
    color: ACCENT.hue,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  fine: {
    fontSize: 11,
    fontWeight: '400',
    fontStyle: 'italic',
    lineHeight: 16.5,
    color: '#9A93A6',
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  /* המרווח בקנבס · 14 פיקסלים */
  gap: { height: 14 },

  field: {
    minHeight: 64,
    borderRadius: radius.field,
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.2)',
    backgroundColor: '#FFFFFF',
    padding: 12,
    fontSize: 14,
    textAlign: INPUT_START,
    textAlignVertical: 'top',
    color: surface.ink,
  },
  oneLine: { minHeight: 46, paddingVertical: 12 },
  /* ⚠ חובה שלא מולאה · ״חסר משהו״ בלי פירוט, או טלפון לא תקין */
  fieldMissing: { borderColor: MISSING, backgroundColor: 'rgba(185,83,73,0.05)' },
  badNote: { fontSize: 11, color: MISSING, paddingHorizontal: 4, paddingTop: 3 },
  pairText: { flexDirection: 'row', gap: space.sm },
  smallLabel: { fontSize: 11.5, color: surface.faint, marginBottom: 4, textAlign: 'center' },
  grow: { flex: 1 },

  stepperBox: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: TILE_EDGE,
    boxShadow: TILE_SHADOW,
  },
  /* המספר והיחידה · טור אחד ברוחב 46 כמו `numW` הדק בקנבס */
  numCol: { minWidth: 46, alignItems: 'center' },
  num: { fontSize: 18, fontWeight: '600', color: surface.ink, lineHeight: 20 },
  stepperUnit: { fontSize: 10.5, fontWeight: '300', color: surface.muted },

  /* גלולות · גובה מזערי 40, פינה 14, ריפוד 6/12 · מהקנבס */
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 7, paddingHorizontal: 2 },
  chip: {
    minHeight: 40,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.16)',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 12.5, color: surface.inkSoft, textAlign: 'center' },
  /* `boxy: true` בקנבס · פינה 18 במקום גלולה */
  boxy: { borderRadius: 18 },
  /* בוקר · צהריים · ערב · גובה אחיד ופינה מרובעת יותר */
  uniform: { height: 46, borderRadius: 12 },

  /* שורות בחירה · פינה 16, ריפוד 9/12, הכל ממורכז · מהקנבס */
  cards: { gap: 7 },
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(130,112,162,0.16)',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 2,
  },
  /**
   * גובה מזערי לכרטיס רוטב · ריפוד 9+9, שם 17, תיאור 16, שורת
   * הצורה 16 ושני מרווחים של 2 — יחד 71. כל כרטיסי הרטבים באותו
   * גובה, ולכן הבחירה כבר לא מקפיצה את הרשת.
   */
  sauceCard: { minHeight: SAUCE_MIN_H },
  cardName: { fontSize: 13, fontWeight: '400', lineHeight: 17, color: surface.ink, textAlign: 'center' },
  cardDesc: { fontSize: 11.5, fontWeight: '300', color: surface.muted, lineHeight: 16, textAlign: 'center' },
  /* הצורה והשדרוג שנבחרו לרוטב · 11.5/600 בגוון השף, כמו בקנבס */
  extra: { fontSize: 11.5, fontWeight: '600', color: ACCENT.hue, lineHeight: 16, textAlign: 'center' },

  on: { borderColor: a(ACCENT.rgb, 0.42), backgroundColor: a(ACCENT.rgb, 0.1) },
  onText: { color: ACCENT.deep, fontWeight: '600' },
  /**
   * אפשרות שאינה זמינה · הערכים מהקנבס: רקע, מסגרת וטקסט אפורים
   * ואטימות 0.55. ⚠ החליף את `blocked` שהחשיך את כל הרשת ב-0.4.
   */
  off: {
    backgroundColor: 'rgba(130,112,162,0.05)',
    borderColor: 'rgba(130,112,162,0.12)',
    opacity: 0.55,
  },
  offText: { color: '#BDB7C6', fontWeight: '400' },
});
