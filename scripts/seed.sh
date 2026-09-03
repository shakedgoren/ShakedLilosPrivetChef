#!/usr/bin/env bash
# בונה מחדש את הקנבס · אוסף אוטומטית כל תמונה מ-design/app/assets
set -euo pipefail
cd "$(dirname "$0")/.."
: "${SK:?צריך SK=<נתיב לסקיל design>}"

BOARDS=(Main Guest Login Admin AdminOrders AdminBoard AdminDays AdminMoney
        AdminShopping AdminHistory AdminStock AdminCustomers AdminMenu AdminCosts
        Order Schnitzel Boxes Fruit Chef MyOrders Profile)

args=()
for f in "${BOARDS[@]}"; do args+=(--artboard "design/app/$f.dc.html"); done
"$(dirname "$0")/optimize-assets.sh"

shopt -s nullglob
for img in design/app/assets/*.png design/app/assets/*.jpg design/app/assets/*.jpeg design/app/assets/*.webp design/app/assets/*.svg; do args+=(--image "$img"); done
shopt -u nullglob

node "$SK/seed-canvas.mjs" --template "$SK/payload.template.html" \
  --out shaked-liloz-glass-app.html --title "BITE and TELL" \
  "${args[@]}" --canvas design/app/canvas.json
node "$SK/seed-canvas.mjs" --check shaked-liloz-glass-app.html
