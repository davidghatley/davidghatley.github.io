// system-a preview: the dataset funnel (real public traces → 1,313 decisions), the training run on one
// 12 GB card, and the result. Every number comes from ship/experiments-facts.md §2.
const FUNNEL = [
  // [step, count, label, segment key]
  [1, '−224', 'unresolved prior tool call', 'u'],
  [2, '−208', 'no-call turn without a clear finish', 'n'],
  [3, '−76', 'mixed-category turn', 'm'],
];
const SEG = [['tr', 1051], ['dv', 140], ['te', 122], ['m', 76], ['n', 208], ['u', 224]];
const SPLITS = [['train', 1051, 163], ['dev', 140, 20], ['test', 122, 23]];
const CLASSES = [
  ['read', 227, 27, 17], ['search', 109, 16, 14], ['edit', 178, 27, 32], ['execute', 537, 70, 59],
  ['other_tool', 0, 0, 0], ['respond_or_finish', 0, 0, 0],
];
const MAX = [537, 70, 59];
const fmt = n => n.toLocaleString('en-US');

const CSS = `
.pv-system-a{--sa:#9a5200;container-type:inline-size;color:var(--ink);background:var(--paper);border:1px solid var(--ink);font:400 13px/16px var(--font-mono)}
:root[data-theme=dark] .pv-system-a{--sa:#f5a24a}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .pv-system-a{--sa:#f5a24a}}
.pv-system-a *{box-sizing:border-box}
.pv-system-a p{margin:0}
.pv-system-a .sa-top,.pv-system-a .sa-foot{display:flex;justify-content:space-between;gap:16px;padding:8px 16px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-muted)}
.pv-system-a .sa-top{border-bottom:1px solid var(--rule)}
.pv-system-a .sa-foot{border-top:1px solid var(--rule);text-transform:none;letter-spacing:0;font-size:13px;color:var(--ink);justify-content:flex-start}
.pv-system-a .sa-foot b{font-weight:400;color:var(--sa)}
.pv-system-a .sa-body{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr)}
.pv-system-a .sa-col{padding:16px;min-width:0;display:flex;flex-direction:column;gap:16px}
.pv-system-a .sa-col+.sa-col{border-left:1px solid var(--rule)}
.pv-system-a .sa-h{display:flex;align-items:baseline;gap:8px;font:400 16px/16px var(--font-pixel);text-transform:lowercase}
.pv-system-a .sa-h small{font:400 11px/16px var(--font-mono);color:var(--ink-muted);letter-spacing:.08em;text-transform:uppercase}
.pv-system-a .sa-mut{color:var(--ink-muted)}
.pv-system-a .q{opacity:0;transition:opacity .2s steps(2)}
.pv-system-a .q.on{opacity:1}
.pv-system-a .led{display:grid;grid-template-columns:56px 1fr;column-gap:12px;row-gap:2px}
.pv-system-a .led span:nth-child(odd){text-align:right;font-variant-numeric:tabular-nums}
.pv-system-a .led .k{color:var(--sa)}
.pv-system-a .big{display:flex;align-items:baseline;gap:12px;margin-top:4px}
.pv-system-a .big b{font:400 32px/32px var(--font-pixel);color:var(--sa)}
.pv-system-a .fb{display:flex;height:16px;gap:0}
.pv-system-a .fb i{display:block;height:100%;background:var(--ink-muted);transition:background .25s steps(2),outline-color .25s steps(2);outline:1px dashed transparent;outline-offset:-1px}
.pv-system-a .fb i.out{background:transparent;outline-color:var(--ink-muted)}
.pv-system-a .fb i.kept{background:var(--sa)}
.pv-system-a .fb i.cut{border-left:2px solid var(--paper)}
.pv-system-a .spl{display:flex;flex-wrap:wrap;gap:4px 16px;margin-top:8px}
.pv-system-a .spl b{font-weight:400}
.pv-system-a table{border-collapse:collapse;width:100%;table-layout:fixed}
.pv-system-a th{font:400 11px/16px var(--font-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-muted);text-align:left;padding:0 0 4px;border-bottom:1px solid var(--rule)}
.pv-system-a th:first-child{width:37%}
.pv-system-a td{padding:3px 8px 3px 0;vertical-align:middle;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pv-system-a td .c{display:flex;align-items:center;gap:6px;padding-right:8px}
.pv-system-a td .c span{width:28px;text-align:right;font-variant-numeric:tabular-nums;flex:none}
.pv-system-a .m{flex:1;height:8px;position:relative}
.pv-system-a .m i{position:absolute;left:0;top:0;bottom:0;background:var(--sa);transform:scaleX(0);transform-origin:left;transition:transform .4s steps(5)}
.pv-system-a .on .m i,.pv-system-a .m.on i{transform:scaleX(1)}
.pv-system-a tr.z td{color:var(--ink-muted)}
.pv-system-a tr.z .m{outline:1px dashed var(--ink-muted);outline-offset:-1px}
.pv-system-a .zn{color:var(--vermilion-text,var(--vermilion));margin-top:8px}
.pv-system-a .spec{display:grid;grid-template-columns:auto 1fr;gap:2px 12px}
.pv-system-a .spec span:nth-child(odd){color:var(--ink-muted)}
.pv-system-a .vr{position:relative;height:16px;border:1px solid var(--ink);margin:8px 0 4px}
.pv-system-a .vr i{position:absolute;left:0;top:0;bottom:0;background:var(--sa);transform:scaleX(0);transform-origin:left;transition:transform .6s steps(8)}
.pv-system-a .on .vr i{transform:scaleX(1)}
.pv-system-a .vr u{position:absolute;top:-5px;bottom:-5px;border-left:1px solid var(--ink)}
.pv-system-a .vl{display:flex;justify-content:space-between;gap:8px;color:var(--ink-muted);font-size:11px}
.pv-system-a .pc{display:grid;grid-template-columns:minmax(0,1fr) 96px 112px;gap:4px 8px;align-items:center}
.pv-system-a .pc .m{height:8px;outline:1px solid var(--rule);outline-offset:-1px}
.pv-system-a .pc .m em{position:absolute;left:0;top:-3px;bottom:-3px;border-right:2px solid var(--ink);z-index:1}
.pv-system-a .pc .v,.pv-system-a .rs .v{text-align:right;font-variant-numeric:tabular-nums}
.pv-system-a .rs{display:grid;grid-template-columns:64px minmax(0,1fr) 44px;gap:4px 8px;align-items:center}
.pv-system-a .rs .m.b i{background:var(--ink-muted)}
.pv-system-a .rh{display:flex;justify-content:space-between;gap:8px;margin-bottom:4px}
.pv-system-a .rh em{font-style:normal;font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:0 4px;border:1px solid currentColor}
.pv-system-a .win{color:var(--sa)}
.pv-system-a .res{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.pv-system-a .dk{border-top:1px solid var(--rule);padding-top:8px}
.pv-system-a.hero .sa-col{padding:24px;gap:24px}
.pv-system-a.still *{transition:none!important}
@container (max-width:720px){
 .pv-system-a .sa-body{grid-template-columns:1fr}
 .pv-system-a .sa-col+.sa-col{border-left:0;border-top:1px solid var(--rule)}
}
@container (max-width:460px){
 .pv-system-a .res{grid-template-columns:1fr}
 .pv-system-a .pc{grid-template-columns:minmax(0,1fr) 112px}
 .pv-system-a .pc .l{grid-column:1/-1;margin-top:4px}
 .pv-system-a .sa-top span+span{display:none}
 .pv-system-a .sa-col,.pv-system-a.hero .sa-col{padding:16px 12px}
 .pv-system-a th:first-child{width:34%}
 .pv-system-a td:first-child{white-space:normal}
 .pv-system-a td .c span{width:24px}
}
`;

