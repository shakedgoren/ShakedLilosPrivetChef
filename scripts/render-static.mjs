/* ממיר ארטבורד .dc.html לעמוד סטטי · ממלא חורים מ-renderVals ופורש sc-for */
import fs from 'fs';
import { load } from './dc-load.mjs';

const file = process.argv[2], out = process.argv[3];
const src = fs.readFileSync(file, 'utf8');
const c = await load(file);
if (c.componentDidMount) { try { c.componentDidMount(); } catch (e) {} }
const V = c.renderVals();

let mk = src.split('<script data-dc-script')[0];
mk = mk.replace(/<script src="\.\/support\.js"><\/script>/, '');
mk = mk.replace(/<\/?helmet>/g, '').replace(/<\/?x-dc>/g, '');

const val = (scope, path) => {
  const parts = path.split('.');
  let v = parts[0] in scope ? scope[parts[0]] : V[parts[0]];
  for (let i = 1; i < parts.length && v != null; i++) v = v[parts[i]];
  return v;
};
const fill = (html, scope) => html.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, p) => {
  const v = val(scope, p);
  return v === undefined || v === null || typeof v === 'function' ? '' : String(v);
});

/* פורשים sc-for ו-sc-if מבפנים החוצה */
const expand = (html, scope) => {
  for (let guard = 0; guard < 400; guard++) {
    const m = /<sc-(for|if)\b([^>]*)>((?:(?!<sc-(?:for|if)\b)[\s\S])*?)<\/sc-\1>/.exec(html);
    if (!m) break;
    const [all, kind, attrs, body] = m;
    let rep = '';
    if (kind === 'for') {
      const list = val(scope, /list="\{\{\s*([\w.]+)\s*\}\}"/.exec(attrs)[1]) || [];
      const as = /as="(\w+)"/.exec(attrs)[1];
      rep = list.map((item) => fill(body, Object.assign({}, scope, { [as]: item }))).join('\n');
    } else {
      const key = /value="\{\{\s*([\w.]+)\s*\}\}"/.exec(attrs)[1];
      rep = val(scope, key) ? fill(body, scope) : '';
    }
    html = html.slice(0, m.index) + rep + html.slice(m.index + all.length);
  }
  return html;
};
mk = fill(expand(mk, {}), {});
fs.writeFileSync(out, mk);
console.log('נכתב', out, mk.length, 'תווים');
