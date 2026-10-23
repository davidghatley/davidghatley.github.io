// precision-canvas preview: "473 specs, 0 pixels". The spec fills up; the canvas stays empty.
// Private repo: counts only (STATUS.md via ship/experiments-facts.md §6). No spec text is shown.
const TIERS = [[376, 'proven'], [87, 'better'], [10, 'new']];
const TOTAL = 473, INV = 14, TICKS = 16, HOLD = 3600;
const CSS = `
.pv-precision-canvas{--pc:#6e6a62;color:var(--ink);background:var(--paper);border:1px solid var(--ink);font:400 13px/16px var(--font-mono)}
.pv-precision-canvas *{box-sizing:border-box}
.pv-precision-canvas .pc-n{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-bottom:1px solid var(--ink)}
.pv-precision-canvas .pc-n div{padding:12px 12px 8px;border-right:1px solid var(--rule);min-width:0}
.pv-precision-canvas .pc-n div:last-child{border-right:0}
.pv-precision-canvas .pc-n b{display:block;font:400 32px/32px var(--font-pixel);font-variant-numeric:tabular-nums}
.pv-precision-canvas .pc-n span{display:block;margin-top:4px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-muted)}
.pv-precision-canvas .pc-body{display:grid;grid-template-columns:auto minmax(0,1fr)}
.pv-precision-canvas .pc-spec{padding:16px;border-right:1px solid var(--rule);background:var(--sheet)}
.pv-precision-canvas .pc-cap{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:8px;display:flex;justify-content:space-between;gap:12px}
.pv-precision-canvas .pc-grid{display:grid;grid-template-columns:repeat(32,8px);gap:2px}
.pv-precision-canvas .pc-grid i{width:8px;height:8px;border:1px solid var(--rule)}
.pv-precision-canvas .pc-grid i.p{background:var(--pc);border-color:var(--pc)}
.pv-precision-canvas .pc-grid i.b{background:var(--pc);border-color:var(--pc);opacity:.45}
.pv-precision-canvas .pc-grid i.w{border-color:var(--ink)}
.pv-precision-canvas .pc-inv{display:grid;grid-template-columns:repeat(14,8px);gap:2px;margin-top:12px;align-items:center}
.pv-precision-canvas .pc-inv i{width:8px;height:8px;border:1px solid var(--rule)}
.pv-precision-canvas .pc-inv i.on{background:var(--ink);border-color:var(--ink)}
.pv-precision-canvas .pc-key{display:flex;flex-wrap:wrap;gap:4px 16px;margin-top:12px;font-size:11px;color:var(--ink-muted)}
.pv-precision-canvas .pc-key span{display:flex;align-items:center;gap:6px}
.pv-precision-canvas .pc-key i{width:8px;height:8px;border:1px solid var(--pc);flex:none}
.pv-precision-canvas .pc-key .p{background:var(--pc)}
.pv-precision-canvas .pc-key .b{background:var(--pc);opacity:.45}
.pv-precision-canvas .pc-key .w{border-color:var(--ink)}
.pv-precision-canvas .pc-key .v{background:var(--ink);border-color:var(--ink)}
.pv-precision-canvas .pc-canvas{display:flex;flex-direction:column;padding:16px;min-width:0}
.pv-precision-canvas .pc-frame{flex:1;min-height:200px;border:1px solid var(--ink);background:var(--sheet);position:relative}
.pv-precision-canvas .pc-frame::before,.pv-precision-canvas .pc-frame::after{content:'';position:absolute;background:var(--ink)}
.pv-precision-canvas .pc-frame::before{left:50%;top:calc(50% - 12px);width:1px;height:24px}
.pv-precision-canvas .pc-frame::after{top:50%;left:calc(50% - 12px);height:1px;width:24px}
.pv-precision-canvas .pc-frame.blink::before,.pv-precision-canvas .pc-frame.blink::after{animation:pcblink 1.1s steps(2,jump-none) infinite}
.pv-precision-canvas.paused .pc-frame::before,.pv-precision-canvas.paused .pc-frame::after{animation-play-state:paused}
@keyframes pcblink{50%{opacity:0}}
.pv-precision-canvas .pc-tag{position:absolute;left:8px;top:8px;font-size:11px;color:var(--ink-muted)}
.pv-precision-canvas .pc-zero{display:flex;justify-content:space-between;gap:12px;margin-top:8px;align-items:baseline}
.pv-precision-canvas .pc-zero b{font:400 16px/16px var(--font-pixel);color:var(--vermilion-text)}
.pv-precision-canvas .pc-zero span{color:var(--ink-muted);font-size:11px}
.pv-precision-canvas .pc-foot{border-top:1px solid var(--rule);padding:8px 16px;color:var(--ink-muted)}
.pv-precision-canvas .pc-foot b{font-weight:400;color:var(--ink)}
.pv-precision-canvas.hero .pc-frame{min-height:240px}
@media(max-width:720px){
 .pv-precision-canvas .pc-n{grid-template-columns:repeat(2,minmax(0,1fr))}
 .pv-precision-canvas .pc-n div:nth-child(2){border-right:0}
 .pv-precision-canvas .pc-n div:nth-child(-n+2){border-bottom:1px solid var(--rule)}
 .pv-precision-canvas .pc-body{grid-template-columns:1fr}
 .pv-precision-canvas .pc-spec{border-right:0;border-bottom:1px solid var(--rule)}
 .pv-precision-canvas .pc-frame{min-height:160px}
}
`;

