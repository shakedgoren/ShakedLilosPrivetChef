import fs from 'fs';
import path from 'path';

/**
 * חילוץ אייקוני ה-SVG מכל 22 מסכי הקנבס.
 *
 * ⚠ לא מהקנבס · הסקריפט נכתב על ידי Claude. בקנבס יש 348 מופעי SVG
 * ובאפליקציה היו 11 — האייקונים פשוט לא הועברו. כאן אוספים את הצורות
 * הייחודיות פעם אחת, כדי שהאפליקציה תשתמש באותן צורות בדיוק.
 *
 * כל האייקונים בקנבס בנויים אותו דבר: viewBox 0 0 24 24, fill none,
 * קו עם strokeLinecap/join עגולים. מה שמשתנה בין מופעים הוא הגודל,
 * צבע הקו ועוביו — ולכן הם נשארים props ואינם חלק מזהות האייקון.
 */
const DIR = '/Users/shakedgoren/Downloads/files/design/app';
const OUT = process.env.SP + '/icons.json';

/** האלמנטים שמותר לאייקון להכיל · כל אחר יעצור את החילוץ */
const SHAPES = ['path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse'];

const attrs = (tag) => {
  const out = {};
  for (const m of tag.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)) out[m[1]] = m[2];
  return out;
};

const icons = new Map();

for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith('.dc.html')).sort()) {
  const screen = path.basename(file, '.dc.html');
  const src = fs.readFileSync(path.join(DIR, file), 'utf8');

  for (const m of src.matchAll(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/g)) {
    const head = attrs(m[1]);
    const body = m[2];

    const box = head.viewBox || '';
    if (box !== '0 0 24 24') {
      /* גרפים ועמודות · לא אייקונים. הם כבר הועברו כרכיבים משלהם */
      continue;
    }

    const shapes = [];
    for (const s of body.matchAll(/<(\w+)\b([^>]*?)\/?>/g)) {
      const name = s[1];
      if (name === 'defs' || name === 'linearGradient' || name === 'stop') { shapes.length = 0; break; }
      if (!SHAPES.includes(name)) continue;
      const a = attrs(s[2]);
      /* מאפייני המראה נקבעים בשימוש · לא בזהות */
      delete a.stroke; delete a['stroke-width']; delete a.fill;
      shapes.push({ tag: name, attrs: a });
    }
    if (!shapes.length) continue;

    const key = JSON.stringify(shapes);
    const prev = icons.get(key) ?? {
      shapes,
      uses: 0,
      screens: new Set(),
      strokeWidths: new Map(),
      sizes: new Map(),
      filled: false,
    };
    prev.uses++;
    prev.screens.add(screen);
    const sw = head['stroke-width'] ?? '2';
    prev.strokeWidths.set(sw, (prev.strokeWidths.get(sw) ?? 0) + 1);
    const size = head.width ?? '24';
    prev.sizes.set(size, (prev.sizes.get(size) ?? 0) + 1);
    if (head.fill && head.fill !== 'none') prev.filled = true;
    icons.set(key, prev);
  }
}

const common = (map) => [...map.entries()].sort((a, b) => b[1] - a[1])[0][0];

const list = [...icons.values()]
  .sort((a, b) => b.uses - a.uses)
  .map((ic, i) => ({
    idx: i + 1,
    shapes: ic.shapes,
    uses: ic.uses,
    screens: [...ic.screens].sort(),
    strokeWidth: common(ic.strokeWidths),
    size: common(ic.sizes),
    filled: ic.filled,
  }));

fs.writeFileSync(OUT, JSON.stringify(list, null, 2));

console.log('אייקונים ייחודיים:', list.length, '· מופעים:', list.reduce((s, x) => s + x.uses, 0));
for (const ic of list) {
  const d = ic.shapes.map((s) => s.attrs.d ?? `<${s.tag}>`).join(' ');
  console.log(
    String(ic.idx).padStart(3) + '.',
    String(ic.uses).padStart(3) + '×',
    'עובי ' + ic.strokeWidth.padEnd(4),
    d.slice(0, 78),
  );
}
