/**
 * מלאי · הנתונים חולצו אוטומטית מ-AdminStock.dc.html בקנבס.
 * לעדכון: node scripts/extract-admin-stock.mjs && node scripts/emit-admin-stock.mjs
 *
 * שתי טבלאות נפרדות · אסור לערבב:
 *   מלאי מכירה   · נקבע בפתיחת יום המכירה ויורד עם כל הזמנה. לקריאה בלבד כאן.
 *   מלאי לוגיסטי · אריזות, יבשים וציוד. מתעדכן ידנית ואינו קשור למכירות.
 */

export type SaleItem = { name: string; quota: number; sold: number };
export type SaleDay = {
  cat: string;
  name: string;
  day: string;
  hue: string;
  deep: string;
  rgb: string;
  open: boolean;
  items: SaleItem[];
};

/** ⚠ נתוני הדגמה · נכתבו על ידי Claude בקנבס. המכסות תואמות את ימי המכירה */
export const SALE_DAYS: SaleDay[] = [
  {
    "cat": "cous",
    "name": "שלישי של קוסקוס",
    "day": "שלישי · 1 בספטמבר",
    "hue": "#7B5CBC",
    "deep": "#43307A",
    "rgb": "123,92,188",
    "open": true,
    "items": [
      {
        "name": "קוסקוס צמחוני",
        "quota": 40,
        "sold": 28
      },
      {
        "name": "קוסקוס עם עוף",
        "quota": 30,
        "sold": 30
      },
      {
        "name": "קוסקוס עם מפרום",
        "quota": 30,
        "sold": 22
      },
      {
        "name": "תוספת ירקות",
        "quota": 20,
        "sold": 9
      },
      {
        "name": "תוספת עוף",
        "quota": 15,
        "sold": 11
      },
      {
        "name": "תוספת מפרום",
        "quota": 15,
        "sold": 6
      }
    ]
  },
  {
    "cat": "schn",
    "name": "שישי של מטעמים",
    "day": "שישי · 4 בספטמבר",
    "hue": "#416D9E",
    "deep": "#2B4A6E",
    "rgb": "65,109,158",
    "open": false,
    "items": [
      {
        "name": "שניצל דק בציפוי פירורי לחם",
        "quota": 30,
        "sold": 26
      },
      {
        "name": "פילה עוף בציפוי טמפורה",
        "quota": 20,
        "sold": 15
      },
      {
        "name": "מארז שניצל דק",
        "quota": 10,
        "sold": 7
      },
      {
        "name": "מארז פילה עוף טמפורה",
        "quota": 8,
        "sold": 3
      }
    ]
  }
];
/** המסך מציג רק את הימים שפתוחים כרגע ב-AdminDays */
export const OPEN_DAYS: SaleDay[] = SALE_DAYS.filter((d) => d.open);

export type SupplyItem = {
  g: string;
  name: string;
  n: number;
  unit: string;
  min: number;
  /** כמה יחידות באריזה · רק לפריטים שנקנים בחבילה או בקרטון */
  per?: number;
};
export const SUPPLY: SupplyItem[] = [
  {
    "g": "אריזות",
    "name": "מגשי אלומיניום",
    "n": 40,
    "unit": "יח׳",
    "min": 60
  },
  {
    "g": "אריזות",
    "name": "קופסאות אישיות",
    "n": 220,
    "unit": "יח׳",
    "min": 100
  },
  {
    "g": "אריזות",
    "name": "שקיות נשיאה",
    "n": 15,
    "unit": "יח׳",
    "min": 50
  },
  {
    "g": "יבשים",
    "name": "קוסקוס",
    "n": 4,
    "unit": "ק״ג",
    "min": 8
  },
  {
    "g": "יבשים",
    "name": "חומוס יבש",
    "n": 6,
    "unit": "ק״ג",
    "min": 3
  },
  {
    "g": "יבשים",
    "name": "שמן זית",
    "n": 5,
    "unit": "ל׳",
    "min": 4
  },
  {
    "g": "ציוד",
    "name": "מגשי הגשה",
    "n": 12,
    "unit": "יח׳",
    "min": 8
  },
  {
    "g": "ציוד",
    "name": "גז לטאבון",
    "n": 2,
    "unit": "בלונים",
    "min": 2
  }
];
export const SUP_GROUPS: string[] = [
  "אריזות",
  "יבשים",
  "ציוד"
];
export const SUP_UNITS: string[] = [
  "יחידה",
  "ק״ג",
  "חבילה",
  "קרטון"
];
/** באריזה שלמה שואלים גם כמה יחידות יש בתוכה */
export const PACKED: string[] = [
  "חבילה",
  "קרטון"
];

export const STOCK_TABS: { id: 'sale' | 'supply'; name: string }[] = [
  {
    "id": "sale",
    "name": "מלאי מכירה"
  },
  {
    "id": "supply",
    "name": "מלאי לוגיסטי"
  }
];

/** מתחת לכמה מנות נחשב ״כמעט אזל״ */
export const LOW_LEFT = 5;
export const STATE_LABELS = {
  "out": "אזל",
  "low": "כמעט אזל",
  "ok": "זמין"
} as const;

/* ── כותרות ── */
export const STOCK_TITLE = "מלאי";
export const STOCK_SUB = {
  "sale": "מנות מוכנות למכירה",
  "supply": "אריזות, יבשים וציוד"
};
export const DAY_TAG_ONE = "יום המכירה הפעיל";
export const DAY_TAG_MANY = "ימי המכירה הפתוחים";
export const NO_OPEN_DAY = "אין יום מכירה פתוח";
export const ROW_LEFT_TAG = "נותרו";
export const TOTAL_LEFT_TAG = "מנות נותרו";
export const NO_DAY_LABEL = "אין כרגע יום מכירה פתוח";
export const NO_DAY_SUB = "המלאי נפתח כשפותחים יום מכירה במסך ימי מכירה";
export const DROP_LABEL = "ירדו מהמכירה";
export const SALE_NOTE = "המסך מציג את ימי המכירה שפתוחים כרגע · פתוחים שניים, מוצגים שניהם. המכסה נקבעת בפתיחת היום ויורדת עם כל הזמנה; כאן רק מורידים מנות שהתקלקלו או נפלו.";
export const LOW_CTA = "לרשימת הקניות";
export const SUPPLY_NOTE = "המלאי הזה מתעדכן ידנית בלבד ואינו קשור למכירות.";

/* ── חלונית ההוספה ── */
export const ADD = {
  title: "פריט חדש למלאי",
  sub: "למשל אחרי שינוי מתכון",
  nameLabel: "שם הפריט",
  namePlaceholder: "למשל: קמח טמפורה",
  groupLabel: "קבוצה",
  unitLabel: "כמות",
  qtyLabel: "יש עכשיו",
  minLabel: "מינימום",
  cta: "הוספה למלאי",
} as const;
