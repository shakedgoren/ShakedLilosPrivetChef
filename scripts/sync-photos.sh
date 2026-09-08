#!/bin/bash
# מעתיק את תמונות הקנבס אל האפליקציה.
#
# כלל ברזל: האפליקציה צורכת את originals/, לא את המוקטנות ב-assets/.
# אין הקטנה ב-sips — הקבצים נכנסים בגודל המקור.
# home-1..10 יצאו ריבועיים 800×800; משתמשים במה שיש, בלי לייצר מחדש.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC="design/app/assets/originals"
FALLBACK="design/app/assets"
DST="mobile/assets/photos"

rm -rf "$DST"
mkdir -p "$DST"

copied=0
from_fallback=0
for path in "$SRC"/*.jpg "$SRC"/*.png "$FALLBACK"/*.jpg "$FALLBACK"/*.png; do
  [ -e "$path" ] || continue
  name=$(basename "$path")
  if [ -e "$DST/$name" ]; then
    continue
  fi
  # originals קודם · אם חסר שם, נופלים ל-assets/
  if [ -f "$SRC/$name" ]; then
    cp "$SRC/$name" "$DST/$name"
  else
    cp "$FALLBACK/$name" "$DST/$name"
    from_fallback=$((from_fallback + 1))
  fi
  copied=$((copied + 1))
done

cat > "$DST/README.md" <<'EOF'
# תמונות האפליקציה

עותק של `design/app/assets/originals/` — **לא** של המוקטנות ב-`design/app/assets/`.

לעדכון אחרי העלאת תמונה חדשה לקנבס:

```bash
bash scripts/sync-photos.sh
node scripts/emit-photos.mjs
```

שלוש תמונות עדיין חסרות (שקד סימנה באדום, יגיעו בהמשך):
ממשותף לאישי · שולחן קינוחים מעוצב · חבילת שתייה ללא הגבלה
EOF

echo "הועתקו: $copied קבצים · נפילה ל-assets/: $from_fallback"
echo "משקל: $(du -sh "$DST" | cut -f1)"
