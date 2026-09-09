import fs from 'fs';

/** חילוץ מסך ההתחברות · הטקסטים והשדות של שני הטאבים. */
const SRC = '/Users/shakedgoren/Downloads/files/design/app/Login.dc.html';
const OUT = process.env.SP + '/login.json';

const src = fs.readFileSync(SRC, 'utf8');
const js = /<script data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(src)[1];
const markup = src.replace(/<script data-dc-script[\s\S]*?<\/script>/, '');
const view = js.slice(js.indexOf('renderVals()'));

const pick = (name, scope = view) => {
  const hits = [...scope.matchAll(new RegExp(name + ":\\s*'([^']*)'", 'g'))];
  if (hits.length !== 1) throw new Error(name + ': ' + hits.length + ' התאמות במקום אחת');
  return hits[0][1];
};

const out = {};
out.tabIn = pick('tabIn');
out.tabUp = pick('tabUp');
out.googleLabel = pick('googleLabel');
out.orLabel = pick('orLabel');
out.forgotLabel = pick('forgotLabel');

/* שני הענפים של הכותרת המשנית והכפתור */
const lede = /lede: isIn\s*\?\s*'([^']*)'\s*:\s*'([^']*)'/.exec(view);
if (!lede) throw new Error('lede: לא נמצא');
out.ledeIn = lede[1];
out.ledeUp = lede[2];
const cta = /cta: isIn \? '([^']*)' : '([^']*)'/.exec(view);
out.ctaIn = cta[1];
out.ctaUp = cta[2];

/* מינימום הסיסמה · ממנו נבנה מציין המקום */
out.passMin = Number(/PASS_MIN = (\d+)/.exec(js)[1]);

/* השדות · שם, תווית, מציין מקום, סוג והודעת שגיאה */
const parseFields = (block) =>
  [...block.matchAll(/field\('(\w+)',\s*'([^']*)',\s*(?:'([^']*)'|'([^']*)' \+ PASS_MIN \+ '([^']*)'),\s*'(\w+)',\s*e\.\w+,\s*'([^']*)'\)/g)]
    .map((h) => ({
      id: h[1],
      label: h[2],
      placeholder: h[3] !== undefined ? h[3] : h[4] + out.passMin + h[5],
      type: h[6],
      hint: h[7],
    }));

const both = /const fields = isIn\s*\?\s*\[([\s\S]*?)\]\s*:\s*\[([\s\S]*?)\];/.exec(js);
if (!both) throw new Error('שדות: לא נמצאו');
out.fieldsIn = parseFields(both[1]);
out.fieldsUp = parseFields(both[2]);
if (out.fieldsIn.length !== 2) throw new Error('שדות כניסה: ' + out.fieldsIn.length + ' במקום 2');
if (out.fieldsUp.length !== 5) throw new Error('שדות הרשמה: ' + out.fieldsUp.length + ' במקום 5');

/* טקסטים במרקאפ */
const one = (re, label) => {
  const hits = [...markup.matchAll(new RegExp(re, 'g'))];
  if (hits.length !== 1) throw new Error(label + ': ' + hits.length + ' התאמות במקום אחת');
  return hits[0][1];
};
out.brand = 'BITE & TELL';
out.brandSub = one('>(שף פרטית · [^<]*)</div>', 'תת-כותרת המותג');

/* טקסט האורחת · יושב ב-renderVals או במרקאפ */
const guest = /guestLabel: '([^']*)'/.exec(view);
out.guestLabel = guest ? guest[1] : one('>(להמשיך בלי חשבון)</div>', 'אורחת');

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log('טאבים:', out.tabIn, '/', out.tabUp);
console.log('כניסה:', out.fieldsIn.map((f) => f.label).join(', '), '→', out.ctaIn);
console.log('הרשמה:', out.fieldsUp.map((f) => f.label).join(', '), '→', out.ctaUp);
console.log('גוגל:', out.googleLabel, '· מפריד:', out.orLabel, '· שכחתי:', out.forgotLabel);
console.log('אורחת:', out.guestLabel, '· מותג:', out.brand, '·', out.brandSub);
