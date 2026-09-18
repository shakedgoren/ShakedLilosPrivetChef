import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { S } from '../components/Sym';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text, TextInput } from '../ui/text';
import { surface } from '../theme/tokens';
import {
  BAND as BOARD_BAND,
  BOARD_SUB as BOARD_LIVE,
  CATS as BOARD_CATS,
  COL_W,
  EMPTY_LABEL as BOARD_EMPTY,
  FLOW as BOARD_FLOW,
  GONE_PREFIX as BOARD_GONE,
  HEAD_COLS,
  LOW_STOCK,
  MODES as BOARD_MODES,
  SEED as BOARD_SEED,
  STEPS as BOARD_STEPS,
  START_MODE,
  TAIL_COLS,
} from '../data/adminBoard';
import { CancelSheet } from './CancelSheet';
import { CATS } from '../data/adminDays';
import { upcomingSale } from '../data/saleWeek';
import { boardCatOf, prepOf, type BoardItem } from './boardCat';
import { apiEnabled } from '../api/config';
import { adminBoard, adminSetBoardStatus, adminSetQty } from '../api/admin';
import { saleDayStatus } from '../api/orders';
import { boardColumn, boardPrepLines } from './dishNames';
import { adminSetStatus } from '../api/orders';
import { useNav } from '../navigation/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCheer } from '../components/Cheer';
import { statusToast } from './statusToast';
import type { CancelNote } from './useAdminOrders';
import Svg, { Path } from 'react-native-svg';
import { iconOrbShadow } from '../theme/glass';
import { FONT_BUMP } from '../theme/fontScale';

/** ריפוד המסך */
const ROOT_PAD = 14;
/**
 * כיוון הסיבוב של תצוגת הטלפון.
 * ⚠ **התהפך ב-18 בספטמבר 2026** · היה ‎'90deg', ושקד ביקשה ״תסובב
 * את הטבלה לכיוון השני״. עכשיו קוראים אותה כשמסובבים את המכשיר
 * **עם כיוון השעון**.
 */
const TURN_ANGLE = '-90deg';
/** כל כמה זמן הלוח שואל את השרת מחדש · ראו ההערה ב-`reload` */
const REFRESH_MS = 20000;
/** הריפוד מעל הכותרת · מתווסף לאזור הבטוח */
const ROOT_TOP = 10;

const nf = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const TOTAL_LABEL = 'סה״כ';

/**
 * מכסת ברירת המחדל של פריט · נפילה לאחור כשאין יום מכירה בשרת.
 * ⚠ המכסה האמיתית מגיעה מדף יום המכירה, ולא מכאן.
 */
const dishQuota = (cat: string, id: string) =>
  CATS[cat as keyof typeof CATS]?.dishes.find((d) => d.id === id)?.q ?? 0;


/**
 * ⚠ **מתג התצוגה** · בקשה של שקד — הלוח תוכנן לאייפד (1180×820),
 * והיא רוצה לעבור בין תצוגת אייפד לתצוגת טלפון בלחיצה.
 * בתצוגת טלפון הטבלה מצטמצמת לעמודות שנכנסות למסך צר.
 */
const VIEWS = [
  { id: 'pad', label: 'תצוגת אייפד' },
  { id: 'phone', label: 'תצוגת טלפון' },
] as const;
type ViewId = (typeof VIEWS)[number]['id'];

type Row = {
  id?: string;
  who: string;
  time: string;
  ship: 'pickup' | 'deliv';
  pay: string;
  status: string;
  note: string;
  q: Record<string, number>;
  gone?: boolean;
  hrs: number;
};

const sumOf = (items: BoardItem[], q: Record<string, number>) =>
  items.reduce((s, it) => s + (q[it.id] || 0) * it.price, 0);

