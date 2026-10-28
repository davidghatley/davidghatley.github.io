// Secret Sauce: a live specimen. Type in Stem 7, watch the project glyphs build, flip the theme, browse real `sauce make` output.
const FILES = ['anime', 'kitchen', 'tools', 'vaasf'];
const SHEET = [
  ['make-card-napkin.jpg', 'card · napkin', 640, 800],
  ['make-title-playdough.jpg', 'title · playdough', 1280, 720],
  ['make-og-anime.jpg', 'og · anime', 1200, 630],
  ['make-thumb-nibble.jpg', 'thumb · nibble', 1280, 720],
  ['make-splash-mise.jpg', 'splash · mise_en_place', 1280, 720],
  ['make-plate-manual.jpg', 'plate · manual', 960, 563],
  ['make-banner-bonfire.jpg', 'banner · bonfire', 1584, 396],
  ['make-readme-playdough.jpg', 'readme header · playdough', 1280, 320],
];
const CALLS = [
  [67, 16.6, 18.2, 5.8, 'where it looks: pixel numerals must sit on whole cells'],
  [32, 30.7, 5.7, 8.1, 'where it looks: vermilion once per page, on the one thing to act on'],
  [10.9, 91, 3.1, 3.3, 'where it looks: the typed dh mark, set by the font ligature'],
];

