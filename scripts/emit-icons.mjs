import fs from 'fs';

/**
 * יצירת ערכת האייקונים של האפליקציה מתוך אייקוני הקנבס.
 *
 * ⚠ לא מהקנבס · הסקריפט והשמות נכתבו על ידי Claude. הצורות עצמן
 * מגיעות אחת לאחת מ-design/app/*.dc.html דרך extract-icons.mjs —
 * אף נתיב אינו מוקלד כאן ביד.
 *
 * טבלת השמות ממופה לפי חתימת הצורה (sig), לא לפי סדר, כדי שהוספת
 * אייקון חדש בקנבס לא תזיז את השמות הקיימים.
 */
const SRC = process.env.SP + '/icons.json';
const OUT = '/Users/shakedgoren/Downloads/files/mobile/src/icons/index.tsx';

/** שמות האייקונים · נכתבו על ידי Claude לפי הצורה וההקשר שבו היא מופיעה */
const NAMES = {
  '8999430a': 'Close',        '474939e1': 'ChevronLeft',  'aaed3d76': 'ChevronRight',
  '7c311256': 'Plus',         '89fd45a9': 'Minus',        'cd1d0786': 'Receipt',
  '9e9ba09a': 'Home',         'd5b6544c': 'Image',        '00eedc63': 'Check',
  '2f756d4f': 'Package',      '6b78e6a2': 'BarChart',     '1134d226': 'User',
  '4a2602d0': 'ChevronDown',  '23df1f07': 'UserCircle',   '8c94c459': 'Bag',
  '716742f4': 'Truck',        '0596a7de': 'Map',          '7bad913d': 'Clock',
  '1bf71dca': 'Bars',         'ee2f3faa': 'Phone',        'df63f46b': 'Bookmark',
  '4f6db3de': 'Upload',       '2d9c8fca': 'MapPin',       '452b404e': 'Bowl',
  'da0b6599': 'LogIn',        '9f87b4ed': 'Pencil',       'f69b12d7': 'Box3D',
  'a0b5ae32': 'Download',     'f6772829': 'Bell',         '9265fec7': 'Search',
  '884471ad': 'FileText',     'ec43b738': 'Board',        '0ebd5efc': 'UserSmall',
  'e607da41': 'Cart',         '34b03c96': 'Calendar',     '00771c15': 'AlertTriangle',
  'd979751d': 'PhoneCall',    'fac8cae7': 'ArrowLeft',    'b4edc90d': 'Eye',
  '6017d31d': 'LogOut',       '7e44b53f': 'Refresh',      '9cac8196': 'AlertCircle',
  '66d09cbb': 'Camera',       'cca49021': 'Lock',         'c7c6e864': 'Gift',
  'c81321f4': 'Platter',      '17dc327f': 'Copy',
};

/** האלמנט של react-native-svg לכל תגית SVG */
const EL = {
  path: 'Path', circle: 'Circle', rect: 'Rect',
  line: 'Line', polyline: 'Polyline', polygon: 'Polygon', ellipse: 'Ellipse',
};

const camel = (k) => k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

const icons = JSON.parse(fs.readFileSync(SRC, 'utf8'));

const skipped = [];
const emitted = [];

for (const ic of icons) {
  const name = NAMES[ic.sig];
  /* חורים דינמיים · הנתיב מגיע מ-renderVals ולא מהמרקאפ */
  const dynamic = ic.shapes.some((s) => Object.values(s.attrs).some((v) => v.includes('{{')));
  if (!name || dynamic) {
    skipped.push({ sig: ic.sig, uses: ic.uses, why: dynamic ? 'נתיב דינמי' : 'אין שם' });
    continue;
  }
  const body = ic.shapes
    .map((s) => {
      const el = EL[s.tag];
      const props = Object.entries(s.attrs)
        .map(([k, v]) => `${camel(k)}="${v}"`)
        .join(' ');
      return `      <${el} ${props} />`;
    })
    .join('\n');
  emitted.push({ name, sig: ic.sig, uses: ic.uses, screens: ic.screens, body, ...ic });
}

emitted.sort((a, b) => a.name.localeCompare(b.name));

const used = [...new Set(emitted.flatMap((e) => e.shapes.map((s) => EL[s.tag])))].sort();

const ts = `import React from 'react';
import Svg, { ${used.join(', ')} } from 'react-native-svg';

/**
 * ⚠ נוצר אוטומטית · scripts/emit-icons.mjs · אין לערוך ביד.
 *
 * הצורות מגיעות אחת לאחת מאייקוני הקנבס. כל אייקון בקנבס בנוי
 * viewBox 0 0 24 24, בלי מילוי, עם קו וקצוות עגולים — ולכן העטיפה
 * משותפת לכולם, ומה שמשתנה הוא הגודל, הצבע ועובי הקו.
 *
 * ברירות המחדל של כל אייקון הן הערכים השכיחים שלו בקנבס.
 */

export type IconProps = {
  /** רוחב וגובה בפיקסלים */
  size?: number;
  /** צבע הקו */
  color?: string;
  /** עובי הקו */
  strokeWidth?: number;
};

type BaseProps = IconProps & { children: React.ReactNode };

function Base({ size, color, strokeWidth, children }: BaseProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

${emitted
  .map(
    (e) => `/** ${e.uses === 1 ? 'מופע אחד' : e.uses + ' מופעים'} בקנבס · ${e.screens.join(', ')} */
export function ${e.name}({ size = ${e.size}, color = '${e.stroke}', strokeWidth = ${e.strokeWidth} }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
${e.body}
    </Base>
  );
}`,
  )
  .join('\n\n')}
`;

fs.mkdirSync('/Users/shakedgoren/Downloads/files/mobile/src/icons', { recursive: true });
fs.writeFileSync(OUT, ts);

console.log('נכתב', OUT);
console.log('אייקונים:', emitted.length, '· מכסים', emitted.reduce((s, e) => s + e.uses, 0), 'מופעים');
console.log('צבעי ברירת מחדל:', [...new Set(emitted.map((e) => e.stroke))].join(' '));
if (skipped.length) {
  console.log('\nלא נוצרו:');
  for (const s of skipped) console.log(' ', s.sig, s.uses + '×', '·', s.why);
}
