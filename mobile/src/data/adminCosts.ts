/**
 * עלויות ייצור · הנתונים חולצו אוטומטית מ-AdminCosts.dc.html בקנבס.
 * לעדכון: node scripts/extract-admin-costs.mjs && node scripts/emit-admin-costs.mjs
 *
 * ⚠ המחיר שנקבע כאן הוא המחיר של כל האפליקציה, כולל צד הלקוחה.
 * מגשי הפירות אינם כאן — הם לא בניהול הכספי של שקד.
 */

export type CostCatKey = 'cous' | 'schn' | 'box' | 'chef';
export type SubCat = { id: string; n: string };
export type CostCat = {
  id: CostCatKey;
  n: string;
  hue: string;
  deep: string;
  rgb: string;
  subs: SubCat[] | null;
};
export const CATS: CostCat[] = [
  {
    "id": "cous",
    "n": "קוסקוס",
    "hue": "#7B5CBC",
    "deep": "#43307A",
    "rgb": "123,92,188",
    "subs": null
  },
  {
    "id": "schn",
    "n": "שישניצל",
    "hue": "#416D9E",
    "deep": "#2B4A6E",
    "rgb": "65,109,158",
    "subs": null
  },
  {
    "id": "box",
    "n": "ספיישל",
    "hue": "#437C59",
    "deep": "#2C5A3E",
    "rgb": "67,124,89",
    "subs": [
      {
        "id": "salads",
        "n": "סלטים"
      },
      {
        "id": "challah",
        "n": "חלות"
      },
      {
        "id": "packs",
        "n": "מארזים מוכנים"
      }
    ]
  },
  {
    "id": "chef",
    "n": "שף",
    "hue": "#A85A28",
    "deep": "#7A3D18",
    "rgb": "168,90,40",
    "subs": null
  }
];

/** פנקס המצרכים · אותו פנקס של מסך הקניות */
export type PantryRow = { name: string; unit: string; price: number };
export const PANTRY: PantryRow[] = [
  {
    "name": "עגבניות",
    "unit": "ק״ג",
    "price": 9
  },
  {
    "name": "בצל",
    "unit": "ק״ג",
    "price": 6
  },
  {
    "name": "גזר",
    "unit": "ק״ג",
    "price": 6
  },
  {
    "name": "כוסברה",
    "unit": "יח׳",
    "price": 4
  },
  {
    "name": "פטרוזיליה",
    "unit": "יח׳",
    "price": 4
  },
  {
    "name": "קישואים",
    "unit": "ק״ג",
    "price": 8
  },
  {
    "name": "תפוחי אדמה",
    "unit": "ק״ג",
    "price": 5
  },
  {
    "name": "ירך עוף",
    "unit": "ק״ג",
    "price": 40
  },
  {
    "name": "חזה עוף",
    "unit": "ק״ג",
    "price": 46
  },
  {
    "name": "פילה עוף",
    "unit": "ק״ג",
    "price": 58
  },
  {
    "name": "בשר טחון למפרום",
    "unit": "ק״ג",
    "price": 65
  },
  {
    "name": "קוסקוס",
    "unit": "ק״ג",
    "price": 16
  },
  {
    "name": "חומוס יבש",
    "unit": "ק״ג",
    "price": 15
  },
  {
    "name": "פירורי לחם",
    "unit": "ק״ג",
    "price": 12
  },
  {
    "name": "קמח טמפורה",
    "unit": "ק״ג",
    "price": 18
  },
  {
    "name": "קמח",
    "unit": "ק״ג",
    "price": 5
  },
  {
    "name": "שמרים",
    "unit": "ק״ג",
    "price": 22
  },
  {
    "name": "שומשום",
    "unit": "ק״ג",
    "price": 18
  },
  {
    "name": "חמאה",
    "unit": "ק״ג",
    "price": 45
  },
  {
    "name": "גבינת פטה",
    "unit": "ק״ג",
    "price": 38
  },
  {
    "name": "שמן זית",
    "unit": "ק״ג",
    "price": 48
  },
  {
    "name": "חציל",
    "unit": "ק״ג",
    "price": 7
  },
  {
    "name": "פלפל אדום",
    "unit": "ק״ג",
    "price": 11
  },
  {
    "name": "כרוב סגול",
    "unit": "ק״ג",
    "price": 6
  },
  {
    "name": "כרוב לבן",
    "unit": "ק״ג",
    "price": 5
  },
  {
    "name": "סלק",
    "unit": "ק״ג",
    "price": 6
  },
  {
    "name": "מיונז",
    "unit": "ק״ג",
    "price": 18
  },
  {
    "name": "ביצים",
    "unit": "יח׳",
    "price": 0.8
  },
  {
    "name": "מגשי אלומיניום",
    "unit": "קרטון",
    "price": 90
  },
  {
    "name": "קופסאות אישיות",
    "unit": "קרטון",
    "price": 75
  },
  {
    "name": "צנצנות",
    "unit": "קרטון",
    "price": 110
  },
  {
    "name": "קוקוטים",
    "unit": "קרטון",
    "price": 60
  },
  {
    "name": "דבש",
    "unit": "ק״ג",
    "price": 42
  },
  {
    "name": "נרות",
    "unit": "קרטון",
    "price": 65
  },
  {
    "name": "נוטלה",
    "unit": "ק״ג",
    "price": 34
  },
  {
    "name": "מארז",
    "unit": "יח׳",
    "price": 9
  },
  {
    "name": "מארז גדול",
    "unit": "יח׳",
    "price": 14
  },
  {
    "name": "שקית נשיאה",
    "unit": "יח׳",
    "price": 2.5
  },
  {
    "name": "כרטיס ברכה",
    "unit": "יח׳",
    "price": 1.5
  },
  {
    "name": "סרט",
    "unit": "יח׳",
    "price": 0.8
  }
];

