/**
 * ימי מכירה · הנתונים חולצו אוטומטית מ-AdminDays.dc.html בקנבס.
 * לעדכון: node scripts/extract-admin-days.mjs && node scripts/emit-admin-days.mjs
 * ברירת ימי המכירה (שלישי=קוסקוס, שישי=שניצל) חיה ב-saleWeek.ts — לא בחילוץ.
 */
import { eachIsoDate, weekdaySale } from './saleWeek';

export const MONTHS: string[] = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר"
];
/** ראשי התיבות של ימות השבוע · לכותרת רשת הלוח */
export const DOWS: string[] = [
  "א",
  "ב",
  "ג",
  "ד",
  "ה",
  "ו",
  "ש"
];
export const DAY_NAMES: string[] = [
  "ראשון",
  "שני",
  "שלישי",
  "רביעי",
  "חמישי",
  "שישי",
  "שבת"
];

export type DayCatKey = 'cous' | 'schn' | 'box' | 'fruit' | 'chef';

export type Dish = { id: string; n: string; q: number };
export type DayCat = {
  n: string;
  short: string;
  hue: string;
  deep: string;
  rgb: string;
  dishes: Dish[];
};

/** חמש הקטגוריות · אותם גוונים של כל האפליקציה */
export const CATS: Record<DayCatKey, DayCat> = {
  "cous": {
    "n": "שלישי של קוסקוס",
    "short": "קוסקוס",
    "hue": "#7B5CBC",
    "deep": "#43307A",
    "rgb": "123,92,188",
    "dishes": [
      {
        "id": "veg",
        "n": "קוסקוס צמחוני",
        "q": 40
      },
      {
        "id": "chick",
        "n": "קוסקוס עם עוף",
        "q": 30
      },
      {
        "id": "mafr",
        "n": "קוסקוס עם מפרום",
        "q": 30
      },
      {
        "id": "aVeg",
        "n": "תוספת ירקות",
        "q": 20
      },
      {
        "id": "aChick",
        "n": "תוספת עוף",
        "q": 15
      },
      {
        "id": "aMafr",
        "n": "תוספת מפרום",
        "q": 15
      }
    ]
  },
  "schn": {
    "n": "שישי של מטעמים",
    "short": "שישניצל",
    "hue": "#416D9E",
    "deep": "#2B4A6E",
    "rgb": "65,109,158",
    "dishes": [
      {
        "id": "thin",
        "n": "שניצל דק בציפוי פירורי לחם",
        "q": 30
      },
      {
        "id": "temp",
        "n": "פילה עוף בציפוי טמפורה",
        "q": 20
      },
      {
        "id": "boxThin",
        "n": "מארז שניצל דק",
        "q": 10
      },
      {
        "id": "boxTemp",
        "n": "מארז פילה עוף טמפורה",
        "q": 8
      }
    ]
  },
  "box": {
    "n": "מארזי ספיישל",
    "short": "ספיישל",
    "hue": "#437C59",
    "deep": "#2C5A3E",
    "rgb": "67,124,89",
    "dishes": []
  },
  "fruit": {
    "n": "מגשי פירות",
    "short": "פירות",
    "hue": "#B04A76",
    "deep": "#7A2E4E",
    "rgb": "176,74,118",
    "dishes": []
  },
  "chef": {
    "n": "שף וטאבון",
    "short": "שף",
    "hue": "#A85A28",
    "deep": "#7A3D18",
    "rgb": "168,90,40",
    "dishes": []
  }
};
export const CAT_KEYS: DayCatKey[] = [
  "cous",
  "schn",
  "box",
  "fruit",
  "chef"
];
/** רק שתי אלה נקבעות כיום מכירה · השאר זמינות רק כחריגה */
export const SALE_KEYS: DayCatKey[] = [
  "cous",
  "schn"
];

export function freshQuota(cat: DayCatKey): Record<string, number> {
  return Object.fromEntries(CATS[cat].dishes.map((d) => [d.id, d.q]));
}

/** יום שלישי/שישי בלי שורה שמורה — נפתח כיום מכירה סגור, עם מכסות ברירת המנה. */
export function impliedWeekdayRecord(iso: string): DayRecord | null {
  const sale = weekdaySale(iso);
  if (!sale) return null;
  return { sale, open: false, q: freshQuota(sale) };
}

/** שורה קיימת במסד/זרע גוברת. חסרים רק ממולאים לפי יום בשבוע. */
export function mergeWeekdayDays(
  stored: Record<string, DayRecord>,
  from: string,
  to: string,
): Record<string, DayRecord> {
  const out = { ...stored };
  for (const d of eachIsoDate(from, to)) {
    if (d in out) continue;
    const implied = impliedWeekdayRecord(d);
    if (implied) out[d] = implied;
  }
  return out;
}

