import { writeFileSync } from 'node:fs';

const P = [
  { f:'P1_Ice',      name:'קרח ונענע',   sub:'קריר · נקי · רענן',
    ground:'#F3F8FA', ink:'#14232B', muted:'#5F7480', soft:'#7E939F',
    mesh:['rgba(88,168,190,0.58)','rgba(112,202,176,0.44)','rgba(146,158,214,0.34)','rgba(70,150,175,0.30)'],
    a1:'#0E7C86', a2:'#0A5A63', aText:'#F1FBFC', chipText:'#0A5A63',
    glass:'rgba(255,255,255,0.58)', glass2:'rgba(255,255,255,0.30)', rim:'rgba(255,255,255,0.74)', hi:'rgba(255,255,255,0.95)',
    shadow:'rgba(20,60,72,0.5)', dark:false,
    sw:['#F3F8FA','#58A8BE','#70CAB0','#0E7C86','#14232B'] },

  { f:'P2_Sunset',   name:'שקיעה',       sub:'חם · חי · נועז',
    ground:'#FDF4F2', ink:'#2B1620', muted:'#7C5E66', soft:'#9C7A80',
    mesh:['rgba(242,118,104,0.58)','rgba(226,92,148,0.44)','rgba(158,108,208,0.34)','rgba(248,160,90,0.34)'],
    a1:'#D8434F', a2:'#A81F31', aText:'#FFF4F2', chipText:'#A81F31',
    glass:'rgba(255,255,255,0.58)', glass2:'rgba(255,255,255,0.30)', rim:'rgba(255,255,255,0.76)', hi:'rgba(255,255,255,0.96)',
    shadow:'rgba(110,30,45,0.45)', dark:false,
    sw:['#FDF4F2','#F27668','#E25C94','#D8434F','#2B1620'] },

  { f:'P3_Olive',    name:'זית ואבן',    sub:'רגוע · טבעי · מאופק',
    ground:'#F6F5EE', ink:'#22261A', muted:'#6B7060', soft:'#8A8F7C',
    mesh:['rgba(140,156,94,0.52)','rgba(194,182,138,0.48)','rgba(108,140,124,0.32)','rgba(168,150,110,0.30)'],
    a1:'#4F6B33', a2:'#374C22', aText:'#F7FAF2', chipText:'#374C22',
    glass:'rgba(255,255,255,0.56)', glass2:'rgba(255,255,255,0.28)', rim:'rgba(255,255,255,0.72)', hi:'rgba(255,255,255,0.94)',
    shadow:'rgba(50,58,32,0.42)', dark:false,
    sw:['#F6F5EE','#8C9C5E','#C2B68A','#4F6B33','#22261A'] },

  { f:'P4_Lavender', name:'לבנדר וגרפיט', sub:'רך · עכשווי · אופנתי',
    ground:'#F7F5FB', ink:'#1F1A2B', muted:'#6A6178', soft:'#8B8299',
    mesh:['rgba(148,136,222,0.54)','rgba(202,148,216,0.42)','rgba(118,150,206,0.34)','rgba(170,160,235,0.30)'],
    a1:'#5A4BC4', a2:'#3C2F92', aText:'#F6F4FE', chipText:'#3C2F92',
    glass:'rgba(255,255,255,0.58)', glass2:'rgba(255,255,255,0.30)', rim:'rgba(255,255,255,0.76)', hi:'rgba(255,255,255,0.96)',
    shadow:'rgba(45,32,90,0.42)', dark:false,
    sw:['#F7F5FB','#9488DE','#CA94D8','#5A4BC4','#1F1A2B'] },

  { f:'P5_Ink',      name:'דיו וזהב',    sub:'כהה · יוקרתי · דרמטי',
    ground:'#0E1116', ink:'#F2EFE7', muted:'#9A9385', soft:'#7C776C',
    mesh:['rgba(198,158,74,0.40)','rgba(120,110,182,0.30)','rgba(88,142,142,0.26)','rgba(176,120,70,0.26)'],
    a1:'#C89B3C', a2:'#9B7422', aText:'#14100A', chipText:'#E8C57A',
    glass:'rgba(255,255,255,0.10)', glass2:'rgba(255,255,255,0.05)', rim:'rgba(255,255,255,0.20)', hi:'rgba(255,255,255,0.30)',
    shadow:'rgba(0,0,0,0.85)', dark:true,
    sw:['#0E1116','#C69E4A','#786EB6','#C89B3C','#F2EFE7'] }
];


