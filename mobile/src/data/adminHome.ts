/**
 * בית הניהול · הנתונים חולצו אוטומטית מ-Admin.dc.html בקנבס.
 * חלק מהמספרים ישבו במרקאפ של הגרפים ולא ב-JS, ולכן החולץ מושך גם משם
 * ובודק שכל ערך נמצא בדיוק פעם אחת.
 * לעדכון: node scripts/extract-admin-home.mjs && node scripts/emit-admin-home.mjs
 */

/** מפתחות האריחים · כל אחד מצביע על מסך ניהול אמיתי */
export type TileKey =
  | 'orders' | 'days' | 'stock' | 'shop' | 'people' | 'menu' | 'costs' | 'hist';

export type Tile = { key: TileKey; name: string; file: string; paths: string[] };
export const TILES: Tile[] = [
  {
    "key": "orders",
    "name": "הזמנות",
    "file": "AdminOrders.dc.html",
    "paths": [
      "M6 3h12v18l-3-2-3 2-3-2-3 2z",
      "M9 8h6M9 12h6"
    ]
  },
  {
    "key": "days",
    "name": "ימי מכירה",
    "file": "AdminDays.dc.html",
    "paths": [
      "M4 6h16v14H4z",
      "M4 10h16M9 3v4M15 3v4"
    ]
  },
  {
    "key": "stock",
    "name": "מלאי",
    "file": "AdminStock.dc.html",
    "paths": [
      "M3 8.5L12 4l9 4.5v7L12 20l-9-4.5z",
      "M3 8.5L12 13l9-4.5M12 13v7"
    ]
  },
  {
    "key": "shop",
    "name": "קניות",
    "file": "AdminShopping.dc.html",
    "paths": [
      "M3 5h2.5l2 10h9l2-7H7",
      "M9 17.6a1.4 1.4 0 1 0 0 2.8a1.4 1.4 0 1 0 0-2.8",
      "M16 17.6a1.4 1.4 0 1 0 0 2.8a1.4 1.4 0 1 0 0-2.8"
    ]
  },
  {
    "key": "people",
    "name": "לקוחות",
    "file": "AdminCustomers.dc.html",
    "paths": [
      "M9 4.6a3.4 3.4 0 1 0 0 6.8a3.4 3.4 0 1 0 0-6.8",
      "M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1",
      "M16 5.5a3.4 3.4 0 0 1 0 6M18 20v-1a5 5 0 0 0-2-4"
    ]
  },
  {
    "key": "menu",
    "name": "תפריט",
    "file": "AdminMenu.dc.html",
    "paths": [
      "M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16",
      "M12 8.6a3.4 3.4 0 1 0 0 6.8a3.4 3.4 0 1 0 0-6.8"
    ]
  },
  {
    "key": "costs",
    "name": "עלויות",
    "file": "AdminCosts.dc.html",
    "paths": [
      "M12 3v18",
      "M16 7.5a3.5 3.5 0 0 0-3.5-2.5h-1a3 3 0 0 0 0 6h1a3 3 0 0 1 0 6h-1A3.5 3.5 0 0 1 8 16.5"
    ]
  },
  {
    "key": "hist",
    "name": "היסטוריה",
    "file": "AdminHistory.dc.html",
    "paths": [
      "M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17",
      "M12 7.6V12l3 2"
    ]
  }
];

/** מספרי הדגמה · נכתבו על ידי Claude בקנבס ותואמים את מסכי הניהול */
export const STATE = {
  "day": "שלישי 25.8",
  "newOrders": 3,
  "nextSale": "8.9",
  "lowStock": 3,
  "toBuy": 7,
  "people": 7,
  "menuItems": 20,
  "costsDue": true,
  "buys": 6
} as const;

export type Quota = {
  key: string;
  name: string;
  hue: string;
  rgb: string;
  sold: number;
  quota: number;
  open: boolean;
};
/** מוצגות רק הקטגוריות של ימי המכירה הפתוחים כרגע */
export const QUOTAS: Quota[] = [
  {
    "key": "cous",
    "name": "קוסקוס",
    "hue": "#7B5CBC",
    "rgb": "123,92,188",
    "sold": 68,
    "quota": 100,
    "open": true
  },
  {
    "key": "schn",
    "name": "שישניצל",
    "hue": "#416D9E",
    "rgb": "65,109,158",
    "sold": 41,
    "quota": 50,
    "open": false
  }
];
/** המכסה זזה ביחידה אחת בכל לחיצה */
export const QUOTA_STEP = 1;

