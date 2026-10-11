#!/usr/bin/env python3
"""
מרכיב את ארבע מפות ההגעה לתמונה אחת · לשליחה בוואטסאפ.

⚠ **למה · בקשת שקד, 11 באוקטובר 2026** · ״אפשר לשלוח בוואטצפ עם
ההזמנה של איסוף עצמי גם תמונה של המיקום?״. ארבע המפות קיימות
באפליקציה מאז 16 בספטמבר, אבל שם הלקוחה **מחליקה** ביניהן. בוואטסאפ
כל קובץ הוא הודעה נפרדת, וארבע התראות על הזמנה אחת הן יותר מדי —
ולכן אחת.

⚠ **התמונה עצמה היא נגזרת ולא מקור** · המקורות הם
`mobile/assets/photos/parking-1..4.jpg` והכותרות הן
`PICKUP.maps` ב-`mobile/src/data/categories.ts`. שונה שם משהו —
להריץ את זה מחדש, לא לערוך את ה-JPEG.

⚠ **הכותרות מצויירות כאן** · באפליקציה הן תווית לבנה מעל התמונה
(`badge` ב-`PickupMaps.tsx`), ולא חלק מהקובץ. בוואטסאפ אין שכבות,
ולכן אותה תווית נצרבת פנימה — באותו עיצוב בדיוק.

⚠ **העברית נסמכת על Raqm** · Pillow עם Raqm עושה את סידור
הדו-כיווניות בעצמו. היה כאן `python-bidi` שהפך את המחרוזת לפני
הציור — והתוצאה יצאה הפוכה, כי שני הצדדים הפכו. נמדד.

⚠ **אינו חלק מהבנייה** · רץ ביד, וצריך `pip install pillow`.
הפלט נכנס למאגר כקובץ, כדי שהבנייה לא תהיה תלויה בפייתון.

    python3 scripts/build-pickup-map.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, features

ROOT = Path(__file__).resolve().parent.parent
PHOTOS = ROOT / "mobile/assets/photos"
FONT = ROOT / "mobile/node_modules/@expo-google-fonts/assistant/700Bold/Assistant_700Bold.ttf"
OUT = ROOT / "landing/img/pickup-map.jpg"

# ⚠ הכותרות של שקד · מועתקות מ-`PICKUP.maps`. לא לנסח מחדש.
MAPS = [
    ("parking-1", "הגעה מכיוון נווה אילן"),
    ("parking-2", "הגעה מכיוון הרצל"),
    ("parking-3", "הגעה מכיוון לב יבנה"),
    ("parking-4", "הגעה מכיוון רוגובין"),
]

# ⚠ רוחב סופי · וואטסאפ דוחס ממילא, ו-1600 נשאר קריא אחרי הדחיסה שלו
WIDTH = 1600
GAP = 14
PAD = 14
GROUND = (243, 239, 250)  # surface.ground
INK = (42, 36, 48)  # surface.ink
BADGE_BG = (255, 255, 255)
RADIUS = 18


def badge(tile: Image.Image, text: str) -> None:
    """התווית הלבנה · למעלה מימין, בדיוק כמו `badge` באפליקציה."""
    d = ImageDraw.Draw(tile, "RGBA")
    size = max(15, round(tile.width * 0.034))
    font = ImageFont.truetype(str(FONT), size)
    left, top, right, bottom = d.textbbox((0, 0), text, font=font, direction="rtl")
    tw, th = right - left, bottom - top
    px, py = round(size * 0.85), round(size * 0.5)
    bw, bh = tw + px * 2, th + py * 2
    x = tile.width - bw - round(size * 0.7)
    y = round(size * 0.7)
    d.rounded_rectangle([x, y, x + bw, y + bh], radius=bh // 2, fill=BADGE_BG + (235,))
    d.text((x + px - left, y + py - top), text, font=font, fill=INK, direction="rtl")


def tile_of(name: str, title: str, w: int) -> Image.Image:
    src = Image.open(PHOTOS / f"{name}.jpg").convert("RGB")
    h = round(w * src.height / src.width)
    tile = src.resize((w, h), Image.LANCZOS)

    # פינות מעוגלות · כמו `frame` באפליקציה
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], radius=RADIUS, fill=255)
    rounded = Image.new("RGB", (w, h), GROUND)
    rounded.paste(tile, (0, 0), mask)

    badge(rounded, title)
    return rounded


def main() -> None:
    if not features.check("raqm"):
        raise SystemExit("חסר Raqm · העברית תצא הפוכה · pip install --upgrade pillow")

    cell_w = (WIDTH - PAD * 2 - GAP) // 2
    tiles = [tile_of(name, title, cell_w) for name, title in MAPS]
    cell_h = max(t.height for t in tiles)

    out = Image.new(
        "RGB",
        (WIDTH, PAD * 2 + GAP + cell_h * 2),
        GROUND,
    )
    for i, t in enumerate(tiles):
        col, row = i % 2, i // 2
        # ⚠ ימין לשמאל · המפה הראשונה היא זו שמימין למעלה
        x = PAD + (cell_w + GAP) * (1 - col)
        y = PAD + (cell_h + GAP) * row
        out.paste(t, (x, y))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT, "JPEG", quality=84, optimize=True, progressive=True)
    kb = OUT.stat().st_size / 1024
    print(f"{OUT.relative_to(ROOT)} · {out.width}×{out.height} · {kb:.0f}KB")


if __name__ == "__main__":
    main()
