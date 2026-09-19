import React from 'react';
import { S } from '../components/Sym';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../ui/text';
import { surface } from '../theme/tokens';
import { DONUT, HOME_SUBTITLE, HOME_TITLE, PROFIT, type TileKey } from '../data/adminHome';
import { NewOrderSheet } from './NewOrderSheet';
import { LogoutConfirm } from '../components/LogoutConfirm';
import { SentNotice } from './SentNotice';
import { useAdminOrders } from './useAdminOrders';
import { useNav, type Screen } from '../navigation/store';
import { GlassCard } from './home/GlassCard';
import { SalePanel } from './home/SalePanel';
import { TileRail } from './home/TileRail';
import { CategoryPie, ProfitBars, REV_CHART_H, RevenueChart } from './home/Charts';
import { REV_RANGES, useAdminHome } from './home/useAdminHome';
import { LAV, NightSky } from './home/NightSky';
import { LTR_ROW } from './ui/ltrRow';
import { LogOut, Plus } from '../icons';
import { iconOrbShadow } from '../theme/glass';

/** כל אריח מצביע על מסך ניהול · אותה מפה שבקנבס, בשמות של הניווט */
const TILE_ROUTES: Record<TileKey, Screen> = {
  orders: 'adminOrders',
  days: 'adminDays',
  stock: 'adminStock',
  shop: 'adminShopping',
  people: 'adminCustomers',
  menu: 'adminMenu',
  costs: 'adminCosts',
  hist: 'adminHistory',
};

/**
 * גובה שני כרטיסי הדיאגרמות · **אחד לשניהם**.
 *
 * ⚠ **הוגדל · 18 בספטמבר 2026** · בקשה של שקד: ״תוסיף מעט גובה
 * לכרטיסיות של דיאגרמת העוגה שמחלקת לפי קטגוריות ולרווח החודש
 * ותגדיל את שתי הדיאגרמות בתוכן״. היה 176 בשניהם.
 *
 * ⚠ **מספר אחד ולא שניים** · הם עומדים זה לצד זה עם `flex: 1`;
 * שני גבהים שונים היו מיישרים אותם לגבוה ומשאירים לנמוך שוליים.
 *
 * ⚠ **מינימום, לא תקרה · 19 בספטמבר 2026** · ראו `profitCard`.
 */
const CHART_CARD_H = 202;
/** רוחב העוגה · היה 127, וההגדלה היא כל מה שהכרטיס הגבוה מרשה */
const PIE_W = 148;
/** מתיחת עמודות הרווח · ראו `ProfitBars` */
const BARS_GROW = 1.55;

/** האריחים שנשארו בדף הבית · הסדר הוא של שקד */
const HOME_TILES: TileKey[] = ['menu', 'costs', 'people', 'stock'];

/**
 * ⚠ **שני הנוסחים האלה נכתבו על ידי Claude · 19.9.2026** · שקד
 * ביקשה ״בלי כותרות שמסבירות״, ולכן הם מילה אחת כל אחד.
 */
const MONTH_REVENUE = 'הכנסות';
const MONTH_COST = 'הוצאות';

const money = (n: number) => n.toLocaleString('en-US');

/** ‎2026-09-15 → ‎15.9 · כמו התג של ״ימי מכירה״ בקנבס */
const shortDate = (iso: string) =>
  iso.length === 10 ? `${+iso.slice(8)}.${+iso.slice(5, 7)}` : iso;

/** ⚠ טקסט שכתבתי · שקד ביקשה את המילים האלה על הכפתור */
const NEW_ORDER_LABEL = 'הזמנה חדשה';

/** הרווח מעל הכותרת · מעל האזור הבטוח, כמו ב-`AdminShell` */
const HOME_PAD = 14;

