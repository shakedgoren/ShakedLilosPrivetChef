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
import { CategoryPie, REV_CHART_H, RevenueChart, SplitColumns } from './home/Charts';
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
 * רוחב שתי הדיאגרמות.
 *
 * ⚠ **העוגה גדלה על חשבון העמודות · 19 בספטמבר 2026** · בקשה של
 * שקד: ״אפשר את הדיאגרמת עמודות לצמצם מהרוחב של כל אחד מהעמודות
 * כדי להגדיל את העוגה אם יש צורך״ — הסכומים שהיא ביקשה לכתוב על
 * הפרוסות צריכים מקום. הייתה חלוקה שווה, 148 לכל צד.
 */
const PIE_W = 186;
const COL_W = 138;

/** האריחים שנשארו בדף הבית · הסדר הוא של שקד */
const HOME_TILES: TileKey[] = ['menu', 'costs', 'people', 'stock'];

/**
 * ⚠ **שני הנוסחים האלה נכתבו על ידי Claude · 19.9.2026** · שקד
 * ביקשה ״בלי כותרות שמסבירות״, ולכן הם מילה אחת כל אחד.
 */
const MONTH_REVENUE = 'הכנסות';
const MONTH_COST = 'הוצאות';

/**
 * ⚠ **כותרות טבלת הפילוח · נכתבו על ידי Claude · 19.9.2026** ·
 * שקד תיארה את העמודות במילים שלה: ״השם מנה, כמות הפעמים שנמכרה
 * החודש, סה״כ ייצור שהיא עלתה וסה״כ רווח שנכנס ממנה״. הכותרות
 * כאן הן הקיצור שלהן לרוחב של טלפון.
 */
const SPLIT_COLS = ['מנה', 'כמות', 'מכירה', 'ייצור', 'רווח'];

