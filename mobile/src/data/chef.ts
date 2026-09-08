import { buildSlots } from '../order/types';

/**
 * שף וטאבון · הנתונים חולצו אוטומטית מ-Chef.dc.html בקנבס,
 * כדי שכל טקסט, מחיר ותפריט יהיו זהים בדיוק למה ששקד כתבה.
 * לעדכון: node scripts/extract-chef.mjs && node scripts/emit-chef.mjs
 */

export type Named = { n: string; d?: string; [k: string]: any };

export const CONCEPTS = [
  {
    "n": "חלבי · צמחוני",
    "d": "גבינות, חמאה, פסטות טריות וירקות העונה. עדין, עשיר ומלא שכבות טעם. ללא דגים/בשר.",
    "fam": "milk"
  },
  {
    "n": "חלבי · דגים",
    "d": "דגים טריים לאורך כל הערב, נאים, צרובים או אפויים; לשיקולכם, לצד גבינות ירקות ומאפים משובחים.",
    "fam": "meat"
  },
  {
    "n": "בשרי",
    "d": "צלייה, אש וטעמים עמוקים. תפריט עוצמתי שנבנה סביב נתח מרכזי ומשלב שלל של מנות בטעמים מטורפים.",
    "fam": "meat"
  }
] as const;
export const CONCEPT_FAM: Record<string, 'meat' | 'milk'> = {
  "חלבי · צמחוני": "milk",
  "חלבי · דגים": "meat",
  "בשרי": "meat"
};
export const TIERS: string[] = [
  "8 סוגי מנות",
  "10 סוגי מנות",
  "12 סוגי מנות"
];
export const TIER_LINES = [
  [
    "2 מנות פתיחה",
    "2 סלטים",
    "2 עיקריות",
    "2 קינוחים"
  ],
  [
    "3 מנות פתיחה",
    "3 סלטים",
    "2 עיקריות",
    "2 קינוחים"
  ],
  [
    "3 מנות פתיחה",
    "3 סלטים",
    "3 עיקריות",
    "3 קינוחים"
  ]
] as const;
export const STYLES: string[] = [
  "איטלקי",
  "אסייאתי",
  "מזרח תיכוני",
  "דיינר אמריקאי",
  "מקסיקני",
  "יווני"
];
export const STYLES_ALL: string[] = [
  "איטלקי",
  "אסייאתי",
  "מקסיקני",
  "יווני"
];

export const CHEF_PRICES: Record<'meat' | 'milk', Record<string, number[]>> = {
  "meat": {
    "2-4": [
      600,
      650,
      800
    ],
    "5-11": [
      500,
      550,
      700
    ],
    "12-16": [
      400,
      450,
      600
    ]
  },
  "milk": {
    "2-4": [
      450,
      500,
      600
    ],
    "5-11": [
      350,
      400,
      500
    ],
    "12-16": [
      250,
      300,
      400
    ]
  }
};

/* טאבון · מחיר לראש יורד ככל שיש יותר סועדים */
export const TABOON_TIERS: number[][] = [
  [
    15,
    220
  ],
  [
    20,
    200
  ],
  [
    25,
    180
  ]
];
export const T_TABLE: number[][] = [
  [
    15,
    250
  ],
  [
    20,
    350
  ],
  [
    25,
    450
  ]
];
export const T_EXTRAS = [
  {
    "n": "מנות דג בטאבון",
    "p": "55 ₪",
    "d": "פילה סלמון, לברק או דניס בתערובת תבלינים וחמאה או עשבי תיבול, נאפים במקום.",
    "per": 55
  },
  {
    "n": "שולחן קינוחים מעוצב",
    "p": "40 ₪",
    "d": "קינוחים אישיים מוגשים על שולחן מעוצב.",
    "per": 40
  },
  {
    "n": "ממשותף לאישי",
    "p": "20 ₪",
    "d": "עריכה בכלים אישיים של הסלטים והפסטות על עמדת הבופה, במקום הגשה משותפת.",
    "per": 20
  },
  {
    "n": "עיצוב שולחן יוקרתי",
    "p": "250–450 ₪ סה״כ",
    "d": "סכו״ם, צלחות, מפיות, כוסות וקשים, כולל תפריט מעוצב ומודפס לכל סועד. (השולחן והכיסאות עליכם)",
    "tiered": true
  }
] as const;

