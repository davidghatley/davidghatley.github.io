// shuto preview: stages of one shot, frame-locked, with a previz/final wipe, plus the show's 3D scenes, map/keys and a landscape clip.
const CFG = {"slug": "shuto", "accent": "#2559c9", "accentDark": "#7aa2ff", "ar": "16/9", "arn": 1.7778, "shot": "SH13 the duel", "h4": "700 14px/16px 'Barlow Condensed',var(--font-sans);letter-spacing:.1em;text-transform:uppercase", "cap": "400 12px/16px var(--font-mono)", "tag": "700 12px/16px 'Barlow Condensed',var(--font-sans);letter-spacing:.1em", "gifs": {"previz": "sh13-previz.gif", "final": "sh13-final.gif"}, "stages": [{"h": "Blender previz", "items": [{"g": "previz", "alt": "previz of shot SH13"}], "cap": "blockout, bikes + trails"}, {"h": "Look-lab key", "items": [{"still": "key-cyberpunk-SH13.jpg", "alt": "look-lab key frame of the duel"}], "cap": "one look, f110"}, {"h": "Video model", "node": ["SH13_duel", "<i>cyberpunk look, H3</i>", "<i>1344x768 / 24fps / 124f</i>", "<i>one RTX 3060, 12 GB</i>"], "cap": "guided by the previz"}, {"h": "Final", "items": [{"g": "final", "alt": "final shot SH13"}], "cap": "test clip, same shot"}], "sections": [{"kind": "thumbs", "title": "3D scenes (previz renders)", "items": [{"src": "previz-SH01_afterglow.jpg", "alt": "Previz of the junction", "cap": "SH01 junction"}, {"src": "previz-SH05_tunnel.jpg", "alt": "Previz of the tunnel", "cap": "SH05 tunnel"}, {"src": "previz-SH06_toll.jpg", "alt": "Previz of the toll plaza", "cap": "SH06 toll"}]}, {"kind": "clip", "title": "SH12 guard: previz to final", "src": "guard-previz-final.mp4", "alt": "previz of the guard shot beside the generated shot", "cap": "previz left, generated right"}, {"kind": "thumbs", "title": "Look lab, same frame", "items": [{"src": "key-cyberpunk-SH13.jpg", "alt": "cyberpunk look", "cap": "cyberpunk"}, {"src": "key-backlit-SH13.jpg", "alt": "backlit manga look", "cap": "backlit"}, {"src": "key-boldinked-SH13.jpg", "alt": "bold inked look", "cap": "bold inked"}]}]};
export default function mount(root, { mode, base }) {
  const M = base + 'public/media/' + CFG.slug + '/';
  const hero = mode === 'hero' || mode === 'strip';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const S = '.pv-' + CFG.slug;
  const css = document.createElement('style');
  css.textContent = `
${S}{--acc:var(--pv-acc,${CFG.accent});display:grid;gap:20px;color:var(--ink);font:400 14px/20px var(--font-sans)}
:root[data-theme="dark"] ${S}{--pv-acc:${CFG.accentDark}}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) ${S}{--pv-acc:${CFG.accentDark}}}
${S} .lab{font:500 11px/16px var(--font-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-muted)}
${S} .top{display:grid;gap:20px;align-items:start;grid-template-columns:${mode === 'row' ? 'minmax(0,1.15fr) minmax(0,1fr)' : 'minmax(0,1fr)'}}
${S} .main{display:grid;gap:12px;min-width:0}
${S} .stages{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}
${S} .st{padding:0 8px;border-left:1px solid var(--rule);min-width:0;display:flex;flex-direction:column;gap:6px}
${S} .st:first-child{border-left:0;padding-left:0}${S} .st:last-child{padding-right:0}
${S} .st h4{margin:0;font:${CFG.h4};display:flex;align-items:center;gap:6px}
${S} .st h4 b{font:400 32px/32px var(--font-pixel);color:var(--acc)}
${S} .st .im,${S} .st canvas,${S} .st img{display:block;width:100%;height:auto;aspect-ratio:${CFG.ar};object-fit:contain;background:var(--rule-faint);border:1px solid var(--rule)}
${S} .stack{display:grid;gap:6px}
${S} .node{border:1px solid var(--ink);background:var(--sheet);padding:6px;font:400 12px/16px var(--font-mono);overflow-wrap:anywhere;min-width:0;flex:1;display:flex;flex-direction:column;justify-content:space-between;gap:6px;min-height:60px}
${S} .node i{font-style:normal;color:var(--ink-muted)}
${S} .bar{height:6px;border:1px solid var(--ink);position:relative}${S} .bar span{position:absolute;left:0;top:0;bottom:0;background:var(--acc);width:0}
${S} .cap{font:${CFG.cap};color:var(--ink-muted)}
${S} .film{background:var(--ink);padding:14px 0;position:relative;max-width:${hero ? 760 : 560}px}
${S} .film i{position:absolute;left:0;right:0;height:6px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='6'%3E%3Crect width='8' height='6' fill='%23eeede7'/%3E%3C/svg%3E");background-size:16px 6px}
${S} .film i:first-child{top:4px}${S} .film i:nth-child(2){bottom:4px}
${S} .wipe{position:relative;aspect-ratio:${CFG.ar};background:var(--rule-faint);touch-action:pan-y;cursor:ew-resize}
${S} .wipe canvas,${S} .wipe img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block}
${S} .wipe .topl{clip-path:inset(0 0 0 var(--x,50%))}
${S} .wipe .ln{position:absolute;top:0;bottom:0;left:var(--x,50%);width:2px;margin-left:-1px;background:var(--acc)}
${S} .tag{position:absolute;top:6px;font:${CFG.tag};background:var(--sheet);color:var(--ink);padding:0 6px;border:1px solid var(--ink)}
${S} .fc{font:400 16px/16px var(--font-pixel);display:flex;justify-content:space-between;max-width:${hero ? 760 : 560}px}
${S} .rng{width:100%;max-width:${hero ? 760 : 560}px;accent-color:var(--acc);margin:0}
${S} .side{display:grid;gap:14px;min-width:0}
${S} .sec{display:grid;gap:6px;min-width:0}
${S} .th{display:grid;gap:8px;grid-template-columns:repeat(var(--n,3),minmax(0,1fr));align-items:start}
${S} .th figure{margin:0;min-width:0}${S} .th img,${S} .sec video,${S} .sec .mapi{display:block;box-sizing:border-box;width:100%;height:auto;object-fit:contain;border:1px solid var(--rule);background:var(--rule-faint)}
${S} .th figcaption{font:400 12px/16px var(--font-mono);color:var(--ink-muted);margin-top:2px}
${S} .secs{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(${hero ? 300 : 220}px,1fr));align-items:start}
${S} .mapi{max-width:${hero ? 460 : 230}px}
@media (max-width:820px){${S} .top{grid-template-columns:1fr}${S} .stages{grid-template-columns:1fr 1fr;row-gap:12px}${S} .st:nth-child(3){border-left:0;padding-left:0}}
`;
  document.head.appendChild(css);
  root.innerHTML = '';
  const el = document.createElement('div'); el.className = 'pv-' + CFG.slug;
  const ph = (k, alt) => `<img data-g="${k}" alt="${alt}" width="400" height="${Math.round(400 / CFG.arn)}">`;
  const st = CFG.stages.map((s, i) => {
    const body = s.node ? `<div class="node"><span>${s.node.join('<br>')}</span><div class="bar"><span></span></div></div>`
      : `<div class="stack">${s.items.map(it => it.still ? `<img src="${M}${it.still}" alt="${it.alt}">` : ph(it.g, it.alt)).join('')}</div>`;
    return `<div class="st"><h4><b>${i + 1}</b>${s.h}</h4>${body}<span class="cap">${s.cap}</span></div>`;
  }).join('');
  const sec = (x) => {
    if (x.kind === 'thumbs') return `<div class="sec"><div class="lab">${x.title}</div><div class="th" style="--n:${x.items.length}">${x.items.map(i => `<figure><img src="${M}${i.src}" alt="${i.alt}" loading="lazy"><figcaption>${i.cap}</figcaption></figure>`).join('')}</div></div>`;
    if (x.kind === 'map') return `<div class="sec"><div class="lab">${x.title}</div><img class="mapi" src="${M}${x.src}" alt="${x.alt}" loading="lazy"><span class="cap">${x.cap}</span></div>`;
    return `<div class="sec"><div class="lab">${x.title}</div><video src="${M}${x.src}" muted loop playsinline preload="none" ${reduce ? 'controls' : ''} aria-label="${x.alt}"></video><span class="cap">${x.cap}</span></div>`;
  };
  const secs = mode === 'strip' ? '' : CFG.sections.map(sec).join('');
  el.innerHTML = `<div class="top"><div class="main"><div class="stages">${st}</div>
  <div class="lab">Same shot, previz to final. Hover or drag.</div>
  <div class="film"><i></i><i></i><div class="wipe"><img data-g="previz" alt="previz"><img class="topl" data-g="final" alt="final"><div class="ln"></div><span class="tag" style="left:6px">PREVIZ</span><span class="tag" style="right:6px">FINAL</span></div></div>
  <div class="fc"><span>${CFG.shot}</span><span class="n">F 000/041</span></div>
  <input class="rng" type="range" min="0" max="100" value="50" aria-label="Wipe between previz and final"></div>
  ${mode === 'row' ? `<div class="side">${secs}</div>` : ''}</div>${mode === 'hero' ? `<div class="secs">${secs}</div>` : ''}`;
  root.appendChild(el);

  const imgs = [...el.querySelectorAll('img[data-g]')];
  const wipe = el.querySelector('.wipe'), rng = el.querySelector('.rng'), fill = el.querySelector('.bar span'), fc = el.querySelector('.fc .n');
  const vids = [...el.querySelectorAll('video')];
  let alive = true, raf = 0, t0 = performance.now(), hovering = false, dragged = false, urls = [];
  const set = (v) => { wipe.style.setProperty('--x', v + '%'); rng.value = v; };
  set(50);
  const pos = (e) => { const r = wipe.getBoundingClientRect(); return Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)); };
  const on = (t, ev, f) => { t.addEventListener(ev, f); return () => t.removeEventListener(ev, f); };
  const offs = [on(wipe, 'pointermove', (e) => { hovering = true; set(pos(e)); }), on(wipe, 'pointerleave', () => { hovering = false; }), on(rng, 'input', () => { dragged = true; set(+rng.value); })];
  const frames = {}; let ready = false, N = 0; const views = [];
  const dec = async (k, f) => {
    const buf = await (await fetch(M + f)).arrayBuffer();
    const d = new ImageDecoder({ data: buf, type: 'image/gif' }); await d.tracks.ready;
    const n = d.tracks.selectedTrack.frameCount, out = [];
    for (let i = 0; i < n; i++) { const { image } = await d.decode({ frameIndex: i }); out.push(await createImageBitmap(image)); image.close(); }
    frames[k] = out;
  };
  const fallback = () => Promise.all(Object.entries(CFG.gifs).map(([k, f]) => fetch(M + f).then(r => r.blob()).then(b => [k, URL.createObjectURL(b)]))).then(list => {
    if (!alive) return; const m = Object.fromEntries(list); urls = list.map(l => l[1]); imgs.forEach(i => { i.src = m[i.dataset.g]; });
  });
  (window.ImageDecoder ? Promise.all(Object.entries(CFG.gifs).map(([k, f]) => dec(k, f))) : Promise.reject()).then(() => {
    if (!alive) return;
    N = Math.min(...Object.values(frames).map(a => a.length));
    imgs.forEach(i => {
      const c = document.createElement('canvas'), fr = frames[i.dataset.g][0]; c.width = fr.width; c.height = fr.height;
      c.className = i.className; c.setAttribute('role', 'img'); c.setAttribute('aria-label', i.alt); c.dataset.g = i.dataset.g;
      i.replaceWith(c); views.push([c, c.getContext('2d')]);
    });
    ready = true; t0 = performance.now(); paint(0);
  }).catch(() => { if (alive) fallback(); });
  function paint(idx) { for (const [c, x] of views) x.drawImage(frames[c.dataset.g][idx], 0, 0); }
  function tick(now) {
    if (!alive) return;
    const e0 = Math.max(0, now - t0), p = (e0 / 5100) % 1;
    fc.textContent = 'F ' + String(Math.floor(p * 41)).padStart(3, '0') + '/041';
    if (ready) paint(Math.min(N - 1, Math.floor((e0 / 1000 * 8) % N)));
    fill.style.width = (p * 100) + '%';
    if (!hovering && !dragged) set(50 + 45 * Math.sin(e0 / 2400));
    raf = requestAnimationFrame(tick);
  }
  if (!reduce) raf = requestAnimationFrame(tick); else fill.style.width = '100%';
  const io = new IntersectionObserver((es) => { for (const e of es) { if (e.target === el) { if (!reduce) { cancelAnimationFrame(raf); if (e.isIntersecting) raf = requestAnimationFrame(tick); } } else if (!reduce) { e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause(); } } });
  io.observe(el); vids.forEach(v => io.observe(v));
  return () => { alive = false; cancelAnimationFrame(raf); io.disconnect(); offs.forEach(f => f()); urls.forEach(u => URL.revokeObjectURL(u)); css.remove(); root.innerHTML = ''; };
}