const Q = [
  { f:'Q1_Pistachio', name:'פיסטוק ושמנת', sub:'רך · טרי · קולינרי',
    ground:'#F7FAF3', ink:'#1F2A1B', muted:'#66755E', soft:'#8B9A83',
    mesh:['rgba(176,214,158,0.62)','rgba(232,232,178,0.56)','rgba(158,206,190,0.44)','rgba(206,224,172,0.44)'],
    a1:'#5C8A42', a2:'#42672D', aText:'#F8FCF4', chipText:'#3E6229',
    glass:'rgba(255,255,255,0.56)', glass2:'rgba(255,255,255,0.28)', rim:'rgba(255,255,255,0.78)', hi:'rgba(255,255,255,0.96)',
    shadow:'rgba(60,80,48,0.34)', dark:false,
    sw:['#F7FAF3','#B0D69E','#E8E8B2','#5C8A42','#1F2A1B'] },

  { f:'Q2_Peach', name:'אפרסק ואבקת סוכר', sub:'חמים · עדין · מזמין',
    ground:'#FEF6F2', ink:'#2E1F1C', muted:'#7D6660', soft:'#A08A83',
    mesh:['rgba(252,196,168,0.66)','rgba(246,186,196,0.56)','rgba(250,220,186,0.52)','rgba(232,178,190,0.42)'],
    a1:'#C4645A', a2:'#9E453F', aText:'#FFF7F4', chipText:'#9E453F',
    glass:'rgba(255,255,255,0.58)', glass2:'rgba(255,255,255,0.3)', rim:'rgba(255,255,255,0.8)', hi:'rgba(255,255,255,0.97)',
    shadow:'rgba(120,60,50,0.3)', dark:false,
    sw:['#FEF6F2','#FCC4A8','#F6BAC4','#C4645A','#2E1F1C'] },

  { f:'Q3_Sky', name:'תכלת ולילך', sub:'קריר · אוורירי · שקט',
    ground:'#F4F7FC', ink:'#1D2430', muted:'#5F6B7C', soft:'#8492A3',
    mesh:['rgba(174,208,242,0.64)','rgba(202,190,238,0.56)','rgba(176,224,228,0.48)','rgba(198,210,246,0.44)'],
    a1:'#5570BC', a2:'#3C5197', aText:'#F6F9FE', chipText:'#3C5197',
    glass:'rgba(255,255,255,0.58)', glass2:'rgba(255,255,255,0.3)', rim:'rgba(255,255,255,0.8)', hi:'rgba(255,255,255,0.97)',
    shadow:'rgba(45,60,95,0.3)', dark:false,
    sw:['#F4F7FC','#AED0F2','#CABEEE','#5570BC','#1D2430'] },

  { f:'Q4_Butter', name:'חמאה ולבנדר', sub:'שמשי · שובב · לא צפוי',
    ground:'#FBF8EF', ink:'#2A2418', muted:'#726A56', soft:'#958C76',
    mesh:['rgba(250,226,158,0.66)','rgba(208,192,238,0.54)','rgba(244,208,178,0.48)','rgba(224,214,168,0.44)'],
    a1:'#7E5A9C', a2:'#5C3D78', aText:'#FBF7FD', chipText:'#5C3D78',
    glass:'rgba(255,255,255,0.58)', glass2:'rgba(255,255,255,0.3)', rim:'rgba(255,255,255,0.8)', hi:'rgba(255,255,255,0.97)',
    shadow:'rgba(90,70,40,0.3)', dark:false,
    sw:['#FBF8EF','#FAE29E','#D0C0EE','#7E5A9C','#2A2418'] },

  { f:'Q5_Rose', name:'מלח ורוד וסלביה', sub:'מעודן · בוטני · מאופק',
    ground:'#FAF6F5', ink:'#28211F', muted:'#736663', soft:'#988A86',
    mesh:['rgba(240,198,198,0.62)','rgba(184,212,192,0.56)','rgba(226,206,214,0.48)','rgba(206,220,206,0.44)'],
    a1:'#57806A', a2:'#3C6050', aText:'#F6FAF7', chipText:'#3C6050',
    glass:'rgba(255,255,255,0.58)', glass2:'rgba(255,255,255,0.3)', rim:'rgba(255,255,255,0.8)', hi:'rgba(255,255,255,0.97)',
    shadow:'rgba(70,70,60,0.3)', dark:false,
    sw:['#FAF6F5','#F0C6C6','#B8D4C0','#57806A','#28211F'] }
];

