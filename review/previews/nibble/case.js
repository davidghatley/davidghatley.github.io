const CSS = `
.cs-nibble{max-width:1200px;margin:0 auto;padding:24px 16px 64px;color:var(--ink);font:400 16px/24px var(--font-sans);--a:var(--cobalt-text,#2236b0)}
.cs-nibble *{box-sizing:border-box}
.cs-nibble a{color:var(--a);text-underline-offset:3px}
.cs-nibble .k{font:500 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted)}
.cs-nibble .top{display:flex;gap:20px;align-items:flex-end;border-bottom:2px solid var(--ink);padding-bottom:16px}
.cs-nibble .top svg{width:56px;height:56px;flex:none;fill:var(--cobalt,#2236b0);shape-rendering:crispEdges}
.cs-nibble h1{font:700 clamp(56px,13vw,120px)/.88 var(--font-display,'Hoop'),sans-serif;letter-spacing:-.03em;margin:0}
.cs-nibble .sub{font:italic 400 18px/26px var(--font-serif);color:var(--ink-muted);margin:12px 0 0;max-width:44rem}
.cs-nibble .meta{display:flex;flex-wrap:wrap;gap:8px 24px;margin:16px 0 0}
.cs-nibble .page{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:32px;margin-top:32px}
.cs-nibble .nb{background:var(--sheet,transparent);background-image:repeating-linear-gradient(to bottom,transparent 0,transparent 31px,var(--rule-faint,var(--rule)) 31px,var(--rule-faint,var(--rule)) 32px);background-image:none}
.cs-nibble .entry{border-top:1px solid var(--ink);padding:16px 0 32px;display:grid;grid-template-columns:110px minmax(0,1fr);gap:20px}
.cs-nibble .date{font:400 16px/24px var(--font-pixel);color:var(--a)}
.cs-nibble .date small{display:block;font:500 11px/16px var(--font-mono);letter-spacing:.1em;color:var(--ink-muted);text-transform:uppercase;margin-top:4px}
.cs-nibble h2{font:700 28px/30px var(--font-display,'Hoop'),sans-serif;letter-spacing:-.015em;margin:0 0 10px}
.cs-nibble p{margin:0 0 12px;max-width:42rem}
.cs-nibble dl{margin:12px 0;display:grid;grid-template-columns:110px minmax(0,1fr);gap:0;border-top:1px solid var(--rule)}
.cs-nibble dt{font:600 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--a);padding:8px 0;border-bottom:1px solid var(--rule)}
.cs-nibble dd{margin:0;padding:6px 0;border-bottom:1px solid var(--rule)}
.cs-nibble dd.v{font-weight:700}
.cs-nibble .exp{border:1px solid var(--ink);padding:16px;margin:16px 0;background:var(--sheet,transparent)}
.cs-nibble .exp>.k{margin-bottom:8px}
.cs-nibble .margin{border-left:2px solid var(--vermilion);padding-left:12px;position:sticky;top:16px;align-self:start}
.cs-nibble .margin b{display:block;font:400 16px/24px var(--font-pixel);color:var(--vermilion-text,var(--vermilion));margin-bottom:6px}
.cs-nibble .margin p{font:400 13px/19px var(--font-sans);color:var(--ink-muted)}
.cs-nibble .oq{margin:0;padding:0;list-style:none;counter-reset:q}
.cs-nibble .oq li{counter-increment:q;padding:8px 0 8px 40px;position:relative;border-bottom:1px solid var(--rule);max-width:44rem}
.cs-nibble .oq li::before{content:counter(q);position:absolute;left:0;top:6px;font:400 16px/24px var(--font-pixel);color:var(--a)}
.cs-nibble .ev{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;margin:16px 0}
.cs-nibble figure{margin:0}.cs-nibble figure img{display:block;width:100%;height:auto;max-width:100%;border:1px solid var(--rule)}
.cs-nibble figcaption{font:italic 400 14px/20px var(--font-serif);color:var(--ink-muted);margin-top:6px}
.cs-nibble .spec{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin:12px 0}
.cs-nibble .spec div{border-top:1px solid var(--ink);padding-top:8px}
.cs-nibble .spec b{display:block;font:400 16px/24px var(--font-pixel)}
.cs-nibble .links{display:flex;flex-wrap:wrap;gap:12px;margin-top:12px}
.cs-nibble .links a{font:600 12px/16px var(--font-mono);letter-spacing:.1em;text-transform:uppercase;border:2px solid var(--ink);color:var(--ink);padding:10px 14px;text-decoration:none}
.cs-nibble .links a.p{background:var(--cobalt,#2236b0);border-color:var(--cobalt,#2236b0);color:var(--on-cobalt,#f9f9f5)}
.cs-nibble .links a:focus-visible{outline:2px solid var(--a);outline-offset:2px}
@media(max-width:820px){.cs-nibble .page{grid-template-columns:1fr}.cs-nibble .margin{position:static;order:-1;margin-bottom:8px}.cs-nibble .entry{grid-template-columns:1fr;gap:6px}.cs-nibble dl{grid-template-columns:1fr}.cs-nibble dt{border-bottom:0;padding-bottom:0}}
`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export default function renderCase(root, { project, base, meta }) {
  const p = project, b = base || './';
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const el = document.createElement('div'); el.className = 'cs-nibble'; root.appendChild(el);
  let rects = '';
  (p.glyph || []).forEach((r, y) => [...r].forEach((c, x) => { if (c === 'X') rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`; }));
  const link = l => (p.links || []).find(x => x.label === l);
  const L = link('Landing page'), G = link('GitHub');
  const others = (p.links || []).filter(x => x !== L && x !== G);
  el.innerHTML = `
  <header class="top"><svg class="glyph" viewBox="0 0 5 5" aria-hidden="true">${rects}</svg><div><div class="k">Lab notebook &middot; ${esc(p.status)} &middot; ${esc(p.when)}</div><h1>nibble</h1></div></header>
  <p class="sub">${esc(p.oneliner)}</p>
  <div class="meta"><span class="k">${esc(p.role)}</span></div>
  <div class="links">${L ? `<a class="p" href="${esc(L.url)}">Landing page</a>` : ''}${G ? `<a href="${esc(G.url)}">GitHub</a>` : ''}</div>
  <div class="page"><div class="nb">
    <section class="entry"><div class="date">2026-10-17<small>Entry 1</small></div><div>
      <h2>Intent</h2>
      ${(p.body || []).slice(0, 1).map(t => `<p>${esc(t)}</p>`).join('')}
      <dl><dt>Hypothesis</dt><dd>A small model on a CPU can pick among typed options at least as well as a big model, and faster.</dd>
      <dt>Status</dt><dd>${esc(p.status_note)}</dd></dl>
      <div class="spec">${(p.spec || []).map(s => `<div><span class="k">${esc(s.label)}</span><b>${esc(s.value)}</b>${s.source ? `<span class="k">${esc(s.source)}</span>` : ''}</div>`).join('')}</div>
    </div></section>
    <section class="entry"><div class="date">2026-10-18<small>Entry 2</small></div><div>
      <h2>Encodings, then a held-out compare</h2>
      <p>Two ways of writing the question for the model were tried in parallel. Encoding A v0 scored 0.784 on dev. Encoding B scored 0.903 on dev and became the default (decision 0001). A cross-encoder cheap alternative scored 0.717 in 5-fold CV at p50 54 ms.</p>
      <dl><dt>Hypothesis</dt><dd>Kev-0.8B on CPU matches the big model within 5 points on 50 held-out game-idea prompts (350 yes/no and choose-one decisions), and is faster.</dd>
      <dt>Method</dt><dd>Same prompts to Kev-0.8B (encoding B, CPU) and claude -p sonnet, scored against labels. Big-model replies cached; word-count baseline for reference.</dd>
      <dt>Result</dt><dd>Accuracy 0.880 vs 1.000 (baseline 0.871). Median wall 2.26 s vs 2.95 s, 1.3x faster. Difference &minus;12.0 points, 95% interval [&minus;15.1, &minus;8.9].</dd>
      <dt>Verdict</dt><dd class="v">TOO-FEW (50 &lt; 200 prompts). Even so, Kev-0.8B loses on quality here.</dd></dl>
      <div class="exp" id="nb-exp"><div class="k">The experiment, replayed: pick a logged prompt, flip the model</div></div>
    </div></section>
    <section class="entry"><div class="date">2026-10-22<small>Entry 3</small></div><div>
      <h2>Kev-4B and a fine-tune</h2>
      ${(p.body || []).slice(1, 2).map(t => `<p>${esc(t)}</p>`).join('')}
      <dl><dt>Hypothesis</dt><dd>A bigger Kev, or a fine-tune on rubric labels, closes the quality gap.</dd>
      <dt>Method</dt><dd>Kev-4B composing shadcn landing pages (about 1.7 s per commit log), then a chunked fine-tune on the shared 3060.</dd>
      <dt>Verdict</dt><dd class="v">Open. Branch exp/shadcn-picker; not yet compared to a big model.</dd></dl>
    </div></section>
    <section class="entry"><div class="date">Lesson<small>Earlier work</small></div><div>
      <h2>What the old classifiers taught</h2>
      ${(p.body || []).slice(2).map(t => `<p>${esc(t)}</p>`).join('')}
    </div></section>
    <section class="entry"><div class="date">Open<small>Questions</small></div><div>
      <h2>Open questions</h2>
      <ol class="oq"><li>Who decides the right answers? Labels here were written by Claude, and the big model is Claude. Hand labels or run outcomes are needed.</li>
      <li>How large must the held-out set be, and what margin counts as at least as well? Placeholders are 200 prompts and &minus;5 points.</li>
      <li>Which Kev size? Kev-0.8B scores 0.697 on Kev&rsquo;s never-trained test sources against 0.838 for Kev-4B.</li>
      <li>What does faster mean: lower median wall time than the big model on the same machine, or an absolute target?</li></ol>
    </div></section>
    <section class="entry"><div class="date">Plates<small>Evidence</small></div><div>
      <div class="ev">${(p.media || []).map(m => `<figure><img src="${b}${esc(m.src)}" alt="${esc(m.alt)}" loading="lazy"><figcaption>${esc(m.caption || '')}</figcaption></figure>`).join('')}</div>
      <div class="links">${L ? `<a class="p" href="${esc(L.url)}">Landing page</a>` : ''}${G ? `<a href="${esc(G.url)}">GitHub</a>` : ''}${others.map(o => `<a href="${esc(o.url)}">${esc(o.label)}</a>`).join('')}</div>
    </div></section>
  </div>
  <aside class="margin"><div class="k">Margin note</div><b>TOO-FEW</b><p>The headline gap is 12 points on 50 prompts. The pre-set size floor is 200, so this is a read, not a result. The big model's 1.000 is graded against labels written by Claude.</p>
  <p>Accuracy: Kev-0.8B 0.880, word count 0.871, Sonnet 1.000. Median wall: 2.26 s vs 2.95 s.</p></aside></div>`;
  const hero = el.querySelector('.top'); hero.style.viewTransitionName = 'hero-' + p.slug;
  el.querySelector('.glyph').style.viewTransitionName = 'glyph-' + p.slug;
  let off = null, dead = false;
  import('./preview.js').then(m => { if (!dead) off = m.default(el.querySelector('#nb-exp'), { mode: 'hero', base: b }); }).catch(() => {});
  return () => { dead = true; if (off) off(); st.remove(); el.remove(); };
}
