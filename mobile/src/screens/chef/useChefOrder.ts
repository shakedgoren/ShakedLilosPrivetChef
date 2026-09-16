import { useCallback, useMemo, useState } from 'react';
import {
  CHEF_PACKAGES,
  STYLES,
  STYLES_ALL,
  priceOfPackage,
  taboonPerHead,
  type ChefPackage,
  type ChefSection,
} from '../../data/chef';
import type { OrderLine } from '../../order/types';
import type { PastaPick } from './PastaPopup';
import { dayPartOpen } from '../../data/calendar';
import { isPhone } from '../../lib/phone';

export type Picks = Record<string, any>;

/** סעיף שתלוי בבחירה קודמת · לא מוצג ולא נדרש עד שהיא נעשית */
const isDormant = (s: ChefSection, picks: Picks) => !!s.when && picks[s.when.id] !== s.when.is;

/** בחירה יחידה */
const SINGLE = ['grid', 'tiers', 'pair'];
/** בחירה מרובה */
const MULTI = ['multi', 'multicap', 'sauces', 'cards'];

/**
 * ⚠ **״חסר משהו״ מחייב פירוט** · שקד ביקשה (16 בספטמבר 2026): ״אם
 * סימנו את ׳חסר משהו׳ שלא יתנו ללקוח להמשיך הלאה — שהוא יהיה חייב
 * לכתוב מה חסר, ושהכרטיסייה תסומן במסגרת אדומה״.
 *
 * ⚠ **הכלל יושב כאן ולא ב-`chef.ts`** · אותו קובץ נוצר אוטומטית
 * מהקנבס ואין לערוך אותו ביד. לכן התלות מוגדרת בקוד, במקום אחד.
 */
const DETAIL = { pick: 'kitchen', value: 'חסר משהו', field: 'kitchenTxt' } as const;

/** האם השדה הזה חייב להתמלא כרגע · משמש גם את המסגרת האדומה */
export const detailRequired = (picks: Picks, id?: string): boolean =>
  id === DETAIL.field && picks[DETAIL.pick] === DETAIL.value;

/** מולא? */
export const detailFilled = (picks: Picks, id?: string): boolean =>
  !!String(picks[id ?? ''] ?? '').trim();

const sectionReady = (s: ChefSection, picks: Picks): boolean => {
  /* ⚠ לפני `s.req` · השדה הזה אינו מסומן כחובה בקנבס, והחובה שלו
     נולדת רק מהבחירה ״חסר משהו״ */
  if (s.kind === 'text' && detailRequired(picks, s.id)) return detailFilled(picks, s.id);
  if (!s.req || isDormant(s, picks)) return true;
  const v = picks[s.id];
  if (SINGLE.includes(s.kind)) return !!v;
  if (MULTI.includes(s.kind)) {
    const n = Array.isArray(v) ? v.length : 0;
    /* ⚠ `>=` ולא `===` · מאז שהמכסה לא נועלת אפשר לבחור מעבר לה,
       ובחירה רביעית מתוך שלוש נעלה את ״המשך״. כך גם בקנבס. */
    if (s.cap != null && n < s.cap) return false;
    if (s.kind === 'sauces') {
      /* כל פסטה חייבת צורה או שדרוג · נבחרים בחלונית */
      return n > 0 && (v as { shape?: string; up?: string }[]).every((x) => !!(x.shape || x.up));
    }
    return n > 0;
  }
  if (s.kind === 'stepper') return typeof v === 'number' && v > 0;
  if (s.kind === 'cal' || s.kind === 'addr') return !!v;
  if (s.kind === 'pairtext') {
    /**
     * ⚠ **טלפון לא תקין נועל את הבקשה** · שקד ביקשה (16 בספטמבר
     * 2026): ״אין בדיקה בהשארת פרטים אם הזנתי טלפון לא תקין — אם
     * המספר לא תקין אי אפשר לשלוח בקשה להזמנה״. קודם הספיק ששדה
     * הטלפון אינו ריק.
     */
    return (s.ids as string[]).every((id) => {
      const v = String(picks[id] ?? '').trim();
      if (!v) return false;
      return id === 'phone' ? isPhone(v) : true;
    });
  }
  return true;
};

/** ערכי הפתיחה של חבילה · כמו בקנבס, כדי שהמחיר יתאים למה שמוצג */
const seedPicks = (pkg: ChefPackage): Picks => {
  const out: Picks = {};
  pkg.pages.flat().forEach((x) => {
    if (x.kind === 'stepper') out[x.id] = x.min;
    else if (['multi', 'multicap', 'sauces'].includes(x.kind)) out[x.id] = [];
    else if (x.kind === 'cards' && x.multi) out[x.id] = [];
    else if (['text', 'cal', 'addr'].includes(x.kind)) out[x.id] = '';
  });
  return out;
};

