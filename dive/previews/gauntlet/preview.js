// gauntlet preview: the loop. Seven steps from the README with a stepping highlight, beside the
// orchestration self-test (experiments/orchestration_v0/REPORT.md): scripted workers, no model calls.
// All numbers from ship/experiments-facts.md §3.
const STEPS = [
  ['propose', 'a worker proposes a change to the tracked file'],
  ['snapshot', 'the candidate is committed to its own worktree'],
  ['evaluate', 'the executable contract scores it, deterministically'],
  ['criticize', 'fresh read-only critics return findings as JSON'],
  ['verify', 'a separate worktree reproduces each finding, or rejects it'],
  ['select', 'deterministic ranking keeps the best candidate'],
  ['mutate / reset', 'keep going, or one architect reset on a plateau'],
];
// grid order: top row 1-4 left to right, bottom row 7-5 right to left (clockwise)
const POS = [[1, 1], [1, 2], [1, 3], [1, 4], [2, 4], [2, 3], [2, 2]];
const RUNS = [
  ['A', 'one worker', 75, 'not met'],
  ['B', 'worker, fresh review, revision', 100, 'met'],
  ['C', '3 parallel workers + selection', 100, 'met'],
];
const CSS = `
.pv-gauntlet{container-type:inline-size;color:var(--ink);background:var(--paper);border:1px solid var(--ink)}
.pv-gauntlet *{box-sizing:border-box}
.pv-gauntlet .gt-body{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr)}
.pv-gauntlet .gt-loop{padding:16px;border-right:1px solid var(--rule);display:flex;flex-direction:column;gap:12px}
.pv-gauntlet .gt-k{margin:0;font:400 11px/16px var(--font-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-muted)}
.pv-gauntlet .gt-k b{font-weight:400;color:var(--ink)}
.pv-gauntlet .ring{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:auto 24px auto;column-gap:16px}
.pv-gauntlet .st{border:1px solid var(--rule);padding:8px;display:flex;flex-direction:column;gap:4px;min-width:0;position:relative}
.pv-gauntlet .st span{font:400 11px/16px var(--font-mono);color:var(--ink-muted)}
.pv-gauntlet .st b{font:500 13px/20px var(--font-mono)}
.pv-gauntlet .st[data-a]::after{content:attr(data-a);position:absolute;top:50%;transform:translateY(-50%);font:400 13px/16px var(--font-mono);color:var(--ink-muted)}
.pv-gauntlet .st[data-a='→']::after{right:-13px}
.pv-gauntlet .st[data-a='←']::after{left:-13px}
.pv-gauntlet .st.on{background:var(--gt);border-color:var(--gt);color:var(--gt-on)}
.pv-gauntlet .st.on span{color:var(--gt-on)}
.pv-gauntlet .st.done{border-color:var(--ink)}
.pv-gauntlet .ar{font:400 13px/24px var(--font-mono);color:var(--ink-muted);text-align:center}
.pv-gauntlet .cap{min-height:40px;margin:0;font:400 13px/20px var(--font-sans);color:var(--ink)}
.pv-gauntlet .cap b{font:500 13px/20px var(--font-mono)}
.pv-gauntlet .gt-runs{padding:16px;display:flex;flex-direction:column;gap:12px}
.pv-gauntlet .bars{position:relative;display:flex;flex-direction:column;gap:12px;padding-top:4px}
.pv-gauntlet .run{display:grid;grid-template-columns:minmax(0,1fr) 40px;column-gap:8px;row-gap:4px;align-items:center}
.pv-gauntlet .run .lab{grid-column:1/-1;font:400 13px/16px var(--font-sans);color:var(--ink-muted)}
.pv-gauntlet .run .lab b{font:500 13px/16px var(--font-mono);color:var(--ink)}
.pv-gauntlet .track{position:relative;height:16px;border:1px solid var(--rule)}
.pv-gauntlet .fill{position:absolute;left:0;top:0;bottom:0;background:var(--gt);width:0;transition:width .5s steps(6)}
.pv-gauntlet .tgt{position:absolute;top:-4px;bottom:-4px;left:90%;border-left:1px dashed var(--ink);z-index:1}
.pv-gauntlet .val{font:500 13px/16px var(--font-mono);text-align:right}
.pv-gauntlet .val.miss{color:var(--vermilion-text,var(--vermilion))}
.pv-gauntlet .miss-l{color:var(--ink)}
.pv-gauntlet .axis{display:grid;grid-template-columns:minmax(0,1fr) 40px;column-gap:8px;font:400 11px/16px var(--font-mono);color:var(--ink-muted)}
.pv-gauntlet .axis div{position:relative;height:16px}
.pv-gauntlet .axis i{position:absolute;font-style:normal;transform:translateX(-50%);white-space:nowrap}
.pv-gauntlet .honest{margin:auto 0 0;font:400 13px/20px var(--font-sans);color:var(--ink-muted)}
.pv-gauntlet .gt-foot{padding:8px 16px;border-top:1px solid var(--rule);font:400 13px/16px var(--font-mono);color:var(--ink-muted)}
.pv-gauntlet .gt-foot b{font-weight:400;color:var(--ink)}
@container (max-width:680px){
 .pv-gauntlet .gt-body{grid-template-columns:1fr}
 .pv-gauntlet .gt-loop{border-right:0;border-bottom:1px solid var(--rule)}
 .pv-gauntlet .ring{column-gap:12px}
 .pv-gauntlet .st[data-a='→']::after{right:-11px}
 .pv-gauntlet .st[data-a='←']::after{left:-11px}
 .pv-gauntlet .ar{font-size:11px;line-height:16px}
 .pv-gauntlet .st{padding:6px}
 .pv-gauntlet .st b{font-size:11px}
}
`;