/** ⚠ ארבעת הסיכומים · בדיוק בלשון שלה */
const SPLIT_SUM = ['כמות מנות', 'סה״כ הכנסות', 'סה״כ הוצאות', 'סה״כ רווח'];

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

      {/**
        * ⚠ **כרטיס הפילוח · 19 בספטמבר 2026** · בקשה של שקד:
        * ״נשים את הכל באותה הכרטיסייה, מצד ימין תופיע העוגה
        * שמחלקת לפי מנות את ההכנסות ואז בצד שמאל תופיע הפרמידה
        * שמחלקת לפי מנות את ההוצאות. ואז מתחת יופיע השם מנה,
        * כמות הפעמים שנמכרה החודש, סה״כ ייצור שהיא עלתה וסה״כ
        * רווח שנכנס ממנה. ולמטה יהיה סיכום של הכל״.
        *
        * ⚠ **החליף שני כרטיסים** · העוגה וכרטיס ״רווח החודש״ ישבו
        * זה לצד זה, כל אחד בכרטיס משלו.
        *
        * ⚠ **הבורר בוחר קטגוריה אחת** · ״שהקוסקוס והשניצל יהיה
        * מופרד בכפתור שיחליף ביניהם״. הטבלה והסיכום הם של
        * הקטגוריה שנבחרה, לא של שתיהן יחד.
        *
        * ⚠ **צבע אחד לכל מנה** · פרוסת העוגה, רצועת הפירמידה
        * והנקודה שבטבלה חולקות גוון, ולכן אין צורך במקרא נפרד.
        */}
      <GlassCard style={[s.splitCard, s.tint4]}>
        <View style={s.splitTabs}>
          {home.splitTabs.map((c) => {
            const on = home.splitCat === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => home.setSplitCat(c.id)}
                style={[s.splitTab, on && s.rangeOn]}
              >
                <Text style={[s.rangeText, on && s.rangeTextOn]}>{c.n}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={s.splitCharts}>
          <View style={[s.splitHalf, s.splitPie]}>
            <CategoryPie parts={home.splitShares} width={PIE_W} />
            <Text style={s.splitCap}>{MONTH_REVENUE}</Text>
          </View>
          <View style={[s.splitHalf, s.splitCols]}>
            <SplitColumns
              width={COL_W}
              rows={home.split.rows.map((r) => ({ id: r.id, name: r.name, v: r.cost, color: r.color }))}
            />
            <Text style={s.splitCap}>{MONTH_COST}</Text>
          </View>
        </View>

        {/* ⚠ **הטבלה עטופה** · `splitCard` נותן `gap` בין חלקי הכרטיס,
            ובלי העטיפה הוא היה חל גם בין שורה לשורה · בקשה של שקד
            ״לצמצם קצת רווחים בין כל מנה ומנה״. */}
        <View style={s.table}>
        <View style={s.tHead}>
          <Text style={[s.tHeadText, s.tDish]}>{SPLIT_COLS[0]}</Text>
          <Text style={[s.tHeadText, s.tNum]}>{SPLIT_COLS[1]}</Text>
          <Text style={[s.tHeadText, s.tNum]}>{SPLIT_COLS[2]}</Text>
          <Text style={[s.tHeadText, s.tNum]}>{SPLIT_COLS[3]}</Text>
          <Text style={[s.tHeadText, s.tNum]}>{SPLIT_COLS[4]}</Text>
        </View>

        {home.split.rows.map((r) => {
          const gain = r.revenue - r.cost;
          return (
            <View key={r.id} style={s.tRow}>
              <View style={s.tDish}>
                <View style={[s.legendDot, { backgroundColor: r.color }]} />
                {/* ⚠ **שתי שורות ולא חיתוך** · ״חלת פילה עוף טמפורה״
                    ארוך מהעמודה. שם של מנה לא מקצרים. */}
                <Text style={s.tDishName} numberOfLines={2}>
                  {r.name}
                </Text>
              </View>
              <Text style={[s.tCell, s.tNum]}>{r.sold}</Text>
              {/* ⚠ ״מכירה״ · בקשה של שקד · ההכנסה מאותה מנה החודש */}
              <Text style={[s.tCell, s.tNum]}>{money(r.revenue)}</Text>
              <Text style={[s.tCell, s.tNum]}>{money(r.cost)}</Text>
              {/* ⚠ הפסד באדום · מנה שעלתה יותר ממה שהכניסה */}
              <Text style={[s.tCell, s.tNum, gain < 0 && s.tLoss]}>{money(gain)}</Text>
            </View>
          );
        })}
        </View>

        <View style={s.sumBox}>
          {[
            home.splitSum.sold,
            home.splitSum.revenue,
            home.splitSum.cost,
            home.splitSum.profit,
          ].map((v, i) => (
            <View key={SPLIT_SUM[i]} style={s.sumCell}>
              <Text style={s.sumLabel}>{SPLIT_SUM[i]}</Text>
              <Text style={[s.sumValue, i === 3 && v < 0 && s.tLoss]}>
                {i === 0 ? v : `${money(v)} ₪`}
              </Text>
            </View>
          ))}
        </View>
      </GlassCard>

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

  /**
   * ⚠ **בורר הקטגוריה של הפילוח** · אותה גלולה של בורר הטווחים.
   *
   * ⚠ **רוחב מינימלי · בקשה של שקד (19 בספטמבר 2026)** · ״אפשר את
   * הכפתור שמחליף בין המכירות לצמצם לרוחב מינימלי״. קודם הוא נמתח
   * על כל רוחב הכרטיס, כי הכפתורים ירשו את `flex: 1` של בורר
   * הטווחים. עכשיו הם מתכווצים לכיתוב, והגלולה ממורכזת.
   */
  splitTabs: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 4,
    padding: 3,
    borderRadius: 999,
    backgroundColor: LAV.pill,
  },
  splitTab: {
    height: 26,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
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
  monthOn: { fontWeight: '600', color: '#7B5CBC' },

  /**
   * ⚠ **כרטיס אחד לפילוח · 19 בספטמבר 2026** · שתי הדיאגרמות,
   * הטבלה והסיכום · ראו את ההערה המלאה במקום שבו הוא מצויר.
   */
  splitCard: { borderRadius: 26, paddingTop: 12, paddingHorizontal: 14, paddingBottom: 12, gap: 10 },
  splitCharts: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  /* ⚠ **לא חצאים שווים** · העוגה מקבלת יותר · ראו `PIE_W` */
  splitHalf: { alignItems: 'center', gap: 6 },
  splitPie: { flex: 1.35 },
  splitCols: { flex: 1 },
  splitCap: { fontSize: 12.5, fontWeight: '600', color: LAV.dim },
  /**
   * ⚠ **רשת ולא שורות** · כשכל שורה מרכזה את עצמה, ״ספיישל״
   * הארוך הזיז את הנקודה שלו ביחס ל״קוסקוס״. שתי עמודות ברוחב
   * שווה מיישרות את הנקודות אחת מתחת לשנייה בדיוק.
   */
  legendDot: { width: 8, height: 8, borderRadius: 4 },

  /* ⚠ **הטבלה** · שם המנה תופס את מה שנשאר, והמספרים ברוחב קבוע
     כדי שהעמודות יישארו מיושרות משורה לשורה. */
  table: {},
  tHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: LAV.edge,
  },
  tHeadText: { fontSize: 10.5, fontWeight: '600', color: LAV.faint },
  /* ⚠ **שורות צפופות · בקשה של שקד (19 בספטמבר 2026)** · ״לצמצם
     קצת רווחים בין כל מנה ומנה״ · היה 5 מלמעלה ומלמטה. */
  tRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 },
  tDish: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  tDishName: { flex: 1, fontSize: 11, fontWeight: '500', color: LAV.soft },
  tCell: { fontSize: 11.5, fontWeight: '600', color: LAV.ink },
  /* ⚠ ארבע עמודות מספרים · רוחב קבוע כדי שיישארו מיושרות */
  tNum: { width: 44, textAlign: 'center' },
  /* ⚠ הפסד באדום · הצבע של ההוצאות במסך הכספים */
  tLoss: { color: '#B95349' },

  /* ⚠ **הסיכום** · ארבעה תאים בשתי שורות · בלשון של שקד */
  sumBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: LAV.edge,
    rowGap: 8,
  },
  /* ⚠ **ממורכזים** · בקשה של שקד: ״שכל הסה״כ בתחתית יהיו
     ממורכזים לאמצע״ */
  sumCell: { width: '50%', gap: 2, alignItems: 'center' },
  sumLabel: { fontSize: 11.5, fontWeight: '400', color: LAV.faint, textAlign: 'center' },
  sumValue: { fontSize: 15, fontWeight: '700', color: LAV.ink, textAlign: 'center' },

});
