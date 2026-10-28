// anime pipeline preview: one RTX 3060 (12 GB VRAM) and 64 GB RAM as two cell meters plus a time bar.
// Steps through the methods I tried to fit open video models on the card, each with its measured before -> after
// and whether it was kept, and ends on the finding. Every number is from ship/anime-pipeline-facts.md (§1, §3a, §3b).
const STAGES = [
  ['Previz', 'Blender 5.2.2 LTS', 'Cycles on CPU, 15–20 min/shot'],
  ['Keys', 'Krea 2 Turbo int8 / Qwen-Image 2.1 int8 + Fun ControlNet depth', '25.4 s / 55.5 s median'],
  ['Review', 'gate: every image checked', 'rejects moved aside'],
  ['Motion', 'MiniMax H3 int8 ref2va, 1344×768, 24 fps, 124 f', '28.5 min median'],
  ['Upscale', 'Real-ESRGAN / SeedVR2 3B fp8', '38 s / 15 min a clip'],
  ['Sound', 'Qwen3-TTS 1.7B + ACE-Step 1.5', '≈15 s a cue'],
  ['Cut', 'EDL to Kdenlive, JP + EN subs', 'CPU'],
];
// v: VRAM GB, r: RAM GB, t: time. [before, after]; null = no number logged. bl/al: labels.
const M = [
  { n: 'Run 8-bit weights', k: 'kept', st: [1, 3],
    v: { b: 36.7, a: 11.37, bl: '21 + 15.7 GB of H3 weights', al: '11.37 GiB median peak' },
    r: { a: 22.3, al: '22.3 GiB median (H3)' },
    t: { none: 'not logged as an A/B' },
    say: 'int8 is the pick on Ampere, which has no FP8 maths. Even pruned to int8, the H3 video model is a 21 GB DiT plus a 15.7 GB text encoder. With offload it runs on the 12 GB card. This was never A/B logged; it is the house rule.' },
  { n: 'Offload to RAM, no --lowvram', k: 'kept', st: [1, 3],
    v: { a: 11.27, al: '11.27 GiB median peak (Krea)' },
    r: { a: 21.5, al: '21.5 GiB median, 13.5 GB offloaded' },
    t: { none: '--lowvram: slower here, no number logged' },
    say: 'ComfyUI streams weights from RAM by default. Krea offloads 13.5 GB; each Wan Q8 expert keeps ~4.4 GB on the GPU and ~10.4 GB in RAM. I banned --lowvram: slower here and not needed.' },
  { n: '--disable-pinned-memory', k: 'kept', st: [3],
    r: { b: 52, a: 13, bl: '52 GB', al: '13 GB' },
    t: { b: 3.0, a: 3.2, u: 'min', bl: '3.0 min', al: '3.2 min' },
    say: 'Stop pinning ~37 GB of offloaded H3 weights. On an 864×480 Turbo clip, RAM fell from 52 to 13 GB for about 7% more time. It is on in the launcher.' },
  { n: 'Turbo 8 steps vs base 20', k: 'kept', st: [3],
    t: { b: 39.0, a: 16.4, u: 'min', bl: '39.0 min', al: '16.4 min' },
    say: 'H3 at 1344×768: the 8-step Turbo LoRA matched base 20 steps at 42% of the time. The 4-step 768p LoRA took 8.4 min but invented camera moves, so 8 steps for ref2va and i2v, 4 only under ControlNet.' },
  { n: 'Qwen Turbo for drafts', k: 'drafts only', st: [1],
    t: { b: 55, a: 21, u: 's', bl: '51–59 s', al: '20–22 s' },
    say: 'Qwen-Image 2.1 from 25 to 8 steps, about 2.5× faster. Good for drafts; finals keep the full steps.' },
  { n: 'Low res, then upscale', k: 'rejected', st: [3, 4],
    t: { b: 16.4, a: 3.2, u: 'min', bl: '16.4 min at 1344×768', al: '3.2 min at 864×480' },
    say: 'H3 at 864×480 and upscale to 1080p took 3.2 min instead of 16.4, but 480p was mushy and artifact-heavy. I render native 1344×768 and upscale only the finals.' },
  { n: 'SeedVR2 BlockSwap 16', k: 'finals only', st: [4],
    v: { a: 11.8, al: '11.8 GB' },
    t: { a: 15, u: 'min', al: '15 min a 124-frame clip' },
    say: 'SeedVR2 3B fp8 to 1920×1080 with 16 blocks swapped and tiled encode/decode. The 7B would need more swap and is not installed. Real-ESRGAN (38 s) does previews.' },
  { n: 'SageAttention', k: 'not used', st: [3],
    t: { none: 'no run: morphing with int8 weights' },
    say: 'SageAttention causes morphing with int8 weights, per the H3 docs, so it stays off and the default attention runs.' },
  { n: 'Freestyle to numpy lines', k: 'kept', st: [0],
    r: { b: 41, a: 2, bl: '41 GB', al: 'under 2 GB' },
    say: 'Blender Freestyle line art hit 41 GB of RAM on the town. I draw the lines from the render passes in numpy instead, under 2 GB a look.' },
  { n: 'One GPU lock + RAM caps', k: 'kept', st: [0, 1, 2, 3, 4, 5, 6], lock: 1,
    v: { b: 9.6, a: 11.37, bl: '~9.6 GB reloaded mid-run: OOM', al: 'one job at a time' },
    r: { cap: 20, a: 20, al: 'cap 20 G default, 12 G for Blender' },
    say: 'Every session, in every project, takes one lock before the GPU and says how much it needs. Batches split under ~30 min so others get a turn, and stages free the card between them. A memory cap kills the job that overruns, not the machine.' },
  { n: 'Finding', k: 'result', st: [3], fin: 1,
    v: { a: 11.5, al: '11.3–11.5 of 12 GiB median peak · 0 CUDA OOMs' },
    r: { a: 26.1, mx: 58.7, al: 'H3 median 26.1 GiB · max 58.7' },
    t: { lo: 8.4, a: 48, mid: 28.5, u: 'min', al: '8.4–48 min a 5 s clip · median 28.5' },
    say: 'No logged run ran out of VRAM; every family sits at 11.3–11.5 of 12 GiB. RAM peaks and minutes per clip set the limits: 66 clips against 1,384 stills.' },
];
const JOBS = ['H3 clip', 'Krea keys', 'Blender', 'TTS', 'other project'];