export function AdminBoardScreen() {
  const { back, user } = useNav();
  /**
   * ⚠ **האזור הבטוח ידנית · 17 בספטמבר 2026** · מסכי הניהול מוותרים
   * על הריפוד העליון של האפליקציה (ראו `NO_TOP_INSET` ב-`App.tsx`),
   * והמסך הזה אינו יושב ב-`AdminShell` שמפצה על כך. נמדד בסימולטור:
   * הכותרת נכנסה מתחת למגרעת.
   */
  const insets = useSafeAreaInsets();
  const live = apiEnabled && user?.role === 'admin';
  /**
   * ⚠ **הקטגוריה נגזרת מהשעון · תוקן ב-17 בספטמבר 2026** · ראו
   * `boardCat`. נקבע פעם אחת בכניסה למסך, כמו בשורת דף הבית.
   */
  const saleCat = React.useMemo(() => upcomingSale(new Date()).cat, []);
  /* ההודעה הצפה · שכבה גלובלית · ראו `Cheer` */
  const { toast } = useCheer();
  const BOARD_CAT = React.useMemo(() => boardCatOf(saleCat), [saleCat]);
  const { width, height } = useWindowDimensions();
  const [mode, setMode] = useState<'all' | 'pickup' | 'deliv'>(
    START_MODE as 'all' | 'pickup' | 'deliv',
  );
  /* ברירת המחדל נגזרת מרוחב החלון · באייפד פותחים בתצוגת אייפד */
  const [view, setView] = useState<ViewId>('pad');
  const [orders, setOrders] = useState<Row[]>(() =>
    BOARD_SEED.map((o) => ({ ...o, q: { ...o.q }, hrs: o.hrs })),
  );
  /* המכסות של היום · מגיעות מהשרת, ובלעדיו ממכסת ברירת המחדל */
  const [quotas, setQuotas] = useState<Record<string, number>>({});
  const [cancelling, setCancelling] = useState(-1);
  const [cx, setCx] = useState<CancelNote>({ reason: '', note: '' });

  /**
   * טעינת הלוח.
   *
   * ⚠ **התאריך היה מוקלד · תוקן ב-18 בספטמבר 2026** · שקד דיווחה:
   * ״כשלקוחה מזמינה הזמנה במערכת זה לא מוצג לי אוטומטית בדף ניהול
   * ההזמנות של יום המכירה, זה כן מוצג בהזמנות הראשיות״.
   *
   * זה לא היה באג בשרת אלא **תאריך קבוע בקוד**: הלוח ביקש תמיד את
   * ההזמנות של ‎1 בספטמבר 2026. כל הזמנה שנכנסה ביום אחר פשוט לא
   * הייתה בתשובה. עכשיו התאריך מגיע מיום המכירה של הקטגוריה —
   * אותה נקודה שהלקוחה עצמה מוזמנת דרכה — ולכן השניים מסונכרנים
   * מעצם ההגדרה.
   */
  const reload = useCallback(async () => {
    if (!live) return;
    const day = await saleDayStatus(saleCat).catch(() => null);
    const res = await adminBoard(day?.date, saleCat);
    setOrders(
      res.cards.map((c) => ({
        id: c.id,
        who: c.who,
        time: c.time,
        ship: c.ship.includes('משלוח') ? 'deliv' : 'pickup',
        pay: c.pay,
        status: BOARD_FLOW.includes(c.status as (typeof BOARD_FLOW)[number])
          ? c.status
          : c.status === 'בהכנה' || c.status === 'מאושרת'
            ? 'חדשה'
            : c.status === 'נמסרה'
              ? 'נמסרה'
              : 'חדשה',
        note: c.ship.includes('משלוח') ? c.ship.replace('משלוח · ', '') : c.via,
        q: res.qty[c.id] ?? {},
        hrs: c.hrs,
      })),
    );
    /* המכסות של היום · מזינות את מוני ההכנה בראש הלוח */
    setQuotas(res.quotas ?? {});
  }, [live, saleCat]);

  /**
   * ⚠ **רענון חוזר · 18 בספטמבר 2026** · הלוח נטען פעם אחת בכניסה
   * אליו, ולכן הזמנה שנכנסה בזמן שהוא פתוח לא הופיעה עד שסוגרים
   * ופותחים אותו. שקד ביקשה שזה יקרה **אוטומטית**.
   *
   * ⚠ **דגימה ולא חיבור פתוח** · לשרת אין היום ערוץ שדוחף שינויים
   * (לא WebSocket ולא SSE). דגימה כל `REFRESH_MS` היא הקירוב
   * הזול; חיבור פתוח הוא שינוי בשרת, ואפשר לעשות אותו בנפרד.
   */
  useEffect(() => {
    void reload().catch(() => undefined);
    if (!live) return;
    const id = setInterval(() => void reload().catch(() => undefined), REFRESH_MS);
    return () => clearInterval(id);
  }, [reload, live]);

  const liveRows = orders.filter((o) => !o.gone);
  const shown = liveRows
    .map((o, i) => ({ o, i: orders.indexOf(o) }))
    .filter((x) => mode === 'all' || x.o.ship === mode)
    .sort((a, b) => {
      const g = BOARD_FLOW.indexOf(a.o.status as (typeof BOARD_FLOW)[number]) - BOARD_FLOW.indexOf(b.o.status as (typeof BOARD_FLOW)[number]);
      return g !== 0 ? g : a.o.time.localeCompare(b.o.time);
    });

  const gone = orders.filter((o) => o.gone).length + (live ? 0 : 0);
  const setQ = (i: number, id: string, v: string) => {
    const n = parseInt(String(v).replace(/[^\d]/g, ''), 10);
    const qn = isNaN(n) ? 0 : Math.max(0, n);
    setOrders((list) =>
      list.map((o, k) => (k === i ? { ...o, q: { ...o.q, [id]: qn } } : o)),
    );
    const row = orders[i];
    if (live && row?.id) void adminSetQty(row.id, { ...row.q, [id]: qn }).catch(() => undefined);
  };

  const setStatus = (i: number, name: string) => {
    /* ⚠ הודעה צפה בכל שינוי סטטוס · בקשה של שקד · ראו `statusToast` */
    toast(statusToast(name));
    setOrders((list) => list.map((o, n) => (n === i ? { ...o, status: name } : o)));
    const row = orders[i];
    if (live && row?.id) void adminSetBoardStatus(row.id, name).then(reload).catch(() => undefined);
  };

  const doCancel = () => {
    if (!cx.reason) return;
    const i = cancelling;
    toast(statusToast('בוטלה'));
    const row = orders[i];
    if (live && row?.id) {
      void adminSetStatus(row.id, 'בוטלה', { reason: cx.reason, note: cx.note }).then(reload).catch(() => undefined);
    }
    setOrders((list) => list.map((o, n) => (n === i ? { ...o, gone: true } : o)));
    setCancelling(-1);
  };

  const colSums = BOARD_CAT.items.map((it) => shown.reduce((s, x) => s + (x.o.q[it.id] || 0), 0));
  const grand = shown.reduce((s, x) => s + sumOf(BOARD_CAT.items, x.o.q), 0);
  /**
   * מוני ההכנה · **לפי מצרך, לא לפי מנה**.
   *
   * ⚠ שקד הסבירה (15 בספטמבר 2026) שהמונים אמורים לומר לה **כמה
   * להכין מכל סוג**, ולא כמה נמכר מכל שורה בתפריט:
   *
   * · **קוסקוס** · כל מנה צריכה קוסקוס → שלוש המנות יחד.
   * · **ירקות** · כל מנה מקבלת מנת ירקות → שלוש המנות יחד,
   *   ועוד תוספות הירקות שהוזמנו בנפרד.
   * · **עוף** · מנות העוף ועוד תוספות העוף.
   * · **מפרום** · מנות המפרום ועוד תוספות המפרום.
   *
   * המלאי של כל מונה הוא סכום המכסות של אותם פריטים, והמכסות
   * מגיעות מדף יום המכירה — לא ממספרים קבועים בקוד.
   */
  const PREP = prepOf(saleCat, BOARD_CAT.items);

  const stock = PREP.map((p) => {
    const used = p.of.reduce(
      (t, id) => t + liveRows.reduce((s2, o) => s2 + (o.q[id] || 0), 0),
      0,
    );
    const quota = p.of.reduce((t, id) => t + (quotas[id] ?? dishQuota(saleCat, id)), 0);
    return {
      id: p.id,
      sub: p.name,
      /* שתי שורות הכיתוב · השלישית היא המספרים · ראו `boardPrepLines` */
      lines: boardPrepLines(p.id, p.name),
      used,
      quota,
      left: quota - used,
    };
  });

  /**
   * ⚠ הרוחבים · בתצוגת אייפד בדיוק אלה של הקנבס, ובתצוגת טלפון
   * מצטמצמים כדי שהשורה תיכנס במסך צר בלי גלילה אינסופית.
   */
  /**
   * ⚠ **טבלה רחבה במסך צר** · הלוח תוכנן לאייפד (1180 רוחב), ובאייפון
   * עמודות הכמויות, הסכום והסטטוס נשארו מחוץ למסך. שקד הציעה
   * ״שהטבלה תהיה מוצגת במצב שוכב״.
   *
   * שתי הדרכים פתוחות עכשיו:
   * · **מסובבים את המכשיר** · מרוחב 700 ומעלה הטבלה המלאה של
   *   הקנבס נכנסת, ותצוגת הטלפון עוברת אליה מעצמה.
   * · **מחזיקים זקוף** · כל הזמנה הופכת לכרטיס משלה, בלי גלילה
   *   לרוחב בכלל. טבלה מסובבת ב-90 מעלות הייתה מאלצת לקרוא
   *   בצוואר מוטה, ולכן לא עשיתי את זה.
   */
  const landscape = width >= 700;
  const pad = view === 'pad' || landscape;
  /**
   * האם להציג את הטבלה שוכבת.
   *
   * ⚠ **החליף את ההקטנה · 18 בספטמבר 2026** · שקד: ״שינית את
   * התצוגה של האייפד, הקטנת אותה ולא ביקשתי את זה. בתצוגת טלפון
   * אני לא רוצה שזה יהיה מותאם לרוחב של הטלפון — תציג לי את
   * הטבלה לרוחב כאילו הטלפון שוכב, מבלי שאני אשכיב אותו״.
   *
   * לכן ההקטנה ירדה לגמרי: **תצוגת האייפד חזרה לגודלה המלא**
   * (וגולשת לצדדים כמו קודם), ותצוגת הטלפון מסובבת ב-90 מעלות.
   */
  const turn = view === 'phone' && !landscape;
  /**
   * ⚠ **רוחבי הקנבס הצטמצמו** · בקנבס העמודות הן 92/220/68/96/104/206
   * (1126 מתוך ארטבורד 1180), ושקד ביקשה (15 בספטמבר 2026) לצמצם
   * ״למינימום מרחב שהיא צריכה — יש יותר מדי רווחים מיותרים״.
   * כל עמודה ירדה לרוחב שהתוכן שלה באמת דורש: שעה 11:40, שם מלא,
   * ספרה או שתיים בכל פריט, סכום עד ארבע ספרות, ואמצעי תשלום.
   */
  const w = pad
    ? { time: 54, who: 92, item: 50, sum: 62, pay: 62, status: 146 }
    : { time: 58, who: 96, item: 44, sum: 64, pay: 58, status: 118 };
  const tableW = w.time + w.who + w.item * BOARD_CAT.items.length + w.sum + w.pay + w.status;

  const body = (
    <View style={[s.root, turn ? s.rootTurned : { paddingTop: insets.top + ROOT_TOP }]}>
      {/* ⚠ **הכותרת בשורת החץ** · שקד ביקשה (15 בספטמבר 2026) להסיר
          את הרווח שהיה מעל הכותרת בכל מסכי הניהול. הכותרת ממורכזת
          וחץ החזרה מרחף בפינה הימנית, והפקדים יורדים לשורה שמתחת —
          הם רחבים מדי (הלשוניות לבדן כ-270 פיקסלים) מכדי לחלוק את
          השורה עם כותרת ממורכזת. */}
      <View style={s.head}>
        <View style={s.headText}>
          <Text style={s.title}>{BOARD_CAT.name}</Text>
          <Text style={s.sub}>{BOARD_LIVE}</Text>
        </View>
        <View style={s.backWrap}>
          <Pressable onPress={() => back()} style={s.back}>
            <S k="chevronRight" size={19} color="#6E6478" />
          </Pressable>
        </View>
      </View>

      <View style={s.tools}>
        {/* ⚠ מתג התצוגה · בקשה של שקד, אינו בקנבס */}
        <View style={s.views}>
          {VIEWS.map((v) => {
            const on = view === v.id;
            return (
              <Pressable key={v.id} onPress={() => setView(v.id)} style={[s.viewBtn, on && s.viewOn]}>
                <Text style={[s.viewText, on && s.viewTextOn]}>{v.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* ⚠ **בורר מפולח** · שקד שלחה צילום מסך: מיכל אפור אחד
            שמחזיק את שלושת הטאבים, הנבחר הוא גלולה לבנה עם צל,
            ולכל אחד תג מספר עגול משלו. קודם היו כאן שלוש גלולות
            נפרדות עם מסגרת. */}
        <View style={s.modes}>
          {BOARD_MODES.map((m) => {
            const n = liveRows.filter((o) => m.id === 'all' || o.ship === m.id).length;
            const on = mode === m.id;
            return (
              <Pressable key={m.id} onPress={() => setMode(m.id)} style={[s.mode, on && s.modeOn]}>
                <Text style={[s.modeText, on && s.modeTextOn]}>{m.name}</Text>
                <View style={[s.modeCount, on && s.modeCountOn]}>
                  <Text style={[s.modeCountText, on && s.modeCountTextOn]}>{n}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        {gone > 0 ? <Text style={s.gone}>{`${BOARD_GONE} ${gone}`}</Text> : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={pad} style={s.stock}>
        {stock.map((it) => {
          /* ⚠ שלושת המצבים של הקנבס · אזל, מתחת לסף, ורגיל */
          const outOf = it.left <= 0;
          const low = it.left <= LOW_STOCK;
          const fg = outOf ? '#B95349' : low ? '#A65E2A' : '#43307A';
          const bg = outOf
            ? 'rgba(185,83,73,0.09)'
            : low
              ? 'rgba(199,125,62,0.1)'
              : 'rgba(255,255,255,0.72)';
          const bd = outOf
            ? 'rgba(185,83,73,0.3)'
            : low
              ? 'rgba(199,125,62,0.32)'
              : 'rgba(255,255,255,0.9)';
          return (
          <View key={it.id} style={[s.stockChip, { backgroundColor: bg, borderColor: bd }]}>
            {/* ⚠ **שלוש שורות · 18 בספטמבר 2026** · בקשה של שקד:
                ״שניצל דק (לרדת שורה) חלה (לרדת שורה) כמות מתוך
                מלאי״ — וכך לארבעתם. ראו `boardPrepLines`. */}
            <Text style={[s.stockName, { color: fg }]} numberOfLines={1}>{it.lines[0]}</Text>
            <Text style={[s.stockForm, { color: fg }]} numberOfLines={1}>{it.lines[1]}</Text>
            <Text style={[s.stockLeft, { color: fg }]}>{`${it.left} מתוך ${it.quota}`}</Text>
          </View>
          );
        })}
      </ScrollView>

      {/**
        * ⚠ **אותה טבלה בשתי התצוגות · 17 בספטמבר 2026** · בקשה של
        * שקד: ״התצוגת טלפון צריכה להראות בדיוק כמו התצוגת אייפד, רק
        * שמה שמוצג שם צריך להיות לרוחב של הטלפון״.
        *
        * קודם תצוגת הטלפון בנתה **כרטיס לכל הזמנה** — מבנה אחר
        * לגמרי. עכשיו זו אותה טבלה בדיוק, מוקטנת כדי להיכנס לרוחב
        * המסך. ⚠ **`transform` אינו משנה פריסה**, ולכן המכל הפנימי
        * מקבל גובה מחולק ביחס ההקטנה — אחרת הטבלה הייתה נגמרת
        * באמצע המסך ומתחתיה שטח ריק.
        */}
      <View style={s.fitBox}>
        <View>
      <ScrollView horizontal>
        {/* ⚠ **הרוחב נגזר מהעמודות בפועל** · קודם הוא הוזמן לפי
            `tableWidth` של הקנבס (1126) בעוד שהעמודות הצטמצמו,
            ונשאר פס ריק של יותר מ-300 פיקסלים בקצה הטבלה. */}
        <View style={{ minWidth: tableW }}>
          <View style={s.cols}>
            <Text style={[s.col, { width: w.time }]}>{HEAD_COLS.time}</Text>
            <Text style={[s.col, { width: w.who }]}>{HEAD_COLS.who}</Text>
            {BOARD_CAT.items.map((it) => (
              <View key={it.id} style={[s.cellBox, { width: w.item }]}>
                {/* ⚠ **שם קצר בשורה אחת · 18 בספטמבר 2026** · בקשה
                    של שקד: ״במקום הכיתובים הקיימים תכתוב שניצל דק,
                    שניצל טמפורה, מארז דק, מארז טמפורה — שזה ייכנס
                    בנראות ולא יהיה …״. ראו `boardColumn`. */}
                <Text style={s.colIn} numberOfLines={2}>
                  {boardColumn(it.id, `${it.t} ${it.sub}`.trim())}
                </Text>
              </View>
            ))}
            <Text style={[s.col, { width: w.sum }]}>{TAIL_COLS.sum}</Text>
            <Text style={[s.col, { width: w.pay }]}>{TAIL_COLS.pay}</Text>
            <Text style={[s.col, { width: w.status }]}>{TAIL_COLS.status}</Text>
          </View>
          <ScrollView style={s.list}>
            {shown.length === 0 ? (
              <Text style={s.empty}>{BOARD_EMPTY}</Text>
            ) : (
              shown.map((x) => {
                const band = BOARD_BAND[x.o.status] ?? BOARD_BAND['חדשה'];
                return (
                  <View key={x.o.id ?? x.i} style={[s.row, { backgroundColor: band.row, borderColor: band.edge }]}>
                    <Text style={[s.cell, { width: w.time, color: band.ink }]}>{x.o.time}</Text>
                    {/* ⚠ **בלי שורת המקור** · שקד ביקשה (15 בספטמבר
                        2026) להוריד את ״וואטסאפ״ מתחת לשם. */}
                    <View style={{ width: w.who }}>
                      <Text style={[s.who, { color: band.ink }]} numberOfLines={1}>{x.o.who}</Text>
                    </View>
                    {/* ⚠ **התא ברוחב העמודה, התיבה בתוכו** · קודם
                        ה-`TextInput` היה הילד הישיר ברוחב
                        `w.item - 12`, כלומר כל עמודה בגוף הטבלה
                        הייתה צרה ב-12 מזו שבכותרת ובשורת הסיכום.
                        ההפרש הצטבר, ולכן ״14 מנות צמחוניות״ לא ישב
                        מתחת לעמודה שלו. */}
                    {BOARD_CAT.items.map((it) => (
                      <View key={it.id} style={[s.cellBox, { width: w.item }]}>
                        <TextInput
                          value={String(x.o.q[it.id] || 0)}
                          keyboardType="number-pad"
                          onChangeText={(v) => setQ(x.i, it.id, v)}
                          style={s.qty}
                        />
                      </View>
                    ))}
                    <Text style={[s.cell, { width: w.sum }]}>{`${nf(sumOf(BOARD_CAT.items, x.o.q))} ₪`}</Text>
                    <Text style={[s.cell, { width: w.pay }]}>{x.o.pay}</Text>
                    {/* ⚠ **שלושה אייקונים ולא כפתורי טקסט** · כך זה בקנבס:
                        `STEPS` נושא את הנתיבים, והפעיל נצבע בגוון השורה. */}
                    <View style={[s.steps, { width: w.status }]}>
                      {BOARD_STEPS.map((st) => {
                        const on = x.o.status === st.id;
                        return (
                          <Pressable
                            key={st.id}
                            onPress={() => setStatus(x.i, st.id)}
                            style={[
                              s.step,
                              { borderColor: on ? band.edge : 'rgba(130,112,162,0.22)' },
                              on ? { backgroundColor: band.edge } : s.stepOff,
                            ]}
                          >
                            <Svg width={17} height={17} viewBox="0 0 24 24">
                              {st.paths.map((d) => (
                                <Path
                                  key={d}
                                  d={d}
                                  fill="none"
                                  stroke={on ? '#FFFFFF' : '#A79FB2'}
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              ))}
                            </Svg>
                          </Pressable>
                        );
                      })}
                      {/* ⚠ **בתוך קופסה כמו השאר** · בקשה של שקד —
                          קודם הוא היה אייקון חשוף בקצה השורה. */}
                      <Pressable
                        onPress={() => { setCancelling(x.i); setCx({ reason: '', note: '' }); }}
                        style={[s.step, s.stepOff, s.cancelBox]}
                        hitSlop={6}
                      >
                        <S k="close" size={13} color="#B95349" />
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
            <View style={s.foot}>
              <Text style={[s.cell, { width: w.time + w.who }]}>{TOTAL_LABEL}</Text>
              {colSums.map((n, i) => (
                <View key={BOARD_CAT.items[i].id} style={[s.cellBox, { width: w.item }]}>
                  <Text style={s.footCell}>{n}</Text>
                </View>
              ))}
              <Text style={[s.cell, { width: w.sum, fontWeight: '700' }]}>{`${nf(grand)} ₪`}</Text>
            </View>
          </ScrollView>
        </View>
      </ScrollView>
        </View>
      </View>

      {cancelling >= 0 && orders[cancelling] ? (
        <CancelSheet
          order={{
            key: 'cous',
            status: orders[cancelling].status,
            who: orders[cancelling].who,
            phone: '',
            time: orders[cancelling].time,
            items: '',
            sum: sumOf(BOARD_CAT.items, orders[cancelling].q),
            ship: orders[cancelling].ship,
            pay: orders[cancelling].pay,
            via: '',
            hrs: orders[cancelling].hrs,
          }}
          cx={cx}
          ready={cx.reason !== ''}
          onSetField={(k, v) => setCx((c) => ({ ...c, [k]: v }))}
          onClose={() => setCancelling(-1)}
          onConfirm={doCancel}
        />
      ) : null}
    </View>
  );

  if (!turn) return body;
  /**
   * ⚠ **העמוד כולו מסתובב, לא רק הטבלה · 18 בספטמבר 2026** · בקשה
   * של שקד: ״גם העמוד כולו צריך להיות באותה התצורה של הטבלה
   * ולהיות מותאם לגודל של מסך של אייפון 16 plus״.
   *
   * ⚠ **התיבה מוזמנת כבר בממדים המוחלפים** · `transform` אינו משנה
   * פריסה, ולכן רוחב התיבה הוא **גובה המסך** וגובהה הוא **רוחבו**;
   * אחרי הסיבוב היא יושבת בדיוק על המסך. המידות מגיעות מהחלון
   * עצמו, ולכן זה נכון לכל אייפון ולא רק ל-16 Plus.
   *
   * ⚠ **האפליקציה נעולה לאורך** · ה-`Info.plist` מתיר באייפון רק
   * `Portrait`, ולכן אי אפשר להישען על סיבוב מערכת. זו בדיוק
   * הסיבה שהסיבוב נעשה כאן.
   *
   * ⚠ **ריפוד בצדדים במקום אזור בטוח** · אחרי הסיבוב המגרעת ופס
   * הבית יושבים על **הצדדים** של התוכן, ולא מעליו ומתחתיו, ולכן
   * הריפוד העליון הרגיל אינו רלוונטי כאן.
   */
  return (
    <View style={s.stage}>
      <View
        style={[
          s.turned,
          {
            width: height,
            height: width,
            left: (width - height) / 2,
            top: (height - width) / 2,
            paddingHorizontal: Math.max(insets.top, insets.bottom, 12),
          },
        ]}
      >
        {body}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: ROOT_PAD, gap: 8, backgroundColor: surface.ground },
  /* ⚠ בעמוד מסובב אין ״למעלה״ בטוח · ראו ההערה ליד `s.turned` */
  rootTurned: { paddingTop: ROOT_TOP },
  stage: { flex: 1, backgroundColor: surface.ground, overflow: 'hidden' },
  turned: { position: 'absolute', transform: [{ rotate: TURN_ANGLE }] },
  /* ⚠ חותך את מה שגולש אחרי ההקטנה · ראו ההערה ליד הטבלה */
  fitBox: { flex: 1, overflow: 'hidden' },
  tools: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  head: { justifyContent: 'center', minHeight: 44 },
  backWrap: { position: 'absolute', right: 0, top: 0, bottom: 0, justifyContent: 'center' },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(130,112,162,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  boxShadow: iconOrbShadow('130,112,162'),
  },
  backGlyph: { fontSize: 23, color: '#6E6478' },
  headText: { alignItems: 'center', gap: 2 },
  title: { fontSize: 23, fontWeight: '600', color: surface.ink, textAlign: 'center' },
  sub: { fontSize: 14, color: surface.faint, textAlign: 'center' },
  /* המיכל האפור · הגלולה הלבנה מרחפת בתוכו */
  modes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    padding: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(130,112,162,0.09)',
  },
  mode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    justifyContent: 'center',
  },
  modeOn: {
    backgroundColor: '#FFFFFF',
    boxShadow: '0 2px 6px -2px rgba(96,80,132,0.35)',
  } as never,
  modeText: { fontSize: 15, fontWeight: '400', color: surface.muted },
  modeTextOn: { fontWeight: '700', color: '#43307A' },
  /* התג העגול · אפור כשכבוי, סגול רך כשדלוק */
  modeCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(130,112,162,0.12)',
  },
  modeCountOn: { backgroundColor: 'rgba(123,92,188,0.14)' },
  modeCountText: { fontSize: 13, fontWeight: '600', color: surface.muted },
  modeCountTextOn: { color: '#43307A' },
  /**
   * ⚠ **רווח מעל · בקשה של שקד (17 בספטמבר 2026)** · ״צריך להוסיף
   * רווח מעל הכיתוב נמחק״. הוא נדחק אל הבורר שמעליו כשהשורה
   * גולשת, כי `flexWrap` אינו מוסיף רווח בין שורות.
   */
  gone: { fontSize: 14.5, fontWeight: '600', color: '#B95349', marginTop: 10 },
  stock: { flexGrow: 0 },
  /* ⚠ שתי שורות · הגובה נגזר מהתוכן ולא קבוע · ראו הכרית למעלה */
  stockChip: {
    marginEnd: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(123,92,188,0.1)',
    justifyContent: 'center',
  },
  stockName: { fontSize: 12.5, fontWeight: '600', color: '#43307A' },
  stockForm: { fontSize: 12, fontWeight: '400', color: '#43307A' },
  stockLeft: { fontSize: 12.5, fontWeight: '600', color: '#43307A' },
  cols: { flexDirection: 'row', paddingVertical: 6, alignItems: 'flex-end' },
  /**
   * ⚠ **ההגדלה הגלובלית מנוטרלת כאן · 17 בספטמבר 2026** · בקשה של
   * שקד: ״תקטין את הכותרות בטבלה כדי שיכנסו ב-2 שורות בלבד״. רוחב
   * העמודה קבוע (44–50 נקודות), ולכן כל נקודה נוספת בגופן מוסיפה
   * שורה. ראו `FONT_BUMP`.
   */
  col: { fontSize: 11.5 - FONT_BUMP, fontWeight: '600', color: '#8A8194', textAlign: 'center' },
  colIn: {
    width: '100%',
    fontSize: 11.5 - FONT_BUMP,
    fontWeight: '600',
    color: '#8A8194',
    textAlign: 'center',
  },
  itemCol: { width: 68, textAlign: 'center' },
  list: { maxHeight: 560 },
  empty: { fontSize: 17, color: '#A79FB2', textAlign: 'center', padding: 70 },
  /* ⚠ ריפוד הדוק יותר · חלק מהצמצום שביקשה שקד */
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 11, borderWidth: 1, paddingVertical: 4, marginBottom: 3 },
  cell: { fontSize: 14, textAlign: 'center', color: surface.ink },
  who: { fontSize: 15, fontWeight: '600' },
  note: { fontSize: 11.5, color: surface.faint },
  /* ⚠ תיבה לבנה עם מסגרת אפורה דקה · והתא סביבה נותן את הרווח
     הקטן, כך שהתיבות לא נדבקות זו לזו. בקשה של שקד. */
  cellBox: { paddingHorizontal: 3 },
  qty: {
    width: '100%',
    height: 30,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: surface.ink,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(130,112,162,0.2)',
  },
  steps: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 5, justifyContent: 'center', flexShrink: 0 },
  /* ⚠ ריבוע אייקון · בקנבס 34×30 עם מסגרת, והפעיל נצבע מלא */
  /**
   * ⚠ **ארבע קופסאות זהות** · שלושת הסטטוסים וכפתור הביטול, כולם
   * 30×30. קודם ה-X היה אייקון חשוף והשורה נחתכה בקצה.
   * הרוחב הדרוש: 4×30 + 3×5 + 10 = 145, והעמודה 146.
   */
  step: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepOff: { backgroundColor: 'rgba(255,255,255,0.72)' },
  cancelBox: { borderColor: 'rgba(185,83,73,0.32)' },

  /* מתג התצוגה · אינו בקנבס, בקשה של שקד */
  views: { flexDirection: 'row', gap: 4 },
  viewBtn: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(130,112,162,0.22)',
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewOn: { backgroundColor: '#C6B3EC', borderColor: '#C6B3EC' },

  /* ── כרטיס הזמנה · תצוגת טלפון זקוף ── */
  cardPad: { gap: 9, paddingBottom: 120 },
  oCard: { borderRadius: 16, borderWidth: 1.5, padding: 11, gap: 9 },
  oTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  oTime: { fontSize: 15, fontWeight: '600', width: 46 },
  oWho: { flex: 1, minWidth: 0 },
  oSum: { fontSize: 16, fontWeight: '700' },
  oItems: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  oChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingStart: 9,
    paddingEnd: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  oChipName: { fontSize: 13, fontWeight: '500', color: surface.inkSoft },
  oChipQty: {
    width: 34,
    height: 24,
    borderRadius: 999,
    textAlign: 'center',
    fontSize: 14.5,
    fontWeight: '600',
    color: surface.ink,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  oNone: { fontSize: 13, fontWeight: '300', color: surface.faint },
  oFoot: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  oPay: { flex: 1, fontSize: 13, fontWeight: '300', color: surface.muted },
  oSteps: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  oTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(130,112,162,0.16)',
  },
  oTotalK: { flex: 1, fontSize: 15, fontWeight: '600', color: surface.inkSoft },
  oTotalV: { fontSize: 17, fontWeight: '700', color: surface.ink },
  viewText: { fontSize: 12.5, fontWeight: '600', color: '#6E6478' },
  viewTextOn: { color: '#43307A' },
  x: { fontSize: 18.5, color: '#B95349', paddingHorizontal: 4 },
  foot: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(130,112,162,0.16)' },
  /* שורת הסיכום · אותו רוחב תא בדיוק, כדי שהמספר יישב מתחת לעמודה */
  footCell: { width: '100%', textAlign: 'center', fontSize: 15, fontWeight: '700', color: surface.ink },
});