export default function mount(root, { mode }) {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const de = document.documentElement;
  const dark = de.dataset.theme === 'dark' || (de.dataset.theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const w = document.createElement('div');
  w.className = 'pv-precision-canvas' + (mode === 'hero' ? ' hero' : '');
  w.style.setProperty('--pc', dark ? '#b3ada2' : '#6e6a62');
  w.setAttribute('aria-label', 'precision-canvas: a 620 KB spec with 473 capabilities and 14 invariants, next to an empty canvas: 0 pixels drawn');
  const cls = k => k < TIERS[0][0] ? 'p' : k < TIERS[0][0] + TIERS[1][0] ? 'b' : 'w';
  w.innerHTML = `<div class="pc-n">
    <div><b>620</b><span>KB of spec</span></div><div><b class="pc-cnt">473</b><span>capabilities</span></div>
    <div><b class="pc-ic">14</b><span>invariants</span></div><div><b>0</b><span>editor</span></div></div>
  <div class="pc-body"><div class="pc-spec"><div class="pc-cap"><span>spec, frozen</span><span class="pc-k">473 / 473</span></div>
    <div class="pc-grid" aria-hidden="true">${'<i></i>'.repeat(TOTAL)}</div>
    <div class="pc-inv" aria-hidden="true">${'<i></i>'.repeat(INV)}</div>
    <div class="pc-key"><span><i class="p"></i>proven 376</span><span><i class="b"></i>better 87</span><span><i class="w"></i>new 10</span><span><i class="v"></i>14 invariants</span></div></div>
  <div class="pc-canvas"><div class="pc-frame${reduce ? '' : ' blink'}"><span class="pc-tag">canvas</span></div>
    <div class="pc-zero"><b>0 pixels drawn</b><span>no editor, no renderer</span></div></div></div>
  <div class="pc-foot">→ <b>napkin</b>: working canvas first, one mutation path for human and agent</div>`;
  root.appendChild(w);

  const cells = [...w.querySelectorAll('.pc-grid i')], invs = [...w.querySelectorAll('.pc-inv i')];
  const cnt = w.querySelector('.pc-cnt'), ic = w.querySelector('.pc-ic'), k = w.querySelector('.pc-k');
  const draw = (n, m) => {
    cells.forEach((c, i) => c.className = i < n ? cls(i) : '');
    invs.forEach((c, i) => c.className = i < m ? 'on' : '');
    cnt.textContent = n; ic.textContent = m; k.textContent = `${n} / ${TOTAL}`;
  };
  let alive = true, vis = true, timer = 0;
  const wait = ms => new Promise(res => {
    const go = () => { if (!alive) return; if (!vis) { timer = setTimeout(go, 300); return; } res(); };
    timer = setTimeout(go, ms);
  });
  async function play() {
    while (alive) {
      draw(0, 0); await wait(400);
      for (let t = 1; t <= TICKS && alive; t++) { draw(Math.round(TOTAL * t / TICKS), Math.round(INV * t / TICKS)); await wait(120); }
      await wait(HOLD);
    }
  }
  const io = new IntersectionObserver(e => { vis = e[0].isIntersecting; w.classList.toggle('paused', !vis); });
  io.observe(w);
  if (reduce) draw(TOTAL, INV); else play();
  return () => { alive = false; clearTimeout(timer); io.disconnect(); w.remove(); st.remove(); };
}
