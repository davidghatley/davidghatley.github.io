const QS = ['template','hop_control','platformer_control','spawner_lanes','score_counter','round_timer','difficulty_ramp'];
const NAME = ['Template','One step at a time','Platformer controls','Lanes of hazards','Score counter','Round timer','Gets harder'];
// Real values from nibble docs/demo/compare-2026-10-18/report.json (Kev-0.8B on CPU vs claude:sonnet, held-out game-v0, 2026-10-18)
const EX = [{"id":"ho-003","t":"my kid loves otters. an otter paddles around a big lake seen from above, visits friends, finds pebbles. nothing can hurt you.","gold":["top-down-roam",false,false,false,false,false,false],"s":["top-down-roam",false,false,false,false,false,false],"p":[0.825,0.812,0.701,0.662,0.726,0.687,0.68],"b":["top-down-roam",false,false,false,false,false,false],"sm":2031,"bm":2552},
{"id":"ho-014","t":"Side-scrolling bee platformer: hop between flowers, bounce off leaves, pick up honey drops for points.","gold":["side-platformer",false,true,false,true,false,false],"s":["side-platformer",false,true,false,false,false,false],"p":[0.821,0.681,0.846,0.56,0.505,0.674,0.617],"b":["side-platformer",false,true,false,true,false,false],"sm":2264,"bm":3452},
{"id":"ho-044","t":"Pinball-ish one screen: keep a firefly bouncing with a paddle, points per bounce, it zips faster every bounce.","gold":["one-screen-arena",false,false,false,true,false,true],"s":["side-platformer",false,false,false,true,false,false],"p":[0.404,0.756,0.528,0.708,0.706,0.769,0.654],"b":["one-screen-arena",false,false,false,true,false,true],"sm":2258,"bm":5256},
{"id":"ho-001","t":"ok so picture a hedgehog trying to get across a motorway, square by square, with lorries whooshing along each lane. you get points every time you make it, there's a 2 minute clock, and the lorries get quicker.","gold":["one-screen-arena",true,false,true,true,true,true],"s":["lane-runner",false,false,true,true,true,false],"p":[0.539,0.574,0.72,0.767,0.843,0.538,0.61],"b":["one-screen-arena",true,false,true,true,true,true],"sm":2316,"bm":2782}];
// All 350 recorded decisions in prompt order (7 per prompt): [kev confidence, kev correct, big correct]; wall ms per prompt call.
const REC=[[0.54,0,1],[0.57,0,1],[0.72,1,1],[0.77,1,1],[0.84,1,1],[0.54,1,1],[0.61,0,1],[0.65,1,1],[0.71,1,1],[0.66,1,1],[0.65,1,1],[0.56,0,1],[0.71,1,1],[0.54,0,1],[0.82,1,1],[0.81,1,1],[0.7,1,1],[0.66,1,1],[0.73,1,1],[0.69,1,1],[0.68,1,1],[0.74,1,1],[0.71,1,1],[0.72,1,1],[0.63,1,1],[0.52,0,1],[0.71,1,1],[0.57,1,1],[0.45,1,1],[0.75,1,1],[0.55,1,1],[0.78,1,1],[0.59,1,1],[0.52,0,1],[0.5,1,1],[0.76,1,1],[0.73,1,1],[0.6,1,1],[0.8,1,1],[0.81,1,1],[0.76,1,1],[0.69,1,1],[0.71,1,1],[0.68,1,1],[0.72,1,1],[0.67,1,1],[0.73,1,1],[0.68,1,1],[0.68,1,1],[0.66,1,1],[0.78,1,1],[0.73,1,1],[0.7,1,1],[0.54,0,1],[0.73,1,1],[0.67,1,1],[0.62,1,1],[0.61,1,1],[0.67,1,1],[0.69,1,1],[0.56,1,1],[0.82,1,1],[0.74,1,1],[0.86,1,1],[0.68,1,1],[0.8,1,1],[0.61,1,1],[0.62,1,1],[0.78,1,1],[0.51,0,1],[0.77,1,1],[0.73,1,1],[0.73,1,1],[0.7,1,1],[0.67,1,1],[0.7,1,1],[0.58,1,1],[0.41,1,1],[0.79,1,1],[0.71,1,1],[0.75,0,1],[0.66,1,1],[0.69,1,1],[0.57,1,1],[0.48,1,1],[0.6,1,1],[0.74,1,1],[0.69,1,1],[0.84,1,1],[0.65,1,1],[0.76,1,1],[0.82,1,1],[0.68,1,1],[0.85,1,1],[0.56,1,1],[0.5,0,1],[0.67,1,1],[0.62,1,1],[0.66,1,1],[0.78,1,1],[0.71,1,1],[0.59,1,1],[0.53,1,1],[0.71,1,1],[0.68,1,1],[0.38,1,1],[0.73,1,1],[0.61,1,1],[0.88,1,1],[0.68,1,1],[0.62,1,1],[0.52,1,1],[0.61,1,1],[0.78,1,1],[0.61,1,1],[0.62,1,1],[0.6,0,1],[0.67,1,1],[0.65,1,1],[0.91,1,1],[0.72,1,1],[0.84,1,1],[0.73,1,1],[0.7,1,1],[0.68,1,1],[0.67,0,1],[0.91,1,1],[0.61,1,1],[0.83,1,1],[0.58,1,1],[0.58,1,1],[0.66,1,1],[0.65,1,1],[0.6,1,1],[0.66,1,1],[0.69,1,1],[0.56,1,1],[0.66,1,1],[0.73,1,1],[0.65,0,1],[0.78,1,1],[0.7,1,1],[0.66,1,1],[0.64,1,1],[0.66,1,1],[0.7,1,1],[0.62,1,1],[0.74,1,1],[0.5,0,1],[0.79,1,1],[0.84,1,1],[0.54,1,1],[0.65,1,1],[0.69,1,1],[0.61,1,1],[0.71,1,1],[0.51,0,1],[0.78,1,1],[0.87,1,1],[0.59,1,1],[0.68,1,1],[0.53,1,1],[0.62,1,1],[0.62,1,1],[0.59,0,1],[0.65,0,1],[0.56,1,1],[0.67,1,1],[0.37,0,1],[0.75,1,1],[0.65,1,1],[0.62,1,1],[0.64,1,1],[0.8,1,1],[0.65,1,1],[0.74,1,1],[0.73,1,1],[0.81,1,1],[0.55,1,1],[0.71,1,1],[0.72,1,1],[0.66,1,1],[0.71,1,1],[0.66,1,1],[0.67,1,1],[0.58,1,1],[0.63,1,1],[0.72,1,1],[0.53,0,1],[0.78,1,1],[0.77,1,1],[0.74,1,1],[0.76,1,1],[0.8,1,1],[0.7,1,1],[0.63,1,1],[0.86,1,1],[0.72,1,1],[0.65,1,1],[0.75,1,1],[0.52,1,1],[0.62,1,1],[0.67,1,1],[0.45,1,1],[0.73,1,1],[0.51,1,1],[0.68,1,1],[0.52,1,1],[0.67,1,1],[0.69,1,1],[0.65,1,1],[0.83,1,1],[0.62,1,1],[0.58,1,1],[0.61,1,1],[0.72,1,1],[0.61,0,1],[0.71,1,1],[0.81,1,1],[0.54,1,1],[0.75,1,1],[0.5,0,1],[0.73,1,1],[0.62,0,1],[0.89,1,1],[0.73,1,1],[0.73,1,1],[0.71,1,1],[0.65,1,1],[0.69,1,1],[0.69,1,1],[0.43,1,1],[0.61,1,1],[0.61,1,1],[0.7,1,1],[0.51,0,1],[0.64,1,1],[0.64,1,1],[0.81,1,1],[0.79,1,1],[0.65,1,1],[0.72,1,1],[0.63,1,1],[0.5,0,1],[0.53,0,1],[0.59,1,1],[0.65,1,1],[0.71,1,1],[0.6,1,1],[0.71,1,1],[0.52,1,1],[0.65,0,1],[0.83,1,1],[0.66,1,1],[0.57,1,1],[0.72,1,1],[0.69,1,1],[0.66,1,1],[0.66,1,1],[0.82,1,1],[0.67,1,1],[0.7,1,1],[0.66,1,1],[0.65,1,1],[0.83,1,1],[0.67,1,1],[0.81,1,1],[0.81,1,1],[0.73,1,1],[0.71,1,1],[0.67,0,1],[0.69,1,1],[0.72,1,1],[0.37,1,1],[0.67,1,1],[0.55,0,1],[0.74,1,1],[0.51,1,1],[0.57,0,1],[0.52,0,1],[0.86,1,1],[0.73,1,1],[0.89,1,1],[0.73,1,1],[0.71,1,1],[0.67,1,1],[0.53,0,1],[0.61,1,1],[0.8,1,1],[0.81,1,1],[0.76,1,1],[0.56,0,1],[0.7,1,1],[0.68,1,1],[0.85,1,1],[0.77,1,1],[0.67,1,1],[0.61,0,1],[0.63,1,1],[0.75,1,1],[0.57,0,1],[0.4,0,1],[0.76,1,1],[0.53,1,1],[0.71,1,1],[0.71,1,1],[0.77,1,1],[0.65,0,1],[0.8,1,1],[0.53,1,1],[0.63,1,1],[0.74,1,1],[0.66,1,1],[0.68,1,1],[0.55,0,1],[0.84,1,1],[0.75,1,1],[0.72,1,1],[0.78,1,1],[0.7,1,1],[0.71,1,1],[0.64,1,1],[0.68,1,1],[0.71,1,1],[0.61,1,1],[0.68,1,1],[0.58,0,1],[0.51,1,1],[0.67,1,1],[0.37,1,1],[0.65,1,1],[0.74,1,1],[0.57,0,1],[0.65,1,1],[0.69,1,1],[0.63,0,1],[0.88,1,1],[0.65,1,1],[0.72,1,1],[0.76,1,1],[0.51,0,1],[0.7,1,1],[0.67,1,1],[0.86,1,1],[0.7,1,1],[0.62,1,1],[0.74,1,1],[0.74,1,1],[0.78,1,1],[0.71,1,1]];
const SM=[2316, 2067, 2031, 2092, 2103, 2188, 2194, 2179, 2422, 3037, 2224, 2201, 2242, 2264, 2180, 2182, 2216, 2239, 2192, 2197, 2220, 2415, 3087, 3120, 3107, 3216, 3107, 3093, 3115, 3103, 3137, 2975, 2193, 2246, 2274, 2284, 2260, 2309, 2267, 2230, 2216, 2242, 2219, 2258, 2508, 2199, 2275, 2355, 2297, 2318],BM=[2782, 2683, 2552, 2741, 3307, 3104, 2851, 2952, 2707, 2953, 2442, 2656, 3036, 3452, 3248, 2599, 2916, 5607, 2755, 3002, 3438, 2729, 2781, 4828, 7168, 4747, 2800, 2916, 2822, 2734, 4526, 2908, 6724, 3424, 2768, 3159, 2116, 2779, 3010, 3136, 2711, 3107, 3587, 5256, 2976, 3246, 3134, 2943, 2541, 3099];
// Four real records [id, question, confidence, kev pick, big pick, label, prompt idx]
const FLOW=[["ho-003","template",0.825,"top-down-roam","top-down-roam","top-down-roam",2],["ho-044","round_timer",0.769,"no","no","no",43],["ho-001","round_timer",0.538,"yes","yes","yes",0],["ho-044","template",0.404,"side-platformer","one-screen-arena","one-screen-arena",43]];
const RCSS=`
.pv-nibble .route{grid-column:1/-1;border-top:2px solid var(--ink);padding-top:16px}
.pv-nibble .rflow{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;margin:10px 0}
.pv-nibble .st{border:1px solid var(--rule);padding:10px;min-height:96px;position:relative;margin-left:-1px}
.pv-nibble .st.on{border-color:var(--ink);background:var(--sheet,transparent);z-index:1}
.pv-nibble .st .k{margin-bottom:4px}
.pv-nibble .st.wait>:not(.k){visibility:hidden}.pv-nibble .st.wait::after{content:'\\00b7\\00b7';position:absolute;left:10px;top:32px;font:400 16px/24px var(--font-pixel);color:var(--ink-muted)}
.pv-nibble .px16{font:400 16px/24px var(--font-pixel)}
.pv-nibble .px32{font:400 32px/32px var(--font-pixel)}
.pv-nibble .fast{color:var(--a)}.pv-nibble .slow{color:var(--vermilion-text,var(--vermilion))}
.pv-nibble .gauge{position:relative;height:40px;margin:14px 0 4px;background:var(--rule-faint,var(--rule))}
.pv-nibble .gauge .mk2{position:absolute;top:0;bottom:0;width:6px;margin-left:-3px;background:var(--ink)}
.pv-nibble .gauge .tl{position:absolute;top:-6px;bottom:-6px;border-left:3px dashed var(--vermilion)}
.pv-nibble .gauge input{position:absolute;inset:-8px 0;width:100%;height:56px;opacity:0;margin:0;cursor:ew-resize}
.pv-nibble .gauge:focus-within{outline:2px solid var(--a);outline-offset:3px}
.pv-nibble .rsum{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px;margin-top:12px}
.pv-nibble .rsum>div{border-top:1px solid var(--ink);padding-top:6px}
.pv-nibble.is-narrow .rflow{grid-template-columns:1fr 1fr}
`;
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
.pv-nibble .lbl{display:flex;gap:8px;right:6px;overflow:hidden}.pv-nibble .lbl .tx{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pv-nibble .lbl .nu{flex:none;white-space:nowrap;margin-left:auto;background:var(--cobalt,#2236b0);padding:0 4px}.pv-nibble .lbl.o{color:var(--ink)}
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
  const st = document.createElement('style'); st.textContent = CSS + RCSS; document.head.appendChild(st);
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
    <p class="note">Kev-0.8B on a CPU is 12 points behind the big model and 1.3x faster. The labels were written by Claude, so the big model's 1.00 partly measures shared judgement. Verdict in the repo: too few prompts (50 &lt; 200).</p></div><div class="route"><div class="k">Threshold routing &middot; drag the line, watch the 350 recorded decisions move</div>
    <div class="rflow"><div class="st s0"><div class="k">1 Question</div><div class="rq"></div></div><div class="st s1"><div class="k">2 Kev-0.8B picks</div><div class="px16 rp"></div></div><div class="st s2"><div class="k">3 Sure enough?</div><div class="px16 rc"></div></div><div class="st s3"><div class="k">4 Answer used</div><div class="rr"></div></div></div>
    <div class="gauge"><div class="mk2"></div><div class="tl"></div><input type="range" min="0.40" max="0.90" step="0.01" aria-label="Routing threshold"></div>
    <div class="k" style="display:flex;justify-content:space-between"><span>0.40</span><span>confidence of the pick</span><span>0.90</span></div>
    <div class="ex rbtn"></div>
    <div class="rsum"><div><span class="k">Threshold</span><div class="px32 rt2"></div></div><div><span class="k">Sent to big model</span><div class="px32 rn"></div></div><div><span class="k">Avg latency per decision</span><div class="px32 rl"></div><span class="k">ms</span></div><div><span class="k">Accuracy vs labels</span><div class="px32 ra"></div></div></div>
    <p class="note">Rule from nibble&rsquo;s landing page ("under 0.70, ask the big model"); 0.70 is the site&rsquo;s example line, not a tuned optimum. Data: the 350 decisions of the 2026-10-18 compare. A call&rsquo;s wall time is split evenly over its 7 decisions; a routed decision pays both models. Labels were written by Claude.</p></div>`;
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
        bars = `<div class="bar"><div class="fill" style="width:0" data-w="${p * 100}"></div><span class="lbl" title="${fmt(ans[i])} ${p.toFixed(2)}"><span class="tx">${fmt(ans[i])}</span><span class="nu">${p.toFixed(2)}</span></span><i class="thr"></i></div>`;
      } else {
        bars = `<div class="bar"><div class="fill" style="width:0" data-w="100"></div><span class="lbl" title="${fmt(ans[i])}"><span class="tx">${fmt(ans[i])}</span><span class="nu">no odds</span></span></div>`;
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

  // threshold routing
  const rs = sel => el.querySelector(sel); let T = 0.70, step = 0, ri = 0, tm = 0;
  const gauge = rs('.gauge'), inp = rs('.gauge input');
  const pct = v => ((v - 0.4) / 0.5 * 100);
  const FS = FLOW.map(f => ({ s: SM[f[6]] / 7, b: BM[f[6]] / 7 }));
  FLOW.forEach((f, i) => { const b = document.createElement('button'); b.textContent = f[0] + ' ' + f[1]; b.onclick = () => { ri = i; step = 3; paintFlow(); }; rs('.rbtn').appendChild(b); });
  function agg() {
    let n = 0, lat = 0, ok = 0;
    REC.forEach((r, i) => { const pi = Math.floor(i / 7), s = SM[pi] / 7, b = BM[pi] / 7; if (r[0] < T) { n++; lat += s + b; ok += r[2]; } else { lat += s; ok += r[1]; } });
    return { n, lat: lat / REC.length, ok: ok / REC.length };
  }
  function paintFlow() {
    const f = FLOW[ri], fl = FS[ri], routed = f[2] < T;
    [...rs('.rbtn').children].forEach((b, i) => b.setAttribute('aria-pressed', i === ri));
    const m = rs('.mk2'); m.style.left = pct(f[2]) + '%'; rs('.tl').style.left = pct(T) + '%';
    rs('.rq').innerHTML = `<div style="font:italic 14px/18px var(--font-serif)">${f[0]}: ${NAME[QS.indexOf(f[1])]}?</div>`;
    rs('.rp').textContent = fmt(f[3]); rs('.rc').innerHTML = `<span class="px32">${f[2].toFixed(2)}</span><div class="k ${routed ? 'slow' : 'fast'}">${routed ? 'below ' : 'at or above '}${T.toFixed(2)}</div>`;
    const ans = routed ? f[4] : f[3], lt = Math.round(routed ? fl.s + fl.b : fl.s);
    rs('.rr').innerHTML = `<div class="px16 ${routed ? 'slow' : 'fast'}">${esc2(fmt(ans))}</div><div class="k">${routed ? 'slow path: big model' : 'fast path: Kev'}</div><div class="px16">${lt} ms</div><div class="k">${ans === f[5] ? 'matches label' : 'differs from label'}</div>`;
    ['.s0', '.s1', '.s2', '.s3'].forEach((c, i) => { const e = rs(c); e.classList.toggle('on', i === step); e.firstChild.nextSibling && 0; e.classList.toggle('wait', i > step); });
    const g = agg(); rs('.rt2').textContent = T.toFixed(2); rs('.rn').textContent = Math.round(g.n / REC.length * 100) + '%'; rs('.rl').textContent = Math.round(g.lat); rs('.ra').textContent = g.ok.toFixed(2);
  }
  const esc2 = x => String(x).replace(/</g, '&lt;');
  inp.value = T; inp.oninput = () => { T = +inp.value; paintFlow(); };
  if (reduce) { step = 3; } else { tm = setInterval(() => { step++; if (step > 3) { step = 0; ri = (ri + 1) % FLOW.length; } paintFlow(); }, 1100); }
  paintFlow();
  const ro = new ResizeObserver(() => el.classList.toggle('is-narrow', el.clientWidth < 760)); ro.observe(el);
  return () => { cancelAnimationFrame(raf); clearTimeout(timer); clearInterval(tm); ro.disconnect(); st.remove(); el.remove(); };
}