const tpl = (p) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rubik:wght@500;600;700&family=Assistant:wght@300;400;600;700&display=swap">
  <style>
    body { margin: 0; }
    a { color: ${p.a1}; } a:hover { color: ${p.a2}; }
  </style>
</helmet>

<div dir="rtl" style="position: relative; width: 390px; height: 640px; box-sizing: border-box; background: ${p.ground}; color: ${p.ink}; font-family: 'Assistant', system-ui, sans-serif; overflow: hidden;">

  <div style="position: absolute; inset: 0; background-image: radial-gradient(58% 42% at 12% 4%, ${p.mesh[0]} 0%, transparent 62%), radial-gradient(52% 38% at 92% 16%, ${p.mesh[1]} 0%, transparent 66%), radial-gradient(64% 44% at 78% 72%, ${p.mesh[2]} 0%, transparent 62%), radial-gradient(50% 40% at 6% 86%, ${p.mesh[3]} 0%, transparent 64%);"></div>

  <div style="position: relative; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; padding: 24px 18px 0;">

    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 6px 18px;">
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <div style="font-family: 'Rubik', system-ui, sans-serif; font-weight: 700; font-size: 20px; letter-spacing: -0.015em;">שקד לילוז</div>
        <div style="font-size: 12.5px; color: ${p.muted};">${p.name} · ${p.sub}</div>
      </div>
      <div style="width: 44px; height: 44px; border-radius: 50%; background: ${p.glass}; backdrop-filter: blur(24px) saturate(190%); -webkit-backdrop-filter: blur(24px) saturate(190%); border: 1px solid ${p.rim}; box-shadow: inset 0 1px 0 ${p.hi}; display: flex; align-items: center; justify-content: center;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${p.muted}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
      </div>
    </div>

    <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 12px;">

      <div style="position: relative; border-radius: 30px; overflow: hidden; background: linear-gradient(152deg, ${p.glass} 0%, ${p.glass2} 55%, ${p.glass} 100%); backdrop-filter: blur(30px) saturate(200%); -webkit-backdrop-filter: blur(30px) saturate(200%); border: 1px solid ${p.rim}; box-shadow: inset 0 1.5px 0 ${p.hi}, 0 22px 44px -26px ${p.shadow}; padding: 20px;">
        <div style="position: absolute; top: -40%; right: -10%; width: 70%; height: 90%; background: radial-gradient(closest-side, ${p.hi}, transparent); pointer-events: none; opacity: .55;"></div>
        <div style="position: relative; display: flex; flex-direction: column; gap: 14px;">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;">
            <div style="display: flex; flex-direction: column; gap: 5px;">
              <div style="font-size: 10.5px; letter-spacing: 0.22em; font-weight: 700; color: ${p.chipText};">פתוח עכשיו</div>
              <div style="font-family: 'Rubik', system-ui, sans-serif; font-weight: 700; font-size: 26px; line-height: 1.08; letter-spacing: -0.02em;">שלישי<br>של קוסקוס</div>
            </div>
            <div style="border-radius: 999px; padding: 7px 13px; background: ${p.glass}; border: 1px solid ${p.rim}; font-size: 12px; font-weight: 700; color: ${p.chipText}; white-space: nowrap;">נותרו 62</div>
          </div>
          <div style="font-size: 13px; color: ${p.muted};">איסוף 11:30–14:30 · משלוח 12:00–14:00</div>
          <div style="position: relative; height: 52px; border-radius: 999px; overflow: hidden; background: linear-gradient(168deg, ${p.a1} 0%, ${p.a2} 100%); box-shadow: inset 0 1.5px 0 rgba(255,255,255,0.4), 0 12px 24px -14px ${p.shadow}; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; top: 0; right: 0; left: 0; height: 52%; background: linear-gradient(180deg, rgba(255,255,255,0.26), transparent); pointer-events: none;"></div>
            <div style="position: relative; color: ${p.aText}; font-weight: 700; font-size: 16.5px;">להזמנה</div>
          </div>
        </div>
      </div>

      <div style="border-radius: 24px; background: linear-gradient(152deg, ${p.glass2} 0%, ${p.glass2} 100%); backdrop-filter: blur(22px) saturate(170%); -webkit-backdrop-filter: blur(22px) saturate(170%); border: 1px solid ${p.rim}; box-shadow: inset 0 1px 0 ${p.hi}; padding: 15px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
        <div style="display: flex; flex-direction: column; gap: 3px;">
          <div style="font-family: 'Rubik', system-ui, sans-serif; font-weight: 600; font-size: 17px;">שישי של מטעמים</div>
          <div style="font-size: 12.5px; color: ${p.muted};">נפתח ביום רביעי</div>
        </div>
        <div style="width: 40px; height: 40px; border-radius: 50%; background: ${p.glass}; border: 1px solid ${p.rim}; display: flex; align-items: center; justify-content: center;">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="${p.soft}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"></path><path d="M13.7 21a2 2 0 0 1-3.4 0"></path></svg>
        </div>
      </div>

      <div style="display: flex; gap: 7px; padding: 2px 4px;">
        ${p.sw.map(c=>`<div style="flex-grow: 1; height: 34px; border-radius: 9px; background: ${c}; border: 1px solid ${p.rim};"></div>`).join('\n        ')}
      </div>

    </div>

    <div style="height: 96px; flex-shrink: 0;"></div>

  </div>

  <div style="position: absolute; bottom: 22px; right: 18px; left: 18px; height: 64px; border-radius: 999px; background: linear-gradient(152deg, ${p.glass} 0%, ${p.glass2} 100%); backdrop-filter: blur(34px) saturate(200%); -webkit-backdrop-filter: blur(34px) saturate(200%); border: 1px solid ${p.rim}; box-shadow: inset 0 1.5px 0 ${p.hi}, 0 18px 34px -18px ${p.shadow}; display: flex; align-items: center; justify-content: space-around; padding: 0 10px;">
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; min-width: 60px; height: 52px; border-radius: 999px; background: ${p.dark ? 'rgba(200,155,60,0.18)' : 'rgba(0,0,0,0.05)'};">
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="${p.chipText}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
      <div style="font-size: 10.5px; font-weight: 700; color: ${p.chipText};">בית</div>
    </div>
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; min-width: 60px; height: 52px;">
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="${p.soft}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"></path><path d="M9 8h6M9 12h6"></path></svg>
      <div style="font-size: 10.5px; color: ${p.soft};">הזמנות</div>
    </div>
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; min-width: 60px; height: 52px;">
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="${p.soft}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"></path></svg>
      <div style="font-size: 10.5px; color: ${p.soft};">אזור אישי</div>
    </div>
  </div>

</div>
</x-dc>
<script data-dc-script data-props='{}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
`;

[...P, ...Q].forEach(p => writeFileSync(`${p.f}.dc.html`, tpl(p)));
console.log('כתבתי', P.length + Q.length, 'ערכות · פסטל:', Q.map(p=>p.f).join(', '));