/**
 * מצבי חישוב:
 *   unit   · עלות ליחידה   = סה״כ המצרכים ÷ כמה יצא
 *   weight · עלות ל-100 גרם = סה״כ המצרכים ÷ (גרמים ÷ 100)
 *   auto   · העלות נשאבת ממנות אחרות · אין מה למלא חוץ מהמחיר
 */
export type CostMode = 'unit' | 'weight' | 'auto';

export type Part = { n: string; price: number; qty: number };
/** מקור שאיבה · id של מנה אחרת, או 'salads:avg' לממוצע הסלטים */
export type FromRef = { id: string; m: number };

export type Dish = {
  id: string;
  c: CostCatKey;
  sub?: string;
  name: string;
  mode: CostMode;
  price: number;
  yld?: number;
  note?: string;
  from?: FromRef[];
  parts?: Part[];
};
/**
 * ⚠ נתוני הדגמה · המצרכים והכמויות נכתבו על ידי Claude בקנבס.
 * המחירים למכירה נלקחו מהמסכים של הלקוחה.
 */
export const DISHES: Dish[] = [
  {
    "id": "cousVeg",
    "c": "cous",
    "name": "קוסקוס צמחוני",
    "mode": "unit",
    "price": 45,
    "yld": 120,
    "parts": [
      {
        "n": "קוסקוס",
        "price": 16,
        "qty": 36
      },
      {
        "n": "גזר",
        "price": 6,
        "qty": 42
      },
      {
        "n": "קישואים",
        "price": 8,
        "qty": 30
      },
      {
        "n": "חומוס יבש",
        "price": 15,
        "qty": 9
      },
      {
        "n": "קופסאות אישיות",
        "price": 75,
        "qty": 6
      }
    ]
  },
  {
    "id": "cousChick",
    "c": "cous",
    "name": "קוסקוס עם עוף",
    "mode": "unit",
    "price": 55,
    "yld": 95,
    "parts": [
      {
        "n": "קוסקוס",
        "price": 16,
        "qty": 15
      },
      {
        "n": "גזר",
        "price": 6,
        "qty": 19
      },
      {
        "n": "קישואים",
        "price": 8,
        "qty": 14
      },
      {
        "n": "ירך עוף",
        "price": 40,
        "qty": 37
      },
      {
        "n": "קופסאות אישיות",
        "price": 75,
        "qty": 3
      }
    ]
  },
  {
    "id": "cousMafr",
    "c": "cous",
    "name": "קוסקוס עם מפרום",
    "mode": "unit",
    "price": 65,
    "yld": 70,
    "parts": [
      {
        "n": "קוסקוס",
        "price": 16,
        "qty": 11
      },
      {
        "n": "גזר",
        "price": 6,
        "qty": 12
      },
      {
        "n": "תפוחי אדמה",
        "price": 5,
        "qty": 14
      },
      {
        "n": "בשר טחון למפרום",
        "price": 65,
        "qty": 26
      },
      {
        "n": "קופסאות אישיות",
        "price": 75,
        "qty": 2
      }
    ]
  },
  {
    "id": "addVeg",
    "c": "cous",
    "name": "תוספת ירקות",
    "mode": "unit",
    "price": 10,
    "yld": 60,
    "parts": [
      {
        "n": "גזר",
        "price": 6,
        "qty": 12
      },
      {
        "n": "קישואים",
        "price": 8,
        "qty": 10
      }
    ]
  },
  {
    "id": "addChick",
    "c": "cous",
    "name": "תוספת עוף",
    "mode": "unit",
    "price": 15,
    "yld": 45,
    "parts": [
      {
        "n": "ירך עוף",
        "price": 40,
        "qty": 8
      }
    ]
  },
  {
    "id": "addMafr",
    "c": "cous",
    "name": "תוספת מפרום",
    "mode": "unit",
    "price": 20,
    "yld": 30,
    "parts": [
      {
        "n": "בשר טחון למפרום",
        "price": 65,
        "qty": 5
      }
    ]
  },
  {
    "id": "schThin",
    "c": "schn",
    "name": "חלת שניצל דק",
    "mode": "unit",
    "price": 50,
    "yld": 110,
    "parts": [
      {
        "n": "חזה עוף",
        "price": 46,
        "qty": 38
      },
      {
        "n": "פירורי לחם",
        "price": 12,
        "qty": 9
      },
      {
        "n": "ביצים",
        "price": 0.8,
        "qty": 90
      },
      {
        "n": "קמח",
        "price": 5,
        "qty": 38
      },
      {
        "n": "שומשום",
        "price": 18,
        "qty": 3
      }
    ]
  },
  {
    "id": "schTemp",
    "c": "schn",
    "name": "חלת פילה עוף טמפורה",
    "mode": "unit",
    "price": 60,
    "yld": 65,
    "parts": [
      {
        "n": "פילה עוף",
        "price": 58,
        "qty": 26
      },
      {
        "n": "קמח טמפורה",
        "price": 18,
        "qty": 8
      },
      {
        "n": "קמח",
        "price": 5,
        "qty": 22
      },
      {
        "n": "שמרים",
        "price": 22,
        "qty": 1.5
      }
    ]
  },
  {
    "id": "boxThin",
    "c": "schn",
    "name": "מארז שניצל דק",
    "mode": "unit",
    "price": 200,
    "yld": 22,
    "parts": [
      {
        "n": "חזה עוף",
        "price": 46,
        "qty": 24
      },
      {
        "n": "פירורי לחם",
        "price": 12,
        "qty": 5
      },
      {
        "n": "קמח",
        "price": 5,
        "qty": 22
      },
      {
        "n": "קופסאות אישיות",
        "price": 75,
        "qty": 2
      }
    ]
  },
  {
    "id": "boxTemp",
    "c": "schn",
    "name": "מארז פילה עוף טמפורה",
    "mode": "unit",
    "price": 250,
    "yld": 14,
    "parts": [
      {
        "n": "פילה עוף",
        "price": 58,
        "qty": 15
      },
      {
        "n": "קמח טמפורה",
        "price": 18,
        "qty": 3
      },
      {
        "n": "קמח",
        "price": 5,
        "qty": 14
      },
      {
        "n": "קופסאות אישיות",
        "price": 75,
        "qty": 1.5
      }
    ]
  },
  {
    "id": "cocotte",
    "c": "schn",
    "name": "קוקוט רוטב",
    "mode": "unit",
    "price": 3,
    "yld": 140,
    "parts": [
      {
        "n": "מיונז",
        "price": 18,
        "qty": 6
      },
      {
        "n": "קוקוטים",
        "price": 60,
        "qty": 1.5
      }
    ]
  },
  {
    "id": "salMat",
    "c": "box",
    "sub": "salads",
    "name": "מטבוחה של בית",
    "mode": "weight",
    "price": 89,
    "yld": 6000,
    "parts": [
      {
        "n": "עגבניות",
        "price": 9,
        "qty": 7
      },
      {
        "n": "פלפל אדום",
        "price": 11,
        "qty": 3
      },
      {
        "n": "שמן זית",
        "price": 48,
        "qty": 0.8
      }
    ]
  },
  {
    "id": "salEgg",
    "c": "box",
    "sub": "salads",
    "name": "סלט ביצים קלאסי",
    "mode": "weight",
    "price": 89,
    "yld": 3200,
    "parts": [
      {
        "n": "ביצים",
        "price": 0.8,
        "qty": 60
      },
      {
        "n": "מיונז",
        "price": 18,
        "qty": 1.4
      }
    ]
  },
  {
    "id": "salEggp",
    "c": "box",
    "sub": "salads",
    "name": "חציל במיונז",
    "mode": "weight",
    "price": 89,
    "yld": 3200,
    "parts": [
      {
        "n": "חציל",
        "price": 7,
        "qty": 6
      },
      {
        "n": "מיונז",
        "price": 18,
        "qty": 1.6
      }
    ]
  },
  {
    "id": "salMor",
    "c": "box",
    "sub": "salads",
    "name": "חציל מרוקאי",
    "mode": "weight",
    "price": 89,
    "yld": 4500,
    "parts": [
      {
        "n": "חציל",
        "price": 7,
        "qty": 6
      },
      {
        "n": "פלפל אדום",
        "price": 11,
        "qty": 1.5
      },
      {
        "n": "שמן זית",
        "price": 48,
        "qty": 0.5
      }
    ]
  },
  {
    "id": "salCar",
    "c": "box",
    "sub": "salads",
    "name": "סלט גזר מרוקאי",
    "mode": "weight",
    "price": 89,
    "yld": 3000,
    "parts": [
      {
        "n": "גזר",
        "price": 6,
        "qty": 6
      },
      {
        "n": "שמן זית",
        "price": 48,
        "qty": 0.5
      }
    ]
  },
  {
    "id": "salMash",
    "c": "box",
    "sub": "salads",
    "name": "סלט מאשוויה",
    "mode": "weight",
    "price": 89,
    "yld": 4500,
    "parts": [
      {
        "n": "פלפל אדום",
        "price": 11,
        "qty": 4
      },
      {
        "n": "עגבניות",
        "price": 9,
        "qty": 2
      },
      {
        "n": "שמן זית",
        "price": 48,
        "qty": 0.5
      }
    ]
  },
  {
    "id": "salPurp",
    "c": "box",
    "sub": "salads",
    "name": "סלט כרוב סגול במיונז",
    "mode": "weight",
    "price": 89,
    "yld": 3000,
    "parts": [
      {
        "n": "כרוב סגול",
        "price": 6,
        "qty": 5
      },
      {
        "n": "מיונז",
        "price": 18,
        "qty": 1.2
      }
    ]
  },
  {
    "id": "salWhite",
    "c": "box",
    "sub": "salads",
    "name": "סלט כרוב לבן חמוץ",
    "mode": "weight",
    "price": 89,
    "yld": 2600,
    "parts": [
      {
        "n": "כרוב לבן",
        "price": 5,
        "qty": 5
      },
      {
        "n": "שמן זית",
        "price": 48,
        "qty": 0.3
      }
    ]
  },
  {
    "id": "salChin",
    "c": "box",
    "sub": "salads",
    "name": "כרוב לבן סיני",
    "mode": "weight",
    "price": 89,
    "yld": 2500,
    "parts": [
      {
        "n": "כרוב לבן",
        "price": 5,
        "qty": 4.5
      },
      {
        "n": "שמן זית",
        "price": 48,
        "qty": 0.3
      }
    ]
  },
  {
    "id": "salBeet",
    "c": "box",
    "sub": "salads",
    "name": "סלק",
    "mode": "weight",
    "price": 89,
    "yld": 2800,
    "parts": [
      {
        "n": "סלק",
        "price": 6,
        "qty": 6
      },
      {
        "n": "שמן זית",
        "price": 48,
        "qty": 0.3
      }
    ]
  },
  {
    "id": "salTab",
    "c": "box",
    "sub": "salads",
    "name": "טאבולה",
    "mode": "weight",
    "price": 89,
    "yld": 4000,
    "parts": [
      {
        "n": "פטרוזיליה",
        "price": 4,
        "qty": 20
      },
      {
        "n": "עגבניות",
        "price": 9,
        "qty": 2
      },
      {
        "n": "שמן זית",
        "price": 48,
        "qty": 0.4
      }
    ]
  },
  {
    "id": "salHerb",
    "c": "box",
    "sub": "salads",
    "name": "עשבים",
    "mode": "weight",
    "price": 89,
    "yld": 3000,
    "parts": [
      {
        "n": "פטרוזיליה",
        "price": 4,
        "qty": 16
      },
      {
        "n": "כוסברה",
        "price": 4,
        "qty": 10
      },
      {
        "n": "שמן זית",
        "price": 48,
        "qty": 0.4
      }
    ]
  },
  {
    "id": "salSwt",
    "c": "box",
    "sub": "salads",
    "name": "פלפלים מתוקים",
    "mode": "weight",
    "price": 89,
    "yld": 4000,
    "parts": [
      {
        "n": "פלפל אדום",
        "price": 11,
        "qty": 5
      },
      {
        "n": "שמן זית",
        "price": 48,
        "qty": 0.5
      }
    ]
  },
  {
    "id": "salHot",
    "c": "box",
    "sub": "salads",
    "name": "פלפלים חריפים",
    "mode": "weight",
    "price": 89,
    "yld": 3500,
    "parts": [
      {
        "n": "פלפל אדום",
        "price": 11,
        "qty": 4
      },
      {
        "n": "שמן זית",
        "price": 48,
        "qty": 0.4
      }
    ]
  },
  {
    "id": "chFri",
    "c": "box",
    "sub": "challah",
    "name": "חלת שישי משפחתית",
    "mode": "unit",
    "price": 25,
    "yld": 40,
    "note": "שומשום, קמח וקלאסית הן אותה חלה ואותו מחיר — מספיק חישוב אחד.",
    "parts": [
      {
        "n": "קמח",
        "price": 5,
        "qty": 12
      },
      {
        "n": "שמרים",
        "price": 22,
        "qty": 0.4
      },
      {
        "n": "שומשום",
        "price": 18,
        "qty": 0.5
      },
      {
        "n": "ביצים",
        "price": 0.8,
        "qty": 8
      }
    ]
  },
  {
    "id": "chBase",
    "c": "box",
    "sub": "challah",
    "name": "חלה לכל אירוע · הבסיס",
    "mode": "unit",
    "price": 12,
    "yld": 90,
    "note": "העלות הזאת נכנסת אוטומטית לכל ארבעת סוגי האירוע שמתחתיה.",
    "parts": [
      {
        "n": "קמח",
        "price": 5,
        "qty": 14
      },
      {
        "n": "שמרים",
        "price": 22,
        "qty": 0.5
      },
      {
        "n": "ביצים",
        "price": 0.8,
        "qty": 10
      }
    ]
  },
  {
    "id": "chRosh",
    "c": "box",
    "sub": "challah",
    "name": "ראש השנה",
    "mode": "auto",
    "price": 18,
    "from": [
      {
        "id": "chBase",
        "m": 1
      }
    ],
    "parts": [
      {
        "n": "דבש",
        "price": 42,
        "qty": 3
      },
      {
        "n": "צנצנות",
        "price": 110,
        "qty": 1
      }
    ],
    "yld": 90
  },
  {
    "id": "chHafr",
    "c": "box",
    "sub": "challah",
    "name": "הפרשת חלה",
    "mode": "auto",
    "price": 18,
    "from": [
      {
        "id": "chBase",
        "m": 1
      }
    ],
    "parts": [
      {
        "n": "נרות",
        "price": 65,
        "qty": 1
      }
    ],
    "yld": 60
  },
  {
    "id": "chEvent",
    "c": "box",
    "sub": "challah",
    "name": "ימי הולדת ואירועים",
    "mode": "auto",
    "price": 12,
    "from": [
      {
        "id": "chBase",
        "m": 1
      }
    ],
    "yld": 0,
    "parts": [
      {
        "n": "שקית נשיאה",
        "price": 2.5,
        "qty": 1
      },
      {
        "n": "כרטיס ברכה",
        "price": 1.5,
        "qty": 1
      }
    ]
  },
  {
    "id": "chKids",
    "c": "box",
    "sub": "challah",
    "name": "פינוק לגן ולכיתה",
    "mode": "auto",
    "price": 16,
    "from": [
      {
        "id": "chBase",
        "m": 1
      }
    ],
    "parts": [
      {
        "n": "נוטלה",
        "price": 34,
        "qty": 2
      },
      {
        "n": "קוקוטים",
        "price": 60,
        "qty": 1
      }
    ],
    "yld": 120
  },
  {
    "id": "pkSalads",
    "c": "box",
    "sub": "packs",
    "name": "חגיגה בשולחן · סלטים",
    "mode": "auto",
    "price": 179,
    "note": "החלות והסלטים נשאבים מהקטגוריות שמעל · כאן רק האריזה והתוספות.",
    "from": [
      {
        "id": "chFri",
        "m": 2
      },
      {
        "id": "salads:avg",
        "m": 12.5
      }
    ],
    "yld": 0,
    "parts": [
      {
        "n": "מארז",
        "price": 9,
        "qty": 1
      },
      {
        "n": "שקית נשיאה",
        "price": 2.5,
        "qty": 1
      },
      {
        "n": "כרטיס ברכה",
        "price": 1.5,
        "qty": 1
      }
    ]
  },
  {
    "id": "pkMain",
    "c": "box",
    "sub": "packs",
    "name": "חגיגה בשולחן · עיקרית",
    "mode": "unit",
    "price": 339,
    "yld": 1,
    "note": "העיקריות כאן נמכרות לפי משקל ולא לפי מנה, ולכן אינן נשאבות מהקוסקוס — מעדכנים אותן ידנית.",
    "parts": [
      {
        "n": "ירך עוף",
        "price": 40,
        "qty": 2.2
      },
      {
        "n": "בשר טחון למפרום",
        "price": 65,
        "qty": 1.2
      },
      {
        "n": "תפוחי אדמה",
        "price": 5,
        "qty": 1.5
      },
      {
        "n": "מגשי אלומיניום",
        "price": 90,
        "qty": 0.1
      }
    ]
  },
  {
    "id": "pkAll",
    "c": "box",
    "sub": "packs",
    "name": "הכל עלינו",
    "mode": "auto",
    "price": 499,
    "note": "מורכב במלואו משני המארזים שמעל · כאן רק האריזה והתוספות והמחיר הסופי.",
    "from": [
      {
        "id": "pkSalads",
        "m": 1
      },
      {
        "id": "pkMain",
        "m": 1
      }
    ],
    "yld": 0,
    "parts": [
      {
        "n": "מארז גדול",
        "price": 14,
        "qty": 1
      },
      {
        "n": "שקית נשיאה",
        "price": 2.5,
        "qty": 1
      },
      {
        "n": "כרטיס ברכה",
        "price": 1.5,
        "qty": 1
      }
    ]
  },
  {
    "id": "pkShana",
    "c": "box",
    "sub": "packs",
    "name": "טעם של שנה טובה",
    "mode": "unit",
    "price": 49,
    "yld": 30,
    "note": "מארז עצמאי · מתעדכן ידנית.",
    "parts": [
      {
        "n": "דבש",
        "price": 42,
        "qty": 4
      },
      {
        "n": "צנצנות",
        "price": 110,
        "qty": 1
      },
      {
        "n": "קמח",
        "price": 5,
        "qty": 6
      },
      {
        "n": "שמרים",
        "price": 22,
        "qty": 0.3
      }
    ]
  },
  {
    "id": "chefMeal",
    "c": "chef",
    "name": "ארוחת שף · לסועד",
    "mode": "unit",
    "price": 250,
    "yld": 34,
    "parts": [
      {
        "n": "פילה עוף",
        "price": 58,
        "qty": 38
      },
      {
        "n": "ירך עוף",
        "price": 40,
        "qty": 32
      },
      {
        "n": "קישואים",
        "price": 8,
        "qty": 45
      },
      {
        "n": "שמן זית",
        "price": 48,
        "qty": 6
      },
      {
        "n": "מגשי אלומיניום",
        "price": 90,
        "qty": 10
      }
    ]
  },
  {
    "id": "tabun",
    "c": "chef",
    "name": "עמדת טאבון · לסועד",
    "mode": "unit",
    "price": 220,
    "yld": 52,
    "parts": [
      {
        "n": "קמח",
        "price": 5,
        "qty": 310
      },
      {
        "n": "שמרים",
        "price": 22,
        "qty": 12
      },
      {
        "n": "גבינת פטה",
        "price": 38,
        "qty": 62
      },
      {
        "n": "שמן זית",
        "price": 48,
        "qty": 16
      }
    ]
  }
];

