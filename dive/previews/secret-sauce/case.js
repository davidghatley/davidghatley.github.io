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
  [67, 16.6, 18.2, 5.8, 'Where it looks: pixel numerals must sit on whole cells.'],
  [32, 30.7, 5.7, 8.1, 'Where it looks: vermilion once per page, on the one thing to act on.'],
  [10.9, 91, 3.1, 3.3, 'Where it looks: the typed dh mark, set by the font ligature.'],
];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export default function renderCase(root, { project: p, base }) {
  const media = base + 'public/media/secret-sauce/', fonts = base + 'public/fonts/';
  const css = `
@font-face{font-family:"Stem 7 CS";src:url("${fonts}Stem7-Regular.woff2") format("woff2");font-weight:400;font-display:block}
@font-face{font-family:"Stem 7 CS";src:url("${fonts}Stem7-Bold.woff2") format("woff2");font-weight:700;font-display:block}
.cs-secret-sauce{max-width:1200px;margin:0 auto;padding:24px 16px 64px;color:var(--ink);font:400 16px/26px var(--font-sans)}
.cs-secret-sauce *{box-sizing:border-box}
.cs-secret-sauce .lab{font:500 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted)}
.cs-secret-sauce .px{font-family:"Stem 7 CS","IBM Plex Mono",monospace;font-synthesis:none;font-variant-ligatures:common-ligatures;-webkit-font-smoothing:none;font-weight:400}
.cs-secret-sauce .mast{display:grid;grid-template-columns:auto 1fr;gap:24px;align-items:end;border-bottom:3px solid var(--ink);padding-bottom:16px}
.cs-secret-sauce .mast svg{width:100px;height:100px;fill:var(--cobalt);shape-rendering:crispEdges;view-transition-name:glyph-secret-sauce}
.cs-secret-sauce h1{margin:0;font-size:120px;line-height:120px;color:var(--ink);word-break:break-word}
.cs-secret-sauce .meta{display:flex;flex-wrap:wrap;gap:8px 24px;margin:12px 0 24px}
.cs-secret-sauce .hero{margin:0 0 48px;view-transition-name:hero-secret-sauce}
.cs-secret-sauce img{display:block;max-width:100%;height:auto}
.cs-secret-sauce .hero img{width:100%;border:1px solid var(--rule)}
.cs-secret-sauce section{border-top:1px solid var(--ink);padding:16px 0 48px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:8px 32px}
.cs-secret-sauce .num{font-size:72px;line-height:72px;color:var(--cobalt-text,var(--cobalt))}
.cs-secret-sauce h2{margin:8px 0 0;font:700 24px/30px var(--font-sans)}
.cs-secret-sauce .rule{font:italic 400 18px/28px var(--font-serif);margin:0 0 16px;max-width:60ch}
.cs-secret-sauce .demo{background:var(--sheet);border:1px solid var(--rule);padding:16px;display:grid;gap:12px}
.cs-secret-sauce .sw{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:1px solid var(--ink)}
.cs-secret-sauce .sw div{padding:12px;height:120px;display:flex;align-items:flex-end;font:600 11px/16px var(--font-mono);letter-spacing:.1em;text-transform:uppercase}
.cs-secret-sauce .bars{display:flex;gap:12px;align-items:flex-end;height:140px;border-bottom:1px solid var(--ink)}
.cs-secret-sauce .bars button{flex:0 0 72px;border:0;border-radius:0;background:var(--cobalt);padding:0;cursor:pointer}
.cs-secret-sauce .bars button[aria-pressed=true]{background:var(--vermilion)}
.cs-secret-sauce button:focus-visible,.cs-secret-sauce input:focus-visible{outline:2px solid var(--cobalt-text,var(--cobalt));outline-offset:2px}
.cs-secret-sauce input{width:100%;font:400 16px/24px var(--font-mono);background:var(--paper);color:var(--ink);border:1px solid var(--rule);border-bottom:2px solid var(--ink);padding:8px 12px;border-radius:0}
.cs-secret-sauce .out{font-size:72px;line-height:72px;min-height:76px;word-break:break-all}
.cs-secret-sauce .sizes{display:grid;gap:8px}
.cs-secret-sauce .gl{display:flex;flex-wrap:wrap;gap:12px 20px}
.cs-secret-sauce .gl svg{display:block;fill:var(--cobalt);shape-rendering:crispEdges}
.cs-secret-sauce .gl rect.off{opacity:0}
.cs-secret-sauce .gl span{display:block;font:500 10px/14px var(--font-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-muted)}
.cs-secret-sauce .pl{display:grid;gap:24px}
.cs-secret-sauce figure{margin:0;display:grid;gap:6px}
.cs-secret-sauce figure img{border:1px solid var(--rule);width:100%}
.cs-secret-sauce figcaption{font:italic 400 15px/22px var(--font-serif);color:var(--ink-muted)}
.cs-secret-sauce .sheet{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;align-items:start}
.cs-secret-sauce .sheet .wide{grid-column:span 2}
.cs-secret-sauce .shot{position:relative;border:1px solid var(--rule)}
.cs-secret-sauce .box{position:absolute;border:2px solid var(--vermilion)}
.cs-secret-sauce .box i{position:absolute;left:-2px;top:-22px;background:var(--vermilion);color:#16181d;font:600 11px/18px var(--font-mono);padding:0 6px;font-style:normal}
.cs-secret-sauce ol{margin:0 0 16px;padding:0;list-style:none;display:grid;gap:8px}
.cs-secret-sauce ol li{border-top:1px solid var(--rule);padding-top:6px;font-size:15px;line-height:22px}
.cs-secret-sauce code{font:500 12px/18px var(--font-mono);display:block;background:var(--sheet);border:1px solid var(--rule);padding:8px;overflow-x:auto;white-space:pre}
.cs-secret-sauce .tog{display:inline-flex;border:1px solid var(--ink)}
.cs-secret-sauce .tog button,.cs-secret-sauce .replay{font:500 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;border:0;background:transparent;color:var(--ink);padding:6px 12px;cursor:pointer;border-radius:0}
.cs-secret-sauce .tog button[aria-pressed=true]{background:var(--cobalt);color:var(--on-cobalt,#f9f9f5)}
.cs-secret-sauce .replay{border:1px solid var(--ink)}
.cs-secret-sauce table{width:100%;border-collapse:collapse}
.cs-secret-sauce td{padding:10px 8px;border-top:1px solid var(--rule);vertical-align:top;font-size:14px;line-height:20px}
.cs-secret-sauce td.v{font-size:48px;line-height:48px;width:1%;white-space:nowrap;color:var(--cobalt-text,var(--cobalt))}
.cs-secret-sauce .links{list-style:none;margin:16px 0 0;padding:0;display:grid;gap:8px}
.cs-secret-sauce .links a{color:var(--cobalt-text,var(--cobalt));font:600 14px/20px var(--font-mono);letter-spacing:.06em;text-decoration:underline;text-underline-offset:3px}
@media(max-width:760px){.cs-secret-sauce section{grid-template-columns:1fr}.cs-secret-sauce h1{font-size:48px;line-height:48px}.cs-secret-sauce .mast{grid-template-columns:1fr}.cs-secret-sauce .mast svg{width:60px;height:60px}.cs-secret-sauce .out{font-size:32px;line-height:32px;min-height:40px}.cs-secret-sauce .sheet .wide{grid-column:auto}.cs-secret-sauce .sw div{height:80px}}
`;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dark = () => document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  let theme = dark() ? 'dark' : 'light';
  const ns = 'http://www.w3.org/2000/svg';
  const glyphSvg = (rows, cell) => `<svg viewBox="0 0 5 5" width="${5 * cell}" height="${5 * cell}" role="img" aria-label="glyph">${rows.map((r, y) => [...r].map((c, x) => c === 'X' ? `<rect x="${x}" y="${y}" width="1" height="1"/>` : '').join('')).join('')}</svg>`;
  const body = p.body || [];
  const sec = (n, h, inner, rule) => `<section><div><div class="px num" aria-hidden="true">${n}</div><h2>${h}</h2></div><div>${rule ? `<p class="rule">${rule}</p>` : ''}${inner}</div></section>`;
  const mediaFigs = (p.media || []).map(m => `<figure><img src="${base}${esc(m.src)}" alt="${esc(m.alt)}" loading="lazy"><figcaption>${esc(m.caption || '')}</figcaption></figure>`).join('');
  const sheet = SHEET.map(([f, c, w, h]) => `<figure class="${w / h > 2.5 ? 'wide' : ''}"><img src="${media}${f}" width="${w}" height="${h}" alt="sauce make ${c}" loading="lazy"><figcaption class="lab">${c}</figcaption></figure>`).join('');
  root.innerHTML = `<div class="cs-secret-sauce">
  <div class="mast">${glyphSvg(p.glyph, 20)}<h1 class="px">${esc(p.title)}</h1></div>
  <div class="meta lab"><span>${esc(p.status)}</span><span>${esc(p.when)}</span><span>${esc(p.role)}</span></div>
  <figure class="hero"><img src="${base}${esc(p.hero.src)}" alt="${esc(p.hero.alt)}"></figure>
  ${sec('01', 'Two inks on plaster', `<div class="demo"><div class="sw"><div style="background:var(--paper)">plaster</div><div style="background:var(--cobalt);color:var(--on-cobalt,#f9f9f5)">cobalt</div><div style="background:var(--vermilion);color:#16181d">vermilion</div></div><p style="margin:0">${esc(body[0] || '')}</p></div>`, 'Cobalt and vermilion on plaster. Nothing else is an ink.')}
  ${sec('02', 'Vermilion once', `<div class="demo"><div class="bars" role="group" aria-label="Pick the one bar to act on"><button style="height:45%" aria-label="Area A"></button><button style="height:65%" aria-label="Area B"></button><button style="height:100%" aria-pressed="true" aria-label="Area C"></button><button style="height:35%" aria-label="Area D"></button></div><span class="lab">click a bar: the vermilion moves, it never doubles</span></div>`, 'One vermilion mark per surface, on the thing to act on.')}
  ${sec('03', 'Stem 7', `<div class="demo"><input type="text" value="dh two inks" maxlength="30" aria-label="Specimen text" spellcheck="false"><div class="px out" aria-live="off"></div><div class="sizes"><span class="lab">16 · 32 · 48 · 72 · 120, whole cells only</span><span class="px" style="font-size:16px;line-height:16px">stem 7 sixteen</span><span class="px" style="font-size:32px;line-height:32px">stem 7 thirty-two</span><span class="px" style="font-size:48px;line-height:48px">dh 2026</span></div><div class="lab">project glyphs, one cell per tick <button class="replay">Replay</button></div><div class="gl"></div></div><p>${esc(body[1] || '')}</p>`, 'A pixel face drawn on the grid of the mark; typing dh sets the mark.')}
  ${sec('04', 'Plates', `<div class="pl">${mediaFigs}</div>`, 'Figures are numbered plates, flat, with the caption beneath.')}
  ${sec('05', 'sauce make', `<div class="sheet">${sheet}</div>`, 'Real generator output, shown whole: cards, titles, thumbs, OG cards, plates, banners.')}
  ${sec('06', 'sauce-lint', `<div class="tog" role="group" aria-label="Screenshot theme"><button data-th="light">Plaster</button><button data-th="dark">Night</button></div><div class="shot" style="margin:12px 0"><img alt="sauce-lint screenshot of recipes/report.html" width="1280" height="1203"></div><ol></ol><code>node tools/lint/sauce-lint.mjs recipes/report.html \\
  --surface docs --png out/</code><p class="lab">Actual result: 0 errors, 0 warnings, 1 info (palette-share, 0.00% off-palette). Boxes are explanatory overlays, not findings.</p><p>${esc(body[2] || '')}</p>`, 'An automated art director: it reads a page in both themes.')}
  <section><div><div class="px num" aria-hidden="true">07</div><h2>Colophon</h2></div><div><table>${(p.spec || []).map(s => `<tr><td class="px v">${esc(s.value)}</td><td><strong>${esc(s.label)}</strong><br><span class="lab" style="letter-spacing:.04em;text-transform:none">${esc(s.source)}</span></td></tr>`).join('')}</table><p class="rule" style="margin-top:16px">${esc(p.status_note || '')}</p><ul class="links">${(p.links || []).map(l => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`).join('')}</ul></div></section></div>`;
  const q = s => root.querySelector(s);
  // vermilion once
  const bars = root.querySelectorAll('.bars button');
  bars.forEach(b => b.addEventListener('click', () => bars.forEach(o => o.setAttribute('aria-pressed', o === b))));
  // type specimen
  const input = q('input'), out = q('.out');
  const render = () => { out.textContent = input.value; };
  input.addEventListener('input', render); render();
  // lint
  const img = q('.shot img'), shot = q('.shot'), ol = q('ol');
  CALLS.forEach(([x, y, w, h, t], i) => {
    const b = document.createElement('div'); b.className = 'box'; b.style.cssText = `left:${x}%;top:${y}%;width:${w}%;height:${h}%`; b.innerHTML = `<i>${i + 1}</i>`; shot.appendChild(b);
    const li = document.createElement('li'); li.textContent = `${i + 1}. ${t}`; ol.appendChild(li);
  });
  const setT = t => { theme = t; img.src = media + (t === 'dark' ? 'lint-report-dark.jpg' : 'lint-report-light.jpg'); root.querySelectorAll('[data-th]').forEach(b => b.setAttribute('aria-pressed', b.dataset.th === t)); };
  root.querySelectorAll('[data-th]').forEach(b => b.addEventListener('click', () => setT(b.dataset.th))); setT(theme);
  // glyphs
  const gl = q('.gl'); let timer, alive = true; const builds = [];
  const start = () => {
    clearInterval(timer); builds.forEach(r => r.forEach(x => x.classList.toggle('off', !rm))); let t = 0; if (rm) return;
    timer = setInterval(() => { if (!alive) return; builds.forEach(r => r[t] && r[t].classList.remove('off')); if (++t > 25) clearInterval(timer); }, 90);
  };
  q('.replay').addEventListener('click', start);
  Promise.all(['anime', 'kitchen', 'tools', 'vaasf'].map(f => fetch(`${base}content/${f}.json`).then(r => r.json()).catch(() => []))).then(a => {
    if (!alive) return;
    a.flat().forEach(pr => { if (!pr || !pr.glyph) return; const d = document.createElement('div'); d.innerHTML = glyphSvg(pr.glyph, 6) + `<span>${esc(pr.slug)}</span>`; gl.append(d); builds.push([...d.querySelectorAll('rect')]); });
    start();
  });
  return () => { alive = false; clearInterval(timer); style.remove(); root.innerHTML = ''; };
}