const bar = (v, max, cls = '') => `<div class="m ${cls}"><i style="width:${(v / max * 100).toFixed(2)}%"></i></div>`;

export default function mount(root, { mode }) {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const w = document.createElement('div');
  w.className = 'pv-system-a' + (mode === 'hero' ? ' hero' : '');
  w.setAttribute('role', 'figure');
  w.setAttribute('aria-label', 'system-a: 1,821 public agent turns filtered to 1,313 training decisions, a 421M Laya model trained on one 12 GB card, and its dev result: macro-F1 0.445 against 0.293 for TF-IDF, but NLL 3.41 against 0.95.');
  const total = 1821;
  w.innerHTML = `<div class="sa-top"><span>trace2decision → laya · six-way next-tool classifier</span><span>iteration 3 · 2026-09</span></div>
<div class="sa-body">
 <section class="sa-col">
  <div class="sa-h">dataset <small>mined from real public traces</small></div>
  <div>
   <div class="led">
    <span class="q" data-s="0">1,821</span><span class="q" data-s="0">public coding-agent turns</span>
    ${FUNNEL.map(([s, n, l]) => `<span class="q sa-mut" data-s="${s}">${n}</span><span class="q sa-mut" data-s="${s}">${l}</span>`).join('')}
   </div>
   <div class="big q" data-s="4"><b>1,313</b><span>kept, one record per turn</span></div>
  </div>
  <div>
   <div class="fb q" data-s="0" aria-hidden="true">${SEG.map(([k, n]) => `<i data-k="${k}" style="width:${(n / total * 100).toFixed(3)}%"></i>`).join('')}</div>
   <div class="spl q" data-s="5">${SPLITS.map(([s, n, g]) => `<span>${s} <b>${fmt(n)}</b> <span class="sa-mut">· ${g} task groups</span></span>`).join('')}</div>
  </div>
  <div class="q" data-s="6">
   <table><thead><tr><th>label</th><th>train</th><th>dev</th><th>test</th></tr></thead><tbody>
   ${CLASSES.map(([c, ...v]) => `<tr class="${v[0] ? '' : 'z'}"><td>${c.replace(/_/g, '_<wbr>')}</td>${v.map((n, j) => `<td><div class="c">${bar(n, MAX[j])}<span>${n}</span></div></td>`).join('')}</tr>`).join('')}
   </tbody></table>
   <p class="zn q" data-s="7">0 examples in every split: two of six labels the model never saw.</p>
  </div>
 </section>
 <section class="sa-col">
  <div class="sa-h">training <small>one rtx 3060</small></div>
  <div class="q" data-s="8">
   <div class="spec">
    <span>model</span><span>Laya: ModernBERT-large + option scorer, 421M params</span>
    <span>loss</span><span>RLCD + cross-entropy</span>
    <span>batch</span><span>micro-batch 1 × 64 accumulation</span>
    <span>run</span><span>seed 314159: 767.1 s</span>
   </div>
   <div class="vr" aria-hidden="true"><i style="width:${(9.52 / 12 * 100).toFixed(2)}%"></i><u style="left:${(11.5 / 12 * 100).toFixed(2)}%"></u></div>
   <div class="vl"><span>9.52 GiB peak reserved</span><span>budget 11.5 GiB · 12 GB card</span></div>
  </div>
  <div class="q" data-s="9">
   <div class="rh"><span>positive control first</span><span class="sa-mut">accuracy</span></div>
   <div class="pc">
    <span class="l">public specialist vs base</span><div class="m on"><em style="width:35.5%"></em><i style="width:68%"></i></div><span class="v">35.5% → 68.0%</span>
    <span class="l">my trainer, before → after</span><div class="m on"><em style="width:36%"></em><i style="width:70.5%"></i></div><span class="v">36.0% → 70.5%</span>
   </div>
  </div>
  <div class="sa-h q" data-s="10">result <small>dev, 140 records</small></div>
  <div class="res">
   <div class="q" data-s="10">
    <div class="rh"><span>macro-F1 <span class="sa-mut">↑</span></span><em class="win">wins</em></div>
    <div class="rs"><span>Laya</span>${bar(0.445, 1)}<span class="v">0.445</span><span>TF-IDF</span>${bar(0.293, 1, 'b')}<span class="v">0.293</span></div>
   </div>
   <div class="q" data-s="11">
    <div class="rh"><span>NLL <span class="sa-mut">↓</span></span><em>loses</em></div>
    <div class="rs"><span>Laya</span>${bar(3.41, 4)}<span class="v">3.41</span><span>TF-IDF</span>${bar(0.95, 4, 'b')}<span class="v">0.95</span></div>
   </div>
  </div>
  <p class="q" data-s="11">Its top wrong answers came at &gt;0.9999 confidence.</p>
  <p class="dk q" data-s="12">The main run died saving its checkpoint: disk full.</p>
 </section>
</div>
<div class="sa-foot q" data-s="13"><span><b>→ nibble:</b> reproduce a positive control first; every option needs real examples.</span></div>`;
  root.appendChild(w);

  const qs = [...w.querySelectorAll('[data-s]')];
  const seg = k => w.querySelector(`.fb i[data-k="${k}"]`);
  const LAST = 13;
  function paint(s) {
    qs.forEach(el => el.classList.toggle('on', +el.dataset.s <= s));
    FUNNEL.forEach(([n, , , k]) => seg(k).classList.toggle('out', s >= n));
    ['tr', 'dv', 'te'].forEach(k => seg(k).classList.toggle('kept', s >= 4));
    ['dv', 'te'].forEach(k => seg(k).classList.toggle('cut', s >= 5));
  }

  let alive = true, vis = true, timer = 0, step = -1;
  const io = new IntersectionObserver(es => { vis = es[es.length - 1].isIntersecting; });
  io.observe(w);
  const tick = () => {
    if (!alive) return;
    if (vis) { step++; paint(step); }
    if (step < LAST) timer = setTimeout(tick, step < 0 ? 200 : step === 4 || step === 7 ? 800 : 520);
  };
  if (reduce) { w.classList.add('still'); paint(LAST); } else { paint(-1); timer = setTimeout(tick, 150); }

  return () => { alive = false; clearTimeout(timer); io.disconnect(); st.remove(); w.remove(); };
}
