import fs from 'fs';
const src = fs.readFileSync('/Users/shakedgoren/Downloads/files/design/app/Boxes.dc.html','utf8');
const js = /<script data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(src)[1];
/* חותכים בהגדרת המחלקה · כל הנתונים יושבים לפניה */
const head = js.slice(0, js.indexOf('class Component'));
const mod = head + '\nexport { BOXES, SALADS, COATS, CAKES, WINES, MAINS, EVENTS, SPREADS, CHALLAH_ONE, CHALLAH_PAIR, SALAD_PER_KG, EVENT_PRICE, EVENT_BULK, EVENT_BULK_FROM, MAFROUM_ADD, MAIN_CHICKEN, MAIN_MAFROUM, PICK_FROM, PICK_TO, DELIV_FROM, DELIV_TO, DELIV_STEP };';
const m = await import('data:text/javascript;base64,' + Buffer.from(mod).toString('base64'));
const out = {};
for (const k of Object.keys(m)) out[k] = m[k];
fs.writeFileSync('/private/tmp/claude-501/-Users-shakedgoren-Downloads-files/5277944c-663e-4ec8-97a6-1bc89cfdb41a/scratchpad/boxes.json', JSON.stringify(out, null, 2));
console.log('מארזים:', m.BOXES.length, '· סלטים:', m.SALADS.length, '· אירועים:', m.EVENTS.length);
console.log('סוגי סעיפים:', [...new Set(m.BOXES.flatMap(b=>b.sections.map(s=>s.kind)))].join(', '));
