import fs from 'fs';
class DCLogic { constructor(){ this.state = {}; } setState(o){ this.state = { ...this.state, ...o }; } }
globalThis.DCLogic = DCLogic;
export async function load(file) {
  const s = fs.readFileSync(file,'utf8');
  const js = /<script data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(s)[1].replace(/customElements[\s\S]*$/,'');
  const name = (js.match(/class\s+(\w+)\s+extends\s+DCLogic/)||[])[1];
  const m = await import('data:text/javascript;base64,' + Buffer.from(
    'const DCLogic = globalThis.DCLogic;\n' + js + '\nexport { ' + name + ' as C };').toString('base64'));
  /* props מהצהרת data-props של הארטבורד · אחרת renderVals נופל על this.props */
  const dp = /<script data-dc-script[^>]*data-props='([^']*)'/.exec(s);
  const props = {};
  if (dp) for (const [k, v] of Object.entries(JSON.parse(dp[1]))) {
    if (v && typeof v === 'object' && 'default' in v) props[k] = v.default;
  }
  const c = new m.C(props); c.props = props; if (c.init) c.init();
  return c;
}