export type BadgeTone = { bg: string; fg: string };
export const AMBER: BadgeTone = {
  "bg": "rgba(199,125,62,0.92)",
  "fg": "#FFFFFF"
};
export const PLUM: BadgeTone = {
  "bg": "rgba(123,92,188,0.9)",
  "fg": "#FFFFFF"
};

/* ── כותרות ── */
export const HOME_TITLE = "ניהול";
export const HOME_SUBTITLE = "שלישי · 25 באוגוסט";
export const MONTH_CHIP = "החודש";
export const MANUAL_TITLE = "הזמנה ידנית";
export const MANUAL_SUB = "מוואטסאפ או בטלפון";

/* ── שני הכרטיסים הקטנים ── */
export const TODAY = {
  ordersLabel: "הזמנות היום",
  orders: 37,
  revenueLabel: "מחזור היום",
  revenue: 4280,
} as const;

/* ── גרף המחזור · ששת החודשים האחרונים · מערכת קואורדינטות 322×110 ── */
export const REVENUE = {
  title: "מחזור · ששת החודשים האחרונים",
  total: 40900,
  line: "M42,58 C69,58 69,44 96,44 C123,44 123,51 150,51 C177,51 177,28 204,28 C231,28 231,36 258,36 C282,36 282,15 306,15",
  area: "M42,58 C69,58 69,44 96,44 C123,44 123,51 150,51 C177,51 177,28 204,28 C231,28 231,36 258,36 C282,36 282,15 306,15 L306,96 L42,96 Z",
  dots: [
  {
    "cx": 42,
    "cy": 58
  },
  {
    "cx": 96,
    "cy": 44
  },
  {
    "cx": 150,
    "cy": 51
  },
  {
    "cx": 204,
    "cy": 28
  },
  {
    "cx": 258,
    "cy": 36
  },
  {
    "cx": 306,
    "cy": 15
  }
],
  axis: [
  "12k",
  "8k",
  "4k",
  "0"
],
  tip: "11,000 ₪",
  months: [
  "מרץ",
  "אפר׳",
  "מאי",
  "יוני",
  "יולי",
  "אוג׳"
],
} as const;

/* ── דונאט הקטגוריות · מערכת קואורדינטות 74×74, רדיוס 29 ── */
export const DONUT = {
  title: "לפי קטגוריה",
  center: "47k",
  arcs: [
  {
    "color": "#7B5CBC",
    "dash": "67.4 114.8",
    "offset": 0
  },
  {
    "color": "#416D9E",
    "dash": "47.4 134.8",
    "offset": -69.4
  },
  {
    "color": "#437C59",
    "dash": "36.4 145.8",
    "offset": -118.8
  },
  {
    "color": "#B04A76",
    "dash": "23.7 158.5",
    "offset": -157.2
  }
],
  legend: [
  {
    "color": "#7B5CBC",
    "name": "קוסקוס",
    "pct": 37
  },
  {
    "color": "#416D9E",
    "name": "שישניצל",
    "pct": 26
  },
  {
    "color": "#437C59",
    "name": "ספיישל",
    "pct": 20
  },
  {
    "color": "#B04A76",
    "name": "פירות",
    "pct": 13
  }
],
} as const;

/* ── כרטיס הרווח · העמודות במערכת קואורדינטות 148×30 ── */
export const PROFIT = {
  title: "רווח החודש",
  net: 9140,
  netNote: "לפני מע״מ",
  grossLabel: "כולל מע״מ",
  gross: 10694,
  bars: [
  {
    "x": 2,
    "y": 17,
    "h": 13
  },
  {
    "x": 26,
    "y": 11,
    "h": 19
  },
  {
    "x": 50,
    "y": 15,
    "h": 15
  },
  {
    "x": 74,
    "y": 6,
    "h": 24
  },
  {
    "x": 98,
    "y": 9,
    "h": 21
  },
  {
    "x": 122,
    "y": 1,
    "h": 29
  }
],
} as const;