/**
 * ⚠ הקניות · אותה רשימה שמופיעה במסך היסטוריית הקניות.
 * הייבוא מושך מכאן את המחיר ששולם בפועל ומעדכן בו כל מצרך תואם.
 */
export type BuyRow = { n: string; p: number; q: number };
export type Buy = { area: string; d: string; t: string; rows: BuyRow[] };
export const BUYS: Buy[] = [
  {
    "area": "קוסקוס",
    "d": "1 בספטמבר",
    "t": "07:40",
    "rows": [
      {
        "n": "עגבניות",
        "p": 9,
        "q": 8
      },
      {
        "n": "בצל",
        "p": 6,
        "q": 5
      },
      {
        "n": "גזר",
        "p": 6.5,
        "q": 4
      },
      {
        "n": "ירך עוף",
        "p": 43,
        "q": 12
      },
      {
        "n": "קוסקוס",
        "p": 17,
        "q": 10
      },
      {
        "n": "חומוס יבש",
        "p": 15,
        "q": 3
      }
    ]
  },
  {
    "area": "שניצלים",
    "d": "30 באוגוסט",
    "t": "08:15",
    "rows": [
      {
        "n": "חזה עוף",
        "p": 49,
        "q": 14
      },
      {
        "n": "פילה עוף",
        "p": 61,
        "q": 8
      },
      {
        "n": "פירורי לחם",
        "p": 13,
        "q": 4
      },
      {
        "n": "קמח טמפורה",
        "p": 18,
        "q": 3
      },
      {
        "n": "קוקוטים",
        "p": 62,
        "q": 1
      }
    ]
  },
  {
    "area": "מארזים",
    "d": "28 באוגוסט",
    "t": "09:00",
    "rows": [
      {
        "n": "קמח",
        "p": 5.5,
        "q": 25
      },
      {
        "n": "שמרים",
        "p": 23,
        "q": 2
      },
      {
        "n": "שומשום",
        "p": 19,
        "q": 2
      },
      {
        "n": "קופסאות אישיות",
        "p": 78,
        "q": 3
      }
    ]
  },
  {
    "area": "כללי",
    "d": "24 באוגוסט",
    "t": "17:05",
    "rows": [
      {
        "n": "מגשי אלומיניום",
        "p": 94,
        "q": 2
      },
      {
        "n": "שקית נשיאה",
        "p": 2.8,
        "q": 200
      },
      {
        "n": "כרטיס ברכה",
        "p": 1.7,
        "q": 150
      }
    ]
  }
];

