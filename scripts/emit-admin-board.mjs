import fs from 'fs';

const d = JSON.parse(fs.readFileSync(process.env.SP + '/admin-board.json', 'utf8'));
const j = (v) => JSON.stringify(v, null, 2);

const ts = `/**
 * לוח מכירה · הנתונים חולצו אוטומטית מ-AdminBoard.dc.html בקנבס.
 * לעדכון: node scripts/extract-admin-board.mjs && node scripts/emit-admin-board.mjs
 *
 * ⚠ הארטבורד היחיד שאינו במידות טלפון · ${d.BOARD_W}×${d.BOARD_H}, לאייפד.
 * הטבלה נשמרת ברוחב המקורי ונגללת לרוחב במסך צר.
 */

export type BoardItem = { id: string; t: string; sub: string; price: number; quota?: number };
export type BoardCat = { name: string; hue: string; deep: string; items: BoardItem[] };
/** כל קטגוריה מגדירה את העמודות שלה · להוסיף קטגוריה = להוסיף רשומה כאן */
export const CATS: Record<string, BoardCat> = ${j(d.CATS)};

/** מסלול המצבים · הצבע של השורה כולה נגזר ממנו */
export const FLOW: string[] = ${j(d.FLOW)};
/** בלוח מסמנים ישירות באחד משלושת האייקונים, אין כפתורי טקסט */
export type Step = { id: string; label: string; paths: string[] };
export const STEPS: Step[] = ${j(d.STEPS)};

export type Band = { row: string; edge: string; ink: string; muted: string };
export const BAND: Record<string, Band> = ${j(d.BAND)};

export type BoardOrder = {
  /** שעות שנותרו עד האיסוף · קובע אם הביטול מאוחר */
  hrs: number;
  who: string;
  time: string;
  ship: 'pickup' | 'deliv';
  pay: string;
  status: string;
  note: string;
  q: Record<string, number>;
};
/** ⚠ הזמנות הדגמה · נכתבו על ידי Claude בקנבס */
export const SEED: BoardOrder[] = ${j(d.SEED)};

/** ביטול · אותם כללים בדיוק כמו במסך ההזמנות */
export const LATE_HOURS = ${d.LATE_HOURS};
export const LATE_FEE = ${d.LATE_FEE};
export const REASONS: string[] = ${j(d.REASONS)};

export const MODES: { id: 'all' | 'pickup' | 'deliv'; name: string }[] = ${j(d.MODES)};
export const START_MODE = ${j(d.startMode)};

/** מתחת לכמה מנות המונה נצבע */
export const LOW_STOCK = ${d.LOW_STOCK};

/* ── רוחבי העמודות · מהקנבס, לא נמדדו בעין ── */
export const COL_W = ${j(d.COL_W)};
export const HEAD_COLS = ${j(d.HEAD_COLS)};
export const TAIL_COLS = ${j(d.TAIL_COLS)};
/** רוחב הטבלה המלא · סכום כל העמודות */
export const tableWidth = (itemCount: number) =>
  COL_W.time + COL_W.who + COL_W.item * itemCount + COL_W.sum + COL_W.pay + COL_W.status;

export const BOARD_W = ${d.BOARD_W};
export const BOARD_H = ${d.BOARD_H};

/* ── כותרות ── */
export const BOARD_SUB = ${j(d.sub)};
export const EMPTY_LABEL = ${j(d.emptyLabel)};
export const TOTAL_LABEL = ${j(d.totalLabel)};
export const GONE_PREFIX = ${j(d.gonePrefix)};
export const CANCEL = {
  title: ${j(d.cancelTitle)},
  reasonLabel: ${j(d.reasonLabel)},
  noteLabel: ${j(d.noteLabel)},
  notePlaceholder: ${j(d.notePh)},
  keep: ${j(d.keepLabel)},
  cta: ${j(d.cancelCta)},
} as const;

/** דקות מתוך ״HH:MM״ · למיון לפי שעת האיסוף */
export const toMin = (t: string) => {
  const p = String(t).split(':');
  return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
};
`;

const OUT = '/Users/shakedgoren/Downloads/files/mobile/src/data/adminBoard.ts';
fs.writeFileSync(OUT, ts);
console.log('נכתב', OUT, '·', ts.split('\n').length, 'שורות');
