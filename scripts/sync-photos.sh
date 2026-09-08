#!/bin/bash
# מעביר את התמונות מהקנבס אל האפליקציה.
#
# בקנבס יש שני עותקים לכל תמונה: assets/ (מוקטן) ו-assets/originals/ (מקור).
# לרוב המקור גדול יותר, אבל ב-home-1..10 דווקא התיקייה הראשית מחזיקה את
# הגרסה הנכונה 800×940 בעוד originals נשאר עם הריבועיות הישנות.
# לכן הכלל כאן אובייקטיבי: לכל שם קובץ נבחרת הגרסה עם יותר פיקסלים.
#
# הגודל נקבע לפי מה שהתמונה באמת צריכה במסך, פי שניים לרטינה —
# הגדלים לקוחים מהטבלה ב-design/app/assets/README.md.
set -e
cd "$(dirname "$0")/.."

SRC="design/app/assets"
DST="mobile/assets/photos"
QUALITY=72

# הצלע הארוכה לכל סוג תמונה · פי שניים מגודל התצוגה
side_for() {
  case "$1" in
    logo.png)            echo 180 ;;
    logo-wide.jpg)       echo 560 ;;
    cat-*|home-*)        echo 940 ;;   # 342×400 בתצוגה
    dish-couscous-*)     echo 160 ;;   # 61×61
    dish-schnitzel-*|schnitzel-*) echo 400 ;;   # 158×79
    box-*)               echo 400 ;;   # 63×63 באריח, ורצועות עד 190px
    tray-*)              echo 400 ;;   # 154×121
    chef-*|tabon-*)      echo 800 ;;   # 328×178
    parking-*)           echo 800 ;;   # מפה ברוחב מלא
    *)                   echo 800 ;;
  esac
}

rm -rf "$DST"
mkdir -p "$DST"
picked_orig=0

for path in "$SRC"/*.jpg "$SRC"/*.png; do
  [ -e "$path" ] || continue
  name=$(basename "$path")
  orig="$SRC/originals/$name"

  src="$path"
  if [ -f "$orig" ]; then
    a=$(( $(sips -g pixelWidth "$path" | tail -1 | awk '{print $2}') * $(sips -g pixelHeight "$path" | tail -1 | awk '{print $2}') ))
    b=$(( $(sips -g pixelWidth "$orig" | tail -1 | awk '{print $2}') * $(sips -g pixelHeight "$orig" | tail -1 | awk '{print $2}') ))
    if [ "$b" -gt "$a" ]; then src="$orig"; picked_orig=$((picked_orig+1)); fi
  fi

  cp "$src" "$DST/$name"
  sips -Z "$(side_for "$name")" "$DST/$name" >/dev/null 2>&1
  # PNG נשאר PNG כדי לשמור על השקיפות של הלוגו
  case "$name" in *.jpg) sips -s formatOptions "$QUALITY" "$DST/$name" >/dev/null 2>&1 ;; esac
done

echo "הועתקו: $(ls "$DST" | wc -l | tr -d ' ') קבצים · מ-originals: $picked_orig"
echo "משקל: $(du -sh "$DST" | cut -f1)"