export default function mount(root, { mode, base }) {
  const hero = mode === 'hero';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const S = '.pv-anime';
  const css = document.createElement('style');
  css.textContent = `
${S}{--acc:var(--pv-acc,#00728a);color:var(--ink);font:400 13px/20px var(--font-sans);display:grid;gap:24px}
:root[data-theme="dark"] ${S}{--pv-acc:#4ccbe0}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) ${S}{--pv-acc:#4ccbe0}}
${S} *{box-sizing:border-box}
${S} .lab{font:500 11px/16px var(--font-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-muted)}
${S} .strip{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));border-top:1px solid var(--ink);border-bottom:1px solid var(--rule)}
${S} .sg{padding:8px 8px 8px 0;border-right:1px solid var(--rule);min-width:0}
${S} .sg+.sg{padding-left:8px}${S} .sg:last-child{border-right:0}
${S} .sg b{display:block;font:400 16px/16px var(--font-pixel);-webkit-font-smoothing:none;color:var(--ink-muted)}
${S} .sg h5{margin:4px 0 2px;font:600 13px/16px var(--font-sans)}
${S} .sg p{margin:0;font:400 12px/16px var(--font-mono);color:var(--ink-muted);overflow-wrap:anywhere}
${S} .sg.on b,${S} .sg.on h5{color:var(--acc)}${S} .sg.on{box-shadow:none;border-top:0}
${S} .sg .mk{height:3px;margin:-8px 0 5px;background:transparent}${S} .sg.on .mk{background:var(--acc)}
${S} .body{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:24px;align-items:start}
${S}.narrow .body{grid-template-columns:1fr}${S}.narrow .strip{grid-template-columns:repeat(2,minmax(0,1fr))}
${S}.narrow .sg{border-right:0;border-bottom:1px solid var(--rule);padding-left:0}
${S} .card{border:1px solid var(--ink);background:var(--sheet);padding:16px;display:grid;gap:16px;min-width:0}
${S} .hd{display:flex;justify-content:space-between;gap:8px;align-items:baseline;flex-wrap:wrap}
${S} .hd .t{font:400 16px/16px var(--font-pixel);-webkit-font-smoothing:none}
${S} .meter{display:grid;gap:4px}
${S} .mrow{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}
${S} .mrow .lab b{color:var(--ink);font-weight:500}
${S} .cells{position:relative;display:grid;gap:2px;height:24px}
${S} .cells i{display:block;border:1px solid var(--rule);background:transparent}
${S} .cells i.b{background:var(--ink);border-color:var(--ink)}
${S} .cells i.a{background:var(--acc);border-color:var(--acc)}
${S} .cells i{position:relative}
${S} .cells i.p{background:transparent;border-color:var(--rule)}
${S} .cells i.p::after{content:'';position:absolute;left:0;top:0;bottom:0;width:var(--p);background:var(--acc)}
${S} .cells i.b.p::after{background:var(--ink)}${S} .cells i.x.p::after{display:none}
${S} .say code{font:inherit;white-space:nowrap}
${S} .cells i.x{background:transparent;border:1px solid var(--acc)}
${S} .over{position:absolute;right:0;top:-1px;bottom:-1px;width:0;border-left:2px solid var(--ink)}
${S} .tick{position:absolute;top:-4px;bottom:-4px;width:0;border-left:2px dashed var(--ink);display:none}
${S} .tick.mx{border-left-style:solid}
${S} .val{font:400 16px/20px var(--font-pixel);-webkit-font-smoothing:none;min-height:20px}
${S} .val.dim{font:400 11px/20px var(--font-mono);color:var(--ink-muted)}
${S} .tbar{display:grid;gap:4px}
${S} .tl{display:grid;grid-template-columns:48px minmax(0,1fr);gap:8px;align-items:center}
${S} .tl .lab{font-size:11px}
${S} .track{position:relative;height:16px;border-bottom:1px solid var(--rule)}
${S} .fill{position:absolute;left:0;top:2px;bottom:2px;width:0;background:var(--ink);transition:width .5s steps(8,end),left .5s steps(8,end)}
${S} .fill.a{background:var(--acc)}
${S} .fill .md{position:absolute;top:-4px;bottom:-4px;width:2px;background:var(--ink);display:none}
${S} .lock{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:center}
${S} .gpu{border:1px solid var(--ink);padding:4px 8px;font:500 11px/16px var(--font-mono);min-width:112px;text-align:center}
${S} .gpu.on{border-color:var(--acc);color:var(--acc)}
${S} .q{display:flex;gap:4px;flex-wrap:wrap;min-width:0}
${S} .q span{font:400 11px/16px var(--font-mono);border:1px solid var(--rule);padding:3px 6px;color:var(--ink-muted);white-space:nowrap}
${S} .side{display:grid;gap:12px;min-width:0}
${S} ol{list-style:none;margin:0;padding:0;border-top:1px solid var(--ink)}
${S} li button{all:unset;box-sizing:border-box;width:100%;cursor:pointer;display:grid;grid-template-columns:24px minmax(0,1fr) auto;gap:8px;align-items:baseline;padding:4px 0 4px 8px;border-bottom:1px solid var(--rule);border-left:3px solid transparent;font:400 13px/20px var(--font-sans)}
${S} li button .nn{font:500 11px/20px var(--font-mono);color:var(--ink-muted)}
${S} li button .kk{font:500 11px/20px var(--font-mono);color:var(--ink-muted);text-transform:uppercase;letter-spacing:.06em}
${S} li button[aria-current="true"]{border-left-color:var(--acc);background:var(--sheet)}
${S} li button[aria-current="true"] .nm{font-weight:600}
${S} li button:focus-visible{outline:2px solid var(--acc);outline-offset:-2px}
${S} .kk.rej{text-decoration:line-through}
${S} .ctl{display:flex;gap:8px;align-items:center}
${S} .ctl button{font:500 11px/16px var(--font-mono);letter-spacing:.06em;color:var(--ink);background:transparent;border:1px solid var(--ink);padding:4px 10px;cursor:pointer;border-radius:0}
${S} .ctl button:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
${S} .ctl .pos{font:400 16px/16px var(--font-pixel);-webkit-font-smoothing:none;margin-left:auto}
${S} p.say{margin:0;font:400 13px/20px var(--font-sans);min-height:80px;max-width:60ch}
${S} .verdict{font:500 11px/16px var(--font-mono);letter-spacing:.12em;text-transform:uppercase;border:1px solid var(--acc);color:var(--acc);padding:2px 8px}
${S} .verdict.rej{border-color:var(--ink);color:var(--ink);text-decoration:line-through}
${S} p.find{margin:0;max-width:none;display:flex;gap:8px;align-items:baseline;border-top:1px solid var(--ink);padding-top:8px;font:600 13px/20px var(--font-sans)}
${S} .find i{flex:none;width:8px;height:8px;background:var(--vermilion);transform:translateY(-1px)}
${S} .find span{color:var(--vermilion-text,var(--vermilion))}
${S}.narrow .say{min-height:0}
${S}.row-narrow ol{display:grid;grid-template-columns:1fr}
@media (prefers-reduced-motion:reduce){${S} .fill{transition:none}}
`;
  document.head.appendChild(css);
  const el = document.createElement('div'); el.className = 'pv-anime'; root.appendChild(el);
  const cellsHTML = n => Array.from({ length: n }, () => '<i></i>').join('');
  el.innerHTML = `${hero ? `<div><div class="lab" style="margin-bottom:8px">The pipeline · model per stage</div><div class="strip">${STAGES.map((s, i) => `<div class="sg"><div class="mk"></div><b>${i + 1}</b><h5>${s[0]}</h5><p>${s[1]}</p><p>${s[2]}</p></div>`).join('')}</div></div>` : ''}
  <div class="body">
    <div class="card" aria-hidden="true">
      <div class="hd"><span class="t">RTX 3060 · 64 GB</span><span class="lab mname"></span></div>
      <div class="meter vr"><div class="mrow"><span class="lab"><b>VRAM</b> · 12 cells of 1 GB</span><span class="lab">12 GB</span></div>
        <div class="cells" style="grid-template-columns:repeat(12,minmax(0,1fr))">${cellsHTML(12)}<span class="over"></span></div><div class="val"></div></div>
      <div class="meter rm"><div class="mrow"><span class="lab"><b>RAM</b> · 32 cells of 2 GB</span><span class="lab">64 GB</span></div>
        <div class="cells" style="grid-template-columns:repeat(32,minmax(0,1fr))">${cellsHTML(32)}<span class="tick cp"></span><span class="tick mx"></span></div><div class="val"></div></div>
      <div class="meter tm"><div class="mrow"><span class="lab"><b>Time</b> · per job</span><span class="lab tsc"></span></div>
        <div class="tbar"><div class="tl tb"><span class="lab">before</span><div class="track"><div class="fill"></div></div></div>
        <div class="tl ta"><span class="lab">after</span><div class="track"><div class="fill a"><span class="md"></span></div></div></div></div>
        <div class="val"></div></div>
      <div class="lock"><span class="gpu">GPU · free</span><div class="q">${JOBS.map(j => `<span>${j}</span>`).join('')}</div></div>
    </div>
    <div class="side">
      <div class="hd"><span class="lab">Methods I tried · ${M.length - 1}</span><span class="verdict"></span></div>
      <ol>${M.map((m, i) => `<li><button type="button"><span class="nn">${String(i + 1).padStart(2, '0')}</span><span class="nm">${m.n}</span><span class="kk${m.k === 'rejected' ? ' rej' : ''}">${m.k}</span></button></li>`).join('')}</ol>
      <div class="ctl"><button type="button" class="pv" aria-label="Previous method">&larr; prev</button><button type="button" class="nx" aria-label="Next method">next &rarr;</button><span class="pos"></span></div>
      <p class="say" aria-live="polite"></p>
    </div>
  </div>
  <p class="find"><i></i><span>VRAM was never the failure; RAM and time were.</span></p>`;
  const $ = s => el.querySelector(s);
  const vCells = [...el.querySelectorAll('.vr .cells i')], rCells = [...el.querySelectorAll('.rm .cells i')];
  const btns = [...el.querySelectorAll('ol button')], sgs = [...el.querySelectorAll('.sg')];
  const chips = [...el.querySelectorAll('.q span')];
  const fit = () => {
    const w = el.getBoundingClientRect().width;
    el.classList.toggle('narrow', w < 720);
  };
  const ro = new ResizeObserver(fit); ro.observe(el); fit();

  const timers = new Set();
  const later = (f, ms) => { const t = setTimeout(() => { timers.delete(t); f(); }, ms); timers.add(t); };
  const clear = () => { timers.forEach(clearTimeout); timers.clear(); };
  // cells: n = value / unit, painted one by one (a stepped fill)
  function paint(cells, val, unit, cls, stagger) {
    const q = val == null ? 0 : Math.min(cells.length, val / unit), n = Math.floor(q + 0.02), fr = q - n;
    cells.forEach((c, i) => {
      const set = () => { c.className = i < n ? cls : (i === n && fr > 0.05 && cls ? cls + ' p' : ''); c.style.setProperty('--p', Math.round(fr * 100) + '%'); };
      if (stagger && !reduce) later(set, Math.abs(i) * 24); else set();
    });
  }
  function meter(sel, cells, unit, d, phase) {
    const box = $(sel), val = box.querySelector('.val');
    const over = box.querySelector('.over');
    if (over) over.style.display = 'none';
    box.querySelectorAll('.tick').forEach(t => { t.style.display = 'none'; });
    if (!d && unit === 1) { paint(cells, 11.3, unit, 'b', false); val.className = 'val dim'; val.textContent = 'unchanged: ~11.3 of 12 GiB, like every job'; return; }   // VRAM sits near full whatever the method
    if (!d) { paint(cells, 0, unit, '', false); val.className = 'val dim'; val.textContent = 'not changed by this method'; return; }
    if (d.cap) { const t = box.querySelector('.cp'); t.style.display = 'block'; t.style.left = (d.cap / 64 * 100) + '%'; }
    if (phase === 'b') {
      if (d.b == null) { paint(cells, 0, unit, '', false); val.className = 'val dim'; val.textContent = 'before: no number logged'; return; }
      paint(cells, d.b, unit, 'b', true);
      if (over && d.b > 12.5) over.style.display = 'block';
      val.className = 'val'; val.textContent = d.bl; return;
    }
    if (d.cap) { paint(cells, d.a, unit, 'x', true); }
    else paint(cells, d.a, unit, 'a', true);
    if (d.mx) { const t = box.querySelector('.mx'); t.style.display = 'block'; t.style.left = (d.mx / 64 * 100) + '%'; }
    val.className = 'val'; val.textContent = (d.b != null ? d.bl + ' → ' : '') + d.al;
  }
  function time(d, phase) {
    const box = $('.tm'), val = box.querySelector('.val'), fb = box.querySelector('.tb .fill'), fa = box.querySelector('.ta .fill'), md = fa.querySelector('.md');
    md.style.display = 'none';
    box.querySelector('.tb').style.visibility = d && d.b != null ? '' : 'hidden';
    if (!d || d.none) { fb.style.width = fa.style.width = '0'; fa.style.left = '0'; box.querySelector('.tsc').textContent = ''; val.className = 'val dim'; val.textContent = d ? d.none : 'not changed by this method'; return; }
    const sc = Math.max(d.b || 0, d.a);
    box.querySelector('.tsc').textContent = '0 to ' + sc + ' ' + d.u;
    fb.style.width = d.b != null ? (d.b / sc * 100) + '%' : '0';
    if (phase === 'b') { fa.style.width = '0'; fa.style.left = '0'; val.className = 'val'; val.textContent = d.bl || ''; return; }
    if (d.lo != null) { fa.style.left = (d.lo / sc * 100) + '%'; fa.style.width = ((d.a - d.lo) / sc * 100) + '%'; md.style.display = 'block'; md.style.left = ((d.mid - d.lo) / (d.a - d.lo) * 100) + '%'; }
    else { fa.style.left = '0'; fa.style.width = (d.a / sc * 100) + '%'; }
    val.className = 'val'; val.textContent = (d.b != null ? d.bl + ' → ' : '') + d.al;
  }
  let lockI = 0;
  function lock(m, phase) {
    const g = $('.gpu');
    if (m.lock && phase === 'a') {
      g.classList.add('on');
      const run = () => {
        chips.forEach((c, i) => { c.style.borderColor = i === lockI ? 'var(--acc)' : ''; c.style.color = i === lockI ? 'var(--ink)' : ''; });
        g.textContent = 'GPU · ' + JOBS[lockI];
        if (!reduce && visible) later(() => { lockI = (lockI + 1) % JOBS.length; run(); }, 700);
      };
      run();
    } else {
      g.classList.remove('on');
      chips.forEach((c, i) => { c.style.borderColor = ''; c.style.color = ''; });
      g.textContent = m.lock ? 'GPU · two jobs at once' : 'GPU · ' + (m.st.includes(3) ? 'H3 clip' : m.st.includes(1) ? 'Krea keys' : m.st.includes(0) ? 'free (CPU job)' : 'upscale');
    }
  }
  let cur = 0, auto = !reduce, visible = true;
  function show(m, phase) {
    meter('.vr', vCells, 1, m.v, phase);
    meter('.rm', rCells, 2, m.r, phase);
    time(m.t, phase);
    lock(m, phase);
  }
  function go(i, instant) {
    clear();
    cur = (i + M.length) % M.length;
    const m = M[cur];
    btns.forEach((b, j) => b.setAttribute('aria-current', j === cur ? 'true' : 'false'));
    sgs.forEach((s, j) => s.classList.toggle('on', m.st.includes(j)));
    $('.mname').textContent = String(cur + 1).padStart(2, '0') + ' ' + m.n;
    $('.pos').textContent = String(cur + 1).padStart(2, '0') + '/' + M.length;
    const v = $('.side .verdict'); v.textContent = m.k; v.classList.toggle('rej', m.k === 'rejected' || m.k === 'not used');
    $('.say').innerHTML = m.say.replace(/(--[\w-]+)/g, '<code>$1</code>');
    const hasBefore = (m.v && m.v.b != null) || (m.r && m.r.b != null) || (m.t && m.t.b != null);
    if (reduce || instant || !hasBefore) show(m, 'a');
    else { show(m, 'b'); later(() => show(m, 'a'), 1100); }
    if (auto && visible) later(() => go(cur + 1), cur === M.length - 1 ? 6000 : 3800);
  }
  const stop = () => { auto = false; };
  btns.forEach((b, j) => b.addEventListener('click', () => { stop(); go(j); }));
  $('.ctl .pv').addEventListener('click', () => { stop(); go(cur - 1); });
  $('.ctl .nx').addEventListener('click', () => { stop(); go(cur + 1); });
  el.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { if (e.target.closest('ol,.ctl')) { e.preventDefault(); stop(); go(cur + 1); btns[cur].focus(); } }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { if (e.target.closest('ol,.ctl')) { e.preventDefault(); stop(); go(cur - 1); btns[cur].focus(); } }
  });
  const io = new IntersectionObserver(es => {
    const was = visible; visible = es[0].isIntersecting;
    if (!visible) clear(); else if (!was) go(cur, true);
  });
  io.observe(el);
  go(reduce ? M.length - 1 : 0);
  return () => { clear(); io.disconnect(); ro.disconnect(); el.remove(); css.remove(); };
}