export const SALAD_BASE = 3;
export const SALAD_EXTRA = 20;
export const PASTA_BASE = 2;
export const PASTA_EXTRA = 25;
export const PASTA_UP_EXTRA = 15;
export const DESSERT_BASE = 2;
export const DESSERT_EXTRA = 20;
export const FIRST_EXTRA = 25;
export const EXTRA_TABLE: Record<string, number> = {
  "2-4": 250,
  "5-11": 400,
  "12-16": 550
};
export const EXTRA_DRINK = 120;

export type ChefSection = { kind: string; [k: string]: any };
export type ChefPackage = {
  key: 'chef' | 'taboon';
  short: string;
  name: string;
  base: number;
  price: string;
  desc: string;
  title: string;
  intro?: { text: string; w: string; size: string; fg: string }[];
  pages: ChefSection[][];
  pageTitles?: string[];
  [k: string]: any;
};

export const CHEF_PACKAGES: ChefPackage[] = [
  {
    "key": "chef",
    "short": "ארוחת שף",
    "name": "ארוחת שף פרטית",
    "base": 0,
    "price": "החל מ- 250 ש״ח לסועד",
    "desc": "שף פרטית בבית שלכם · 2 עד 16 סועדים.",
    "title": "ארוחת שף פרטית 👨🏻‍🍳",
    "intro": [
      {
        "text": "ארוחת שף מיועדת ל־2 עד 16 סועדים.",
        "w": "600",
        "size": "14.5px",
        "fg": "#2A2430"
      },
      {
        "text": "כל מסלול הוא רצף מנות שמגיע לשולחן בשלבים,",
        "w": "300",
        "size": "13px",
        "fg": "#7D7488"
      },
      {
        "text": "כל המנות מוגשות בצלחות זוגיות.",
        "w": "300",
        "size": "13px",
        "fg": "#7D7488"
      },
      {
        "text": "המחיר לסועד נקבע לפי מספר הסועדים",
        "w": "300",
        "size": "13px",
        "fg": "#7D7488"
      },
      {
        "text": "יותר סועדים המחיר יורד בהתאם.",
        "w": "300",
        "size": "13px",
        "fg": "#7D7488"
      },
      {
        "text": "המחיר כולל את כל חומרי הגלם ואת כלי ההגשה המעוצבים,",
        "w": "300",
        "size": "13px",
        "fg": "#7D7488"
      },
      {
        "text": "אך לא כולל כלי אוכל אישיים ועיצוב שולחן.",
        "w": "300",
        "size": "13px",
        "fg": "#7D7488"
      },
      {
        "text": "ניתן לשדרג בתוספת מחיר.",
        "w": "300",
        "size": "13px",
        "fg": "#7D7488"
      }
    ],
    "pages": [
      [
        {
          "kind": "title",
          "label": "מספר סועדים"
        },
        {
          "kind": "note",
          "label": "בין 2 ל-16 סועדים.",
          "tight": true
        },
        {
          "kind": "stepper",
          "id": "guests",
          "min": 2,
          "max": 16,
          "step": 1,
          "unit": "סועדים",
          "slim": true
        },
        {
          "kind": "title",
          "label": "על איזה ציר הולכים"
        },
        {
          "kind": "note",
          "label": "זו ההחלטה שקובעת את אופי כל הערב.",
          "tight": true
        },
        {
          "kind": "pair",
          "id": "concept",
          "options": [
            {
              "n": "חלבי · צמחוני",
              "d": "גבינות, חמאה, פסטות טריות וירקות העונה. עדין, עשיר ומלא שכבות טעם. ללא דגים/בשר."
            },
            {
              "n": "חלבי · דגים",
              "d": "דגים טריים לאורך כל הערב, נאים, צרובים או אפויים; לשיקולכם, לצד גבינות ירקות ומאפים משובחים."
            },
            {
              "n": "בשרי",
              "d": "צלייה, אש וטעמים עמוקים. תפריט עוצמתי שנבנה סביב נתח מרכזי ומשלב שלל של מנות בטעמים מטורפים."
            }
          ],
          "cols": 3,
          "req": true
        },
        {
          "kind": "title",
          "label": "סגנון"
        },
        {
          "kind": "grid",
          "id": "style",
          "options": [
            "איטלקי",
            "אסייאתי",
            "מזרח תיכוני",
            "דיינר אמריקאי",
            "מקסיקני",
            "יווני"
          ],
          "cols": 4,
          "boxy": true,
          "req": true,
          "lock": "concept"
        },
        {
          "kind": "title",
          "label": "איך המסלול שלנו הולך להראות"
        },
        {
          "kind": "fine",
          "label": "* המחיר משתנה בהתאם לכמות הסועדים *"
        },
        {
          "kind": "tiers",
          "id": "tier",
          "options": [
            "8 סוגי מנות",
            "10 סוגי מנות",
            "12 סוגי מנות"
          ],
          "req": true,
          "lock": "concept"
        }
      ],
      [
        {
          "kind": "head",
          "label": "מה הטעמים המועדפים עליכם"
        },
        {
          "kind": "note",
          "label": "כאן אני מבינה עד כמה להעז.",
          "tight": true
        },
        {
          "kind": "title",
          "label": "איך אתם אוהבים את הבשר שלכם",
          "when": {
            "id": "concept",
            "is": "בשרי"
          }
        },
        {
          "kind": "multi",
          "id": "meatDone",
          "options": [
            "נא",
            "מדיום רר",
            "מדיום",
            "מדיום וול",
            "עשוי היטב"
          ],
          "when": {
            "id": "concept",
            "is": "בשרי"
          }
        },
        {
          "kind": "title",
          "label": "איך אתם אוהבים את הדגים שלכם",
          "when": {
            "id": "concept",
            "is": "חלבי · דגים"
          }
        },
        {
          "kind": "multi",
          "id": "fishDone",
          "options": [
            "נא",
            "מדיום",
            "עשוי היטב"
          ],
          "when": {
            "id": "concept",
            "is": "חלבי · דגים"
          }
        },
        {
          "kind": "title",
          "label": "דגים שאתם אוהבים במיוחד",
          "when": {
            "id": "concept",
            "is": "חלבי · דגים"
          }
        },
        {
          "kind": "multi",
          "id": "fish",
          "options": [
            "סלמון",
            "טונה אדומה",
            "דניס",
            "לברק",
            "מוסר ים",
            "סומכים עלייך"
          ],
          "when": {
            "id": "concept",
            "is": "חלבי · דגים"
          }
        },
        {
          "kind": "title",
          "label": "חריפות"
        },
        {
          "kind": "grid",
          "id": "spice",
          "options": [
            "בלי בכלל",
            "עדין",
            "אוהבים מאוד"
          ],
          "boxy": true,
          "req": true
        },
        {
          "kind": "title",
          "label": "רמת הרפתקנות"
        },
        {
          "kind": "grid",
          "id": "brave",
          "options": [
            "קלאסי ומוכר",
            "באמצע",
            "הפתיעי אותנו"
          ],
          "boxy": true,
          "req": true
        },
        {
          "kind": "note",
          "label": "״הפתיעי אותנו״ פותח לי דלת למרקמים וטעמים שלא בהכרח פגשתם.",
          "tight": true
        },
        {
          "kind": "title",
          "label": "טעמים שאתם אוהבים במיוחד"
        },
        {
          "kind": "text",
          "id": "love",
          "ph": "חמוץ, מעושן, פטריות, לימון כבוש…"
        }
      ],
      [
        {
          "kind": "head",
          "label": "מה לא ייכנס לתפריט"
        },
        {
          "kind": "note",
          "label": "החלק הכי חשוב בשאלון! עדיף לפרט יותר מדי מאשר פחות.",
          "tight": true
        },
        {
          "kind": "title",
          "label": "אלרגיות ורגישויות"
        },
        {
          "kind": "multi",
          "id": "allergy",
          "options": [
            "אין אלרגיות",
            "גלוטן",
            "לקטוז",
            "אגוזים",
            "בוטנים",
            "שומשום",
            "ביצים",
            "דגים",
            "סויה"
          ],
          "req": true
        },
        {
          "kind": "text",
          "id": "allergyTxt",
          "ph": "פירוט — למי מהסועדים, ובאיזו חומרה"
        },
        {
          "kind": "title",
          "label": "מאכלים שאתם פשוט לא אוהבים"
        },
        {
          "kind": "multi",
          "id": "dislike",
          "options": [
            "כוסברה",
            "חצילים",
            "פטריות",
            "זיתים",
            "עגבניות",
            "גבינה כחולה",
            "סלק",
            "ארטישוק",
            "כמהין"
          ]
        },
        {
          "kind": "text",
          "id": "dislikeTxt",
          "ph": "עוד משהו שלא נכנס לצלחת"
        },
        {
          "kind": "title",
          "label": "מגבלות תזונתיות"
        },
        {
          "kind": "multi",
          "id": "diet",
          "options": [
            "צמחוני",
            "טבעוני",
            "ללא גלוטן",
            "הריון",
            "ילדים"
          ]
        }
      ],
      [
        {
          "kind": "head",
          "label": "פרטים נוספים"
        },
        {
          "kind": "title",
          "label": "המטבח במקום"
        },
        {
          "kind": "note",
          "label": "כל המנות נעשות אצלכם בזמן אמת, ולכן חשוב שיהיה במקום: מקרר, גז, תנור וברז מים.",
          "tight": true
        },
        {
          "kind": "grid",
          "id": "kitchen",
          "options": [
            "הכול קיים",
            "חסר משהו",
            "לא בטוחים"
          ],
          "narrow": true,
          "req": true
        },
        {
          "kind": "text",
          "id": "kitchenTxt",
          "ph": "אם חסר משהו — מה בדיוק"
        },
        {
          "kind": "title",
          "label": "משהו שחשוב לכם שיהיה"
        },
        {
          "kind": "note",
          "label": "מנה שחלמתם עליה, מרכיב שאתם אוהבים, או פשוט הסיפור מאחורי הערב.",
          "tight": true
        },
        {
          "kind": "title",
          "label": "סוג האירוע"
        },
        {
          "kind": "grid",
          "id": "occasion",
          "options": [
            "ערב זוגי",
            "יום הולדת",
            "הצעת נישואין",
            "ערב עם חברים",
            "אירוע משפחתי",
            "אירוע עסקי",
            "מסיבת רווקים/ות",
            "סתם כי מגיע"
          ],
          "cols": 2,
          "boxy": true,
          "maxw": "310px"
        },
        {
          "kind": "title",
          "label": "בקשה ספציפית"
        },
        {
          "kind": "text",
          "id": "wish",
          "ph": "למשל: חייבת להיות פסטה עם פטריות / אמא אוהבת דג שלם על השולחן"
        },
        {
          "kind": "title",
          "label": "עוד משהו שכדאי שאדע"
        },
        {
          "kind": "text",
          "id": "notes2",
          "ph": "הפתעה לבן הזוג, אורח שמגיע מאוחר, חניה מסובכת…"
        }
      ],
      [
        {
          "kind": "head",
          "label": "אפשר גם להעלות הילוך"
        },
        {
          "kind": "note",
          "label": "אופציונלי לגמרי, אבל שווה לדעת שזה קיים.",
          "tight": true
        },
        {
          "kind": "cards",
          "id": "extras",
          "options": [
            {
              "n": "עיצוב שולחן יוקרתי",
              "d": "סכו״ם, צלחות, כוסות, מפיות וקשים, כולל תפריט מעוצב ומודפס לכל סועד. תוספת 250-550 ₪ סה״כ בהתאם לכמות הסועדים. (השולחן והכיסאות עליכם)"
            },
            {
              "n": "חבילת שתייה ללא הגבלה",
              "d": "4 סוגי בקבוקי שתייה קלה אישיים, מים מינרליים וסודה משותפים, יין לבן או אדום. תוספת 120 ₪ לסועד."
            }
          ],
          "multi": true,
          "one": true
        },
        {
          "kind": "note",
          "label": "אפשר לסמן את שניהם, אחד, או להמשיך בלי כלום.",
          "tight": true
        }
      ],
      [
        {
          "kind": "head",
          "label": "השארת פרטים לחזרה"
        },
        {
          "kind": "gap"
        },
        {
          "kind": "pairtext",
          "ids": [
            "name",
            "phone"
          ],
          "labels": [
            "שם מלא",
            "טלפון"
          ],
          "phs": [
            "שם ושם משפחה",
            "050-0000000"
          ],
          "req": true
        },
        {
          "kind": "title",
          "label": "תאריך האירוע"
        },
        {
          "kind": "cal",
          "id": "date",
          "req": true
        },
        {
          "kind": "title",
          "label": "באילו שעות"
        },
        {
          "kind": "grid",
          "id": "daypart",
          "options": [
            "בוקר",
            "צהריים",
            "ערב"
          ],
          "cols": 3,
          "boxy": true,
          "req": true
        },
        {
          "kind": "title",
          "label": "כתובת מלאה"
        },
        {
          "kind": "addr",
          "id": "addr",
          "ph": "התחילו להקליד רחוב…",
          "req": true
        }
      ]
    ]
  },
  {
    "key": "taboon",
    "short": "עמדת טאבון",
    "name": "עמדת טאבון",
    "base": 0,
    "price": "החל מ- 180 ש״ח לסועד",
    "desc": "פיצות נאפות במקום · 10 עד 25 סועדים.",
    "title": "עמדת טאבון 🔥",
    "intro": [
      {
        "text": "עמדת הטאבון מגיעה לאירועים של 10 עד 25 סועדים.",
        "w": "600",
        "size": "14.5px",
        "fg": "#2A2430"
      },
      {
        "text": "שעה וחצי של אוכל ללא הגבלה, בסגנון בופה על שולחן בוצ׳ר מעוצב.",
        "w": "300",
        "size": "13px",
        "fg": "#7D7488"
      },
      {
        "text": "הפיצות נאפות במקום, לעיני האורחים, ולפי הטעם האישי של כל אורח.",
        "w": "300",
        "size": "13px",
        "fg": "#7D7488"
      },
      {
        "text": "המחיר כולל את כל חומרי הגלם ואת כלי ההגשה.",
        "w": "300",
        "size": "13px",
        "fg": "#7D7488"
      },
      {
        "text": "לא כולל כלי אוכל אישיים ועיצוב שולחן.",
        "w": "300",
        "size": "13px",
        "fg": "#7D7488"
      },
      {
        "text": "ניתן לשדרג בתוספת מחיר.",
        "w": "300",
        "size": "13px",
        "fg": "#7D7488"
      },
      {
        "text": "פיצות נפוליטנות מבצק שהותפח 72 שעות, נאפות בטאבון אבן.",
        "w": "400",
        "size": "13px",
        "fg": "#4A4254"
      },
      {
        "text": "ארבעה סוגי גבינות.",
        "w": "400",
        "size": "13px",
        "fg": "#4A4254"
      },
      {
        "text": "רוטב פיצה ורוטב שמנת בשמל.",
        "w": "400",
        "size": "13px",
        "fg": "#4A4254"
      },
      {
        "text": "מבחר תוספות: אנטיפסטי, שרי קונפי, שום קונפי, פטריות, זיתים, תירס, בולגרית, פלפל חריף קלוי, בוראטה, פרוסות תפוחי אדמה בעשבי תיבול ועוד...",
        "w": "400",
        "size": "13px",
        "fg": "#4A4254"
      },
      {
        "text": "מסלול בסיס כולל : 3 סלטים · 2 פסטות · 2 קינוחים.",
        "w": "400",
        "size": "13px",
        "fg": "#4A4254"
      }
    ],
    "pages": [
      [
        {
          "kind": "title",
          "label": "מספר סועדים",
          "flush": true
        },
        {
          "kind": "note",
          "label": "בין 10 ל-25 סועדים.",
          "tight": true
        },
        {
          "kind": "stepper",
          "id": "guests",
          "min": 10,
          "max": 25,
          "step": 1,
          "unit": "סועדים",
          "slim": true
        },
        {
          "kind": "title",
          "label": "סלטים",
          "link": "salads",
          "cap": 3
        },
        {
          "kind": "note",
          "label": "כל סלט נוסף בתוספת של 20 ₪ לסועד.",
          "tight": true
        },
        {
          "kind": "multicap",
          "id": "salads",
          "options": [
            {
              "n": "סלט קיסר",
              "d": "לבבות חסה ועלי אנדיב, פרמז׳ן וקרוטונים ברוטב קיסר"
            },
            {
              "n": "סלט יווני",
              "d": "חסה, עגבניות, מלפפונים, בצל סגול, פטה, זיתי קלמטה וקרוטונים"
            },
            {
              "n": "סלט קפרזה",
              "d": "מגוון שרי צבעוני, בזיליקום, זיתי קלמטה ומוצרלה ברוטב בלסמי"
            },
            {
              "n": "סלט טאבולה",
              "d": "טאבולה ועדשים שחורות, בטטה, אגוזי מלך, חמוציות, בצל ירוק וכוסברה"
            },
            {
              "n": "סלט פאטוש",
              "d": "חיתוכי פיתה זעתר, עגבניות, מלפפונים, גמבה, בצל סגול, בולגרית וקלמטה"
            },
            {
              "n": "סלט עלים",
              "d": "עלי בייבי ורוקט, פקאן מסוכר ופירות העונה בוויניגרט הדרים"
            },
            {
              "n": "סלט כרוב מוקפץ",
              "d": "כרוב לבן, חמוציות, שומשום קלוי, גרעיני דלעת ונודלס קראנצ׳י ברוטב אסייתי"
            }
          ],
          "cap": 3,
          "req": true,
          "note": "כל בחירת סלט נוסף בתוספת 20 ש״ח לסועד."
        }
      ],
      [
        {
          "kind": "head",
          "label": "פסטות",
          "link": "pastas",
          "cap": 2
        },
        {
          "kind": "note",
          "label": "כל פסטה נוספת בתוספת של 25 ₪ לסועד.",
          "tight": true
        },
        {
          "kind": "fine",
          "label": "בחרו רוטב על מנת לבחור את סוג הפסטה"
        },
        {
          "kind": "sauces",
          "id": "pastas",
          "options": [
            {
              "n": "נפוליטנה · עגבניות",
              "d": "עגבניות צלויות, שום ועלי בזיליקום טריים"
            },
            {
              "n": "ארביאטה · עגבניות · חריף",
              "d": "עגבניות שרי צלויות, שום, צ׳ילי חריף ובזיליקום"
            },
            {
              "n": "אלי אוליו · שמן זית",
              "d": "שמן זית, שום, עשבי תיבול, עגבניות מיובשות וזיתי קלמטה"
            },
            {
              "n": "פסטו · שמן זית",
              "d": "שמן זית, שום, עלי בזיליקום, צנוברים ופרמז׳ן"
            },
            {
              "n": "זוקיני · שמן זית · חריף",
              "d": "שמן זית, שום, טימין, צ׳ילי חריף וזוקיני צלוי"
            },
            {
              "n": "אלפרדו פונגי · שמנת",
              "d": "שמנת, חמאה, שום, יין ופטריות טריות צלויות"
            },
            {
              "n": "אלפרדו בטטה · שמנת",
              "d": "שמנת, חמאה, שום, יין ובטטה צלויה"
            },
            {
              "n": "רוזה",
              "d": "שילוב בין נפוליטנה לאלפרדו"
            }
          ],
          "cap": 2,
          "req": true,
          "note": "כל בחירת פסטה נוספת בתוספת 25 ש״ח לסועד."
        }
      ],
      [
        {
          "kind": "head",
          "label": "קינוחים",
          "link": "desserts",
          "cap": 2
        },
        {
          "kind": "note",
          "label": "כל קינוח נוסף בתוספת של 20 ₪ לסועד.",
          "tight": true
        },
        {
          "kind": "multicap",
          "id": "desserts",
          "options": [
            {
              "n": "קלצונה במילוי נוטלה",
              "d": "נאפית במקום בטאבון"
            },
            {
              "n": "קייאק פירות העונה",
              "d": "פירות טריים לפי מה שהשוק נותן"
            },
            {
              "n": "קרם ברולה",
              "d": "קלאסי, עם קרמל שרוף"
            },
            {
              "n": "פבלובה",
              "d": "במילוי מסקרפונה ותותים"
            },
            {
              "n": "בראד פודינג",
              "d": "לצד גלידת וניל"
            },
            {
              "n": "פונדנט שוקולד חם",
              "d": "לצד קצפת"
            }
          ],
          "cap": 2,
          "req": true,
          "note": "כל בחירת קינוח נוסף בתוספת 20 ש״ח לסועד."
        }
      ],
      [
        {
          "kind": "head",
          "label": "אפשר גם להעלות הילוך"
        },
        {
          "kind": "note",
          "label": "אופציונלי לגמרי, אבל שווה לדעת שזה קיים.",
          "tight": true
        },
        {
          "kind": "note",
          "label": "המחירים המוצגים הם תוספת לסועד.",
          "tight": true
        },
        {
          "kind": "title",
          "label": "מנות ראשונות · 25 ₪ לסועד"
        },
        {
          "kind": "multi",
          "id": "firsts",
          "options": [
            "קרפצ׳יו סלק",
            "פילה חציל",
            "ארטישוק א-לה רומנה",
            "אנטיפסטי בטאבון"
          ],
          "cols": 2,
          "maxw": "292px"
        },
        {
          "kind": "gap"
        },
        {
          "kind": "cards",
          "id": "textras",
          "options": [
            {
              "n": "מנות דג בטאבון",
              "p": "55 ₪",
              "d": "פילה סלמון, לברק או דניס בתערובת תבלינים וחמאה או עשבי תיבול, נאפים במקום.",
              "per": 55
            },
            {
              "n": "שולחן קינוחים מעוצב",
              "p": "40 ₪",
              "d": "קינוחים אישיים מוגשים על שולחן מעוצב.",
              "per": 40
            },
            {
              "n": "ממשותף לאישי",
              "p": "20 ₪",
              "d": "עריכה בכלים אישיים של הסלטים והפסטות על עמדת הבופה, במקום הגשה משותפת.",
              "per": 20
            },
            {
              "n": "עיצוב שולחן יוקרתי",
              "p": "250–450 ₪ סה״כ",
              "d": "סכו״ם, צלחות, מפיות, כוסות וקשים, כולל תפריט מעוצב ומודפס לכל סועד. (השולחן והכיסאות עליכם)",
              "tiered": true
            }
          ],
          "multi": true
        }
      ],
      [
        {
          "kind": "head",
          "label": "אלרגיות ומה לא נכנס"
        },
        {
          "kind": "note",
          "label": "גם כשאתם בוחרים את התפריט; חשוב לי לדעת מה לא יכול להתקרב לצלחת",
          "tight": true
        },
        {
          "kind": "title",
          "label": "אלרגיות ורגישויות"
        },
        {
          "kind": "multi",
          "id": "tAllergy",
          "options": [
            "אין אלרגיות",
            "גלוטן",
            "לקטוז",
            "אגוזים",
            "בוטנים",
            "שומשום",
            "ביצים",
            "דגים"
          ],
          "cols": 3,
          "req": true
        },
        {
          "kind": "text",
          "id": "tAllergyTxt",
          "ph": "פירוט — למי מהסועדים, ובאיזו חומרה"
        },
        {
          "kind": "title",
          "label": "מגבלות תזונתיות"
        },
        {
          "kind": "multi",
          "id": "tDiet",
          "options": [
            "צמחוני",
            "טבעוני",
            "ללא גלוטן",
            "הריון",
            "ילדים"
          ],
          "cols": 3
        },
        {
          "kind": "title",
          "label": "מה לא לשים על הפיצה"
        },
        {
          "kind": "text",
          "id": "tDislike",
          "ph": "למשל: בלי זיתים, בלי חריף לילדים"
        },
        {
          "kind": "title",
          "label": "המקום להצבת העמדה"
        },
        {
          "kind": "note",
          "label": "אני מגיעה עם טאבון אבן ועמדת בופה, אז צריך שטח פתוח או מרפסת, נקודת חשמל וגישה למים.",
          "tight": true
        },
        {
          "kind": "grid",
          "id": "tSpace",
          "options": [
            "הכול קיים",
            "חסר משהו",
            "לא בטוחים"
          ],
          "boxy": true,
          "req": true
        },
        {
          "kind": "text",
          "id": "tSpaceTxt",
          "ph": "קומה, גישה, חצר או מרפסת — כל פרט עוזר"
        }
      ],
      [
        {
          "kind": "head",
          "label": "השארת פרטים לחזרה"
        },
        {
          "kind": "gap"
        },
        {
          "kind": "pairtext",
          "ids": [
            "name",
            "phone"
          ],
          "labels": [
            "שם מלא",
            "טלפון"
          ],
          "phs": [
            "שם ושם משפחה",
            "050-0000000"
          ],
          "req": true
        },
        {
          "kind": "title",
          "label": "תאריך האירוע"
        },
        {
          "kind": "cal",
          "id": "date",
          "req": true
        },
        {
          "kind": "title",
          "label": "באילו שעות"
        },
        {
          "kind": "grid",
          "id": "daypart",
          "options": [
            "בוקר",
            "צהריים",
            "ערב"
          ],
          "cols": 3,
          "boxy": true,
          "req": true
        },
        {
          "kind": "title",
          "label": "כתובת מלאה"
        },
        {
          "kind": "addr",
          "id": "addr",
          "ph": "התחילו להקליד רחוב…",
          "req": true
        }
      ]
    ]
  }
];

