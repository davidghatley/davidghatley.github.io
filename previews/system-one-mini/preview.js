// system-one-mini: how the data was made -> how the model was trained -> what unseen wording did to it.
// Every number is from ship/experiments-facts.md section 1 (repo: reports/v0.md, experiments/*.json).
// The latent state, labels and the two rendered texts are an illustrative sample, labelled as such.

const S = 'pv-system-one-mini';

const COMPS = [['application code', 0], ['environment', 0], ['test fixture', 0], ['dependency', 1]];
const LABELS = [
  ['task_complete', 'false'],
  ['should_retry', 'true'],
  ['failure_source', 'dependency', 1],
  ['next_action', 'rerun_tests'],
  ['evidence_sufficient', 'true'],
];
const FAMILIAR = 'Intervention summary. Snapshot fails test_checkout. Restored application code: still failing. Restored environment: still failing. Restored test fixture: still failing. Restored dependency: passes. Retries: 1. Rollback allowed.';
const UNSEEN = 'Put the lockfile back to last-known-good and the suite went green; clean code, clean config and fresh fixtures each left it red. One retry used, reverting is fine.';

// heads: name, width, unseen acc, unseen conf (reports/v0.md, v0 raw)
const HEADS = [
  ['task_complete', 2, 67.05, 99.90],
  ['should_retry', 2, 70.55, 94.41],
  ['failure_source', 5, 21.05, 99.62],
  ['next_action', 5, 42.85, 92.28],
  ['evidence_sufficient', 2, 21.05, 99.71],
];
const SCALE = [['smoke', '500', '19.9 s', 58.26], ['tiny', '5,000', '100.9 s', 78.18], ['v0', '20,000', '376.7 s', 100]];

