// benchlet preview: visible vs hidden. The blind single-agent pilot (research/baseline-pilot.md):
// every visible test passes first, then the sealed hidden evaluators report, two tasks fail.
// All numbers from ship/experiments-facts.md §4.
const T = [
  // task, visible passed/total, hidden passed/total, failure note
  ['ledgerline', 5, 5, 13, 13],
  ['atlas', 12, 12, 9, 10, 'RecursionError on a 1,100-node chain'],
  ['stream', 5, 5, 11, 11],
  ['wire', 5, 5, 12, 12],
  ['prune', 8, 8, 13, 13],
  ['quality', 8, 8, 7, 7],
  ['weave', 3, 3, 16, 17, 'missed one validation'],
];
const CSS = `
.pv-benchlet{container-type:inline-size;color:var(--ink);background:var(--paper);border:1px solid var(--ink)}
.pv-benchlet *{box-sizing:border-box}
.pv-benchlet .bl-head{display:flex;justify-content:space-between;gap:16px;padding:12px 16px;border-bottom:1px solid var(--rule);font:400 11px/16px var(--font-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-muted)}
.pv-benchlet .bl-head b{font-weight:400;color:var(--ink)}
.pv-benchlet .bl-t{display:grid;grid-template-columns:112px minmax(0,1fr) minmax(0,1.4fr) 128px;font:400 13px/16px var(--font-mono)}
.pv-benchlet .bl-t>div{padding:8px 16px 8px 0;border-bottom:1px solid var(--rule);display:flex;align-items:center;gap:8px;min-width:0}
.pv-benchlet .bl-t>.tk{padding-left:16px}
.pv-benchlet .bl-t .th{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-muted);padding-top:12px}
.pv-benchlet .bl-t .th.hid{color:var(--ink)}
.pv-benchlet .sq{display:flex;flex-wrap:nowrap;gap:2px}
.pv-benchlet .sq i{width:6px;height:12px;border:1px solid var(--rule);flex:none}
.pv-benchlet .sq i.ok{background:var(--bl);border-color:var(--bl)}
.pv-benchlet .sq i.no{background:var(--vermilion);border-color:var(--vermilion)}
.pv-benchlet .n{color:var(--ink-muted);white-space:nowrap}
.pv-benchlet .n.on{color:var(--ink)}
.pv-benchlet .res{white-space:nowrap;color:var(--ink-muted)}
.pv-benchlet .res.pass{color:var(--ink)}
.pv-benchlet .res.fail{color:var(--vermilion-text,var(--vermilion))}
.pv-benchlet .bl-t>.note{grid-column:1/-1;padding:0 16px 8px 112px;font-size:11px;color:transparent}
.pv-benchlet .bl-t>.note.on{color:var(--ink)}
.pv-benchlet .bl-t>.nb{border-bottom:0}
.pv-benchlet .bl-t>.rc{padding-right:16px}
.pv-benchlet .bl-sum{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:12px 16px;border-bottom:1px solid var(--rule)}
.pv-benchlet .bl-sum p{margin:0;font:400 13px/20px var(--font-sans);color:var(--ink-muted)}
.pv-benchlet .bl-sum p b{font-weight:600;color:var(--ink)}
.pv-benchlet .bl-foot{padding:8px 16px;font:400 13px/16px var(--font-mono);color:var(--ink-muted)}
.pv-benchlet .bl-foot b{font-weight:400;color:var(--ink)}
@container (max-width:620px){
 .pv-benchlet .bl-t{grid-template-columns:104px minmax(0,1fr) minmax(0,1fr) 64px}
 .pv-benchlet .bl-t>.note{padding-left:104px}
 .pv-benchlet .bl-t .sq{display:none}
 .pv-benchlet .res .w{display:none}
 .pv-benchlet .bl-sum{grid-template-columns:1fr}
 .pv-benchlet .bl-head span:last-child{display:none}
}
`;
const sq = (n, cls) => `<span class="sq">${Array.from({ length: n }, () => `<i class="${cls || ''}"></i>`).join('')}</span>`;

