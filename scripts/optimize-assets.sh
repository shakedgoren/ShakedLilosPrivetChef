#!/usr/bin/env bash
# מקטין כל תמונה ב-design/app/assets לגודל שהקנבס מקבל (~50KB).
# המקור נשמר ב-assets/originals ואינו נאסף ל-seed.
set -euo pipefail
cd "$(dirname "$0")/.."
DIR=design/app/assets
mkdir -p "$DIR/originals"
LIMIT=$((52*1024))

shopt -s nullglob
for f in "$DIR"/*.png "$DIR"/*.jpg "$DIR"/*.jpeg; do
  base=$(basename "$f")
  # שומרים מקור פעם אחת בלבד
  [ -f "$DIR/originals/$base" ] || cp "$f" "$DIR/originals/$base"
  size=$(stat -f%z "$f")
  [ "$size" -le "$LIMIT" ] && continue

  src="$DIR/originals/$base"
  alpha=$(sips -g hasAlpha "$src" 2>/dev/null | awk '/hasAlpha/{print $2}')
  name="${base%.*}"

  if [ "$alpha" = "yes" ]; then
    # שקיפות · חייב להישאר PNG, מקטינים ברזולוציה
    for w in 420 320 240 180 140; do
      sips -Z $w "$src" --out "$f" >/dev/null 2>&1
      [ "$(stat -f%z "$f")" -le "$LIMIT" ] && break
    done
  else
    # בלי שקיפות · JPEG חוסך פי כמה
    out="$DIR/$name.jpg"
    for q in 70 60 50 40; do
      for w in 900 720 600 480; do
        sips -s format jpeg -s formatOptions $q -Z $w "$src" --out "$out" >/dev/null 2>&1
        [ "$(stat -f%z "$out")" -le "$LIMIT" ] && break 2
      done
    done
    [ "$f" = "$out" ] || rm -f "$f"
    f="$out"
  fi
  printf "  %-30s %6.1f KB\n" "$(basename "$f")" "$(echo "scale=1; $(stat -f%z "$f")/1024" | bc)"
done
shopt -u nullglob