const CSS = `
.${S}{--acc:#a3263f;--vt:var(--vermilion-text,var(--vermilion));color:var(--ink);font:400 13px/20px var(--font-mono);display:grid;gap:16px;min-width:0}
:root[data-theme=dark] .${S}{--acc:#f07a8c;--vt:var(--vermilion)}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .${S}{--acc:#f07a8c;--vt:var(--vermilion)}}
.${S} *{box-sizing:border-box}
.${S} .k{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px;font:500 11px/16px var(--font-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-muted);border-bottom:1px solid var(--rule);padding-bottom:6px;margin-bottom:12px}
.${S} .k b{font:400 16px/16px var(--font-pixel);letter-spacing:0;color:var(--ink)}
.${S} .k i{font-style:normal;margin-left:auto;border:1px solid var(--rule);padding:0 6px;letter-spacing:.08em}
.${S} .t{font:500 11px/16px var(--font-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:6px}
.${S} [data-s]{opacity:.14;transition:opacity .3s steps(3,end)}
.${S} [data-s].on{opacity:1}
.${S} .flow{display:grid;grid-template-columns:minmax(0,1fr) 20px minmax(0,1fr) 20px minmax(0,1.5fr);gap:8px;align-items:start}
.${S} .ar{font:400 16px/24px var(--font-mono);color:var(--ink-muted);text-align:center;padding-top:20px}
.${S} .row{display:flex;justify-content:space-between;gap:8px;border-bottom:1px solid var(--rule);padding:2px 0;min-width:0}
.${S} .row span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.${S} .row em{font-style:normal;color:var(--ink-muted);white-space:nowrap}
.${S} .row em.c{color:var(--sheet);background:var(--acc);padding:0 4px}
.${S} .row em.a{color:var(--acc);font-weight:600}
.${S} .note{font-size:11px;line-height:16px;color:var(--ink-muted);margin-top:6px}
.${S} .txt{border:1px solid var(--rule);background:var(--sheet);padding:8px 10px;font-size:11px;line-height:16px;margin-bottom:8px}
.${S} .txt .t{margin-bottom:4px}
.${S} .txt.u{border-color:var(--ink)}
.${S} .cnt{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));border-top:1px solid var(--ink);border-left:1px solid var(--rule);margin-top:12px}
.${S} .cnt>div{border-right:1px solid var(--rule);border-bottom:1px solid var(--rule);padding:6px 8px;min-width:0}
.${S} .cnt strong{display:block;font:600 20px/24px var(--font-mono)}
.${S} .cnt span{font-size:11px;line-height:16px;color:var(--ink-muted)}
.${S} .lower{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.45fr);gap:24px}
.${S} .enc{display:grid;grid-template-columns:auto 16px minmax(0,1fr);gap:8px;align-items:center}
.${S} .ea{color:var(--ink-muted)}
.${S} .box{border:1px solid var(--ink);padding:6px 8px;font-size:11px;line-height:16px;writing-mode:horizontal-tb}
.${S} .box strong{display:block;font-size:13px}
.${S} .hd{display:flex;align-items:center;gap:8px;font-size:11px;line-height:18px}
.${S} .hd .cells{display:flex;gap:2px;flex:none}
.${S} .hd .cells i{width:10px;height:10px;border:1px solid var(--ink)}
.${S} .on .hd .cells i{background:var(--ink)}
.${S} .hd span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.${S} .st{margin-top:12px;display:grid;grid-template-columns:1fr 1fr;border-top:1px solid var(--rule)}
.${S} .st div{padding:4px 0;border-bottom:1px solid var(--rule)}
.${S} .st strong{font:600 16px/24px var(--font-mono);display:block}
.${S} .st span{font-size:11px;line-height:16px;color:var(--ink-muted)}
.${S} table{width:100%;border-collapse:collapse;margin-top:12px;font-size:11px;line-height:16px}
.${S} th{font-weight:500;text-align:left;color:var(--ink-muted);border-bottom:1px solid var(--ink);padding:2px 4px 2px 0}
.${S} td{border-bottom:1px solid var(--rule);padding:2px 4px 2px 0;white-space:nowrap}
.${S} td.n,.${S} th.n{text-align:right}
.${S} .tg{display:flex;gap:0;margin:-4px 0 12px}
.${S} .tg button{font:500 11px/16px var(--font-mono);letter-spacing:.08em;text-transform:uppercase;background:transparent;color:var(--ink);border:1px solid var(--ink);padding:4px 10px;border-radius:0;cursor:pointer}
.${S} .tg button+button{border-left:0}
.${S} .tg button[aria-pressed=true]{background:var(--ink);color:var(--paper)}
.${S} .tg button:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
.${S} .hb{display:grid;grid-template-columns:150px minmax(0,1fr) 112px;gap:10px;align-items:center;margin-bottom:8px}
.${S} .hb .nm{font-size:11px;line-height:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.${S} .tr{position:relative;height:16px;border:1px solid var(--rule);background:var(--sheet)}
.${S} .fi{position:absolute;left:0;top:0;bottom:0;background:var(--acc);transition:width .6s steps(6,end)}
.${S} .cf{position:absolute;top:-5px;bottom:-5px;width:2px;margin-left:-1px;background:var(--ink);transition:left .6s steps(6,end),opacity .2s steps(2,end)}
.${S} .vl{font-size:11px;line-height:16px;white-space:nowrap;text-align:right}
.${S} .vl em{font-style:normal;color:var(--ink-muted)}
.${S} .hb.ov{border-top:1px solid var(--ink);padding-top:8px;margin-top:4px}
.${S} .hb.ov .nm,.${S} .hb.ov .vl{font-weight:600}
.${S} .hb.ov .hot{color:var(--vt)}
.${S} .lg{display:flex;flex-wrap:wrap;gap:4px 16px;font-size:11px;line-height:16px;color:var(--ink-muted);margin-top:8px}
.${S} .lg i{display:inline-block;width:10px;height:10px;background:var(--acc);margin-right:6px;vertical-align:-1px}
.${S} .lg i.m{width:2px;height:14px;background:var(--ink);vertical-align:-3px}
.${S} .lesson{font:400 13px/20px var(--font-mono);margin-top:8px}
.${S} .foot{border-top:1px solid var(--ink);padding-top:8px;font:500 13px/20px var(--font-mono)}
.${S} .foot span{color:var(--acc)}
.${S}.hero{gap:24px}
@media (max-width:760px){
.${S} .flow{grid-template-columns:minmax(0,1fr)}
.${S} .ar{padding:0;text-align:left}
.${S} .ar::before{content:'\\2193'}
.${S} .ar span{display:none}
.${S} .cnt{grid-template-columns:repeat(2,minmax(0,1fr))}
.${S} .cnt>div:first-child{grid-column:1/-1}
.${S} .lower{grid-template-columns:minmax(0,1fr)}
.${S} .hb{grid-template-columns:minmax(0,1fr) 108px;gap:4px 8px}
.${S} .hb .tr{grid-column:1/-1;grid-row:2}
}
@media (prefers-reduced-motion:reduce){.${S} [data-s],.${S} .fi,.${S} .cf{transition:none}}
`;

