const CSS = `
.cs-lmr{--a:#2c4a86;max-width:1000px;margin:0 auto;padding:24px 16px 64px;color:var(--ink);font:400 16px/26px "IBM Plex Sans",var(--font-sans),system-ui,sans-serif}
html[data-theme=dark] .cs-lmr{--a:#8fa9e0}
@media (prefers-color-scheme:dark){html:not([data-theme=light]) .cs-lmr{--a:#8fa9e0}}
.cs-lmr *{box-sizing:border-box}
.cs-lmr .runhead{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;border-bottom:1px solid var(--ink);padding-bottom:8px;font:500 12px/16px "IBM Plex Mono",var(--font-mono),monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted)}
.cs-lmr .runhead b{color:var(--ink);font-weight:600}
.cs-lmr h1{margin:28px 0 4px;font:700 clamp(40px,8vw,64px)/1 "IBM Plex Sans",var(--font-sans),sans-serif;letter-spacing:-.02em;display:flex;gap:18px;align-items:center}
.cs-lmr h1 svg{width:48px;height:48px;color:var(--a);flex:none}
.cs-lmr .sub{font:italic 400 24px/30px "Newsreader",var(--font-serif),Georgia,serif;color:var(--a);margin:0 0 10px;max-width:30ch}
.cs-lmr .byline{font:400 12px/18px "IBM Plex Mono",var(--font-mono),monospace;color:var(--ink-muted);margin:0 0 12px}
.cs-lmr .links{display:flex;flex-wrap:wrap;gap:8px 24px;margin:0 0 20px;padding:0;list-style:none;font:500 12px/18px "IBM Plex Mono",var(--font-mono),monospace;letter-spacing:.08em;text-transform:uppercase}
.cs-lmr .links a{color:var(--a);text-decoration:underline;text-underline-offset:3px}
.cs-lmr .links a:hover{color:var(--ink)}
.cs-lmr .links a:focus-visible{outline:2px solid var(--a);outline-offset:2px}
.cs-lmr .abs{border-top:3px double var(--ink);border-bottom:1px solid var(--ink);padding:14px 0 6px;max-width:72ch;margin:0 0 8px}
.cs-lmr .abs h2{margin:0 0 6px}
.cs-lmr h2{margin:44px 0 8px;font:600 11px/16px "IBM Plex Mono",var(--font-mono),monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--a);display:flex;gap:10px;align-items:baseline}
.cs-lmr h2 .n{font:400 16px/16px var(--font-pixel);color:var(--ink)}
.cs-lmr p{margin:0 0 14px;max-width:70ch}
.cs-lmr .lead{font:italic 400 20px/30px "Newsreader",var(--font-serif),Georgia,serif;color:var(--ink-muted)}
.cs-lmr .hero{margin:16px 0 0;border:1px solid var(--ink);background:var(--sheet);padding:16px}
.cs-lmr .hero .cap,.cs-lmr figcaption{font:italic 400 14px/21px "Newsreader",var(--font-serif),Georgia,serif;color:var(--ink-muted);margin-top:8px}
.cs-lmr figure{margin:16px 0 0;border:1px solid var(--rule);background:var(--sheet);padding:12px}
.cs-lmr figure img{display:block;max-width:100%;height:auto;margin:0 auto}
.cs-lmr figcaption b{font:600 11px/16px "IBM Plex Mono",var(--font-mono),monospace;letter-spacing:.1em;text-transform:uppercase;font-style:normal;color:var(--ink);margin-right:6px}
.cs-lmr .pair{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;align-items:start}
.cs-lmr .pair figure{margin:0}
.cs-lmr .tw{overflow-x:auto;margin-top:8px}
.cs-lmr table{border-collapse:collapse;width:100%;min-width:560px;font:400 13px/20px "IBM Plex Sans",var(--font-sans),sans-serif;font-variant-numeric:tabular-nums}
.cs-lmr th{font:600 12px/16px "IBM Plex Mono",var(--font-mono),monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-muted);text-align:left;padding:6px 12px 6px 0;border-bottom:2px solid var(--ink);border-top:1px solid var(--ink)}
.cs-lmr td{padding:8px 12px 8px 0;border-bottom:1px solid var(--rule);vertical-align:top}
.cs-lmr td.v{font:400 16px/20px var(--font-pixel);white-space:nowrap}
.cs-lmr td.s{font:400 12px/18px "IBM Plex Mono",var(--font-mono),monospace;color:var(--ink-muted)}
.cs-lmr tr.hl td{background:var(--sheet)}
.cs-lmr .tcap{font:italic 400 14px/21px "Newsreader",var(--font-serif),Georgia,serif;color:var(--ink-muted);margin-top:6px}
.cs-lmr .tcap b{font:600 11px/16px "IBM Plex Mono",var(--font-mono),monospace;letter-spacing:.1em;text-transform:uppercase;font-style:normal;color:var(--ink)}
.cs-lmr code{font:400 .86em "IBM Plex Mono",var(--font-mono),monospace;background:var(--rule-faint,var(--sheet));padding:0 .25em}
.cs-lmr .colo{margin-top:48px;border-top:1px solid var(--ink);padding-top:8px;font:400 12px/18px "IBM Plex Mono",var(--font-mono),monospace;color:var(--ink-muted)}
@media(max-width:560px){.cs-lmr h1 svg{width:32px;height:32px}.cs-lmr .sub{font-size:20px;line-height:26px}.cs-lmr .hero{padding:10px}}
`;
const NS = 'http://www.w3.org/2000/svg';
function glyph(rows) { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 5 5'); s.setAttribute('shape-rendering', 'crispEdges'); s.setAttribute('fill', 'currentColor'); s.setAttribute('aria-hidden', 'true'); rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'X') { const e = document.createElementNS(NS, 'rect'); e.setAttribute('x', x); e.setAttribute('y', y); e.setAttribute('width', 1); e.setAttribute('height', 1); s.appendChild(e); } })); return s; }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Depth sweep, docs/manual/data/bench_dev.json and bench_shadow_dev.json (lmr bench, 6 threads, desktop CPU)
const DEV = [[0, 54, 17], [20, 63, 562], [50, 64, 1078], [100, 65, 1533], [500, 64, 5391]];
const SHA = [[0, 80, 16], [20, 91, 530], [50, 93, 1112], [100, 95, 1611], [500, 96, 6027]];

export default async function renderCase(root, { project: p, base }) {
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const el = document.createElement('div'); el.className = 'cs-lmr'; root.appendChild(el);
  const m = p.media, b = p.body;
  const fig = (i, n, cls) => `<figure><img src="${base + m[i].src}" alt="${esc(m[i].alt)}" loading="lazy"><figcaption><b>${n}</b>${esc(m[i].caption)}</figcaption></figure>`;
  const sw = (rows, name, req) => rows.map(r => `<tr${r[0] === 100 ? ' class="hl"' : ''}><td>${name}</td><td class="v">${r[0] === 0 ? 'none' : r[0]}</td><td class="v">${r[1]} / ${req}</td><td class="v">${r[2] < 1000 ? r[2] + ' ms' : (r[2] / 1000).toFixed(1) + ' s'}</td></tr>`).join('');
  el.innerHTML = `<div class="runhead"><span><b>${esc(p.title)}</b> &middot; technical report</span><span>${esc(p.when)} &middot; ${esc(p.status)} &middot; desktop measurements only</span></div>
    <h1><span class="gl"></span><span>${esc(p.title)}</span></h1>
    <p class="sub">${esc(p.oneliner)}</p>
    <p class="byline">David Hatley, with AI agents working under a preregistered protocol. Edition 1.0, 2026-10-15 manual.</p>
    <ul class="links">${(p.links || []).map(l => `<li><a href="${esc(l.url)}">${esc(l.label)} &rarr;</a></li>`).join('')}</ul>
    <div class="abs"><h2>Abstract</h2><p>${esc(b[0])}</p></div>
    <div class="hero"><div class="pv"></div><div class="cap">The pipeline as a packing problem, beside the real UI. Rows and token counts are from the screenshot's own example.</div></div>

    <h2><span class="n">1</span>Finding</h2>
    <p>${esc(b[1])}</p>
    ${fig(1, 'Fig. 1')}
    ${fig(0, 'Fig. 2')}

    <h2><span class="n">2</span>Method</h2>
    <p>${esc(b[2])}</p>
    <p class="lead">${esc(b[4])}</p>

    <h2><span class="n">3</span>Results</h2>
    <div class="tw"><table><thead><tr><th>measure</th><th>value</th><th>source</th></tr></thead><tbody>
    ${p.spec.map(s => `<tr><td>${esc(s.label)}</td><td class="v">${esc(s.value)}</td><td class="s">${esc(s.source)}</td></tr>`).join('')}</tbody></table></div>
    <div class="tcap"><b>Table 1</b> Headline numbers, each with its source.</div>
    <div class="tw" style="margin-top:24px"><table><thead><tr><th>split</th><th>rerank depth k</th><th>required paragraphs in packet</th><th>median retrieval</th></tr></thead><tbody>${sw(DEV, 'dev', 73)}${sw(SHA, 'shadow_dev', 122)}</tbody></table></div>
    <div class="tcap"><b>Table 2</b> Completion against rerank depth, from the benchmark runs on the dev and shadow-dev splits. The app defaults to k = 100 (shaded): the full-depth result at about a quarter of the time. Retrieval only; generation adds about 4 s.</div>

    <h2><span class="n">4</span>Limitations</h2>
    <p>Every measurement is a desktop measurement. There is no Android build. The 1.5B generator rarely cites and can add facts that are not in its evidence, and the corpus is a fixed 297 articles. One sealed evaluation set went missing during final checks on 2026-10-04; no reported result depends on it.</p>

    <h2><span class="n">5</span>Appendix: the manual</h2>
    <p>The full story, with figures drawn from benchmark JSON, is a 19-page technical manual. Three of its pages:</p>
    <div class="pair">${fig(2, 'A.1')}${fig(3, 'A.2')}${fig(4, 'A.3')}</div>
    <div class="colo">${esc(p.role)} ${esc(p.status_note)}</div>`;
  const g = glyph(p.glyph); g.style.viewTransitionName = 'glyph-' + p.slug; el.querySelector('.gl').appendChild(g);
  const hero = el.querySelector('.pv'); hero.style.viewTransitionName = 'hero-' + p.slug;
  let un = () => {};
  try { const mod = await import('./preview.js'); un = mod.default(hero, { mode: 'hero', base }) || un; } catch (e) { console.warn(e); }
  return () => { un(); el.remove(); style.remove(); };
}
