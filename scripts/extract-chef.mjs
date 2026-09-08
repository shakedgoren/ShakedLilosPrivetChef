import fs from 'fs';
const src = fs.readFileSync('/Users/shakedgoren/Downloads/files/design/app/Chef.dc.html','utf8');
const js = /<script data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(src)[1];
const head = js.slice(0, js.indexOf('class Component'));
const names = ['BOXES','CONCEPTS','CONCEPT_FAM','TIERS','TIER_LINES','STYLES','STYLES_ALL','ALLERGY','DISLIKE','DIET','KITCHEN','OCCASION','DAYPART','CHEF_PRICES','MEAT_DONE','FISH_DONE','FISH','TABOON_TIERS','SALAD_BASE','SALAD_EXTRA','PASTA_BASE','PASTA_EXTRA','PASTA_UP_EXTRA','DESSERT_BASE','DESSERT_EXTRA','FIRST_EXTRA','T_FIRSTS','T_TABLE','T_EXTRAS','T_ALLERGY','PASTA_SHAPES','T_PASTA_UPS','T_SALADS','T_PASTAS','T_DESSERTS','EXTRA_TABLE','EXTRA_DRINK','PICK_FROM','PICK_TO','DELIV_FROM','DELIV_TO','DELIV_STEP'];
/* גם קבועים שמוצהרים בפסיק באותה שורה · const A = 1, B = 2; */
const have = names.filter(n => new RegExp('(?:const|let|var|,)\\s*'+n+'\\s*=').test(head));
const mod = head + '\nexport {' + have.join(',') + '};';
const m = await import('data:text/javascript;base64,' + Buffer.from(mod).toString('base64'));
const out = {}; for (const k of have) out[k] = m[k];
fs.writeFileSync('/private/tmp/claude-501/-Users-shakedgoren-Downloads-files/5277944c-663e-4ec8-97a6-1bc89cfdb41a/scratchpad/chef.json', JSON.stringify(out, null, 2));
console.log('נחלצו:', have.length, 'קבועים');
console.log('חבילות:', m.BOXES.map(b=>b.key).join(', '));
m.BOXES.forEach(b => console.log('  ', b.key, '· עמודים:', (b.pages||[]).length, '· סעיפים:', (b.pages||[]).reduce((s,p)=>s+p.sections.length,0)));
console.log('סוגי סעיפים:', [...new Set(m.BOXES.flatMap(b=>(b.pages||[]).flatMap(p=>p.sections.map(s=>s.kind))))].join(', '));