export function AdminHomeScreen() {
  const insets = useSafeAreaInsets();
  const { go, signOut } = useNav();
  const home = useAdminHome();
  /* אותה חלונית בדיוק של מסך ההזמנות · ההזמנה הידנית חיה שם */
  const admin = useAdminOrders();
  const [bye, setBye] = React.useState(false);

  return (
    <ScrollView
      style={s.root}
      /* ⚠ הריפוד העליון · ראו את ההערה ב-`AdminShell` */
      contentContainerStyle={[s.pad, { paddingTop: insets.top + HOME_PAD }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ⚠ **כותרת ממורכזת, + בשמאל, התנתקות בימין** · שקד ביקשה
          (15 בספטמבר 2026) שכפתור ההתנתקות יעבור לפינה הימנית —
          אותה פינה שבשאר מסכי הניהול מחזיקה את חץ החזרה — ושה-+
          ייקח את מקומו בפינה השמאלית. שני הכפתורים מרחפים מעל
          השורה ולכן אינם דוחפים את הכותרת מהמרכז. */}
      <View style={s.head}>
        <View style={s.headText}>
          <Text style={s.title}>{HOME_TITLE}</Text>
          <Text style={s.sub}>{home.subtitle || HOME_SUBTITLE}</Text>
        </View>
        {/* ⚠ **״לחנות״ ירד וכאן יושבת הזמנה חדשה** · שקד ביקשה
            (15 בספטמבר 2026) כפתור שממנו היא מכניסה הזמנה של לקוחה
            שהתקשרה או כתבה בוואטסאפ, בלי שהלקוחה נרשמת לאתר.
            הכרטיס הסגול ״הזמנה ידנית״ שהיה מתחת ללוח המכירה ירד,
            והפעולה שלו עברה לכאן. */}
        {/* ⚠ **רק ה-+** · בקשה מפורשת של שקד (15 בספטמבר 2026)
            במקום הגלולה ״+ הזמנה חדשה״. המילים נשארות כשם
            הנגישות של הכפתור. */}
        <View style={s.headStart}>
        <Pressable onPress={admin.openNew} accessibilityLabel={NEW_ORDER_LABEL} style={s.newChip} hitSlop={8}>
          <S k="plus" size={18} color={LAV.chipInk} />
        </Pressable>
        </View>

        {/* ⚠ **התנתקות בפינה הימנית** · בקשה של שקד (15 בספטמבר
            2026). זו הפינה שבשאר מסכי הניהול מחזיקה את חץ החזרה;
            בדף הבית אין לאן לחזור, ולכן היא פנויה. העיגול 38×38
            הוא בדיוק מידת כפתור המשתמש שבפינה הזו בקנבס. */}
        <View style={s.headEnd}>
        <Pressable
          onPress={() => setBye(true)}
          accessibilityLabel="התנתקות"
          style={s.exit}
          hitSlop={8}
        >
          <LogOut size={17} color={LAV.dim} strokeWidth={1.9} />
        </Pressable>
        </View>
      </View>

      <SalePanel
        label={home.sale.label}
        isOpen={home.sale.open}
        onToggle={home.toggleOpen}
        dishes={home.sale.dishes}
        onSetQuota={home.setQuota}
        onSetSold={home.setSold}
        pct={home.ringPct}
        sold={home.soldTotal}
        quota={home.quotaTotal}
      />

      {/* ⚠ **שני הכרטיסים של יום המכירה** · שקד ביקשה שיופיעו זה
          לצד זה, ושכל אחד ינקוב בתאריך המכירה עצמו ולא ב״היום״.

          ⚠ **הוחזרו · 19 בספטמבר 2026** · קראתי לא נכון את ״בשתי
          כרטיסיות מתחת״ והחלפתי דווקא אותם בהכנסות ובהוצאות של
          החודש. שקד הראתה בתמונה שהכוונה הייתה לשורת הדיאגרמות
          שבתחתית הדף. */}
      <View style={s.statRow}>
        {/* ⚠ **הזמנות ומנות יחד** · שקד ביקשה (15 בספטמבר 2026)
            לראות גם כמה הזמנות התקבלו וגם כמה מנות נמכרו בהן —
            עשר הזמנות של עשר מנות יופיעו ״10 | 100״. */}
        <GlassCard style={[s.stat, s.tint1]}>
          <Text style={s.statLabel}>{`הזמנות ומנות עבור ${shortDate(home.sale.date)}`}</Text>
          <View style={s.pair}>
            <Text style={s.statValue}>{home.sale.orders}</Text>
            <Text style={s.pipe}>|</Text>
            <Text style={s.statValue}>{home.sale.meals}</Text>
          </View>
        </GlassCard>
        <GlassCard style={[s.stat, s.tint1]}>
          {/* ⚠ ״הכנסות״ ולא ״מחזור״ · בקשה של שקד (15 בספטמבר 2026) */}
          <Text style={s.statLabel}>{`הכנסות עבור ${shortDate(home.sale.date)}`}</Text>
          <View style={s.statMoney}>
            <Text style={s.statValue}>{money(home.sale.revenue)}</Text>
            <Text style={s.currency}>₪</Text>
          </View>
        </GlassCard>
      </View>

      {/* ⚠ **בחירת טווח** · שקד ביקשה (15 בספטמבר 2026) לראות את
          המחזור של היום, של השבוע, של החודש ושל חצי השנה האחרונה.
          קודם הגרף היה נתיב קבוע מהקנבס והראה תמיד ששה חודשים. */}
      {/* ⚠ **המדרגה השלישית של הגרדיאנט** · שקד בחרה (15 בספטמבר
          2026) את מבנה ״רצף״ בערכת ״לבנדר״: כל הכרטיסים חולקים
          גרדיאנט אחד שיורד לאורך הדף, והמחזור הוא השלישי בו. */}
      <GlassCard style={[s.revCard, s.tint3]}>
        <NightSky />
        <View style={s.cardHead}>
          <Text style={[s.cardTitle, { color: LAV.dim }]}>{home.rev.label}</Text>
          <View style={s.statMoney}>
            <Text style={[s.revTotal, { color: LAV.ink }]}>{money(home.rev.total)}</Text>
            <Text style={[s.currency, { color: LAV.faint }]}>₪</Text>
          </View>
        </View>

        <View style={s.ranges}>
          {REV_RANGES.map((r) => {
            const on = home.range === r.id;
            return (
              <Pressable
                key={r.id}
                onPress={() => home.setRange(r.id)}
                style={[s.range, on && s.rangeOn]}
              >
                <Text style={[s.rangeText, on && s.rangeTextOn]}>{r.n}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={s.chart}>
          <RevenueChart points={home.rev.points} />
        </View>
        <View style={s.months}>
          <View style={s.axisPad} />
          <View style={s.monthRow}>
            {home.rev.points.map((p, i) => (
              <Text
                key={`${p.k}-${i}`}
                style={[
                  s.month,
                  { color: LAV.faint },
                  i === home.rev.points.length - 1 && { fontWeight: '700', color: LAV.accent },
                ]}
                numberOfLines={1}
              >
                {p.k}
              </Text>
            ))}
          </View>
        </View>
      </GlassCard>

      <View style={s.row}>
        {/* ⚠ **עוגה מוטה בלי כותרת** · בחירה של שקד (15 בספטמבר
            2026). האחוזים יושבים בתוך הפרוסות, ומתחת מקרא בשתי
            שורות ממורכזות — קוסקוס מעל ספיישל, שניצל מעל שף. */}
        <GlassCard style={[s.donutCard, s.tint4]}>
          <View style={s.pieWrap}>
            <CategoryPie parts={home.shares} width={PIE_W} />
          </View>
          <View style={s.legend}>
            {home.shares.map((l) => (
              <View key={l.name} style={s.legendCell}>
                <View style={[s.legendDot, { backgroundColor: l.color }]} />
                <Text style={s.legendName} numberOfLines={1}>
                  {l.name}
                </Text>
              </View>
            ))}
          </View>
        </GlassCard>

        <GlassCard style={[s.profitCard, s.tint4]}>
          <Text style={s.cardTitle}>{PROFIT.title}</Text>
          <View style={s.statMoney}>
            <Text style={s.profitNet}>{money(home.live ? home.month.profit : PROFIT.net)}</Text>
            <Text style={s.currencyBig}>₪</Text>
          </View>
          <View style={s.rule} />
          <View style={s.grossRow}>
            <Text style={s.profitNote}>{PROFIT.revLabel}</Text>
            <View style={s.statMoney}>
              <Text style={s.gross}>{money(home.live ? home.month.revenue : PROFIT.rev)}</Text>
              <Text style={s.currencySm}>₪</Text>
            </View>
          </View>
          <View style={[s.grossRow, s.expRow]}>
            <Text style={s.profitNote}>{PROFIT.expLabel}</Text>
            <View style={s.statMoney}>
              <Text style={s.gross}>{money(home.live ? home.month.expenses : PROFIT.exp)}</Text>
              <Text style={s.currencySm}>₪</Text>
            </View>
          </View>
          <View style={s.spacer} />
          {/* ⚠ נתונים אמיתיים · נופל לציור הקנבס רק בלי שרת */}
          <ProfitBars
            grow={BARS_GROW}
            points={home.live ? home.profitTrend.map((p) => p.v) : undefined}
          />
        </GlassCard>
      </View>

      {/* ⚠ שורה אחת · תפריט · עלויות · לקוחות · מלאי, בסדר הזה.
          השאר עברו לנאב-בר לבקשת שקד (15 בספטמבר 2026). */}
      <TileRail onOpen={(key) => go(TILE_ROUTES[key])} badges={home.badges} keys={HOME_TILES} />

      {admin.newOpen ? <NewOrderSheet admin={admin} /> : null}

      <LogoutConfirm open={bye} onCancel={() => setBye(false)} onConfirm={() => { setBye(false); signOut(); }} />

      {/* ⚠ אישור שהודעת הוואטסאפ יצאה ללקוח · בקשה של שקד */}
      <SentNotice who={admin.notified} onClose={admin.clearNotified} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  /* ⚠ רקע הדף · מתחת לכל הכרטיסים, בגוון של ערכת לבנדר */
  root: { flex: 1, backgroundColor: LAV.page },
  /* ⚠ הריפוד העליון נקבע בזמן ריצה · ראו את ההערה ב-`AdminShell` */
  pad: { paddingHorizontal: 18, paddingBottom: 120, gap: 12 },
  head: { justifyContent: 'center', minHeight: 46 },
  headText: { alignItems: 'center', gap: 2 },
  /**
   * ⚠ **`left`/`right` ולא `start`/`end`** · בדפדפן
   * `I18nManager.isRTL` כבוי, ולכן ריאקט-נייטיב-ווב מתרגם `end`
   * ל-`right`. הצדדים הפיזיים נפתרים אותו דבר בדפדפן ובאפליקציה.
   */
  headStart: { position: 'absolute', left: 0, top: 0, bottom: 0, justifyContent: 'center' },
  headEnd: { position: 'absolute', right: 0, top: 0, bottom: 0, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '600', color: LAV.ink, textAlign: 'center' },
  sub: { fontSize: 14.5, fontWeight: '300', color: LAV.faint, textAlign: 'center' },
  /* עיגול בגוון הצ׳יפ · אותה מידה של כפתור ההתנתקות שלצידו */
  newChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LAV.chip,
  boxShadow: iconOrbShadow('123,92,188'),
  },
  /* כפתור ההתנתקות · אותו עיגול 38 שיושב בפינה הזו בקנבס */
  exit: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    boxShadow: iconOrbShadow('130,112,162'),
    alignItems: 'center',
    justifyContent: 'center',
  } as never,

  /**
   * ⚠ **בלי גובה קבוע** · השורה הייתה נעולה על 144 מהעיצוב הישן,
   * והכרטיסים בתוכה גדלו ל-176 — כך שאריחי הניווט טיפסו 20
   * פיקסלים על תחתית כרטיס העוגה. נמדד בדפדפן.
   */
  row: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
  /* ⚠ **מינימום ולא תקרה · 19 בספטמבר 2026** · בכתב מוגדל הכותרת
     ״הזמנות ומנות עבור 22.9״ נשברת לשתי שורות והמספרים נחתכו
     בתחתית הכרטיס · אותה סיבה שמתוארת ב-`revCard`. */
  statRow: { flexDirection: 'row', gap: 12, minHeight: 66 },
  /* ⚠ ממורכז · בקשה של שקד (15 בספטמבר 2026) */
  stat: { flex: 1, borderRadius: 26, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', gap: 3 },
  statLabel: { fontSize: 12.5, color: LAV.faint, textAlign: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: LAV.ink },
  statMoney: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  currency: { fontSize: 12.5, color: surface.faint },
  currencySm: { fontSize: 11.5, color: surface.faint },
  currencyBig: { fontSize: 14, color: surface.faint },

  /* ⚠ הגובה גדל ב-34 · שורת הטווחים נוספה מתחת לכותרת */
  /**
   * ⚠ **גובה מינימלי ולא גובה קבוע · 19 בספטמבר 2026** · בקשה של
   * שקד: ״בכרטיסייה איפה שמוצג המחזור יום שבוע חודש חצי שנה —
   * בדיאגרמה המד התקדמות עולה על הכיתוב, צריך להגדיל לגובה את
   * הכרטיסייה״.
   *
   * 196 נמדד מהקנבס. מאז `FONT_BUMP` הוסיף 4 לכל גודל כתב, והכותרת
   * עם בורר הטווחים תפחו — נשארו לגרף כ-75 במקום 102. `chart` הוא
   * היחיד עם `flex: 1`, ולכן **הוא** זה שהצטמק, בעוד ה-SVG שבתוכו
   * נשאר 102 וגלש אל שורת החודשים שמתחתיו.
   */
  revCard: { minHeight: 196, borderRadius: 26, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 8 },
  /* חמש מדרגות הגרדיאנט · אותו כרטיס, גוון אחר לפי מקומו בדף */
  tint1: { backgroundColor: LAV.tints[1], borderColor: LAV.edge },
  tint3: { backgroundColor: LAV.tints[2], borderColor: LAV.edge, overflow: 'hidden' },
  tint4: { backgroundColor: LAV.tints[3], borderColor: LAV.edge },
  ranges: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 9,
    padding: 3,
    borderRadius: 999,
    backgroundColor: LAV.pill,
  },

  /* ⚠ בורר מפולח · גלולה לבנה עם צל לנבחר, כמו בשאר המסכים */
  ranges2: {},
  range: {
    flex: 1,
    height: 26,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeOn: { backgroundColor: '#FFFFFF', boxShadow: '0 2px 6px -2px rgba(90,80,70,0.3)' } as never,
  rangeText: { fontSize: 12.5, fontWeight: '400', color: LAV.dim },
  rangeTextOn: { fontWeight: '700', color: LAV.ink },

  pair: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  pipe: { fontSize: 17, fontWeight: '300', color: 'rgba(130,112,162,0.5)' },
  cardHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  cardTitle: { fontSize: 14.5, fontWeight: '600', color: LAV.dim },
  revTotal: { fontSize: 17, fontWeight: '700', color: LAV.ink },
  /* ⚠ **רצפה בגובה הגרף** · בלעדיה `flex: 1` מצטמק וה-SVG גולש */
  chart: { flex: 1, minHeight: REV_CHART_H, marginTop: 4 },
  months: { flexDirection: LTR_ROW, alignItems: 'center' },
  axisPad: { width: 30 },
  /* בקנבס שורת החודשים היא direction: ltr · מרץ בשמאל, אוג׳ בימין */
  monthRow: { flex: 1, flexDirection: LTR_ROW, justifyContent: 'space-around' },
  month: { fontSize: 11.5, fontWeight: '300', color: '#9A93A6' },
  expRow: { marginTop: 3 },
  monthOn: { fontWeight: '600', color: '#7B5CBC' },

  donutCard: { flex: 1, minHeight: CHART_CARD_H, borderRadius: 26, paddingVertical: 14, paddingHorizontal: 16 },
  pieWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  /**
   * ⚠ **רשת ולא שורות** · כשכל שורה מרכזה את עצמה, ״ספיישל״
   * הארוך הזיז את הנקודה שלו ביחס ל״קוסקוס״. שתי עמודות ברוחב
   * שווה מיישרות את הנקודות אחת מתחת לשנייה בדיוק.
   */
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'center',
    marginTop: 9,
    rowGap: 5,
  },
  legendCell: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 5, paddingEnd: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendName: { fontSize: 12, fontWeight: '500', color: LAV.soft },

  /**
   * ⚠ **גובה מינימלי ולא גובה קבוע · 19 בספטמבר 2026** · בקשה של
   * שקד: ״המד התקדמות איפה שמוצג הרווח החודשי עולה על הכיתוב,
   * צריך להגדיל לגובה את הכרטיסייה״.
   *
   * הגובה 202 נמדד מהקנבס, אבל הכתב באפליקציה גדל פעמיים מאז:
   * `FONT_BUMP` הוסיף 4 לכל גודל, ו-iOS מגדיל עוד לפי ״גודל טקסט״
   * שבהגדרות המכשיר. נמדד בסימולטור ב-`extra-large`: התוכן צריך
   * יותר מ-202, ה-`spacer` הצטמק לאפס, והעמודות נדחקו אל שורת
   * ״הוצאות״ ונחתכו בתחתית הכרטיס.
   *
   * עם `minHeight` הכרטיס גדל לפי מה שבתוכו. הכרטיס שלצידו
   * (העוגה) מקבל את אותו מינימום, ו-`alignItems: 'stretch'`
   * שבשורה משווה את השניים — כך הם נשארים תאומים בכל גודל כתב.
   */
  profitCard: {
    flex: 1,
    minHeight: CHART_CARD_H,
    borderRadius: 26,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  profitNet: { fontSize: 26, fontWeight: '300', color: LAV.ink },
  profitNote: { fontSize: 12, fontWeight: '300', color: LAV.faint },
  rule: { height: 1, backgroundColor: LAV.edge, marginVertical: 7 },
  grossRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 },
  gross: { fontSize: 14.5, fontWeight: '600', color: LAV.soft },
  /* ⚠ **רווח אמיתי מעל העמודות** · `flex: 1` לבדו מצטמק לאפס
     כשהתוכן גדול, והעמודות נדבקות לכיתוב. */
  spacer: { flex: 1, minHeight: 10 },
});