const DELIVERY_STEP_MINUTES = 20;

export const CHEF_FULFILLMENT = {
  pickupFrom: 540,
  pickupTo: 900,
  deliverySlots: buildSlots(540, 900, DELIVERY_STEP_MINUTES),
  clockFallback: '10:00',
} as const;

const bracketOf = (g: number) => (g <= 4 ? '2-4' : g <= 11 ? '5-11' : '12-16');

/** מחיר לסועד בארוחת שף · לפי ציר, מספר סועדים ומסלול */
export function chefPerGuest(picks: Record<string, any>): number {
  const fam = CONCEPT_FAM[picks.concept];
  const t = TIERS.indexOf(picks.tier);
  if (!fam || t < 0) return 0;
  return CHEF_PRICES[fam][bracketOf(picks.guests || 2)][t];
}

const extraPrice = (name: string, guests: number): number => {
  if (name === 'שתייה') return EXTRA_DRINK;
  const key = bracketOf(guests);
  return EXTRA_TABLE[key] ?? 0;
};

export const extrasTotal = (picks: Record<string, any>): number =>
  ((picks.extras as string[]) || []).reduce((sum, n) => sum + extraPrice(n, picks.guests || 0), 0);

/** מחיר לראש בטאבון · יורד במדרגות לפי מספר הסועדים */
export function taboonPerHead(g: number): number {
  if (!g) return 0;
  for (const [upTo, price] of TABOON_TIERS) if (g <= upTo) return price;
  return TABOON_TIERS[TABOON_TIERS.length - 1][1];
}

