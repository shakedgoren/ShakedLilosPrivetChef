#!/bin/bash
# =============================================================
# בונה את dist/ — האתר שיושב על bite-and-tell.com
# =============================================================
# עמוד הנחיתה בשורש, גרסת הדפדפן של האפליקציה תחת /app.
#
# ⚠ **למה מקור אחד ולא שני אתרים · 23 בספטמבר 2026** · שקד
# ביקשה שהאתר יישב על הכתובת הזו, ושבטלפון תוצג התצוגה של
# האפליקציה. הפיצול לתת-דומיין היה שובר את הדפדפן: השרת מתיר
# פנייה רק ממקורות שרשומים ב-`CORS_ORIGINS`, ומקור כולל את שם
# המתחם. `bite-and-tell.com/app` נשאר אותו מקור בדיוק, ולכן
# שום הגדרה בשרת לא צריכה להשתנות.
#
# ⚠ **התיקייה נבנית מאפס בכל פעם** · אחרת קובץ שנמחק מהמאגר
# נשאר חי באתר.
set -e
cd "$(dirname "$0")/.."

OUT="dist"
rm -rf "$OUT"
mkdir -p "$OUT"

# ---------- 1 · עמוד הנחיתה → השורש -------------------------
cp -R landing/. "$OUT"/
# ⚠ **לא מעתיקים static/_headers ו-static/robots.txt** · הם של
# שאלון השף ונושאים `noindex, nofollow` ו-`Disallow: /`.
# עמוד הנחיתה מביא robots.txt משלו מתוך landing/.
rm -f "$OUT"/.DS_Store

# ---------- 2 · האפליקציה → /app -----------------------------
# ⚠ `npm ci` רק כשאין node_modules · על Render אין, אצלנו יש
if [ ! -d mobile/node_modules ]; then
  echo "· מתקין תלויות של mobile"
  ( cd mobile && npm ci )
fi

# ⚠ `--clear` בתוך build:web · Metro החזיר פעם באנדל ממטמון
# אחרי שינוי ב-.env, וכתובת שרת מקומית נצרבה לפרודקשן
echo "· מייצא את גרסת הדפדפן"
( cd mobile && npm run build:web )

mkdir -p "$OUT/app"
cp -R mobile/dist/. "$OUT/app"/

# ---------- 2ב · צבע הסרגלים של הדפדפן ----------------------
# ⚠ **שקד, 11 באוקטובר 2026** · ״הלמעלה והלמטה של העמוד בלבן ולא
# מתמזג הכל יחד״. זה לא הדף אלא הכרום של ספארי: אזור שורת המצב
# למעלה וסרגל הכתובת למטה נצבעים לפי `theme-color`, ובהיעדרו הם
# לבנים — ולכן הדף הלילכי ישב בין שתי רצועות לבנות.
#
# ⚠ **למה כאן ולא בקוד** · את ה-HTML של גרסת הדפדפן מייצר
# `expo export`, ואין בפרויקט תבנית משלנו לערוך. הזרקה בזמן ריצה
# הייתה נכנסת רק אחרי שה-JS נטען, כלומר אחרי הבזק לבן.
#
# ⚠ הערך זהה ל-`surface.ground` ולמה שבעמוד הנחיתה.
if ! grep -q 'name="theme-color"' "$OUT/app/index.html"; then
  sed -i 's|</head>|<meta name="theme-color" content="#F3EFFA"/></head>|' "$OUT/app/index.html"
fi

# ---------- 3 · בדיקות שחייבות לעבור ------------------------
fail=0
check() { if [ -e "$1" ]; then echo "  ✓ $1"; else echo "  ✗ חסר: $1"; fail=1; fi }
echo "· בדיקה"
check "$OUT/index.html"
check "$OUT/style.css"
check "$OUT/img/logo.webp"
check "$OUT/img/favicon.png"
# ⚠ **מפת ההגעה נשלחת בוואטסאפ** · Green API מוריד אותה מהכתובת
# הציבורית הזו · חסרה = לקוחה שמקבלת אישור בלי מפה, בשקט.
# נוצרת בידי scripts/build-pickup-map.py · ראו whatsapp/pickupPlace.ts
check "$OUT/img/pickup-map.jpg"
# ⚠ בלי זה ספארי צובע את הסרגלים בלבן · ראו מקטע 2ב
if grep -q 'name="theme-color"' "$OUT/app/index.html" && grep -q 'name="theme-color"' "$OUT/index.html"; then
  echo "  ✓ theme-color בשני המשטחים"
else
  echo "  ✗ חסר theme-color"
  fail=1
fi
check "$OUT/robots.txt"
check "$OUT/app/index.html"

# ⚠ **הבדיקה החשובה** · בלי baseUrl=/app ה-HTML של האפליקציה
# מבקש /_expo/... מהשורש ומקבל את עמוד הנחיתה במקום את הקוד.
# הכישלון הזה שקט: מסך לבן בלי שגיאת רשת אחת.
if grep -q '"/app/_expo/\|=/app/_expo/\|src="/app/_expo/' "$OUT/app/index.html"; then
  echo "  ✓ נתיבי הבאנדל מקדימים /app"
else
  echo "  ✗ הבאנדל לא מקדים /app — experiments.baseUrl באפליקציה?"
  grep -o 'src="[^"]*"' "$OUT/app/index.html" | head -3
  fail=1
fi

# ⚠ עמוד הנחיתה לא נדרס על ידי index.html של האפליקציה
if grep -q 'dir="rtl"' "$OUT/index.html"; then
  echo "  ✓ השורש הוא עמוד הנחיתה"
else
  echo "  ✗ בשורש יושב הקובץ הלא נכון"
  fail=1
fi

[ "$fail" = 0 ] || { echo "✗ הבנייה נכשלה"; exit 1; }
echo "✓ dist/ מוכנה · $(find "$OUT" -type f | wc -l | tr -d ' ') קבצים · $(du -sh "$OUT" | cut -f1)"
