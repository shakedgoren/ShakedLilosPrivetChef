/**
 * לוח מכירה · הנתונים חולצו אוטומטית מ-AdminBoard.dc.html בקנבס.
 * לעדכון: node scripts/extract-admin-board.mjs && node scripts/emit-admin-board.mjs
 *
 * ⚠ הארטבורד היחיד שאינו במידות טלפון · 1180×820, לאייפד.
 * הטבלה נשמרת ברוחב המקורי ונגללת לרוחב במסך צר.
 */

export type BoardItem = { id: string; t: string; sub: string; price: number; quota?: number };
export type BoardCat = { name: string; hue: string; deep: string; items: BoardItem[] };
/** כל קטגוריה מגדירה את העמודות שלה · להוסיף קטגוריה = להוסיף רשומה כאן */
export const CATS: Record<string, BoardCat> = {
  "cous": {
    "name": "שלישי של קוסקוס",
    "hue": "#7B5CBC",
    "deep": "#43307A",
    "items": [
      {
        "id": "veg",
        "t": "מנה",
        "sub": "צמחונית",
        "price": 45,
        "quota": 40
      },
      {
        "id": "chick",
        "t": "מנה",
        "sub": "עוף",
        "price": 55,
        "quota": 30
      },
      {
        "id": "mafr",
        "t": "מנה",
        "sub": "מפרום",
        "price": 65,
        "quota": 30
      },
      {
        "id": "aVeg",
        "t": "תוספת",
        "sub": "ירקות",
        "price": 10
      },
      {
        "id": "aChick",
        "t": "תוספת",
        "sub": "עוף",
        "price": 15
      },
      {
        "id": "aMafr",
        "t": "תוספת",
        "sub": "מפרום",
        "price": 20
      }
    ]
  }
};

/** מסלול המצבים · הצבע של השורה כולה נגזר ממנו */
export const FLOW: string[] = [
  "חדשה",
  "מוכנה",
  "נמסרה"
];
/** בלוח מסמנים ישירות באחד משלושת האייקונים, אין כפתורי טקסט */
export type Step = { id: string; label: string; paths: string[] };
export const STEPS: Step[] = [
  {
    "id": "חדשה",
    "label": "התקבלה",
    "paths": [
      "M3 13h5l1.8 2.6h4.4L16 13h5",
      "M5.4 13L7.6 5h8.8l2.2 8v6H5.4z"
    ]
  },
  {
    "id": "מוכנה",
    "label": "מוכנה",
    "paths": [
      "M12 3.2a8.8 8.8 0 1 0 0 17.6a8.8 8.8 0 1 0 0-17.6",
      "M8.1 12.3l2.6 2.6 5.2-5.4"
    ]
  },
  {
    "id": "נמסרה",
    "label": "נמסרה",
    "paths": [
      "M2.5 13.2l3.8 3.8 7.2-8.4",
      "M11.4 15.4l2 2 8.1-9.4"
    ]
  }
];

