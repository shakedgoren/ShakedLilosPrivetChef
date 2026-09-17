#!/bin/bash
# בילד חדש לאייפון · לסימולטור או למכשיר מחובר.
#
#   npm run build:ios          · לסימולטור
#   npm run build:ios -- --device   · לאייפון שמחובר בכבל
#
# ⚠ **למה סקריפט ולא `npx expo run:ios` ישירות** · CocoaPods נופל
# על המק הזה בלי קידוד UTF-8, עם השגיאה
# `Unicode Normalization not appropriate for ASCII-8BIT`.
# זה קרה כאן פעמיים, וזה מה ששתי השורות למטה פותרות.
#
# ⚠ **בילד למכשיר דורש חתימה** · פעם אחת בלבד:
#   1. מחברים את האייפון בכבל, פותחים אותו, ומאשרים ״Trust״.
#   2. פותחים את הפרויקט ב-Xcode:  open ios/mobile.xcworkspace
#   3. בוחרים את המטרה `mobile` → Signing & Capabilities →
#      מסמנים ״Automatically manage signing״ ובוחרים Team.
#      (חשבון Apple חינמי מספיק · Xcode → Settings → Accounts)
#   4. אחרי ההתקנה, בטלפון: הגדרות → כללי → VPN וניהול מכשיר →
#      נותנים אמון במפתח.
# ⚠ עם חשבון חינמי האפליקציה **פגה אחרי שבעה ימים** וצריך להתקין שוב.
set -e
cd "$(dirname "$0")/.."

export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

echo "› בונה… זה לוקח כמה דקות בפעם הראשונה."
npx expo run:ios "$@"
