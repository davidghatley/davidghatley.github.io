// bonfire case page: an incident report (postmortem) for the forced-restart run.
export default function renderCase(root, { project: p, base, meta }) {
  const st = document.createElement('style');
  st.textContent = `
.cs-bonfire{--a:#ee5228;--at:var(--vermilion-text,#b8300c);color:var(--ink);font-family:var(--font-sans);padding-bottom:48px}
:root[data-theme="dark"] .cs-bonfire{--at:var(--vermilion-text,#ff8a63)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .cs-bonfire{--at:var(--vermilion-text,#ff8a63)}}
.cs-bonfire *{box-sizing:border-box}
.cs-bonfire .rep{border-top:8px solid var(--a);padding-top:12px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font:500 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted)}
.cs-bonfire .head{display:flex;gap:20px;align-items:center;margin:20px 0 8px;flex-wrap:wrap}
.cs-bonfire .head svg{width:64px;height:64px;flex:none}
.cs-bonfire h1{margin:0;font:850 clamp(48px,11vw,120px)/.9 var(--font-display);letter-spacing:-.03em;text-transform:none}
.cs-bonfire .sub{font:400 20px/28px var(--font-sans);max-width:60ch;margin:0 0 28px}
.cs-bonfire h2{display:flex;gap:12px;align-items:baseline;margin:48px 0 12px;padding-top:8px;border-top:1px solid var(--ink);font:750 22px/28px var(--font-sans)}
.cs-bonfire h2 b{font:400 16px/16px var(--font-pixel);color:var(--at)}
.cs-bonfire p{max-width:68ch;margin:0 0 14px;font:400 17px/28px var(--font-sans)}
.cs-bonfire .sum{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));border:1px solid var(--ink);background:var(--sheet)}
.cs-bonfire .sum div{padding:12px 14px;border-right:1px solid var(--rule);border-bottom:1px solid var(--rule)}
.cs-bonfire .sum dt{font:500 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted)}
.cs-bonfire .sum dd{margin:4px 0 0;font:500 14px/20px var(--font-mono);overflow-wrap:anywhere}
.cs-bonfire .sum .pass dd{font:400 32px/32px var(--font-pixel);color:var(--at)}
.cs-bonfire .tl{border:1px solid var(--ink);background:var(--sheet);margin:0;padding:0;list-style:none}
.cs-bonfire .tl li{display:grid;grid-template-columns:104px 56px minmax(0,1fr);gap:12px;align-items:baseline;padding:6px 12px;border-bottom:1px solid var(--rule-faint);font:400 13px/20px var(--font-mono)}
.cs-bonfire .tl .t{font:400 16px/20px var(--font-pixel)}
.cs-bonfire .tl .n{color:var(--ink-muted)}
.cs-bonfire .tl .hot{background:var(--a);color:#16181d;font-weight:600;border-bottom:1px solid var(--ink)}
.cs-bonfire .tl .hot .n{color:#16181d}
.cs-bonfire .tl .gap{color:var(--ink-muted);font-style:italic}
.cs-bonfire .note{font:400 12px/18px var(--font-mono);color:var(--ink-muted);margin:8px 0 0;max-width:80ch}
.cs-bonfire .ex{border:1px solid var(--ink);padding:12px;background:var(--sheet)}
.cs-bonfire .ex>.lab{font:500 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:10px}
.cs-bonfire .cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:32px}
.cs-bonfire .stat{border-left:4px solid var(--a);padding:2px 0 2px 14px;margin:0 0 14px}
.cs-bonfire .stat b{display:block;font:400 16px/20px var(--font-pixel);color:var(--at);margin-bottom:4px}
.cs-bonfire figure{margin:0 0 20px}
.cs-bonfire figure img{display:block;width:100%;height:auto;border:1px solid var(--ink)}
.cs-bonfire figcaption{font:400 12px/18px var(--font-mono);color:var(--ink-muted);margin-top:6px}
.cs-bonfire table{border-collapse:collapse;width:100%;font:400 13px/20px var(--font-mono)}
.cs-bonfire th,.cs-bonfire td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--rule);vertical-align:top}
.cs-bonfire th{font-weight:500;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted)}
.cs-bonfire td.v{font:400 32px/32px var(--font-pixel);white-space:nowrap}
.cs-bonfire ul.lk{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px}
.cs-bonfire ul.lk a{display:inline-block;padding:8px 12px;border:1px solid var(--ink);color:var(--ink);text-decoration:none;font:500 13px/16px var(--font-mono)}
.cs-bonfire ul.lk a.pri{background:var(--a);color:#16181d}
.cs-bonfire ul.lk a:hover,.cs-bonfire ul.lk a:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
@media (max-width:560px){.cs-bonfire .tl li{grid-template-columns:84px minmax(0,1fr);}.cs-bonfire .tl .n{display:none}.cs-bonfire .sub{font-size:17px;line-height:26px}.cs-bonfire .sum .pass dd{font-size:32px}}`;
  document.head.appendChild(st);
  const E = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const wrap = E('div', 'cs-bonfire'); root.appendChild(wrap);
  const spec = (l) => (p.spec.find(s => s.label.startsWith(l)) || {}).value;
  const glyph = (() => { const ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg'); s.setAttribute('viewBox', '0 0 5 5'); s.setAttribute('shape-rendering', 'crispEdges'); s.setAttribute('role', 'img'); s.setAttribute('aria-label', 'bonfire glyph'); p.glyph.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'X') { const q = document.createElementNS(ns, 'rect'); q.setAttribute('x', x); q.setAttribute('y', y); q.setAttribute('width', 1); q.setAttribute('height', 1); q.setAttribute('fill', '#ee5228'); s.appendChild(q); } })); s.style.viewTransitionName = 'glyph-bonfire'; return s; })();
  const RUN = 'r-20261022-135155';
  const head = E('div', 'rep', `<span>Run report · ${RUN}</span><span>${esc(p.when)} · ${esc(p.status)}</span>`);
  const h = E('div', 'head'); h.appendChild(glyph); h.appendChild(E('h1', '', esc(p.title)));
  wrap.append(head, h, E('p', 'sub', esc(p.oneliner) + ' ' + '<em style="font-family:var(--font-serif)">Keep the fire lit.</em>'));

  // 1 summary
  const sec = (n, t) => { const x = E('h2', '', `<b>${n}</b>${t}`); wrap.appendChild(x); return x; };
  sec('01', 'Summary');
  wrap.appendChild(E('dl', 'sum', `
<div class="pass"><dt>Outcome</dt><dd>PASS</dd></div>
<div><dt>Run</dt><dd>${RUN}</dd></div>
<div><dt>Status of project</dt><dd>${esc(p.status)}</dd></div>
<div><dt>Winner</dt><dd>w2, 2/2 checks</dd></div>
<div><dt>Resumes</dt><dd>1, same run id</dd></div>
<div><dt>Finished steps re-run</dt><dd>0</dd></div>
<div><dt>Run kind</dt><dd>recorded replay, 4 agents, no model calls</dd></div>`));
  wrap.appendChild(E('p', 'note', esc(p.status_note) + ' This exhibit replays a real run of the core slice on a small test task, with recorded model replies; the live demo on a real task has not run.'));

  // 2 timeline (from the real events.jsonl)
  sec('02', 'Timeline');
  const tl = E('ol', 'tl'); tl.setAttribute('aria-label', 'Run timeline from events.jsonl'); wrap.appendChild(tl);
  wrap.appendChild(E('p', 'note', 'Times are seconds from run.started, read from the run\'s own events.jsonl (71 events). The kill -9 line is from the demo script; the log has no event for it, only the gap.'));
  const row = (t, n, text, cls) => tl.appendChild(E('li', cls || '', `<span class="t">${t}</span><span class="n">${n}</span><span>${esc(text)}</span>`));
  fetch(base + 'public/media/bonfire/events.jsonl').then(r => r.text()).then(tx => {
    const ev = tx.trim().split('\n').map(JSON.parse), t0 = ev[0].t, T = e => '+' + ((e.t - t0) / 1000).toFixed(2) + 's';
    const seen = new Set(); let killed = false;
    ev.forEach((e, i) => {
      const n = '#' + (i + 1), key = e.type + (e.step && e.step.startsWith('turn-1') ? ':t1' : '');
      if (e.type === 'run.interrupted' && !killed) { killed = true; row('+0.72s', '--', 'kill -9 3238142: all four workers mid-try, four turns saved', 'hot'); row('', '', '... 2.3 s with no owner process ...', 'gap'); }
      if (e.type === 'run.started') row(T(e), n, `run.started, 4 agents, job ${e.job}`);
      else if (e.type === 'round.started') row(T(e), n, 'round.started r1: w1 w2 w3 w4');
      else if (e.type === 'step.finished' && e.step === 'turn-1') row(T(e), n, `step.finished ${e.agent} turn-1 (saved)`);
      else if (e.type === 'run.interrupted') row(T(e), n, `run.interrupted, owner pid ${e.owner_pid} gone`, 'hot');
      else if (e.type === 'run.resumed') row(T(e), n, `run.resumed, pid ${e.pid}: resumed from event 26, same run`, 'hot');
      else if (e.type === 'try.finished') row(T(e), n, `try.finished ${e.agent} ${e.passed}/${e.total} checks`);
      else if (e.type === 'round.scored') row(T(e), n, 'round.scored w1 0/2 w2 2/2 w3 1/2 w4 2/2');
      else if (e.type === 'select') row(T(e), n, `select pick=${e.pick}`);
      else if (e.type === 'run.finished') row(T(e), n, `run.finished ${e.status}, winner ${e.winner}`, 'hot');
    });
  }).catch(() => row('', '', 'events.jsonl could not be loaded'));

  // 3 exhibit
  sec('03', 'Exhibit A: the replay');
  const ex = E('div', 'ex'); ex.style.viewTransitionName = 'hero-bonfire'; ex.appendChild(E('div', 'lab', 'Terminal replay with loop diagram, from the real run')); const pv = E('div'); ex.appendChild(pv); wrap.appendChild(ex);
  let off = () => {}; import('./preview.js').then(m => { off = m.default(pv, { mode: 'hero', base }) || off; }).catch(() => { pv.textContent = 'Preview failed to load.'; });

  // 4-6 narrative
  const cols = E('div', 'cols'); wrap.appendChild(cols);
  const c1 = E('div'), c2 = E('div'); cols.append(c1, c2);
  const s = (c, n, t) => c.appendChild(E('h2', '', `<b>${n}</b>${t}`));
  s(c1, '04', 'What happened'); c1.appendChild(E('p', '', esc(p.body[0])));
  s(c2, '05', 'Why it survived'); c2.appendChild(E('div', 'stat', '<b>kill -9, then resume</b>Four turns were on disk, so none was redone.')); c2.appendChild(E('p', '', esc(p.body[2])));
  s(wrap, '06', 'What is next'); wrap.appendChild(E('p', '', esc(p.body[1]))); wrap.appendChild(E('p', '', '<strong>My part.</strong> ' + esc(p.role)));

  // media
  sec('07', 'Other exhibits');
  const mc = E('div', 'cols'); wrap.appendChild(mc);
  const fig = (m, lab) => { const f = E('figure', '', `<img src="${base + m.src}" alt="${esc(m.alt)}" loading="lazy"><figcaption><b>${lab}.</b> ${esc(m.caption || m.alt)}</figcaption>`); mc.appendChild(f); };
  if (p.hero) fig({ src: p.hero.src, alt: p.hero.alt, caption: p.hero.alt }, 'Exhibit B');
  (p.media || []).forEach((m, i) => fig(m, 'Exhibit ' + 'CDEFGH'[i]));

  // appendix
  sec('A', 'Appendix: spec');
  const tb = E('table'); tb.innerHTML = '<thead><tr><th>Measure</th><th>Value</th><th>Source</th></tr></thead><tbody>' + p.spec.map(r => `<tr><td>${esc(r.label)}</td><td class="v">${esc(r.value)}</td><td>${esc(r.source || '')}</td></tr>`).join('') + '</tbody>';
  wrap.appendChild(tb);
  sec('B', 'Links');
  const lk = E('ul', 'lk'); (p.links || []).forEach(l => { const li = E('li'); const a = E('a', /Landing page|GitHub/.test(l.label) ? 'pri' : '', esc(l.label)); a.href = l.url; a.target = '_blank'; a.rel = 'noopener'; li.appendChild(a); lk.appendChild(li); }); wrap.appendChild(lk);

  return () => { off(); st.remove(); wrap.remove(); };
}
