#!/bin/bash
# בונה את תיקיית הפרסום מהקובץ הראשי.
# מקור אמת יחיד: chef-questionnaire.html. site/ נוצרת מחדש בכל בנייה
# ולכן אי אפשר לפרסם בטעות גרסה ישנה.
set -e
cd "$(dirname "$0")"

rm -rf site
mkdir -p site
cp chef-questionnaire.html site/index.html
cp static/_headers  site/_headers
cp static/robots.txt site/robots.txt

echo "✓ site/ נבנתה מ-chef-questionnaire.html"
if grep -q "⚠" site/index.html; then
  echo "⚠️  שימו לב: יש עדיין טקסט זמני (⚠) באתר."
fi