export type Band = { row: string; edge: string; ink: string; muted: string };
export const BAND: Record<string, Band> = {
  "חדשה": {
    "row": "rgba(199,125,62,0.13)",
    "edge": "#C77D3E",
    "ink": "#7A4A18",
    "muted": "#9A6B3C"
  },
  "מוכנה": {
    "row": "rgba(78,138,100,0.13)",
    "edge": "#4E8A64",
    "ink": "#2F5C42",
    "muted": "#5C8A6E"
  },
  "נמסרה": {
    "row": "rgba(130,112,162,0.08)",
    "edge": "#B3ABBD",
    "ink": "#8A8194",
    "muted": "#A79FB2"
  }
};

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
export const SEED: BoardOrder[] = [
  {
    "hrs": 1.5,
    "who": "דנה כהן",
    "time": "11:40",
    "ship": "pickup",
    "pay": "ביט",
    "status": "מוכנה",
    "note": "",
    "q": {
      "veg": 2,
      "chick": 0,
      "mafr": 1,
      "aVeg": 1,
      "aChick": 0,
      "aMafr": 0
    }
  },
  {
    "hrs": 2,
    "who": "מיכל אברהם",
    "time": "12:00",
    "ship": "pickup",
    "pay": "ביט",
    "status": "חדשה",
    "note": "וואטסאפ",
    "q": {
      "veg": 0,
      "chick": 2,
      "mafr": 2,
      "aVeg": 1,
      "aChick": 0,
      "aMafr": 0
    }
  },
  {
    "hrs": 2.5,
    "who": "יעל לוי",
    "time": "12:20",
    "ship": "pickup",
    "pay": "אפל פיי",
    "status": "חדשה",
    "note": "",
    "q": {
      "veg": 3,
      "chick": 0,
      "mafr": 0,
      "aVeg": 0,
      "aChick": 0,
      "aMafr": 0
    }
  },
  {
    "hrs": 3,
    "who": "אורית ברק",
    "time": "12:40",
    "ship": "pickup",
    "pay": "מזומן",
    "status": "נמסרה",
    "note": "",
    "q": {
      "veg": 1,
      "chick": 1,
      "mafr": 0,
      "aVeg": 0,
      "aChick": 1,
      "aMafr": 0
    }
  },
  {
    "hrs": 3.5,
    "who": "שירה מזרחי",
    "time": "13:10",
    "ship": "pickup",
    "pay": "ביט",
    "status": "חדשה",
    "note": "",
    "q": {
      "veg": 0,
      "chick": 4,
      "mafr": 0,
      "aVeg": 2,
      "aChick": 0,
      "aMafr": 1
    }
  },
  {
    "hrs": 2,
    "who": "רונית שגב",
    "time": "12:00",
    "ship": "deliv",
    "pay": "מזומן",
    "status": "חדשה",
    "note": "ויצמן 8, רחובות",
    "q": {
      "veg": 2,
      "chick": 2,
      "mafr": 0,
      "aVeg": 0,
      "aChick": 0,
      "aMafr": 0
    }
  },
  {
    "hrs": 2.5,
    "who": "נועה פרץ",
    "time": "12:20",
    "ship": "deliv",
    "pay": "פייבוקס",
    "status": "מוכנה",
    "note": "הרצל 14, יבנה",
    "q": {
      "veg": 0,
      "chick": 0,
      "mafr": 4,
      "aVeg": 1,
      "aChick": 0,
      "aMafr": 2
    }
  },
  {
    "hrs": 3,
    "who": "טל אבידן",
    "time": "13:00",
    "ship": "deliv",
    "pay": "ביט",
    "status": "חדשה",
    "note": "בילו 3, גדרה",
    "q": {
      "veg": 4,
      "chick": 0,
      "mafr": 0,
      "aVeg": 0,
      "aChick": 2,
      "aMafr": 0
    }
  },
  {
    "hrs": 4,
    "who": "ליאת דוד",
    "time": "13:40",
    "ship": "deliv",
    "pay": "ביט",
    "status": "נמסרה",
    "note": "הבנים 2, נס ציונה",
    "q": {
      "veg": 1,
      "chick": 1,
      "mafr": 1,
      "aVeg": 1,
      "aChick": 1,
      "aMafr": 1
    }
  }
];

/** ביטול · אותם כללים בדיוק כמו במסך ההזמנות */
export const LATE_HOURS = 12;
export const LATE_FEE = 0.3;
export const REASONS: string[] = [
  "הלקוחה ביטלה",
  "אני ביטלתי",
  "לא הגיעה לאיסוף",
  "אחר"
];

export const MODES: { id: 'all' | 'pickup' | 'deliv'; name: string }[] = [
  {
    "id": "all",
    "name": "הכל"
  },
  {
    "id": "pickup",
    "name": "איסוף"
  },
  {
    "id": "deliv",
    "name": "משלוחים"
  }
];
export const START_MODE = "pickup";

/** מתחת לכמה מנות המונה נצבע */
export const LOW_STOCK = 5;

/* ── רוחבי העמודות · מהקנבס, לא נמדדו בעין ── */
export const COL_W = {
  "time": 92,
  "who": 220,
  "item": 68,
  "sum": 96,
  "pay": 104,
  "status": 206
};
export const HEAD_COLS = {
  "time": "שעת איסוף",
  "who": "שם מלא"
};
export const TAIL_COLS = {
  "sum": "סה״כ",
  "pay": "תשלום",
  "status": "סטטוס"
};
/** רוחב הטבלה המלא · סכום כל העמודות */
export const tableWidth = (itemCount: number) =>
  COL_W.time + COL_W.who + COL_W.item * itemCount + COL_W.sum + COL_W.pay + COL_W.status;

export const BOARD_W = 1180;
export const BOARD_H = 820;

/* ── כותרות ── */
export const BOARD_SUB = "שלישי · 25 באוגוסט · ניהול בזמן אמת";
export const EMPTY_LABEL = "אין הזמנות בטאב הזה";
export const TOTAL_LABEL = "סה״כ בטאב";
export const GONE_PREFIX = "בוטלו";
export const CANCEL = {
  title: "ביטול הזמנה",
  reasonLabel: "סיבת הביטול",
  noteLabel: "הערה · לא חובה",
  notePlaceholder: "מה קרה",
  keep: "להשאיר",
  cta: "ביטול ההזמנה",
} as const;

/** דקות מתוך ״HH:MM״ · למיון לפי שעת האיסוף */
export const toMin = (t: string) => {
  const p = String(t).split(':');
  return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
};
