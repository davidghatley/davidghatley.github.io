// bonfire: terminal replay of a REAL run (demo/kill-restart.sh, recorded replies, CPU only)
// beside the loop diagram. Event numbers are line numbers of public/media/bonfire/events.jsonl.
const P = ['propose', 'evaluate', 'verify', 'criticize', 'select'];
// [event#, phase, text, kind, worker, workerLabel]
const LOG = [
  [1, 0, 'run.started   r-20261022-135155 tiny-grid agents=4 replay'],
  [2, 0, 'round.started r1  w1 w2 w3 w4'],
  [14, 0, 'try.started   w1 w2 w3 w4   (events 11-14)'],
  [19, 0, 'step.finished w1 turn-1', '', 1, 'turn 1'],
  [21, 0, 'step.finished w2 turn-1', '', 2, 'turn 1'],
  [23, 0, 'step.finished w4 turn-1', '', 4, 'turn 1'],
  [25, 0, 'step.finished w3 turn-1', '', 3, 'turn 1'],
  ['kill', 0, '$ kill -9 3238142', 'bad'],
  ['gone', 0, 'status: INTERRUPTED (no owner process)', 'bad'],
  [27, 0, 'run.interrupted owner_pid=3238142', 'warn'],
  [28, 0, 'run.resumed   pid=3239518 resume=1', 'ok'],
  ['res', 0, 'resumed from event 26: 4 saved turns kept', 'ok'],
  [33, 0, 'step.finished w2 turn-2', '', 2, 'turn 2'],
  [35, 0, 'step.finished w1 turn-2', '', 1, 'turn 2'],
  [37, 0, 'step.finished w4 turn-2', '', 4, 'turn 2'],
  [39, 0, 'step.finished w3 turn-2', '', 3, 'turn 2'],
  [43, 1, 'step.finished w2 snapshot', '', 2, 'snapshot'],
  [49, 2, 'step.finished w2 score', '', 2, 'score'],
  [50, 2, 'try.finished  w2 2/2 checks', 'ok', 2, '2/2'],
  [52, 2, 'try.finished  w1 0/2 checks', '', 1, '0/2'],
  [60, 2, 'try.finished  w3 1/2 checks', '', 3, '1/2'],
  [66, 2, 'try.finished  w4 2/2 checks', 'ok', 4, '2/2'],
  [67, 3, 'round.scored  w1 0/2 w2 2/2 w3 1/2 w4 2/2'],
  [68, 4, 'select        pick=w2 decision=d-r1-select', 'ok'],
  [71, 4, 'run.finished  PASS winner=w2  1 resume, 0 finished steps re-run', 'ok'],
];
const CSS = `
.pv-bonfire{--a:#ee5228;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:16px;align-items:stretch;font-family:var(--font-sans)}
.pv-bonfire.hero{gap:24px}
.pv-bonfire .term{background:#121417;color:#ecebe4;border:1px solid var(--ink);display:flex;flex-direction:column;min-width:0}
.pv-bonfire .tbar{display:flex;justify-content:space-between;gap:8px;padding:6px 12px;border-bottom:1px solid #3a3e44;font:500 11px/16px var(--font-mono);letter-spacing:.08em;text-transform:uppercase;color:#a2a7ad}
.pv-bonfire .tbar b{color:#ee5228;font-weight:600}
.pv-bonfire .tlog{flex:1;padding:10px 12px;font:400 12px/18px var(--font-mono);height:330px;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end}
.pv-bonfire.hero .tlog{height:420px;font-size:13px;line-height:20px}
.pv-bonfire .ln{white-space:pre;overflow:hidden;text-overflow:clip;color:#ecebe4}
.pv-bonfire .ln i{font-style:normal;color:#a2a7ad;display:inline-block;width:4ch}
.pv-bonfire .ln.ok{color:#b8d84c}.pv-bonfire .ln.warn{color:#f5cf2a}.pv-bonfire .ln.bad{color:#ff6a3d;font-weight:600}
.pv-bonfire .tnote{padding:6px 12px;border-top:1px solid #3a3e44;font:400 11px/16px var(--font-mono);color:#a2a7ad}
.pv-bonfire .fig{border:1px solid var(--ink);background:var(--sheet);display:flex;flex-direction:column;min-width:0}
.pv-bonfire svg{display:block;width:100%;height:auto}
.pv-bonfire text{font-family:var(--font-mono)}
.pv-bonfire .cap{padding:6px 12px;border-top:1px solid var(--rule);font:400 11px/16px var(--font-mono);color:var(--ink-muted)}
.pv-bonfire .nd rect{fill:var(--sheet);stroke:var(--ink);stroke-width:1.5}
.pv-bonfire .nd text{fill:var(--ink);font-size:13px;font-weight:500}
.pv-bonfire .nd.on rect{fill:var(--a);stroke:var(--ink)}
.pv-bonfire .nd.on text{fill:#16181d;font-weight:600}
.pv-bonfire .dead .nd rect{stroke-dasharray:4 3;stroke:var(--ink-muted)}
.pv-bonfire .dead .nd text{fill:var(--ink-muted)}
.pv-bonfire .arr{stroke:var(--ink-muted);stroke-width:1.5;fill:none}
.pv-bonfire .ah{fill:var(--ink-muted)}
.pv-bonfire .wk rect{fill:var(--sheet);stroke:var(--ink);stroke-width:1.5}
.pv-bonfire .wk.on rect{fill:var(--ink)}
.pv-bonfire .wk text{fill:var(--ink);font-size:11px}
.pv-bonfire .wk.on text{fill:var(--sheet)}
.pv-bonfire .ban{fill:var(--a);stroke:var(--ink);stroke-width:1.5}
.pv-bonfire .bant{fill:#16181d;font-family:var(--font-pixel);font-size:16px}
.pv-bonfire .ev{fill:var(--ink);font-family:var(--font-pixel);font-size:16px}
.pv-bonfire .px{fill:var(--a)}
.pv-bonfire .word{font-family:var(--font-display);font-weight:850;font-stretch:125%;font-size:15px;letter-spacing:-.01em;text-transform:none;color:#ee5228}
@media (max-width:720px){.pv-bonfire{grid-template-columns:1fr}.pv-bonfire .tlog{height:260px}}
`;
export default function mount(root, { mode }) {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const wrap = document.createElement('div');
  wrap.className = 'pv-bonfire' + (mode === 'hero' ? ' hero' : '');
  // diagram geometry: 5 nodes on a ring
  const cx = 210, cy = 135, R = 98, pts = P.map((_, i) => { const a = (-90 + 72 * i) * Math.PI / 180; return [cx + R * 1.5 * Math.cos(a), cy + R * Math.sin(a)]; });
  let svg = '<svg viewBox="0 0 420 330" role="img" aria-label="Loop: propose, evaluate, verify, criticize, select, with four workers. Current phase is highlighted."><g class="g">';
  const W = 104, H = 32;
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % 5], dx = q[0] - p[0], dy = q[1] - p[1], d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d;
    const k = Math.min(W / 2 / Math.max(Math.abs(ux), 1e-6), H / 2 / Math.max(Math.abs(uy), 1e-6)) + 5;
    const x1 = p[0] + ux * k, y1 = p[1] + uy * k, x2 = q[0] - ux * k, y2 = q[1] - uy * k;
    svg += `<line class="arr" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><polygon class="ah" points="${x2},${y2} ${x2 - ux * 9 - uy * 4.5},${y2 - uy * 9 + ux * 4.5} ${x2 - ux * 9 + uy * 4.5},${y2 - uy * 9 - ux * 4.5}"/>`;
  });
  P.forEach((n, i) => { svg += `<g class="nd" data-p="${i}"><rect x="${pts[i][0] - W / 2}" y="${pts[i][1] - H / 2}" width="${W}" height="${H}"/><text x="${pts[i][0]}" y="${pts[i][1] + 4.5}" text-anchor="middle">${n}</text></g>`; });
  const GL = ['..X..', '.XX..', '.XXX.', 'XX.XX', 'X.X.X'];
  GL.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'X') svg += `<rect class="px" x="${cx - 20 + x * 8}" y="${cy - 36 + y * 8}" width="8" height="8"/>`; }));
  svg += `<text class="ev" x="${cx}" y="${cy + 28}" text-anchor="middle">EVENT 0/71</text></g>`;

  svg += '<g class="bn" style="display:none"><rect class="ban" x="65" y="236" width="290" height="30"/><text class="bant" x="210" y="256" text-anchor="middle"></text></g>';
  for (let i = 1; i <= 4; i++) svg += `<g class="wk" data-w="${i}"><rect x="${14 + (i - 1) * 100}" y="272" width="92" height="44"/><text x="${22 + (i - 1) * 100}" y="290">w${i}</text><text class="ws" x="${22 + (i - 1) * 100}" y="307">-</text></g>`;
  svg += '</svg>';
  wrap.innerHTML = `<div class="term"><div class="tbar"><span><span class="word">bonfire</span> run --replay tiny-grid</span><span class="st">RUNNING</span></div><div class="tlog" aria-live="off"></div><div class="tnote">Real run, recorded replies, no model calls. Event numbers are lines of events.jsonl. Phase mapping: turn = propose, snapshot = evaluate, score = verify.</div></div><div class="fig">${svg}<div class="cap">Durable loop: propose, evaluate, verify, criticize, select. Four workers, one forced restart.</div></div>`;
  root.appendChild(wrap);
  const $ = s => wrap.querySelector(s), log = $('.tlog'), nodes = [...wrap.querySelectorAll('.nd')], wks = [...wrap.querySelectorAll('.wk')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let i = 0, timer = 0, dead = false;
  const setPhase = p => nodes.forEach((n, k) => n.classList.toggle('on', k === p));
  function step(entry) {
    const [ev, ph, text, kind, w, wl] = entry;
    const d = document.createElement('div'); d.className = 'ln ' + (kind || '');
    d.innerHTML = `<i>${typeof ev === 'number' ? String(ev).padStart(2, '0') : '--'}</i>`; d.append(text);
    log.appendChild(d); while (log.children.length > 24) log.firstChild.remove();
    setPhase(dead || ev === 'kill' ? -1 : ph);
    if (typeof ev === 'number') $('.ev').textContent = `EVENT ${ev}/71`;
    if (w) { const g = wks[w - 1]; g.querySelector('.ws').textContent = wl; g.classList.add('on'); setTimeout(() => g.classList.remove('on'), 380); }
    const bn = $('.bn');
    if (ev === 'kill') { dead = true; $('.g').classList.add('dead'); bn.style.display = ''; $('.bant').textContent = 'KILLED: KILL -9'; $('.st').innerHTML = '<b>KILLED</b>'; setPhase(-1); }
    if (ev === 'res') { dead = false; $('.g').classList.remove('dead'); $('.bant').textContent = 'RESUMED FROM EVENT 26'; $('.st').textContent = 'RESUMED'; setTimeout(() => { if (!dead) bn.style.display = 'none'; }, 1600); }
    if (ev === 71) $('.st').textContent = 'PASS';
  }
  function reset() { log.textContent = ''; i = 0; dead = false; $('.g').classList.remove('dead'); $('.bn').style.display = 'none'; $('.st').textContent = 'RUNNING'; wks.forEach(g => g.querySelector('.ws').textContent = '-'); setPhase(-1); }
  function tick() {
    if (i >= LOG.length) { timer = setTimeout(() => { reset(); tick(); }, 3500); return; }
    const e = LOG[i++]; step(e);
    timer = setTimeout(tick, e[0] === 'kill' ? 1500 : e[0] === 'gone' ? 1100 : e[0] === 'res' ? 1400 : 520);
  }
  if (reduce) { LOG.forEach(step); $('.bn').style.display = 'none'; }
  else {
    let vis = true; const io = new IntersectionObserver(es => { const v = es[0].isIntersecting; if (v && !vis) tick(); if (!v) clearTimeout(timer); vis = v; });
    io.observe(wrap); tick();
    var stop = () => { io.disconnect(); clearTimeout(timer); };
  }
  return () => { stop && stop(); clearTimeout(timer); st.remove(); wrap.remove(); };
}