export function useChefOrder() {
  /* null = בחירת החבילה · אחרת האינדקס של החבילה שנפתחה */
  const [current, setCurrent] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [picks, setPicks] = useState<Picks>({});
  /**
   * ⚠ החלונית של הכמות המקסימלית · שקד ביקשה **לא לנעול** את שאר
   * האפשרויות כשהמכסה מלאה, אלא להסביר שכל בחירה נוספת היא שדרוג.
   * `seen` דואג שהיא תופיע פעם אחת לכל סעיף, בדיוק כמו בקנבס.
   */
  const [notice, setNotice] = useState<string | null>(null);
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  /**
   * חלונית הפסטה · נפתחת מיד אחרי בחירת רוטב, כמו `pickSauce` בקנבס.
   * `sec` נשמר כדי שהאישור יידע לאיזה סעיף להחזיר את הבחירה.
   */
  const [pasta, setPasta] = useState<(PastaPick & { sec: string; cap?: number | null; note?: string }) | null>(null);

  const pkg: ChefPackage | null = current === null ? null : CHEF_PACKAGES[current];
  const sections: ChefSection[] = pkg ? (pkg.pages[page] ?? []) : [];

  const openPackage = useCallback((i: number) => {
    setCurrent(i);
    setPage(0);
    setPicks(seedPicks(CHEF_PACKAGES[i]));
    setSeen({});
    setNotice(null);
    setPasta(null);
  }, []);

  /**
   * ⚠ ״להזמין שוב״ · פותח את אותה חבילה עם אותן תשובות.
   * ⚠ התאריך **אינו** נטען · אירוע קודם כבר עבר, והלקוחה חייבת
   * לבחור מועד חדש. אותו דבר לגבי חלק היום שתלוי בו.
   */
  const loadDetails = useCallback((d: Record<string, unknown>) => {
    const i = CHEF_PACKAGES.findIndex((p) => p.key === d.key);
    if (i < 0) return;
    const picks = d.picks && typeof d.picks === 'object' ? { ...(d.picks as Picks) } : {};
    delete picks.date;
    delete picks.daypart;
    setCurrent(i);
    setPage(0);
    setPicks(picks);
    setSeen({});
    setNotice(null);
    setPasta(null);
  }, []);

  const backToList = useCallback(() => {
    setCurrent(null);
    setPage(0);
    setPicks({});
    setSeen({});
    setNotice(null);
    setPasta(null);
  }, []);

  /** הסגנונות שנפתחים תלויים בציר · בשרי פותח את כולם */
  const stylesFor = useCallback(
    (concept: string) => (concept === 'בשרי' ? STYLES : STYLES_ALL),
    [],
  );

  const select = useCallback(
    (id: string, value: string) => {
      setPicks((p) => {
        const next = { ...p, [id]: value };
        /* החלפת ציר מאפסת סגנון שכבר אינו זמין */
        if (id === 'concept' && next.style && !stylesFor(value).includes(next.style)) {
          delete next.style;
        }
        return next;
      });
    },
    [stylesFor],
  );

  /**
   * `toggleCap` של הקנבס · לחיצה תמיד מסמנת או מבטלת, גם מעבר למכסה.
   * ⚠ הגרסה הקודמת החזירה את המצב כמו שהוא כשהמכסה התמלאה, ולכן שאר
   * האפשרויות היו נעולות. שקד ביקשה במפורש שלא יינעלו.
   */
  const toggle = useCallback(
    (id: string, value: string, cap?: number | null, note?: string) => {
      setPicks((p) => {
        const cur: string[] = Array.isArray(p[id]) ? p[id] : [];
        const on = cur.includes(value);
        const list = on ? cur.filter((x) => x !== value) : [...cur, value];
        /* בדיוק `capReached` בקנבס · רק ברגע שנוגעים במכסה, ופעם אחת */
        if (!on && cap != null && list.length === cap && !seen[id]) {
          setSeen((v) => ({ ...v, [id]: true }));
          setNotice(note ?? null);
        }
        return { ...p, [id]: list };
      });
    },
    [seen],
  );

  /**
   * בחירת רוטב · אם הוא כבר ברשימה הלחיצה מסירה אותו, ואחרת
   * נפתחת חלונית הצורה/שדרוג. בדיוק `pickSauce` בקנבס.
   */
  const pickSauce = useCallback(
    (sec: ChefSection, sauce: string) => {
      const cur: PastaPick[] = picks[sec.id] || [];
      const mine = cur.find((x) => x.sauce === sauce);
      if (mine) {
        /* לחיצה על רוטב שכבר נבחר · פותחת אותו לעריכה */
        setPasta({ ...mine, edit: true, sec: sec.id, cap: sec.cap, note: sec.note });
        return;
      }
      setPasta({ sauce, shape: null, up: null, sec: sec.id, cap: sec.cap, note: sec.note });
    },
    [picks],
  );

  /** ⚠ או צורה או שדרוג · בחירה באחד מנקה את השני, ולחיצה חוזרת מבטלת */
  /* ⚠ `pastaPick` ו-`pastaCommit` הוסרו ב-16 בספטמבר 2026 · אחרי
     שהבחירה עצמה הפכה לאישור (`pastaChoose`), לא נשאר להם צרכן. */

  /**
   * ⚠ **הבחירה היא האישור · 16 בספטמבר 2026** · שקד ביקשה ״לא צריך
   * להיות שם כפתור אישור, כי האישור כביכול זה הבחירה בסוג פסטה או
   * בשדרוג״. לחיצה על צורה או על שדרוג שומרת וסוגרת מיד.
   *
   * ⚠ **או צורה או שדרוג, לא שניהם** · כמו בקנבס. השדה השני נשאר null.
   */
  const pastaChoose = useCallback(
    (field: 'shape' | 'up', value: string) => {
      if (!pasta) return;
      const entry: PastaPick = {
        sauce: pasta.sauce,
        shape: field === 'shape' ? value : null,
        up: field === 'up' ? value : null,
      };
      setPicks((p) => {
        const cur: PastaPick[] = p[pasta.sec] || [];
        const list = pasta.edit
          ? cur.map((x) => (x.sauce === pasta.sauce ? entry : x))
          : [...cur, entry];
        /* אותה חלונית מכסה כמו בסלטים · פעם אחת לכל סעיף */
        if (!pasta.edit && pasta.cap != null && list.length === pasta.cap && !seen[pasta.sec]) {
          setSeen((v) => ({ ...v, [pasta.sec]: true }));
          setNotice(pasta.note ?? null);
        }
        return { ...p, [pasta.sec]: list };
      });
      setPasta(null);
    },
    [pasta, seen],
  );


  const setValue = useCallback((id: string, value: unknown) => {
    setPicks((p) => {
      const next = { ...p, [id]: value };
      /* ⚠ שינוי תאריך מאפס חלק יום שנחסם · בלי זה אפשר היה להישאר
         עם ״ערב״ מסומן אחרי מעבר לשישי, והוא אפור אבל עדיין נבחר */
      if (id === 'date' && next.daypart && !dayPartOpen(String(value), next.daypart)) {
        delete next.daypart;
      }
      return next;
    });
  }, []);

  const pageReady = useMemo(
    () => sections.every((s) => sectionReady(s, picks)),
    [sections, picks],
  );

  const lastPage = pkg ? page >= pkg.pages.length - 1 : false;

  const next = useCallback(() => {
    if (!pkg || !pageReady) return;
    setPage((n) => Math.min(pkg.pages.length - 1, n + 1));
  }, [pkg, pageReady]);

  const prev = useCallback(() => {
    if (page === 0) backToList();
    else setPage((n) => n - 1);
  }, [page, backToList]);

  const total = pkg ? priceOfPackage(pkg, picks) : 0;
  /** המחיר לסועד לפי מדרגות הסועדים · מזין את סעיף ה-`price` החי */
  const perHead = taboonPerHead(picks.guests || 0);

  const lines: OrderLine[] = useMemo(() => {
    if (!pkg) return [];
    const out: OrderLine[] = [{ qty: picks.guests || 1, name: pkg.name, sum: total }];
    const add = (label: string, v: unknown) => {
      if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) return;
      const text = Array.isArray(v)
        ? v.map((x) => (typeof x === 'string' ? x : x?.n ?? '')).filter(Boolean).join(' · ')
        : String(v);
      if (text) out.push({ qty: 1, name: `${label} · ${text}`, sum: 0 });
    };
    add('ציר', picks.concept);
    add('סגנון', picks.style);
    add('מסלול', picks.tier);
    add('סועדים', picks.guests);
    add('אירוע', picks.occasion);
    add('תוספות', picks.extras ?? picks.textras);
    return out;
  }, [pkg, picks, total]);

  return {
    packages: CHEF_PACKAGES,
    current, pkg, page, sections, openPackage, backToList, loadDetails,
    picks, select, toggle, setValue, stylesFor,
    pageReady, lastPage, next, prev,
    total, lines, perHead,
    notice, closeNotice: () => setNotice(null),
    pasta, pickSauce, pastaChoose, closePasta: () => setPasta(null),
  };
}