export default function mount(root, { mode }) {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const de = document.documentElement;
  const dark = de.dataset.theme === 'dark' || (de.dataset.theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const w = document.createElement('div');
  w.className = 'pv-benchlet' + (mode === 'hero' ? ' hero' : '');
  w.style.setProperty('--bl', dark ? '#a9adb5' : '#5c5f66');
  w.setAttribute('role', 'figure');
  w.setAttribute('aria-label', 'benchlet pilot: 7 of 7 tasks passed every visible test; 2 of 7 failed the hidden tests (atlas 9 of 10, weave 16 of 17).');
  let rows = '';
  T.forEach((t, r) => {
    const nb = t[5] ? ' nb' : '';
    rows += `<div class="tk${nb}"><b style="font-weight:500">${t[0]}</b></div>
      <div class="${nb}" data-v="${r}">${sq(t[2])}<span class="n">–/${t[2]}</span></div>
      <div class="${nb}" data-h="${r}">${sq(t[4])}<span class="n">–/${t[4]}</span></div>
      <div class="rc${nb}"><span class="res" data-r="${r}">…</span></div>`;
    if (t[5]) rows += `<div class="note" data-f="${r}">${t[5]}</div>`;
  });
  w.innerHTML = `<div class="bl-head"><span><b>blind pilot</b> · one agent, 7 tasks</span><span>visible tests vs sealed hidden tests</span></div>
    <div class="bl-t"><div class="th tk">task</div><div class="th">visible</div><div class="th hid">hidden</div><div class="th rc">result</div>${rows}</div>
    <div class="bl-sum"><p><b>7 of 7</b> passed every visible test. <b>2 of 7</b> failed the hidden ones.</p>
    <p>16 tasks curated from 125 ideas. The orchestration comparison it was built for was never run.</p></div>
    <div class="bl-foot">→ <b>bonfire</b>: its eval corpus, equal-budget rule</div>`;
  root.appendChild(w);
  const q = s => w.querySelector(s);

  let alive = true, vis = true, timer = 0;
  const wait = ms => new Promise(res => {
    const go = () => { if (!alive) return; if (!vis) { timer = setTimeout(go, 300); return; } res(); };
    timer = setTimeout(go, ms);
  });
  function fill(cell, pass, total, failCls) {
    const is = cell.querySelectorAll('i');
    is.forEach((el, k) => { el.className = k < pass ? 'ok' : failCls; });
    const n = cell.querySelector('.n'); n.textContent = `${pass}/${total}`; n.classList.add('on');
  }
  function setRes(r, phase) {
    const el = q(`[data-r="${r}"]`), t = T[r];
    if (phase === 0) { el.className = 'res'; el.innerHTML = '…'; return; }
    if (phase === 1) { el.className = 'res'; el.innerHTML = '<span class="w">looks </span>ok'; return; }
    const fail = t[3] < t[4];
    el.className = 'res ' + (fail ? 'fail' : 'pass');
    el.innerHTML = fail ? 'fail' : 'pass';
    const f = q(`[data-f="${r}"]`); if (f) f.classList.add('on');
  }
  function reset() {
    w.querySelectorAll('.sq i').forEach(i => { i.className = ''; });
    T.forEach((t, r) => {
      q(`[data-v="${r}"] .n`).textContent = `–/${t[2]}`; q(`[data-v="${r}"] .n`).classList.remove('on');
      q(`[data-h="${r}"] .n`).textContent = `–/${t[4]}`; q(`[data-h="${r}"] .n`).classList.remove('on');
      setRes(r, 0);
      const f = q(`[data-f="${r}"]`); if (f) f.classList.remove('on');
    });
  }
  function final() {
    T.forEach((t, r) => { fill(q(`[data-v="${r}"]`), t[1], t[2], ''); fill(q(`[data-h="${r}"]`), t[3], t[4], 'no'); setRes(r, 2); });
  }
  async function play() {
    while (alive) {
      reset(); await wait(700);
      // visible tests: all green, quickly
      for (let r = 0; r < T.length && alive; r++) { fill(q(`[data-v="${r}"]`), T[r][1], T[r][2], ''); setRes(r, 1); await wait(140); }
      await wait(900);
      // hidden evaluators report, row by row, in steps
      for (let r = 0; r < T.length && alive; r++) {
        const cell = q(`[data-h="${r}"]`), is = cell.querySelectorAll('i'), t = T[r];
        for (let k = 0; k < is.length && alive; k += 3) {
          for (let j = k; j < Math.min(k + 3, is.length); j++) is[j].className = j < t[3] ? 'ok' : 'no';
          await wait(45);
        }
        fill(cell, t[3], t[4], 'no'); setRes(r, 2);
        await wait(t[3] < t[4] ? 650 : 220);
      }
      await wait(6000);
    }
  }
  const io = new IntersectionObserver(e => { vis = e[0].isIntersecting; });
  io.observe(w);
  if (reduce) final(); else play();
  return () => { alive = false; clearTimeout(timer); io.disconnect(); w.remove(); st.remove(); };
}
