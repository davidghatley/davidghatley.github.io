const QS = ['template','hop_control','platformer_control','spawner_lanes','score_counter','round_timer','difficulty_ramp'];
const NAME = ['Template','One step at a time','Platformer controls','Lanes of hazards','Score counter','Round timer','Gets harder'];
// Real values from nibble docs/demo/compare-2026-10-18/report.json (Kev-0.8B on CPU vs claude:sonnet, held-out game-v0, 2026-10-18)
const EX = [{"id":"ho-003","t":"my kid loves otters. an otter paddles around a big lake seen from above, visits friends, finds pebbles. nothing can hurt you.","gold":["top-down-roam",false,false,false,false,false,false],"s":["top-down-roam",false,false,false,false,false,false],"p":[0.825,0.812,0.701,0.662,0.726,0.687,0.68],"b":["top-down-roam",false,false,false,false,false,false],"sm":2031,"bm":2552},
{"id":"ho-014","t":"Side-scrolling bee platformer: hop between flowers, bounce off leaves, pick up honey drops for points.","gold":["side-platformer",false,true,false,true,false,false],"s":["side-platformer",false,true,false,false,false,false],"p":[0.821,0.681,0.846,0.56,0.505,0.674,0.617],"b":["side-platformer",false,true,false,true,false,false],"sm":2264,"bm":3452},
{"id":"ho-044","t":"Pinball-ish one screen: keep a firefly bouncing with a paddle, points per bounce, it zips faster every bounce.","gold":["one-screen-arena",false,false,false,true,false,true],"s":["side-platformer",false,false,false,true,false,false],"p":[0.404,0.756,0.528,0.708,0.706,0.769,0.654],"b":["one-screen-arena",false,false,false,true,false,true],"sm":2258,"bm":5256},
{"id":"ho-001","t":"ok so picture a hedgehog trying to get across a motorway, square by square, with lorries whooshing along each lane. you get points every time you make it, there's a 2 minute clock, and the lorries get quicker.","gold":["one-screen-arena",true,false,true,true,true,true],"s":["lane-runner",false,false,true,true,true,false],"p":[0.539,0.574,0.72,0.767,0.843,0.538,0.61],"b":["one-screen-arena",true,false,true,true,true,true],"sm":2316,"bm":2782}];
const CSS = `
.pv-nibble{--a:var(--cobalt-text,#2236b0);display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:24px;font:400 14px/20px var(--font-sans);color:var(--ink)}
.pv-nibble *{box-sizing:border-box}
.pv-nibble.is-narrow{grid-template-columns:1fr}
.pv-nibble .k{font:500 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted)}
.pv-nibble .ex{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 12px}
.pv-nibble button{font:500 12px/16px var(--font-mono);letter-spacing:.06em;color:var(--ink);background:transparent;border:1px solid var(--ink);padding:6px 10px;cursor:pointer;border-radius:0}
.pv-nibble button[aria-pressed=true]{background:var(--cobalt,#2236b0);border-color:var(--cobalt,#2236b0);color:var(--on-cobalt,#f9f9f5)}
.pv-nibble button:focus-visible{outline:2px solid var(--a);outline-offset:2px}
.pv-nibble .q{font:italic 400 16px/22px var(--font-serif);margin:0 0 12px;min-height:44px}
.pv-nibble .tog{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:8px}
.pv-nibble .lat{font:500 12px/16px var(--font-mono);color:var(--ink-muted);margin-left:auto}
.pv-nibble .lat b{color:var(--ink);font:400 32px/32px var(--font-pixel);margin-right:6px}
.pv-nibble .wm{font:850 32px/28px var(--font-display,'Archivo'),sans-serif;font-stretch:125%;letter-spacing:-.03em;margin:0 0 10px;display:flex;align-items:baseline;gap:12px}.pv-nibble .wm small{font:500 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted);font-stretch:100%}.pv-nibble .thr{position:absolute;top:0;bottom:0;left:70%;border-left:2px dashed var(--vermilion);pointer-events:none}.pv-nibble .rt{font:500 10px/14px var(--font-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--vermilion-text,var(--vermilion))}.pv-nibble .row{display:grid;grid-template-columns:150px minmax(0,1fr) 20px;gap:10px;align-items:center;padding:5px 0;border-top:1px solid var(--rule)}
.pv-nibble .nm{font:500 11px/14px var(--font-mono);letter-spacing:.04em;color:var(--ink-muted)}
.pv-nibble .bar{position:relative;height:26px;background:var(--rule-faint,var(--rule));overflow:hidden}
.pv-nibble .fill{position:absolute;left:0;top:0;bottom:0;background:var(--cobalt,#2236b0);transition:width .5s ease-out}
.pv-nibble .lbl{position:absolute;left:6px;top:0;line-height:26px;font:400 16px/26px var(--font-pixel);letter-spacing:0;color:var(--on-cobalt,#f9f9f5);white-space:nowrap;mix-blend-mode:normal}
.pv-nibble .lbl.o{color:var(--ink)}
.pv-nibble .mk{font:600 12px/20px var(--font-mono);text-align:center}
.pv-nibble .ok{color:var(--a)} .pv-nibble .no{color:var(--vermilion)}
.pv-nibble .note{font:400 12px/17px var(--font-sans);color:var(--ink-muted);margin:10px 0 0}
.pv-nibble .ch{border-left:1px solid var(--rule);padding-left:24px}
.pv-nibble.is-narrow .ch{border-left:0;padding-left:0;border-top:1px solid var(--ink);padding-top:16px}
.pv-nibble .cr{display:grid;grid-template-columns:92px minmax(0,1fr);gap:10px;align-items:center;margin:6px 0}
.pv-nibble .cr .nm{color:var(--ink)}
.pv-nibble .cb{height:18px;position:relative;display:flex;align-items:center;gap:8px}
.pv-nibble .cb i{display:block;height:18px;background:var(--ink-muted);flex:none}
.pv-nibble .cb.hl i{background:var(--cobalt,#2236b0)}
.pv-nibble .cb span{white-space:nowrap;font:400 16px/18px var(--font-pixel);color:var(--ink)}

.pv-nibble h3{font:600 14px/20px var(--font-sans);margin:2px 0 4px}
`;
export default function mount(root, { mode }) {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const el = document.createElement('div'); el.className = 'pv-nibble'; root.appendChild(el);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ex = 0, who = 's', timer = 0, raf = 0;
  const fmt = v => typeof v === 'boolean' ? (v ? 'yes' : 'no') : v;
  el.innerHTML = `<div class="demo"><div class="wm">nibble<small>picks below 0.70 go to the big model</small></div><div class="k">Pick an agent question, then the model</div>
    <div class="ex"></div><p class="q"></p>
    <div class="tog"><span class="ex2"></span><span class="lat"></span></div>
    <div class="rows"></div>
    <p class="note"></p></div>
    <div class="ch"><div class="k">Headline result &middot; 50 held-out prompts, 350 decisions</div>
    <h3>Accuracy</h3><div class="acc"></div><h3 style="margin-top:12px">Median wall time, seconds</h3><div class="lt"></div>
    <p class="note">Kev-0.8B on a CPU is 12 points behind the big model and 1.3x faster. The labels were written by Claude, so the big model's 1.00 partly measures shared judgement. Verdict in the repo: too few prompts (50 &lt; 200).</p></div>`;
  const $ = s => el.querySelector(s);
  const exb = $('.ex'), tog = $('.ex2'), rows = $('.rows'), lat = $('.lat');
  EX.forEach((e, i) => { const b = document.createElement('button'); b.textContent = e.id; b.title = e.t; b.onclick = () => { ex = i; render(true); }; exb.appendChild(b); });
  [['s','Kev-0.8B (small)'],['b','Claude Sonnet (big)']].forEach(([k, l]) => { const b = document.createElement('button'); b.textContent = l; b.dataset.k = k; b.onclick = () => { who = k; render(true); }; tog.appendChild(b); });
  tog.style.display = 'flex'; tog.style.gap = '8px';
  const chart = (sel, data, max, hlIdx) => { $(sel).innerHTML = data.map(([n, v, t], i) => `<div class="cr"><span class="nm k" style="letter-spacing:.04em">${n}</span><div class="cb ${i === hlIdx ? 'hl' : ''}"><i style="width:calc((100% - 92px) * ${v / max})"></i><span>${t}</span></div></div>`).join(''); };
  chart('.acc', [['Kev-0.8B', .88, '0.880'], ['Word count', .8714, '0.871'], ['Sonnet', 1, '1.000']], 1, 0);
  chart('.lt', [['Kev-0.8B CPU', 2.259, '2.26'], ['Sonnet CLI', 2.9525, '2.95']], 3, 0);
  function render(animate) {
    const e = EX[ex];
    [...exb.children].forEach((b, i) => b.setAttribute('aria-pressed', i === ex));
    [...tog.children].forEach(b => b.setAttribute('aria-pressed', b.dataset.k === who));
    $('.q').textContent = '“' + e.t + '”';
    cancelAnimationFrame(raf); clearTimeout(timer);
    const ans = who === 's' ? e.s : e.b, ms = who === 's' ? e.sm : e.bm;
    rows.innerHTML = QS.map((q, i) => {
      const hit = ans[i] === e.gold[i];
      let bars;
      if (who === 's') {
        const p = e.p[i];
        bars = `<div class="bar"><div class="fill" style="width:0" data-w="${p * 100}"></div><span class="lbl">${fmt(ans[i])} ${p.toFixed(2)}</span><i class="thr"></i></div>`;
      } else {
        bars = `<div class="bar"><div class="fill" style="width:0" data-w="100"></div><span class="lbl">${fmt(ans[i])} &middot; no odds</span></div>`;
      }
      return `<div class="row"><span class="nm">${NAME[i]}</span>${bars}<span class="mk ${hit ? 'ok' : 'no'}" title="${hit ? 'matches label' : 'differs from label: ' + fmt(e.gold[i])}">${hit ? '✓' : '×'}</span></div>`;
    }).join('');
    const right = ans.filter((a, i) => a === e.gold[i]).length;
    $('.note').textContent = `${right} of 7 match the label. ${who === 's' ? 'Dashed line = the 0.70 routing rule. Bar = the model’s own probability for the option it picked; the rest is spread over the other options.' : 'The big model returns answers without odds.'} Example ${e.id}, real logged run.`;
    const fills = [...rows.querySelectorAll('.fill')];
    const go = () => fills.forEach(f => f.style.width = f.dataset.w + '%');
    if (reduce || !animate) { lat.innerHTML = `<b>${(ms / 1000).toFixed(2)}</b> s wall, all 7`; fills.forEach(f => f.style.transition = 'none'); go(); return; }
    fills.forEach(f => f.style.transition = 'none'); fills.forEach(f => f.getBoundingClientRect()); fills.forEach(f => f.style.transition = '');
    const t0 = performance.now(), run = Math.min(ms, 900);
    const tick = now => { const k = Math.min(1, (now - t0) / run); lat.innerHTML = `<b>${(ms * k / 1000).toFixed(2)}</b> s wall, all 7`; if (k < 1) raf = requestAnimationFrame(tick); else go(); };
    raf = requestAnimationFrame(tick);
  }
  render(false);
  const ro = new ResizeObserver(() => el.classList.toggle('is-narrow', el.clientWidth < 760)); ro.observe(el);
  return () => { cancelAnimationFrame(raf); clearTimeout(timer); ro.disconnect(); st.remove(); el.remove(); };
}