/** ⚠ תאריך ההדגמה · ב-1 בחודש התזכורת נדלקת מעצמה */
export const TODAY = {
  "y": 2026,
  "m": 9,
  "d": 1
};
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

/** מתחת לאחוז הזה הרווחיות נחשבת דקה */
export const THIN_MARGIN = 40;
/** עומק השאיבה המרבי · מגן מפני מעגל בין מנות */
export const MAX_DEPTH = 4;
/** המפתח המיוחד שמושך את ממוצע הסלטים */
export const SALADS_AVG = 'salads:avg';
export const SALADS_AVG_LABEL = "ממוצע הסלטים";

export const START_CAT: CostCatKey = "cous";
export const START_SUB = "salads";

/* ── כותרות ── */
export const COSTS_TITLE = "עלויות ייצור";
export const SUB_PREFIX = "עדכון חודשי · ";
export const DUE_TITLE = "הגיע ה-1 בחודש";
export const DUE_SUB = "זה הזמן לעדכן את עלויות הייצור";
export const IMPORT = {
  label: "ייבוא",
  title: "ייבוא מרשימת קניות",
  sub: "המחירים ששולמו בפועל יעדכנו כל מצרך תואם",
  none: "לא נמצאו מצרכים תואמים",
  prefix: "עודכנו ",
  suffix: " שורות מצרכים",
} as const;
export const AUTO_TAG = "אוטומטי";
export const FROM_LABEL = "נשאב מקטגוריות אחרות";
export const PART_PLACEHOLDER = "שם המצרך";
export const COLS = {
  name: "מוצר",
  price: "מחיר",
  qty: "כמות",
  sum: "סה״כ",
} as const;
export const PARTS_TITLE = {
  "auto": "האריזה והתוספות",
  "manual": "חישוב עלות למנה אחת"
};
export const YIELD_LABEL = {
  "weight": "כמות (גרם)",
  "unit": "כמות (יח׳)"
};
export const PRICE_LABEL = {
  "weight": "מחיר לק״ג",
  "unit": "מחיר ליח׳"
};
export const ROW_KEYS = {
  "partsSum": "סה״כ מצרכים",
  "cost": {
    "weight": "עלות ל-100 גרם",
    "unit": "עלות ליחידה"
  },
  "costKg": "עלות לק״ג",
  "profit": {
    "weight": "רווח לק״ג",
    "unit": "רווח ליחידה"
  },
  "margin": "רווחיות"
};
export const SCREEN_NOTE = "המחיר שנקבע כאן הוא המחיר בכל האפליקציה, כולל אצל הלקוחה. העלות עוברת אוטומטית למסך התפריט.";