export default function mount(root, { mode }) {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const de = document.documentElement;
  const dark = de.dataset.theme === 'dark' || (de.dataset.theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const w = document.createElement('div');
  w.className = 'pv-gauntlet' + (mode === 'hero' ? ' hero' : '');
  w.style.setProperty('--gt', dark ? '#8fd16a' : '#3d7a1f');
  w.style.setProperty('--gt-on', dark ? '#16181d' : '#f9f9f5');
  w.setAttribute('role', 'figure');
  w.setAttribute('aria-label', 'The gauntlet loop: propose, snapshot, evaluate, criticize, verify, select, mutate or reset. Scripted self-test against a target of 90: one worker 75, not met; worker with review and revision 100; three parallel workers with selection 100.');
  const ring = STEPS.map((s, i) => `<div class="st" data-i="${i}" style="grid-row:${POS[i][0] === 1 ? 1 : 3};grid-column:${POS[i][1]}"${i < 3 ? ' data-a="→"' : i > 3 ? ' data-a="←"' : ''}><span>0${i + 1}</span><b>${s[0]}</b></div>`).join('')
    + `<div class="ar" style="grid-row:2;grid-column:4">↓</div><div class="ar" style="grid-row:2;grid-column:1">↑</div>`
    + `<div class="ar" style="grid-row:3;grid-column:1;align-self:center;text-align:right">next round</div>`;
  const bars = RUNS.map(r => `<div class="run"><div class="lab"><b>${r[0]}</b> ${r[1]}${r[3] === 'not met' ? ' · <span class="miss-l">target not met</span>' : ''}</div>
    <div class="track"><div class="fill" data-v="${r[2]}"></div><div class="tgt"></div></div><div class="val${r[3] === 'not met' ? ' miss' : ''}">${r[2]}</div></div>`).join('');
  w.innerHTML = `<div class="gt-body">
    <section class="gt-loop"><p class="gt-k"><b>the loop</b> · over git worktrees</p><div class="ring">${ring}</div><p class="cap" aria-live="off"></p></section>
    <section class="gt-runs"><p class="gt-k"><b>self-test</b> · final score out of 100, target 90</p>
      <div class="bars">${bars}</div>
      <div class="axis"><div><i style="left:0;transform:none">0</i><i style="left:90%">90</i></div><span></span></div>
      <p class="honest">Scripted workers, no model calls. It was never measured on a real model run.</p></section>
  </div><div class="gt-foot">→ <b>bonfire</b>: the loop, findings verified before they count</div>`;
  root.appendChild(w);
  const cells = [...w.querySelectorAll('.st')], cap = w.querySelector('.cap'), fills = [...w.querySelectorAll('.fill')];

  function show(i) {
    cells.forEach((c, k) => { c.classList.toggle('on', k === i); c.classList.toggle('done', k < i); });
    cap.innerHTML = `<b>${STEPS[i][0]}</b>: ${STEPS[i][1]}.`;
  }
  const grow = () => fills.forEach(f => { f.style.width = f.dataset.v + '%'; });

  let alive = true, vis = true, timer = 0, i = 0, grown = false;
  function tick() {
    if (!alive) return;
    if (vis) {
      if (!grown) { grown = true; requestAnimationFrame(grow); }
      show(i); i = (i + 1) % STEPS.length;
    }
    timer = setTimeout(tick, vis ? (i === 0 ? 2200 : 1400) : 300);
  }
  const io = new IntersectionObserver(e => { vis = e[0].isIntersecting; });
  io.observe(w);
  if (reduce) { fills.forEach(f => { f.style.transition = 'none'; }); grow(); show(4); }
  else tick();
  return () => { alive = false; clearTimeout(timer); io.disconnect(); w.remove(); st.remove(); };
}
