// primitive preview: "claims to sources". 10 pinned repos, a few claims, each pointing at source files.
// Counts are the real database totals (README.md); the claim wording and paths below are illustrative.
const REPOS = ['swarm', 'pydantic-ai', 'llama.cpp', 'ollama', 'bubbletea', 'duckdb', 'prefect', 'ripgrep', 'FFmpeg', 'three.js'];
const COUNTS = [[10, 'projects'], [48, 'components'], [46, 'concepts'], [215, 'source artifacts'], [231, 'claims'], [720, 'evidence links']];
const CLAIMS = [
  ['three.js', 'renders a scene graph with WebGL', ['src/renderers/WebGLRenderer.js', 'src/core/Object3D.js'], 'MIT'],
  ['ripgrep', 'searches a directory tree, skipping .gitignore matches', ['crates/ignore/src/walk.rs', 'crates/searcher/src/lib.rs'], 'MIT / Unlicense'],
  ['duckdb', 'runs SQL in-process, no server', ['src/main/connection.cpp', 'src/main/database.cpp'], 'MIT'],
];
const STEP = 2600;
const CSS = `
.pv-primitive{--pr:#7a5236;color:var(--ink);background:var(--paper);border:1px solid var(--ink);font:400 13px/16px var(--font-mono)}
.pv-primitive *{box-sizing:border-box}
.pv-primitive .pr-n{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));border-bottom:1px solid var(--ink)}
.pv-primitive .pr-n div{padding:12px 12px 8px;border-right:1px solid var(--rule);min-width:0}
.pv-primitive .pr-n div:last-child{border-right:0}
.pv-primitive .pr-n b{display:block;font:400 32px/32px var(--font-pixel);font-variant-numeric:tabular-nums}
.pv-primitive .pr-n span{display:block;margin-top:4px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pv-primitive .pr-n .hot b{color:var(--vermilion-text)}
.pv-primitive .pr-body{display:grid;grid-template-columns:152px minmax(0,1fr)}
.pv-primitive .pr-repos{list-style:none;margin:0;padding:8px 0;border-right:1px solid var(--rule);background:var(--sheet)}
.pv-primitive .pr-repos li{display:flex;align-items:center;gap:8px;padding:2px 12px;color:var(--ink-muted)}
.pv-primitive .pr-repos li i{width:8px;height:8px;border:1px solid currentColor;flex:none}
.pv-primitive .pr-repos li.on{color:var(--ink)}
.pv-primitive .pr-repos li.on i{background:var(--pr);border-color:var(--pr)}
.pv-primitive .pr-graph{padding:12px 16px;display:flex;flex-direction:column;gap:8px;min-width:0}
.pv-primitive .pr-cap{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-muted);display:flex;justify-content:space-between;gap:8px}
.pv-primitive .pr-row{display:grid;grid-template-columns:minmax(0,1fr) 24px minmax(0,1.1fr);align-items:center}
.pv-primitive .pr-row:not(.on) .pr-claim p{color:var(--ink-muted)}
.pv-primitive .pr-claim{border:1px solid var(--rule);background:var(--sheet);padding:8px 12px;min-width:0}
.pv-primitive .pr-row.on .pr-claim{border-color:var(--ink);border-left:3px solid var(--pr);padding-left:10px}
.pv-primitive .pr-claim em{display:block;font-style:normal;font-size:11px;color:var(--ink-muted)}
.pv-primitive .pr-claim p{margin:4px 0 0;font:400 16px/20px var(--font-sans)}
.pv-primitive .pr-wire{height:1px;background:var(--rule)}
.pv-primitive .pr-row.on .pr-wire{background:var(--ink)}
.pv-primitive .pr-src{display:flex;flex-direction:column;gap:4px;min-width:0;border-left:1px solid var(--rule);padding-left:8px}
.pv-primitive .pr-row.on .pr-src{border-color:var(--ink)}
.pv-primitive .pr-chip{display:flex;gap:8px;justify-content:space-between;border:1px solid var(--rule);padding:2px 8px;font-size:11px;white-space:nowrap;min-width:0;visibility:hidden}
.pv-primitive .pr-chip.in{visibility:visible}
.pv-primitive .pr-chip s{text-decoration:none;overflow:hidden;text-overflow:ellipsis}
.pv-primitive .pr-chip u{text-decoration:none;color:var(--ink-muted);flex:none}
.pv-primitive .pr-row.on .pr-chip u.ok{color:var(--pr)}
.pv-primitive .pr-foot{border-top:1px solid var(--rule);padding:8px 16px;color:var(--ink-muted)}
.pv-primitive .pr-foot b{font-weight:400;color:var(--ink)}
.pv-primitive.hero .pr-graph{padding:16px 24px;gap:12px}
@media(max-width:720px){
 .pv-primitive .pr-n{grid-template-columns:repeat(3,minmax(0,1fr))}
 .pv-primitive .pr-n div:nth-child(3){border-right:0}
 .pv-primitive .pr-n div:nth-child(-n+3){border-bottom:1px solid var(--rule)}
 .pv-primitive .pr-body{grid-template-columns:1fr}
 .pv-primitive .pr-n span{white-space:normal}
 .pv-primitive .pr-repos{display:flex;flex-wrap:wrap;gap:4px 0;border-right:0;border-bottom:1px solid var(--rule)}
 .pv-primitive .pr-repos li{padding:2px 8px}
 .pv-primitive .pr-graph{padding:12px}
 .pv-primitive .pr-row{grid-template-columns:1fr}
 .pv-primitive .pr-wire{width:1px;height:8px;margin-left:12px}
 .pv-primitive .pr-src{border-left:0;padding-left:0}
}
`;
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export default function mount(root, { mode }) {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const de = document.documentElement;
  const dark = de.dataset.theme === 'dark' || (de.dataset.theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const w = document.createElement('div');
  w.className = 'pv-primitive' + (mode === 'hero' ? ' hero' : '');
  w.style.setProperty('--pr', dark ? '#c9a080' : '#7a5236');
  w.setAttribute('aria-label', 'primitive claim graph: 10 pinned repos, 231 claims, 720 evidence links to source');
  w.innerHTML = `<div class="pr-n">${COUNTS.map(([n, l], i) => `<div${i === 5 ? ' class="hot"' : ''}><b data-n="${n}">${reduce ? n : 0}</b><span>${l}</span></div>`).join('')}</div>
  <div class="pr-body"><ul class="pr-repos" aria-label="pinned repos">${REPOS.map(r => `<li data-r="${r}"><i></i>${r}</li>`).join('')}</ul>
  <div class="pr-graph"><div class="pr-cap"><span>claim → source</span><span>illustrative</span></div>
  ${CLAIMS.map(([r, c, src, lic]) => `<div class="pr-row"><div class="pr-claim"><em>${r} · ${esc(lic)}</em><p>${esc(c)}</p></div><div class="pr-wire"></div>
  <div class="pr-src">${src.map(s => `<span class="pr-chip"><s>${esc(s)}</s><u>excerpt</u></span>`).join('')}</div></div>`).join('')}
  </div></div>
  <div class="pr-foot">→ <b>mise en place</b>: flat primitive cards with a license per asset</div>`;
  root.appendChild(w);

  const nums = [...w.querySelectorAll('.pr-n b')], rows = [...w.querySelectorAll('.pr-row')], lis = [...w.querySelectorAll('.pr-repos li')];
  let alive = true, vis = true, timer = 0, cur = -1;
  const wait = ms => new Promise(res => {
    const go = () => { if (!alive) return; if (!vis) { timer = setTimeout(go, 300); return; } res(); };
    timer = setTimeout(go, ms);
  });
  const finalState = () => {
    nums.forEach(b => b.textContent = b.dataset.n);
    w.querySelectorAll('.pr-chip').forEach(c => c.classList.add('in'));
    w.querySelectorAll('.pr-chip u').forEach(u => { u.textContent = 'verified'; u.className = 'ok'; });
  };
  const focus = i => {
    cur = i; rows.forEach((r, j) => r.classList.toggle('on', j === i));
    lis.forEach(l => l.classList.toggle('on', l.dataset.r === CLAIMS[i][0]));
  };

  async function play() {
    // counters step up in 8 ticks while the chips appear one by one
    const chips = [...w.querySelectorAll('.pr-chip')];
    for (let t = 1; t <= 8 && alive; t++) {
      nums.forEach(b => b.textContent = Math.round(b.dataset.n * t / 8));
      const r = Math.min(CLAIMS.length - 1, Math.floor((t - 1) / 3)); if (r !== cur) focus(r);
      chips.slice(0, Math.ceil(chips.length * t / 8)).forEach(c => c.classList.add('in'));
      await wait(110);
    }
    // each claim in turn: its chips get checked against the pinned source
    for (let i = 0; alive; i = (i + 1) % CLAIMS.length) {
      focus(i);
      const us = rows[i].querySelectorAll('u');
      for (const u of us) { await wait(260); u.textContent = 'verified'; u.className = 'ok'; }
      await wait(STEP);
    }
  }

  const io = new IntersectionObserver(e => { vis = e[0].isIntersecting; });
  io.observe(w);
  if (reduce) { finalState(); focus(0); } else play();
  return () => { alive = false; clearTimeout(timer); io.disconnect(); w.remove(); st.remove(); };
}
