const V = [
  ['a-frog-pond','a frog hops across lily pads and a frozen pond to catch flies','8 x 6',9,7],
  ['b-lighthouse','a lighthouse keeper rows between islands to relight the lanterns','9 x 7',11,11],
  ['c-hedge-tank','a tiny tank must escape a hedge maze before the timer runs out','8 x 8',3,3],
  ['d-sheepdog','a sheepdog herds the flock into the pen before sundown','8 x 6',21,21],
  ['e-sled-mail','a postie crosses a snowy valley, delivering one letter to every chimney','8 x 7',5,5],
  ['f-oasis-race','race a camel caravan across the dunes to the oasis before the water runs dry','8 x 6',13,13],
];
// props counts from scene files: frog 9, lighthouse 9, tank 5, sheepdog 12, sled 12, oasis 12
const PROPS = [9,9,5,12,12,12], SEEDS = [7,11,3,21,5,13];
const GL = ['.XXX.','XXXXX','X.X.X','XXXXX','X...X'].map((r,y)=>[...r].map((c,x)=>c==='X'?`<rect x="${x}" y="${y}" width="1" height="1"/>`:'').join('')).join('');
const CSS = `
.pv-playdough{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,440px);gap:24px;align-items:start;color:var(--ink)}
.pv-playdough.hero{grid-template-columns:minmax(0,1fr) minmax(0,min(620px,70vh))}
.pv-playdough .pd-l{display:flex;flex-direction:column;gap:16px;min-width:0}
.pv-playdough .pd-lab{font:400 16px/16px var(--font-pixel);letter-spacing:.04em;text-transform:uppercase;color:var(--ink-muted);display:flex;align-items:center;gap:10px}
.pv-playdough .pd-mark{display:flex;align-items:center;gap:12px;border-bottom:3px solid var(--pd);padding-bottom:10px}
.pv-playdough .pd-mark svg{width:40px;height:40px;fill:var(--ink);flex:none}
.pv-playdough .pd-mark b{font:900 32px/32px var(--font-display);font-stretch:125%;letter-spacing:-.02em}
.pv-playdough .pd-mark em{margin-left:auto;font:400 16px/16px var(--font-pixel);font-style:normal;color:var(--ink-muted)}
.pv-playdough .pd-dot{width:8px;height:8px;background:var(--rule);display:inline-block}
.pv-playdough .pd-dot.on{background:var(--phosphor,#9cbc2c)}
.pv-playdough .pd-field{border:1px solid var(--ink);background:var(--sheet);padding:14px 16px;font:400 32px/40px var(--font-pixel);word-break:break-word;min-height:136px}
.pv-playdough .pd-caret{display:inline-block;width:.55em;height:1em;background:var(--pd);vertical-align:-.12em;margin-left:2px;animation:pdb 1s steps(1) infinite}
@keyframes pdb{50%{opacity:0}}
.pv-playdough .pd-go{font:400 16px/16px var(--font-pixel);letter-spacing:.04em;text-transform:uppercase;align-self:flex-start;background:var(--pd);color:var(--pd-on);padding:6px 12px;opacity:.35}
.pv-playdough .pd-go.on{opacity:1}
.pv-playdough .pd-strip{display:flex;flex-wrap:wrap;column-gap:16px;border-top:1px solid var(--ink);border-bottom:1px solid var(--rule)}
.pv-playdough .pd-strip div{padding:8px 0}
.pv-playdough .pd-strip b{display:block;white-space:nowrap;font:400 32px/40px var(--font-pixel)}
.pv-playdough .pd-strip span{font:400 16px/16px var(--font-pixel);letter-spacing:.02em;text-transform:uppercase;color:var(--ink-muted)}
.pv-playdough .pd-chips{display:flex;flex-wrap:wrap;gap:6px}
.pv-playdough .pd-chips button{font:400 16px/16px var(--font-pixel);letter-spacing:.02em;text-transform:uppercase;border:1px solid var(--rule);background:none;color:var(--ink-muted);padding:6px 8px;cursor:pointer}
.pv-playdough .pd-chips button[aria-pressed=true]{border-color:var(--pd);color:var(--ink);box-shadow:inset 0 -3px 0 var(--pd)}
.pv-playdough .pd-r{border:1px solid var(--rule);background:var(--sheet);aspect-ratio:1/1;position:relative}
.pv-playdough .pd-r img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block;image-rendering:pixelated;transition:opacity .25s}
.pv-playdough .pd-r .pd-ph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:400 16px/16px var(--font-pixel);text-transform:uppercase;color:var(--ink-muted)}
@media(max-width:720px){.pv-playdough,.pv-playdough.hero{grid-template-columns:1fr}}
`;
export default function mount(root, { mode, base }) {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const cs = getComputedStyle(document.documentElement);
  const dark = matchMedia('(prefers-color-scheme: dark)').matches || document.documentElement.dataset.theme === 'dark';
  const pd = dark ? '#f2c81b' : '#836800', on = dark ? '#16181d' : '#f9f9f5';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const w = document.createElement('div'); w.className = 'pv-playdough' + (mode === 'hero' ? ' hero' : '');
  w.style.setProperty('--pd', pd); w.style.setProperty('--pd-on', on);
  w.innerHTML = `<div class="pd-l">${mode === 'row' ? '' : `<div class="pd-mark"><svg viewBox="0 0 5 5" shape-rendering="crispEdges" aria-hidden="true">${GL}</svg><b>playdough</b><em>sentence in</em></div>`}<div class="pd-lab"><i class="pd-dot"></i><span class="pd-st">prompt</span></div>
  <div class="pd-field" aria-live="polite"><span class="pd-t"></span><span class="pd-caret"></span></div>
  <div class="pd-go">build</div>
  <div class="pd-strip"></div><div class="pd-chips"></div></div>
  <div class="pd-r"><div class="pd-ph">waiting for a sentence</div><img alt="" style="opacity:0"></div>`;
  root.appendChild(w);
  const $ = s => w.querySelector(s);
  const t = $('.pd-t'), dot = $('.pd-dot'), stt = $('.pd-st'), go = $('.pd-go'), img = $('img'), ph = $('.pd-ph'), strip = $('.pd-strip'), chips = $('.pd-chips');
  const tms = []; let alive = true, cur = 0, vis = true, gen = 0;
  const later = (f, ms) => { const id = setTimeout(() => { if (alive) f(); }, ms); tms.push(id); };
  V.forEach((v, i) => { const b = document.createElement('button'); b.textContent = v[0].slice(2).replace(/-/g, ' '); b.setAttribute('aria-pressed', i === 0);
    b.onclick = () => { run(i); }; chips.appendChild(b); });
  function reveal(i) {
    const v = V[i];
    img.src = base + 'public/media/playdough/vig-' + v[0] + '.jpg'; img.alt = 'Isometric render of the game: ' + v[1];
    img.style.opacity = 1; ph.style.display = 'none'; go.classList.add('on'); dot.classList.remove('on'); stt.textContent = 'built';
    strip.innerHTML = [['tiles', v[2]], ['props', PROPS[i]], ['seed', SEEDS[i]], ['pixel', '2px']].map(a => `<div><b>${a[1]}</b><span>${a[0]}</span></div>`).join('');
  }
  function run(i, first) {
    gen++; const g = gen; tms.forEach(clearTimeout); tms.length = 0; cur = i;
    [...chips.children].forEach((b, j) => b.setAttribute('aria-pressed', j === i));
    const s = V[i][1];
    const done = () => { t.textContent = s; reveal(i); if (!reduce) later(() => run((i + 1) % V.length), 1700); };
    if (reduce) { t.textContent = s; reveal(i); return; }
    if (first === true) { done(); return; }
    // type the sentence fast, keep the previous render up until the new one lands
    go.classList.remove('on'); dot.classList.add('on'); stt.textContent = 'typing';
    t.textContent = '';
    let n = 0;
    const tick = () => {
      if (g !== gen) return;
      if (!vis) { later(tick, 400); return; }
      n = Math.min(s.length, n + 1); t.textContent = s.slice(0, n);
      if (n < s.length) later(tick, 22 + Math.random() * 10);
      else later(done, 120);
    };
    later(tick, 60);
  }
  const io = new IntersectionObserver(e => { vis = e[0].isIntersecting; }); io.observe(w);
  run(0, true);
  return () => { alive = false; tms.forEach(clearTimeout); io.disconnect(); w.remove(); st.remove(); };
}