export type DayRecord = {
  /** הקטגוריה של יום המכירה */
  sale?: DayCatKey | null;
  /** נפתח להזמנות ללקוחות */
  open?: boolean;
  /** היום חסום לכל הקטגוריות */
  blocked?: boolean;
  /** קטגוריה אחת שנפתחה בכל זאת ביום חסום */
  except?: DayCatKey | null;
  /** מכסה לכל מנה */
  q?: Record<string, number>;
  /** מה כבר נמכר · לקריאה בלבד, מגיע מההזמנות */
  sold?: Record<string, number>;
};

/**
 * מצב פתיחה לספטמבר 2026.
 * שלישי = קוסקוס, שישי = שניצל · ימי אמצע/סוף השבוע החסומים נשארו מהשאלון הישן.
 * שלישי ושישי בטווח הזה הם ימי מכירה (סגורים עד שפותחים), לא חסומים.
 */
export const SEED: Record<string, DayRecord> = {
  "2026-09-01": {
    "sale": "cous",
    "open": true,
    "q": {
      "veg": 40,
      "chick": 30,
      "mafr": 30,
      "aVeg": 20,
      "aChick": 15,
      "aMafr": 15
    },
    "sold": {
      "veg": 28,
      "chick": 30,
      "mafr": 22,
      "aVeg": 9,
      "aChick": 11,
      "aMafr": 6
    }
  },
  "2026-09-04": {
    "sale": "schn",
    "open": true,
    "q": {
      "thin": 30,
      "temp": 20,
      "boxThin": 10,
      "boxTemp": 8
    },
    "sold": {
      "thin": 26,
      "temp": 15,
      "boxThin": 7,
      "boxTemp": 3
    }
  },
  "2026-09-08": {
    "sale": "cous",
    "open": false,
    "q": {
      "veg": 40,
      "chick": 30,
      "mafr": 30
    }
  },
  "2026-09-15": {
    "sale": "cous",
    "open": false,
    "q": {
      "veg": 40,
      "chick": 30,
      "mafr": 30
    }
  },
  "2026-09-18": {
    "sale": "schn",
    "open": false,
    "q": {
      "thin": 30,
      "temp": 20
    }
  },
  "2026-09-22": {
    "sale": "cous",
    "open": false,
    "q": {
      "veg": 40,
      "chick": 30,
      "mafr": 30
    }
  },
  "2026-09-10": {
    "blocked": true
  },
  "2026-09-11": {
    "sale": "schn",
    "open": false,
    "q": {
      "thin": 30,
      "temp": 20
    }
  },
  "2026-09-12": {
    "blocked": true
  },
  "2026-09-13": {
    "blocked": true
  },
  "2026-09-14": {
    "blocked": true
  },
  "2026-09-20": {
    "blocked": true
  },
  "2026-09-21": {
    "blocked": true
  },
  "2026-09-25": {
    "sale": "schn",
    "open": false,
    "q": {
      "thin": 30,
      "temp": 20
    }
  },
  "2026-09-26": {
    "blocked": true
  },
  "2026-09-27": {
    "blocked": true
  },
  "2026-09-28": {
    "blocked": true
  },
  "2026-09-29": {
    "sale": "cous",
    "open": false,
    "q": {
      "veg": 40,
      "chick": 30,
      "mafr": 30
    }
  },
  "2026-09-30": {
    "blocked": true
  }
};

/* ── כותרות ── */
export const DAYS_TITLE = "ימי מכירה";
export const DAYS_SUB = "פתיחה, סגירה ומכסות";
export const SALE_TITLE = "יום מכירה";
export const EXCEPT_TITLE = "חריגה לקטגוריה";
export const EXCEPT_SUB = "אפשר לפתוח קטגוריה אחת גם ביום חסום. אחרי הבחירה אפשר לקבוע מכסות ולפתוח להזמנות.";
export const TOTAL_LABEL = "סה״כ מנות";

export const LEGEND: { text: string; color: string }[] = [
  {
    "text": "יום מכירה",
    "color": "#7B5CBC"
  },
  {
    "text": "פתוח להזמנות",
    "color": "#4E8A64"
  },
  {
    "text": "לא זמינה",
    "color": "#C4BDCE"
  }
];

/** החודש שהמסך נפתח בו בקנבס · ספטמבר 2026, והיום הנבחר הוא ה-8 */
export const START_YEAR = 2026;
export const START_MONTH = 8;
export const START_DAY = 8;
