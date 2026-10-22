// anime-pipeline preview: four synced stages of the same shot (S01_SH050) + previz/final wipe.
export default function mount(root, { mode, base }) {
  const M = base + 'public/media/anime-pipeline/';
  const hero = mode === 'hero';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gifs = { previz: 'sh050-previz.gif', depth: 'sh050-depth.gif', line: 'sh050-line.gif', final: 'sh050-final.gif' };
  const A = '#c93a24';
  const css = document.createElement('style');
  css.textContent = `
.pv-anime-pipeline{--acc:${A};display:grid;gap:16px;color:var(--ink);font:400 14px/20px var(--font-sans)}
.pv-anime-pipeline.hero{grid-template-columns:minmax(0,1fr) minmax(0,300px);align-items:start;gap:24px}
.pv-anime-pipeline .lab{font:500 11px/16px var(--font-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-muted)}
.pv-anime-pipeline .stages{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:0;align-items:stretch}
.pv-anime-pipeline .st{padding:0 10px;border-left:1px solid var(--rule);min-width:0;display:flex;flex-direction:column;gap:6px}
.pv-anime-pipeline .st:first-child{border-left:0;padding-left:0}
.pv-anime-pipeline .st:last-child{padding-right:0}
.pv-anime-pipeline .st h4{margin:0;font:600 12px/16px var(--font-mono);letter-spacing:.08em;text-transform:uppercase}
.pv-anime-pipeline .st h4{font:800 13px/16px 'Archivo',var(--font-sans);font-stretch:62%;letter-spacing:.06em;display:flex;align-items:center;gap:8px}
.pv-anime-pipeline .st h4 b{font:400 32px/32px var(--font-pixel);color:var(--acc)}
.pv-anime-pipeline .st img,.pv-anime-pipeline .st canvas{display:block;width:100%;height:auto;aspect-ratio:1344/768;object-fit:contain;background:var(--rule-faint);border:1px solid var(--rule)}
.pv-anime-pipeline .stack{display:grid;gap:6px}
.pv-anime-pipeline .node{border:1px solid var(--ink);background:var(--sheet);padding:8px;font:400 11px/16px var(--font-mono);color:var(--ink);flex:1;display:flex;flex-direction:column;justify-content:space-between;gap:6px}
.pv-anime-pipeline .node i{font-style:normal;color:var(--ink-muted)}
.pv-anime-pipeline .bar{height:6px;border:1px solid var(--ink);position:relative}
.pv-anime-pipeline .bar span{position:absolute;left:0;top:0;bottom:0;background:var(--acc);width:0}
.pv-anime-pipeline .cap{font:italic 400 14px/18px 'Newsreader',var(--font-serif);color:var(--ink-muted)}
.pv-anime-pipeline .fc{font:400 16px/16px var(--font-pixel);color:var(--ink);display:flex;justify-content:space-between}
.pv-anime-pipeline .film{background:var(--ink);padding:14px 0;position:relative}
.pv-anime-pipeline .film i{position:absolute;left:0;right:0;height:6px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='6'%3E%3Crect width='8' height='6' fill='%23eeede7'/%3E%3C/svg%3E");background-size:16px 6px}
.pv-anime-pipeline .film i:first-child{top:4px}.pv-anime-pipeline .film i:nth-child(2){bottom:4px}
.pv-anime-pipeline .film .wipe{border:0}
.pv-anime-pipeline .cmp{display:grid;gap:8px;max-width:${hero ? 760 : 520}px}
.pv-anime-pipeline .wipe{position:relative;aspect-ratio:1344/768;border:1px solid var(--ink);background:var(--rule-faint);touch-action:pan-y;cursor:ew-resize}
.pv-anime-pipeline .wipe img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block}
.pv-anime-pipeline .wipe .top{clip-path:inset(0 0 0 var(--x,50%))}
.pv-anime-pipeline .wipe .ln{position:absolute;top:0;bottom:0;left:var(--x,50%);width:2px;margin-left:-1px;background:var(--acc)}
.pv-anime-pipeline .wipe .tag{position:absolute;top:6px;font:800 12px/16px 'Archivo',var(--font-sans);font-stretch:75%;letter-spacing:.1em;background:var(--sheet);color:var(--ink);padding:0 6px;border:1px solid var(--ink)}
.pv-anime-pipeline .rng{width:100%;accent-color:var(--acc);margin:0}
.pv-anime-pipeline .sb{display:grid;gap:6px}
.pv-anime-pipeline .sb img{display:block;width:100%;height:auto;max-height:${hero ? '78vh' : 'none'};object-fit:contain;border:1px solid var(--rule)}
@media (max-width:760px){.pv-anime-pipeline.hero{grid-template-columns:1fr}.pv-anime-pipeline .stages{grid-template-columns:1fr 1fr;row-gap:12px}.pv-anime-pipeline .st:nth-child(3){border-left:0;padding-left:0}}
`;
  document.head.appendChild(css);
  root.innerHTML = '';
  const el = document.createElement('div');
  el.className = 'pv-anime-pipeline' + (hero ? ' hero' : '');
  const ph = (k) => `<img data-g="${k}" alt="${k} pass of shot S01_SH050" width="1344" height="768">`;
  el.innerHTML = `
<div class="main" style="display:grid;gap:16px;min-width:0">
 <div class="stages">
  <div class="st"><h4><b>1</b>Blender previz</h4>${ph('previz')}<span class="cap">blockout, beauty</span></div>
  <div class="st"><h4><b>2</b>Passes</h4><div class="stack">${ph('depth')}${ph('line')}</div><span class="cap">depth + line</span></div>
  <div class="st"><h4><b>3</b>ComfyUI</h4><div class="node"><span>S01_SH050<br><i>ir_cn_depth_s06_turbo4</i><br><i>1344x768 / 24fps / 124f</i><br><i>one RTX 3060, 12 GB</i></span><div class="bar"><span></span></div></div><span class="cap">depth control, 4-step</span></div>
  <div class="st"><h4><b>4</b>Final</h4>${ph('final')}<span class="cap">anime clip, same shot</span></div>
 </div>
 <div class="cmp">
  <div class="lab">Same shot, previz to final. Hover or drag.</div>
  <div class="film"><i></i><i></i><div class="wipe"><img data-g="previz" alt="previz"><img class="top" data-g="final" alt="final"><div class="ln"></div><span class="tag" style="left:6px">PREVIZ</span><span class="tag" style="right:6px">FINAL</span></div></div>
  <div class="fc"><span>S01 SH050</span><span class="n">F 000/041</span></div>
  <input class="rng" type="range" min="0" max="100" value="50" aria-label="Wipe between previz and final">
 </div>
</div>
${hero ? `<div class="sb"><div class="lab">Storyboard contact sheet</div><img src="${M}storyboard.jpg" alt="Storyboard contact sheet for Meguri" loading="lazy"></div>` : ''}`;
  root.appendChild(el);

  const imgs = [...el.querySelectorAll('img[data-g]')];
  const fc = el.querySelector('.fc .n'), wipe = el.querySelector('.wipe'), rng = el.querySelector('.rng'), fill = el.querySelector('.bar span');
  let alive = true, raf = 0, t0 = performance.now(), hovering = false, dragged = false, urls = [];
  const set = (v) => { wipe.style.setProperty('--x', v + '%'); rng.value = v; };
  set(50);
  const pos = (e) => { const r = wipe.getBoundingClientRect(); return Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)); };
  const on = (t, ev, f) => { t.addEventListener(ev, f); return () => t.removeEventListener(ev, f); };
  const offs = [
    on(wipe, 'pointermove', (e) => { hovering = true; set(pos(e)); }),
    on(wipe, 'pointerleave', () => { hovering = false; }),
    on(rng, 'input', () => { dragged = true; set(+rng.value); }),
  ];
  // Decode every GIF into frames and paint all views from ONE clock, so the stages stay frame-locked.
  const frames = {}; let ready = false, FPS = 8, N = 0; const views = [];
  const dec = async (k, f) => {
    const buf = await (await fetch(M + f)).arrayBuffer();
    const d = new ImageDecoder({ data: buf, type: 'image/gif' }); await d.tracks.ready;
    const n = d.tracks.selectedTrack.frameCount, out = [];
    for (let i = 0; i < n; i++) { const { image } = await d.decode({ frameIndex: i }); out.push(await createImageBitmap(image)); image.close(); }
    frames[k] = out;
  };
  const fallback = () => Promise.all(Object.entries(gifs).map(([k, f]) => fetch(M + f).then(r => r.blob()).then(b => [k, URL.createObjectURL(b)]))).then(list => {
    if (!alive) return; const m = Object.fromEntries(list); urls = list.map(l => l[1]); imgs.forEach(i => { i.src = m[i.dataset.g]; });
  });
  (window.ImageDecoder ? Promise.all(Object.entries(gifs).map(([k, f]) => dec(k, f))) : Promise.reject()).then(() => {
    if (!alive) return;
    N = Math.min(...Object.values(frames).map(a => a.length));
    imgs.forEach(i => {
      const c = document.createElement('canvas'), fr = frames[i.dataset.g][0]; c.width = fr.width; c.height = fr.height;
      c.className = i.className; c.setAttribute('role', 'img'); c.setAttribute('aria-label', i.alt); c.dataset.g = i.dataset.g;
      c.style.cssText = i.parentNode.classList.contains('wipe') ? 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain' : '';
      i.replaceWith(c); views.push([c, c.getContext('2d')]);
    });
    ready = true; t0 = performance.now(); paint(0);
  }).catch((e) => { console.log('ap-fallback', e); if (alive) fallback(); });
  function paint(idx) { for (const [c, x] of views) x.drawImage(frames[c.dataset.g][idx], 0, 0); }
  function tick(now) {
    if (!alive) return;
    const p = ((now - t0) / 5100) % 1;
    fc.textContent = 'F ' + String(Math.floor(p * 41)).padStart(3, '0') + '/041';
    if (ready && !reduce) paint(Math.min(N - 1, Math.floor(((now - t0) / 1000 * FPS) % N)));
    fill.style.width = (p * 100) + '%';
    if (!hovering && !dragged && !reduce) set(50 + 45 * Math.sin((now - t0) / 2400));
    raf = requestAnimationFrame(tick);
  }
  if (!reduce) raf = requestAnimationFrame(tick); else { fill.style.width = '100%'; }
  // pause when off screen (hidden GIFs are not controllable; stop our loop)
  const io = new IntersectionObserver(([e]) => { if (!reduce) { cancelAnimationFrame(raf); if (e.isIntersecting) raf = requestAnimationFrame(tick); } });
  io.observe(el);
  return () => { alive = false; cancelAnimationFrame(raf); io.disconnect(); offs.forEach(f => f()); urls.forEach(u => URL.revokeObjectURL(u)); css.remove(); root.innerHTML = ''; };
}
