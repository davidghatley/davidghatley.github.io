const OPENED = (a) => !!(a[1] && a[1].opened);   // the dossier already opens on the instrument
// lmr deep dive, rendered under the shared dossier header (site.js): the header owns the title, the work, the
// result, my decisions, status and links, so this page starts at the abstract and reads like a technical report.
const CSS = `
.cs-lmr{--a:#2c4a86;max-width:1000px;margin:0 auto;padding:0 0 64px;color:var(--ink);font:400 16px/24px "IBM Plex Sans",var(--font-sans),system-ui,sans-serif}
html[data-theme=dark] .cs-lmr{--a:#8fa9e0}
@media (prefers-color-scheme:dark){html:not([data-theme=light]) .cs-lmr{--a:#8fa9e0}}
.cs-lmr *{box-sizing:border-box}
.cs-lmr h2{margin:48px 0 8px;font:600 12px/16px "IBM Plex Mono",var(--font-mono),monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--a);display:flex;gap:12px;align-items:baseline}
.cs-lmr h2 .n{font:400 16px/16px var(--font-pixel);color:var(--ink)}
.cs-lmr h2:first-child{margin-top:0}
.cs-lmr p{margin:0 0 16px;max-width:70ch}
.cs-lmr .lead{font:italic 400 20px/28px "Newsreader",var(--font-serif),Georgia,serif;color:var(--ink-muted)}
.cs-lmr .hero{margin:16px 0 0;border:1px solid var(--ink);background:var(--sheet);padding:16px}
.cs-lmr .hero .cap,.cs-lmr figcaption{font:italic 400 14px/20px "Newsreader",var(--font-serif),Georgia,serif;color:var(--ink-muted);margin-top:8px}
.cs-lmr figure{margin:16px 0 0;border:1px solid var(--rule);background:var(--sheet);padding:12px}
.cs-lmr figure img{display:block;max-width:100%;height:auto;margin:0 auto}
.cs-lmr .pair{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;align-items:start}
.cs-lmr .pair figure{margin:0}
.cs-lmr .tw{overflow-x:auto;margin-top:8px}
.cs-lmr table{border-collapse:collapse;width:100%;min-width:560px;font:400 13px/20px "IBM Plex Sans",var(--font-sans),sans-serif;font-variant-numeric:tabular-nums}
.cs-lmr th{font:600 12px/16px "IBM Plex Mono",var(--font-mono),monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-muted);text-align:left;padding:6px 12px 6px 0;border-bottom:2px solid var(--ink);border-top:1px solid var(--ink)}
.cs-lmr td{padding:8px 12px 8px 0;border-bottom:1px solid var(--rule);vertical-align:top}
.cs-lmr td.v{font:400 16px/20px var(--font-pixel);white-space:nowrap}
.cs-lmr td.s{font:400 12px/16px "IBM Plex Mono",var(--font-mono),monospace;color:var(--ink-muted)}
.cs-lmr tr.hl td{background:var(--sheet)}
.cs-lmr .tcap{font:italic 400 14px/20px "Newsreader",var(--font-serif),Georgia,serif;color:var(--ink-muted);margin-top:8px}
@media(max-width:560px){.cs-lmr .hero{padding:8px}}
`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Depth sweep, docs/manual/data/bench_dev.json and bench_shadow_dev.json (lmr bench, 6 threads, desktop CPU)
const DEV = [[0, 54, 17], [20, 63, 562], [50, 64, 1078], [100, 65, 1533], [500, 64, 5391]];
const SHA = [[0, 80, 16], [20, 91, 530], [50, 93, 1112], [100, 95, 1611], [500, 96, 6027]];

export default async function renderCase(root, { project: p, base }) {
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const el = document.createElement('div'); el.className = 'cs-lmr'; root.appendChild(el);
  const m = p.media, b = p.body;
  // the web UI (media 0) is the dossier's work, so it isn't repeated here
  const fig = (i) => `<figure><img src="${base + m[i].src}" alt="${esc(m[i].alt)}" loading="lazy"><figcaption>${esc(m[i].caption)}</figcaption></figure>`;
  const sw = (rows, name, req) => rows.map(r => `<tr${r[0] === 100 ? ' class="hl"' : ''}><td>${name}</td><td class="v">${r[0] === 0 ? 'none' : r[0]}</td><td class="v">${r[1]} / ${req}</td><td class="v">${r[2] < 1000 ? r[2] + ' ms' : (r[2] / 1000).toFixed(1) + ' s'}</td></tr>`).join('');
  el.innerHTML = `<h2><span class="n">1</span>Finding</h2>
    <p>${esc(b[0])}</p>
    <p>${esc(b[1])}</p>
    ${fig(1)}
    <div class="hero"><div class="pv"></div><div class="cap">The pipeline as a packing problem, beside the real UI. Rows and token counts are from the screenshot's own example.</div></div>

    <h2><span class="n">2</span>Method</h2>
    <p>${esc(b[2])}</p>
    <p class="lead">${esc(b[4])}</p>

    <h2><span class="n">3</span>Results</h2>
    <div class="tw"><table><thead><tr><th>measure</th><th>value</th><th>source</th></tr></thead><tbody>
    ${p.spec.map(s => `<tr><td>${esc(s.label)}</td><td class="v">${esc(s.value)}</td><td class="s">${esc(s.source)}</td></tr>`).join('')}</tbody></table></div>
    <div class="tcap">Headline numbers, each with its source.</div>
    <div class="tw" style="margin-top:24px"><table><thead><tr><th>split</th><th>rerank depth k</th><th>required paragraphs in packet</th><th>median retrieval</th></tr></thead><tbody>${sw(DEV, 'dev', 73)}${sw(SHA, 'shadow_dev', 122)}</tbody></table></div>
    <div class="tcap">Completion against rerank depth, from the benchmark runs on the dev and shadow-dev splits. The app defaults to k = 100 (shaded): the full-depth result at about a quarter of the time. Retrieval only; generation adds about 4 s.</div>

    <h2><span class="n">4</span>Limitations</h2>
    <p>Every measurement is a desktop measurement. There is no Android build. The 1.5B generator rarely cites and can add facts that are not in its evidence, and the corpus is a fixed 297 articles.</p>
    <p data-draft="true">${esc(b[3])}</p>
    <p data-draft="true">${esc(b[5])}</p>

    <h2><span class="n">5</span>The manual</h2>
    <p>The full story, with figures drawn from benchmark JSON, is a 19-page technical manual. Three of its pages:</p>
    <div class="pair">${fig(2)}${fig(3)}${fig(4)}</div>`;
  const hero = el.querySelector('.pv');
  let un = () => {};
  if (OPENED(arguments)) hero.closest('.hero').remove(); else try { const mod = await import('./preview.js'); un = mod.default(hero, { mode: 'hero', base }) || un; } catch (e) { console.warn(e); }
  return () => { un(); el.remove(); style.remove(); };
}
