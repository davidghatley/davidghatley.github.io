const L = [
  ['a-frog-pond','a frog hops across lily pads and a frozen pond to catch flies','8 x 6',9,7],
  ['b-lighthouse','a lighthouse keeper rows between islands to relight the lanterns','9 x 7',9,11],
  ['c-hedge-tank','a tiny tank must escape a hedge maze before the timer runs out','8 x 8',5,3],
  ['d-sheepdog','a sheepdog herds the flock into the pen before sundown','8 x 6',12,21],
  ['e-sled-mail','a postie crosses a snowy valley, delivering one letter to every chimney','8 x 7',12,5],
  ['f-oasis-race','race a camel caravan across the dunes to the oasis before the water runs dry','8 x 6',12,13],
];
const CSS = `
.cs-playdough{--pd:#836800;--pdon:#f9f9f5;--ph:var(--phosphor-text,#4f6512);max-width:1200px;margin:0 auto;padding:0 16px 64px;color:var(--ink)}
@media(prefers-color-scheme:dark){:root:not([data-theme=light]) .cs-playdough{--pd:#f2c81b;--pdon:#16181d;--ph:var(--phosphor,#b8d84c)}}
:root[data-theme=dark] .cs-playdough{--pd:#f2c81b;--pdon:#16181d;--ph:var(--phosphor,#b8d84c)}
.cs-playdough *{box-sizing:border-box}
.cs-playdough .px{font-family:var(--font-pixel);font-weight:400;text-transform:uppercase}
.cs-playdough .bar{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;background:var(--ink);color:var(--paper);padding:8px 12px;font-size:16px;line-height:16px}
.cs-playdough .title{border:3px solid var(--ink);margin-top:16px;background:var(--sheet)}
.cs-playdough .tin{padding:32px 24px 24px;display:flex;flex-direction:column;gap:24px}
.cs-playdough .logo{display:flex;align-items:center;gap:20px;flex-wrap:wrap}
.cs-playdough .logo svg{width:96px;height:96px;fill:var(--ink);flex:none}
.cs-playdough h1{margin:0;font:900 clamp(32px,10.5vw,120px)/.95 var(--font-display);letter-spacing:-.025em}
.cs-playdough .one{font-size:32px;line-height:40px;margin:0;max-width:22ch}
.cs-playdough .start{font-size:32px;line-height:40px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.cs-playdough .start i{width:16px;height:16px;background:var(--ph);animation:blk 1s steps(1) infinite}
.cs-playdough .start span{background:var(--pd);color:var(--pdon);padding:4px 12px}
@keyframes blk{50%{opacity:0}}
.cs-playdough .scr{border-top:3px solid var(--ink);padding:16px;background:var(--paper)}
.cs-playdough .sec{margin-top:64px}
.cs-playdough .sh{display:flex;align-items:baseline;gap:16px;flex-wrap:wrap;border-bottom:3px solid var(--pd);padding-bottom:8px;margin-bottom:24px}
.cs-playdough .sh h2{margin:0;font-size:32px;line-height:40px}
.cs-playdough .sh span{font-size:16px;line-height:16px;color:var(--ink-muted)}
.cs-playdough .pages{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.cs-playdough .pg{border:2px solid var(--ink);background:var(--sheet);padding:16px;display:flex;flex-direction:column;gap:12px}
.cs-playdough .pg b{font-size:16px;line-height:16px;background:var(--ink);color:var(--paper);align-self:flex-start;padding:4px 8px}
.cs-playdough .pg p{margin:0;font:400 17px/1.55 var(--font-sans);font-size:17px}
.cs-playdough .pg p:first-of-type::first-line{font-weight:700}
.cs-playdough .lv{display:grid;grid-template-columns:repeat(2,1fr);gap:24px}
.cs-playdough .card{border:2px solid var(--ink);background:var(--sheet);display:flex;flex-direction:column}
.cs-playdough .card .hd{display:flex;justify-content:space-between;background:var(--pd);color:var(--pdon);padding:6px 12px;font-size:16px;line-height:16px;border-bottom:2px solid var(--ink)}
.cs-playdough .card .s{margin:0;padding:16px;font-size:32px;line-height:40px;text-transform:none;min-height:3.6em}
.cs-playdough .card img{display:block;width:100%;height:auto;image-rendering:pixelated;border-top:2px solid var(--ink);border-bottom:2px solid var(--ink)}
.cs-playdough .card .st{display:grid;grid-template-columns:repeat(3,1fr)}
.cs-playdough .card .st div{padding:8px 12px;font-size:16px;line-height:16px;color:var(--ink-muted)}
.cs-playdough .card .st b{display:block;font-size:32px;line-height:40px;color:var(--ink);font-weight:400}
.cs-playdough .shots{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;align-items:start}
.cs-playdough figure{margin:0;border:2px solid var(--ink);background:var(--sheet)}
.cs-playdough figure img{display:block;width:100%;height:auto}
.cs-playdough figcaption{padding:8px 12px;font:italic 400 15px/1.4 var(--font-serif);border-top:2px solid var(--ink)}
.cs-playdough .stats{border:3px solid var(--ink);background:var(--sheet)}
.cs-playdough .stats .row{display:grid;grid-template-columns:1fr auto;gap:16px;align-items:baseline;padding:12px 16px;border-bottom:2px dotted var(--rule)}
.cs-playdough .stats .row:last-child{border:0}
.cs-playdough .stats .k{font-size:32px;line-height:40px}
.cs-playdough .stats .v{font-size:72px;line-height:72px;color:var(--pd)}
.cs-playdough .stats small{display:block;font:400 12px/16px var(--font-mono);color:var(--ink-muted);text-transform:none}
.cs-playdough .note{margin:16px 0 0;font-size:16px;line-height:24px;display:flex;gap:12px;align-items:flex-start}
.cs-playdough .note i{width:12px;height:12px;background:var(--ph);margin-top:6px;flex:none}
.cs-playdough .menu{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;border:3px solid var(--ink)}
.cs-playdough .menu a{display:flex;gap:16px;padding:12px 16px;font-size:32px;line-height:40px;color:var(--ink);text-decoration:none;border-bottom:2px dotted var(--rule);overflow-wrap:anywhere}
.cs-playdough .menu li:last-child a{border:0}
.cs-playdough .menu a::before{content:">";color:var(--pd);visibility:hidden}
.cs-playdough .menu a:hover,.cs-playdough .menu a:focus-visible{background:var(--pd);color:var(--pdon)}
.cs-playdough .menu a:hover::before,.cs-playdough .menu a:focus-visible::before{visibility:visible;color:var(--pdon)}
.cs-playdough .hero .pv-playdough .pd-mark{display:none}
.cs-playdough .hero .pv-playdough,.cs-playdough .hero .pv-playdough.hero{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
.cs-playdough .hero .pd-strip{grid-template-columns:repeat(2,1fr)}
@media(max-width:800px){.cs-playdough .hero .pv-playdough,.cs-playdough .hero .pv-playdough.hero{grid-template-columns:1fr}.cs-playdough .pages,.cs-playdough .shots,.cs-playdough .lv{grid-template-columns:1fr}.cs-playdough .card .s{font-size:16px;line-height:24px;min-height:0}.cs-playdough .one{font-size:16px;line-height:24px}.cs-playdough .stats .v{font-size:48px;line-height:48px}.cs-playdough .stats .k,.cs-playdough .menu a,.cs-playdough .start{font-size:16px;line-height:24px}.cs-playdough .logo svg{width:48px;height:48px}.cs-playdough .tin{padding:20px 16px}}
@media(prefers-reduced-motion:reduce){.cs-playdough .start i{animation:none}}
`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export default function renderCase(root, { project: p, base, meta }) {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const gl = (p.glyph || []).map((r, y) => [...r].map((c, x) => c === 'X' ? `<rect x="${x}" y="${y}" width="1" height="1"/>` : '').join('')).join('');
  const M = 'public/media/playdough/';
  const body = p.body || [];
  const w = document.createElement('div'); w.className = 'cs-playdough';
  const lvl = L.map((l, i) => `<article class="card"><div class="hd px"><span>level 0${i + 1}</span><span>${esc(l[0].slice(2).replace(/-/g, ' '))}</span></div>
    <p class="s px">${esc(l[1])}</p><img src="${base}${M}vig-${l[0]}.jpg" alt="Isometric render of the game: ${esc(l[1])}" loading="lazy">
    <div class="st px"><div><b>${l[2]}</b>tiles</div><div><b>${l[3]}</b>props</div><div><b>${l[4]}</b>seed</div></div></article>`).join('');
  const pages = body.map((t, i) => `<div class="pg"><b class="px">how to play ${i + 1}/${body.length}</b><p>${esc(t)}</p></div>`).join('');
  const shots = (p.media || []).map(m => `<figure><img src="${base}${m.src}" alt="${esc(m.alt || '')}" loading="lazy"><figcaption>${esc(m.caption || '')}</figcaption></figure>`).join('');
  const stats = (p.spec || []).map(s => `<div class="row"><div class="k px">${esc(s.label)}<small>${esc(s.source || '')}</small></div><div class="v px">${esc(s.value)}</div></div>`).join('');
  const links = (p.links || []).map(l => `<li><a class="px" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`).join('');
  w.innerHTML = `
  <section class="title" aria-label="Title screen"><div class="bar px"><span>1 player</span><span>${esc(p.status || '')} / ${esc(p.when || '')}</span></div>
   <div class="tin"><div class="logo"><svg class="g" viewBox="0 0 5 5" shape-rendering="crispEdges" aria-hidden="true">${gl}</svg><h1>${esc(p.title)}</h1></div>
   <p class="one px">${esc(p.oneliner || '')}</p>
   <div class="start px"><i></i><span>press start</span></div></div>
   <div class="scr"><div class="hero"></div></div></section>
  <section class="sec"><div class="sh"><h2 class="px">how to play</h2><span class="px">${esc(p.role || '')}</span></div><div class="pages">${pages}</div></section>
  <section class="sec"><div class="sh"><h2 class="px">level select</h2><span class="px">6 sentences, 6 renders</span></div><div class="lv">${lvl}</div></section>
  <section class="sec"><div class="sh"><h2 class="px">cartridge art</h2><span class="px">${(p.media || []).length} screens</span></div><div class="shots">${shots}</div></section>
  <section class="sec"><div class="sh"><h2 class="px">stats</h2><span class="px">read 2026-10-22</span></div><div class="stats">${stats}</div>
   <p class="note px"><i></i><span>${esc(p.status_note || '')}</span></p></section>
  <section class="sec"><div class="sh"><h2 class="px">continue?</h2><span class="px">${(p.links || []).length} saves</span></div><ul class="menu">${links}</ul></section>`;
  root.appendChild(w);
  w.querySelector('.g').style.viewTransitionName = 'glyph-' + p.slug;
  const hero = w.querySelector('.hero'); hero.style.viewTransitionName = 'hero-' + p.slug;
  let un = null, dead = false;
  import(new URL('./preview.js', import.meta.url).href).then(m => { if (!dead) un = m.default(hero, { mode: 'hero', base }); }).catch(() => {});
  return () => { dead = true; if (un) un(); w.remove(); st.remove(); };
}