const tExtra = (name: string) => (T_EXTRAS as readonly any[]).find((e) => e.n === name);

const taboonTable = (g: number): number => {
  for (const [upTo, price] of T_TABLE) if (g <= upTo) return price;
  return T_TABLE[T_TABLE.length - 1][1];
};

/** תוספות שנספרות לכל ראש · ראשונות, וכל מנה מעבר למכסה הכלולה */
export function taboonAddPerHead(picks: Record<string, any>): number {
  const len = (id: string) => ((picks[id] as unknown[]) || []).length;
  const pastas: { up?: boolean }[] = picks.pastas || [];
  let add = len('firsts') * FIRST_EXTRA;
  add += Math.max(0, len('salads') - SALAD_BASE) * SALAD_EXTRA;
  add += Math.max(0, len('desserts') - DESSERT_BASE) * DESSERT_EXTRA;
  add += Math.max(0, pastas.length - PASTA_BASE) * PASTA_EXTRA;
  add += pastas.filter((x) => x.up).length * PASTA_UP_EXTRA;
  ((picks.textras as string[]) || []).forEach((nm) => {
    const e = tExtra(nm);
    if (e && e.per) add += e.per;
  });
  return add;
}

/** תוספות בתשלום חד־פעמי · שולחן ערוך לפי גודל הקבוצה */
export const taboonFlat = (picks: Record<string, any>): number =>
  ((picks.textras as string[]) || []).reduce((sum, nm) => {
    const e = tExtra(nm);
    return sum + (e && e.tiered ? taboonTable(picks.guests || 0) : 0);
  }, 0);

export function priceOfPackage(pkg: ChefPackage, picks: Record<string, any>): number {
  const g = picks.guests || 0;
  if (pkg.key === 'chef') return g * chefPerGuest(picks) + extrasTotal(picks);
  return g * (taboonPerHead(g) + taboonAddPerHead(picks)) + taboonFlat(picks);
}