function carousel(host, SHEET, media) {
  const car = document.createElement('div'); car.className = 'car'; car.tabIndex = 0; car.setAttribute('role', 'group'); car.setAttribute('aria-roledescription', 'carousel'); car.setAttribute('aria-label', 'sauce make outputs');
  const arrow = d => `<svg viewBox="0 0 5 5" aria-hidden="true">${(d < 0 ? ['2,0','1,1','0,2','1,3','2,4','1,2','2,2','3,2','4,2'] : ['2,0','3,1','4,2','3,3','2,4','3,2','2,2','1,2','0,2']).map(c => { const [x, y] = c.split(','); return `<rect x="${x}" y="${y}" width="1" height="1"/>`; }).join('')}</svg>`;
  car.innerHTML = `<div class="stage"><img alt=""></div><div class="ctl"><button type="button" aria-label="Previous asset">${arrow(-1)}</button><button type="button" aria-label="Next asset">${arrow(1)}</button><span class="cnt" aria-live="polite"></span><span class="nm"></span></div>`;
  host.appendChild(car);
  const img = car.querySelector('img'), cnt = car.querySelector('.cnt'), nm = car.querySelector('.nm'), n = SHEET.length; let i = 0;
  const pad = v => String(v).padStart(2, '0');
  const show = k => {
    i = (k + n) % n; const [f, cap, w, h] = SHEET[i];
    img.src = media + f; img.width = w; img.height = h; img.alt = 'sauce make ' + cap;
    cnt.textContent = pad(i + 1) + ' / ' + pad(n); nm.textContent = cap;
    [i - 1, i + 1].forEach(j => { const o = new Image(); o.src = media + SHEET[(j + n) % n][0]; });
  };
  const [bp, bn] = car.querySelectorAll('button');
  bp.onclick = () => show(i - 1); bn.onclick = () => show(i + 1);
  car.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') { e.preventDefault(); show(i - 1); } else if (e.key === 'ArrowRight') { e.preventDefault(); show(i + 1); } });
  let sx = null;
  const st = car.querySelector('.stage');
  st.addEventListener('pointerdown', e => { sx = e.clientX; });
  st.addEventListener('pointerup', e => { if (sx == null) return; const d = e.clientX - sx; sx = null; if (Math.abs(d) > 40) show(i + (d < 0 ? 1 : -1)); });
  st.addEventListener('pointercancel', () => { sx = null; });
  show(0);
}
export default function mount(root, { mode, base }) {
  const hero = mode === 'hero';
  const media = base + 'public/media/secret-sauce/';
  const fonts = base + 'public/fonts/';
  const css = `
@font-face{font-family:"Stem 7 PV";src:url("${fonts}Stem7-Regular.woff2") format("woff2");font-weight:400;font-display:block}
@font-face{font-family:"Stem 7 PV";src:url("${fonts}Stem7-Bold.woff2") format("woff2");font-weight:700;font-display:block}
.pv-secret-sauce{--a:var(--cobalt,#2236b0);color:var(--ink);font:400 14px/20px var(--font-sans);display:grid;gap:24px}
.pv-secret-sauce *{box-sizing:border-box}
.pv-secret-sauce .lab{font:500 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted)}
.pv-secret-sauce .top{display:grid;gap:24px;grid-template-columns:${hero ? '1fr' : 'minmax(0,5fr) minmax(0,4fr)'};align-items:start}
.pv-secret-sauce .spec{--paper:#eeede7;--sheet:#f9f9f5;--ink:#16181d;--ink-muted:#555a61;--rule:#c9c9c0;--ac:#2236b0;background:var(--paper);color:var(--ink);border:1px solid var(--ink);padding:16px;display:grid;gap:12px}
.pv-secret-sauce .spec[data-t=dark]{--paper:#121417;--sheet:#1b1e22;--ink:#ecebe4;--ink-muted:#a2a7ad;--rule:#3a3e44;--ac:#9fb0ff}
.pv-secret-sauce .bar{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}
.pv-secret-sauce .tog{display:flex;border:1px solid var(--ink)}
.pv-secret-sauce button{font:500 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;border:0;background:transparent;color:var(--ink);padding:6px 12px;cursor:pointer;border-radius:0}
.pv-secret-sauce button[aria-pressed=true]{background:var(--ac);color:var(--paper)}
.pv-secret-sauce button:focus-visible,.pv-secret-sauce input:focus-visible{outline:2px solid var(--ac);outline-offset:2px}
.pv-secret-sauce input{width:100%;font:400 16px/24px var(--font-mono);background:var(--sheet);color:var(--ink);border:1px solid var(--rule);border-bottom:2px solid var(--ink);padding:8px 12px;border-radius:0}
.pv-secret-sauce .out{font-family:"Stem 7 PV","IBM Plex Mono",monospace;font-size:${hero ? 120 : 72}px;line-height:${hero ? 120 : 72}px;font-synthesis:none;font-variant-ligatures:common-ligatures;-webkit-font-smoothing:none;color:var(--ink);min-height:${hero ? 124 : 76}px;word-break:break-all;padding-top:4px}
.pv-secret-sauce .out b{font-weight:700;color:var(--ac)}
.pv-secret-sauce .glyphs{display:flex;flex-wrap:wrap;gap:${hero ? 20 : 12}px;align-items:flex-end}
.pv-secret-sauce .g{display:grid;gap:4px;justify-items:start}
.pv-secret-sauce .g svg{display:block;shape-rendering:crispEdges;fill:var(--ac)}
.pv-secret-sauce .g svg rect{fill:var(--ac)}
.pv-secret-sauce .g svg rect.off{opacity:0}
.pv-secret-sauce .g span{font:500 10px/14px var(--font-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-muted)}
.pv-secret-sauce .sheet{min-width:0}
.pv-secret-sauce .strip{display:flex;gap:12px;overflow-x:auto;align-items:flex-end;padding-bottom:8px;max-width:100%}
.pv-secret-sauce figure{margin:0;display:grid;gap:4px;${hero ? '' : 'flex:none'}}
.pv-secret-sauce figure.wide{${hero ? 'grid-column:span 2' : ''}}
.pv-secret-sauce figure img{display:block;width:100%;height:auto;border:1px solid var(--rule);${hero ? '' : 'width:auto;height:' + 'var(--h)'}}
.pv-secret-sauce .lint{display:grid;gap:12px;grid-template-columns:minmax(0,3fr) minmax(0,2fr);align-items:start}
.pv-secret-sauce .shot{position:relative;border:1px solid var(--rule)}
.pv-secret-sauce .shot img{display:block;width:100%;height:auto}
.pv-secret-sauce .box{position:absolute;border:2px solid var(--vermilion,#f0522a);background:transparent}
.pv-secret-sauce .box i{position:absolute;left:-2px;top:-22px;background:var(--vermilion,#f0522a);color:#16181d;font:600 11px/18px var(--font-mono);padding:0 6px;font-style:normal}
.pv-secret-sauce ol{margin:0;padding:0;list-style:none;display:grid;gap:12px;counter-reset:n}
.pv-secret-sauce ol li{counter-increment:n;border-top:1px solid var(--ink);padding-top:8px}
.pv-secret-sauce ol li::before{content:counter(n);font:700 11px/16px var(--font-mono);color:var(--cobalt-text,var(--cobalt));display:block}
.pv-secret-sauce code{font:500 12px/18px var(--font-mono);display:block;background:var(--sheet);border:1px solid var(--rule);padding:8px;overflow-x:auto;white-space:pre}

.pv-secret-sauce .car{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;min-width:0}
.pv-secret-sauce .car:focus-visible{outline:2px solid var(--cobalt-text,var(--cobalt));outline-offset:4px}
.pv-secret-sauce .car .stage{display:flex;align-items:center;justify-content:center;min-height:${hero ? '420px' : '340px'};background:var(--sheet);border:1px solid var(--rule);padding:12px;touch-action:pan-y;user-select:none}
.pv-secret-sauce .car .stage img{display:block;max-width:100%;max-height:${hero ? '60vh' : '320px'};width:auto;height:auto;object-fit:contain;-webkit-user-drag:none}
.pv-secret-sauce .car .ctl{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;min-width:0}
.pv-secret-sauce .car .ctl button{flex:none;width:48px;height:48px;border:1px solid var(--ink);border-radius:0;background:transparent;color:var(--ink);display:grid;place-items:center;cursor:pointer;padding:0}
.pv-secret-sauce .car .ctl button:hover{background:var(--ink);color:var(--paper)}
.pv-secret-sauce .car .ctl button:focus-visible{outline:2px solid var(--cobalt-text,var(--cobalt));outline-offset:2px}
.pv-secret-sauce .car .ctl svg{width:25px;height:25px;fill:currentColor;shape-rendering:crispEdges}
.pv-secret-sauce .car .cnt{font-family:"Stem 7 PV","IBM Plex Mono",monospace;font-size:32px;line-height:32px;font-synthesis:none;-webkit-font-smoothing:none;color:var(--cobalt-text,var(--cobalt));min-width:7ch}
.pv-secret-sauce .car .nm{font:500 12px/16px var(--font-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-muted);flex:1 1 12ch;min-width:0;overflow-wrap:anywhere}
@media(max-width:760px){.pv-secret-sauce .top,.pv-secret-sauce .lint{grid-template-columns:1fr}}
`;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
  root.innerHTML = '';
  const el = document.createElement('div'); el.className = 'pv-secret-sauce'; root.appendChild(el);
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pageDark = () => document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  let theme = pageDark() ? 'dark' : 'light';

  el.innerHTML = `
  <div class="top">
    <div class="spec" data-t="${theme}">
      <div class="bar"><span class="lab">Stem 7 · type to set it · try "dh"</span>
        <div class="tog" role="group" aria-label="Specimen theme"><button data-th="light" aria-pressed="${theme === 'light'}">Plaster</button><button data-th="dark" aria-pressed="${theme === 'dark'}">Night</button></div></div>
      <input type="text" value="dh two inks" maxlength="40" aria-label="Specimen text" spellcheck="false">
      <div class="out" aria-live="off"></div>
      <div class="lab">glyphs, built one cell per tick <button class="replay" style="padding:2px 8px;margin-left:8px;border:1px solid var(--ink)">Replay</button></div>
      <div class="glyphs"></div>
    </div>
    <div>
      <div class="lab" style="margin-bottom:8px">sauce make · real output, shown whole</div>
      <div class="sheet"></div>
    </div>
  </div>
  ${hero ? `<div class="lint"><div>
      <div class="lab" style="margin-bottom:8px">sauce-lint · recipes/report.html · <span class="lt"></span> theme · boxes are explanatory overlays</div>
      <div class="shot"><img alt="sauce-lint screenshot of the report recipe with three annotations" width="1280" height="1203"></div></div>
    <div><div class="lab" style="margin-bottom:8px">how it reads a page (annotations, not findings)</div><ol></ol>
      <code>node tools/lint/sauce-lint.mjs recipes/report.html \\
  --surface docs --png out/</code>
      <div class="lab" style="margin-top:8px">actual lint result: 0 errors, 0 warnings, 1 info (palette-share, 0.00% off-palette)</div></div></div>` : ''}`;

  const spec = el.querySelector('.spec'), input = el.querySelector('input'), out = el.querySelector('.out');
  const render = () => {
    out.textContent = '';
    const v = input.value;
    // **bold** is not parsed; Stem 7 Bold on words after "!" keeps it simple
    const parts = v.split('!');
    parts.forEach((p, i) => { const n = i % 2 ? document.createElement('b') : document.createDocumentFragment(); n.append(p); out.append(n); });
  };
  input.addEventListener('input', render); render();

  // contact sheet
  carousel(el.querySelector('.sheet, .strip'), SHEET, media);

  // lint
  const lintImg = el.querySelector('.shot img');
  const setLint = () => { if (!lintImg) return; lintImg.src = media + (theme === 'dark' ? 'lint-report-dark.jpg' : 'lint-report-light.jpg'); el.querySelector('.lt').textContent = theme; };
  if (lintImg) {
    const shot = el.querySelector('.shot'), ol = el.querySelector('ol');
    CALLS.forEach(([x, y, w, h, t], i) => {
      const b = document.createElement('div'); b.className = 'box'; b.style.cssText = `left:${x}%;top:${y}%;width:${w}%;height:${h}%`; b.innerHTML = `<i>${i + 1}</i>`; shot.appendChild(b);
      const li = document.createElement('li'); li.textContent = t; ol.appendChild(li);
    });
    setLint();
  }

  const setTheme = t => { theme = t; spec.dataset.t = t; el.querySelectorAll('[data-th]').forEach(b => b.setAttribute('aria-pressed', b.dataset.th === t)); setLint(); };
  el.querySelectorAll('[data-th]').forEach(b => b.addEventListener('click', () => setTheme(b.dataset.th)));

  // glyphs build cell by cell
  const gl = el.querySelector('.glyphs'); let timer = null, alive = true; const builds = [];
  const cell = hero ? 8 : 6;
  const start = () => {
    clearInterval(timer);
    builds.forEach(b => b.rects.forEach(r => r.classList.toggle('off', !rm)));
    let tick = 0; if (rm) return;
    timer = setInterval(() => {
      if (!alive || document.hidden) return;
      builds.forEach(b => { const r = b.rects[tick]; if (r) r.classList.remove('off'); });
      tick++; if (tick > 32) clearInterval(timer);
    }, 90);
  };
  el.querySelector('.replay').addEventListener('click', start);
  Promise.all(FILES.map(f => fetch(`${base}content/${f}.json`).then(r => r.json()).catch(() => []))).then(arr => {
    if (!alive) return;
    arr.flat().forEach(p => {
      if (!p || !p.glyph) return;
      const rows = p.glyph, ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 5 5'); svg.setAttribute('width', 5 * cell); svg.setAttribute('height', 5 * cell); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', p.title + ' glyph');
      const rects = []; let order = 0;
      rows.forEach((row, y) => [...row].forEach((c, x) => { if (c === 'X') { const r = document.createElementNS(ns, 'rect'); r.setAttribute('x', x); r.setAttribute('y', y); r.setAttribute('width', 1); r.setAttribute('height', 1); svg.appendChild(r); rects.push(r); } }));
      const g = document.createElement('div'); g.className = 'g'; g.append(svg); const s = document.createElement('span'); s.textContent = p.slug; g.append(s); gl.append(g);
      builds.push({ rects });
    });
    start();
  });

  return () => { alive = false; clearInterval(timer); style.remove(); root.innerHTML = ''; };
}