const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export default function mount(root, { mode = 'row' } = {}) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const w = document.createElement('div');
  w.className = S + (mode === 'hero' ? ' hero' : '');
  let n = 1;
  const comps = COMPS.map(([c, ok]) => `<div class="row" data-s="${n++}"><span>restore ${esc(c)}</span><em class="${ok ? 'c' : ''}">${ok ? 'clears' : 'still red'}</em></div>`).join('');
  const sLat = n++; // 5
  const labels = LABELS.map(([k, v, hi]) => `<div class="row" data-s="${n++}"><span>${k}</span><em class="${hi ? 'a' : ''}">${v}</em></div>`).join('');
  const sFam = n++, sUns = n++, sCnt = n++, sTrain = n++, sTest = n++;
  const sUnseenChart = sTest + 4, LAST = sUnseenChart + 1;

  const heads = HEADS.map(([h, wd]) => `<div class="hd"><span class="cells">${'<i></i>'.repeat(wd)}</span><span>${h} · ${wd}</span></div>`).join('');
  const bars = HEADS.map(([h], i) => `<div class="hb" data-i="${i}"><div class="nm">${h}</div><div class="tr"><div class="fi"></div><div class="cf"></div></div><div class="vl"></div></div>`).join('');

  w.innerHTML = `
<section>
  <div class="k"><b>01</b>How the data was made<i>illustrative sample</i></div>
  <div class="flow">
    <div>
      <div class="t">1 · latent state</div>
      ${comps}
      <div class="note" data-s="${sLat}">One failing snapshot, four components each restored to known-good. Exactly one clearing repair names the source; none or several means unknown.</div>
    </div>
    <div class="ar" aria-hidden="true"><span>→</span></div>
    <div>
      <div class="t">2 · state machine writes 5 labels</div>
      ${labels}
      <div class="note">Deterministic policy. No teacher model, no API, no LLM paraphrase.</div>
    </div>
    <div class="ar" aria-hidden="true"><span>→</span></div>
    <div>
      <div class="t">3 · renderer writes text</div>
      <div class="txt" data-s="${sFam}"><div class="t">familiar style · train-v1</div>${esc(FAMILIAR)}</div>
      <div class="txt u" data-s="${sUns}"><div class="t">unseen style · unseen-v1 · test only</div>${esc(UNSEEN)}</div>
    </div>
  </div>
  <div class="cnt" data-s="${sCnt}">
    <div><strong>100,000</strong><span>decisions = 20,000 train states × 5 labels</span></div>
    <div><strong>2,000</strong><span>states each: val, calibration</span></div>
    <div><strong>2,000</strong><span>states each: familiar test, unseen test</span></div>
    <div><strong>600</strong><span>out-of-domain probes</span></div>
    <div><strong>1729</strong><span>seed, fully deterministic</span></div>
  </div>
</section>
<div class="lower">
  <section data-s="${sTrain}">
    <div class="k"><b>02</b>Training</div>
    <div class="enc">
      <div class="box"><strong>DistilBERT</strong>6 layers · 768<br>CLS vector</div>
      <div class="ea" aria-hidden="true">→</div>
      <div>${heads}</div>
    </div>
    <div class="st">
      <div><strong>66.4M</strong><span>parameters, full fine-tune</span></div>
      <div><strong>376.7 s</strong><span>on one RTX 3060</span></div>
      <div><strong>1.7 GB</strong><span>peak GPU memory</span></div>
      <div><strong>0</strong><span>tokens generated: logits → legal options</span></div>
    </div>
    <table><thead><tr><th>run</th><th class="n">states</th><th class="n">train time</th><th class="n">val macro</th></tr></thead>
    <tbody>${SCALE.map(r => `<tr><td>${r[0]}</td><td class="n">${r[1]}</td><td class="n">${r[2]}</td><td class="n">${r[3] === 100 ? '100%' : r[3].toFixed(2) + '%'}</td></tr>`).join('')}</tbody></table>
  </section>
  <section data-s="${sTest}">
    <div class="k"><b>03</b>Familiar vs unseen wording</div>
    <div class="tg" role="group" aria-label="Test split"><button type="button" data-m="f">familiar</button><button type="button" data-m="u">unseen</button></div>
    ${bars}
    <div class="hb ov"><div class="nm">all heads</div><div class="tr"><div class="fi"></div><div class="cf"></div></div><div class="vl"></div></div>
    <div class="lg"><span><i></i>accuracy</span><span><i class="m"></i>mean confidence</span></div>
    <div class="lesson"></div>
  </section>
</div>
<div class="foot"><span>→</span> nibble: questions go in the input, not fixed heads.</div>`;
  root.appendChild(w);

  const steps = [...w.querySelectorAll('[data-s]')];
  const rows = [...w.querySelectorAll('.hb')];
  const btns = [...w.querySelectorAll('.tg button')];
  const lesson = w.querySelector('.lesson');

  function chart(m) {
    const u = m === 'u';
    btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === m)));
    rows.forEach((r, i) => {
      const ov = i === HEADS.length;
      const acc = u ? (ov ? 44.51 : HEADS[i][2]) : 100;
      const cf = u ? (ov ? 97.19 : HEADS[i][3]) : (ov ? 99.82 : null);
      r.querySelector('.fi').style.width = acc + '%';
      const mk = r.querySelector('.cf');
      mk.style.left = (cf ?? 100) + '%';
      mk.style.opacity = cf == null ? '0' : '1';
      const accT = acc === 100 ? '100%' : acc.toFixed(2) + '%';
      r.querySelector('.vl').innerHTML = cf == null ? accT : `${accT} <em>@</em> <span class="${ov && u ? 'hot' : ''}">${cf.toFixed(2)}%</span>`;
    });
    lesson.innerHTML = u
      ? 'Accuracy fell to 44.51%. Confidence stayed at 97.19%. That gap is the lesson.'
      : '100% on the generator it was trained on: interpolation, not understanding.';
  }

  let s = 0, mode2 = 'f', timer = 0, vis = true, done = false;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function paint() {
    steps.forEach(el => el.classList.toggle('on', +el.dataset.s <= s));
    const m = s >= sUnseenChart ? 'u' : 'f';
    if (m !== mode2 || !done) { mode2 = m; chart(m); }
  }
  function stop() { clearInterval(timer); timer = 0; }
  function tick() {
    if (!vis) return;
    s++; paint();
    if (s >= LAST) { stop(); done = true; }
  }
  function finish() { stop(); s = LAST; paint(); done = true; }

  btns.forEach(b => b.addEventListener('click', () => { finish(); chart(b.dataset.m); }));

  chart('f');
  if (reduce) finish();
  else { paint(); timer = setInterval(tick, 420); }

  const io = new IntersectionObserver(e => { vis = e[0].isIntersecting; });
  io.observe(w);

  return () => { stop(); io.disconnect(); w.remove(); style.remove(); };
}
