const CSS = `
.pv-workbench{--a:#2f8f9d;--at:#1d6c77;font:400 13px/18px var(--font-sans);color:var(--ink)}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .pv-workbench{--a:#3fb0bd;--at:#3fb0bd}}
:root[data-theme=dark] .pv-workbench{--a:#3fb0bd;--at:#3fb0bd}
.pv-workbench .board{display:grid;grid-template-columns:1.15fr 1fr 1fr;gap:16px}
.pv-workbench.hero .board{gap:24px}
.pv-workbench .tool{background:var(--sheet);border:1px solid var(--rule);padding:12px 14px 14px;position:relative;min-width:0;display:flex;flex-direction:column}
.pv-workbench .tool:before,.pv-workbench .tool:after{content:"";position:absolute;top:8px;width:6px;height:6px;border:1px solid var(--ink-muted);border-radius:50%}
.pv-workbench .tool:before{right:10px}.pv-workbench .tool:after{display:none}
.pv-workbench h4{margin:0 0 2px;font:600 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--at)}
.pv-workbench .sub{font:400 12px/16px var(--font-mono);color:var(--ink-muted);margin-bottom:10px}
.pv-workbench .stage{height:300px;position:relative;border:1px solid var(--rule-faint);background:var(--paper)}
.pv-workbench.hero .stage{height:min(52vh,460px)}
.pv-workbench canvas{display:block;width:100%;height:100%}
.pv-workbench .pick{display:flex;gap:6px;margin-top:8px}
.pv-workbench button{font:500 11px/16px var(--font-mono);padding:3px 8px;background:transparent;color:var(--ink);border:1px solid var(--rule);cursor:pointer;border-radius:0}
.pv-workbench button[aria-pressed=true]{background:var(--a);color:#16181d;border-color:var(--a)}
.pv-workbench button:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
.pv-workbench .note{font:400 11px/16px var(--font-mono);color:var(--ink-muted);margin-top:auto;padding-top:8px}
.pv-workbench svg{display:block;width:100%;height:auto}
.pv-workbench svg text{font-family:var(--font-mono);fill:var(--ink-muted);font-size:10px}
.pv-workbench svg .t{fill:var(--ink)}
.pv-workbench .cnt{display:grid;gap:12px;margin-top:2px}
.pv-workbench .cnt .r{display:grid;grid-template-columns:1fr auto;align-items:baseline;gap:2px 8px}
.pv-workbench .cnt .n{font:400 32px/36px var(--font-pixel);font-variant-numeric:tabular-nums;color:var(--ink)}
.pv-workbench.hero .cnt .n{font-size:48px;line-height:52px}
.pv-workbench svg .px{font-family:var(--font-pixel);font-size:16px;fill:var(--ink)}
.pv-workbench .dim{position:absolute;left:8px;right:8px;bottom:6px;height:16px;border-left:1px solid var(--ink-muted);border-right:1px solid var(--ink-muted);display:flex;align-items:center;font:400 10px/12px var(--font-mono);color:var(--ink-muted)}
.pv-workbench .dim:before,.pv-workbench .dim:after{content:"";flex:1;border-top:1px solid var(--ink-muted)}
.pv-workbench .dim span{padding:0 6px;background:var(--paper)}
.pv-workbench .cnt .bar{border-left:1px solid var(--ink-muted);border-right:1px solid var(--ink-muted);box-sizing:border-box}
.pv-workbench .cnt .l{font:400 12px/16px var(--font-mono);color:var(--ink-muted)}
.pv-workbench .cnt .bar{grid-column:1/3;height:6px;background:var(--rule-faint)}
.pv-workbench .cnt .bar i{display:block;height:100%;background:var(--a);width:0}
.pv-workbench .cnt .zero .n{color:var(--ink-muted)}
@media(max-width:820px){.pv-workbench .board{grid-template-columns:1fr}.pv-workbench .stage{height:260px}}
`;
const PARTS = [
  { f: 'wall_front_L.stl', label: 'wall_front_L', note: 'rack10 front wall, 61 KB STL' },
  { f: 'carrier_o7050_FL.stl', label: 'carrier_o7050_FL', note: 'rack10 carrier for an OptiPlex 7050, 157 KB STL' },
];
const NS = 'http://www.w3.org/2000/svg';

export default function mount(root, { mode, base }) {
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const el = document.createElement('div'); el.className = 'pv-workbench ' + mode; root.appendChild(el);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.innerHTML = `<div class="board">
  <section class="tool"><h4>rack10 / STL viewer</h4><div class="sub">real parts, OpenSCAD to STL</div>
    <div class="stage"><div class="dim"><span class="dv"></span></div></div><div class="pick"></div><div class="note"></div></section>
  <section class="tool"><h4>VRAM / one RTX 3060</h4><div class="sub">12 GB shared by every project</div><div class="gauge"></div>
    <div class="note">Every GPU job takes the flock on /mnt/scratch/gpu.lock via gpu_run.</div></section>
  <section class="tool"><h4>Corpus / counter</h4><div class="sub">research-corpus, read from the repo</div><div class="cnt"></div>
    <div class="note">Audio is queued for local Whisper; nothing is transcribed yet.</div></section></div>`;

  // ---- (b) gauge
  const g = el.querySelector('.gauge');
  const W = 300, x0 = 8, bw = 284, px = (gb) => x0 + bw * gb / 12;
  const rect = (x, y, w, h, a) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${a}/>`;
  let ticks = ''; for (let i = 0; i <= 12; i += 2) ticks += `<line x1="${px(i)}" x2="${px(i)}" y1="100" y2="106" stroke="var(--ink-muted)"/><text x="${px(i)}" y="118" text-anchor="middle">${i}</text>`;
  g.innerHTML = `<svg viewBox="0 0 ${W} 250" role="img" aria-label="12 GB of VRAM: ComfyUI idle holds 7 to 11 GB, Whisper large-v3 waits for 6 GB free, yields below 700 MiB">
   <text x="${x0}" y="14" class="px">12 GB</text>
   ${rect(x0, 20, bw, 80, 'fill="var(--paper)" stroke="var(--ink)"')}
   ${rect(x0, 20, px(7) - x0, 80, 'fill="var(--ink-muted)" opacity=".55"')}
   ${rect(px(7), 20, px(11) - px(7), 80, 'fill="none" stroke="var(--ink-muted)" stroke-dasharray="4 3"')}
   <text x="${(x0 + px(7)) / 2}" y="64" text-anchor="middle" class="t">ComfyUI</text>
   <text x="${(x0 + px(7)) / 2}" y="78" text-anchor="middle">idle, 7 GB min</text>
   <text x="${(px(7) + px(11)) / 2}" y="64" text-anchor="middle">up to 11</text>
   ${ticks}
   <line x1="${px(6)}" x2="${px(6)}" y1="14" y2="100" stroke="var(--a,#2f8f9d)" stroke-width="2" class="m6"/>
   <line x1="${px(12) - 3}" x2="${px(12) - 3}" y1="14" y2="100" stroke="var(--vermilion)" stroke-width="2"/>
   <text x="${x0}" y="140" class="t">Whisper large-v3 (int8_float16)</text>
   <text x="${x0}" y="154">waits for 6 GB free + idle ComfyUI</text>
   <text x="${x0}" y="168">yields below 700 MiB free</text>
   ${rect(x0, 180, bw, 10, 'fill="var(--paper)" stroke="var(--ink-muted)"')}
   ${rect(x0, 180, bw * 20 / 64, 10, 'fill="var(--ink-muted)" opacity=".55"')}
   <text x="${x0}" y="206" class="px">64 GB RAM</text>
   <text x="${x0}" y="220">20 GB cap per job, ~48 GB offload room</text>
   <text x="${x0}" y="236">nothing may need more than 12 GB VRAM</text></svg>`;
  const wm = g.querySelector('.m6');
  // 6 GB marker in accent via inline stroke var on parent
  wm.setAttribute('stroke', 'currentColor'); wm.parentNode.style.color = getComputedStyle(el).getPropertyValue('--a') || '#2f8f9d';
  g.querySelector('svg').style.color = 'var(--a)';

  // ---- (c) counter
  const rows = [['videos catalogued', 463, 463], ['cleaned caption files', 380, 463], ['audio files downloaded', 172, 463], ['Whisper transcripts', 0, 463]];
  const cnt = el.querySelector('.cnt');
  cnt.innerHTML = rows.map(([l, v, m]) => `<div class="r ${v ? '' : 'zero'}"><span class="l">${l}</span><span class="n" data-v="${v}">${reduce ? v : 0}</span><span class="bar"><i style="width:${reduce ? v / m * 100 : 0}%" data-w="${v / m * 100}"></i></span></div>`).join('');
  let raf = 0, tStart = 0, countDone = reduce;
  const run = (t) => {
    if (!tStart) tStart = t; const p = Math.min(1, (t - tStart) / 1400), e = 1 - Math.pow(1 - p, 3);
    cnt.querySelectorAll('.n').forEach(n => n.textContent = Math.round(n.dataset.v * e));
    cnt.querySelectorAll('i').forEach(i => i.style.width = i.dataset.w * e + '%');
    if (p < 1) raf = requestAnimationFrame(run); else countDone = true;
  };

  // ---- (a) three.js viewer
  const stage = el.querySelector('.stage'), pick = el.querySelector('.pick'), note = el.querySelector('.note');
  let visible = true, disposed = false, three, renderer, cleanup3 = () => {};
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) { start(); } }, { threshold: 0.05 });
  io.observe(el);
  const start = () => { if (!countDone && !raf) raf = requestAnimationFrame(run); if (three) three.loop(); };

  const btns = PARTS.map((p, i) => { const b = document.createElement('button'); b.textContent = p.label; b.setAttribute('aria-pressed', i === 0); b.onclick = () => three && three.show(i); pick.appendChild(b); return b; });
  note.textContent = PARTS[0].note;

  (async () => {
    try {
      const T = await import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js');
      // STLLoader imports the bare specifier 'three'; rewrite it to the same CDN module so no import map is needed.
      const src = await (await fetch('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/STLLoader.js')).text();
      const blob = URL.createObjectURL(new Blob([src.replace(/from\s+['"]three['"]/, "from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js'")], { type: 'text/javascript' }));
      const { STLLoader } = await import(blob); URL.revokeObjectURL(blob);
      if (disposed) return;
      renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); stage.insertBefore(renderer.domElement, stage.firstChild);
      const scene = new T.Scene(), cam = new T.PerspectiveCamera(35, 1, 0.1, 5000);
      scene.add(new T.HemisphereLight(0xffffff, 0x777777, 1.1));
      const dl = new T.DirectionalLight(0xffffff, 1.6); dl.position.set(1, 1.4, 1.2); scene.add(dl);
      const accent = () => (getComputedStyle(el).getPropertyValue('--a').trim() || '#2f8f9d');
      const mat = new T.MeshLambertMaterial({ color: accent(), flatShading: true });
      const pivot = new T.Group(); scene.add(pivot);
      const loader = new STLLoader(); const geos = [];
      const size = () => { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
      const ro = new ResizeObserver(size); ro.observe(stage); size();
      let cur = -1, mesh, edges, ang = 0, last = 0, running = false;
      const load = (i) => new Promise((res, rej) => { if (geos[i]) return res(geos[i]); loader.load(base + 'public/media/workbench/' + PARTS[i].f, gm => { gm.computeVertexNormals(); gm.center(); geos[i] = gm; res(gm); }, undefined, rej); });
      const show = async (i) => {
        const gm = await load(i); if (disposed) return; cur = i;
        if (mesh) { pivot.remove(mesh, edges); edges.geometry.dispose(); }
        mesh = new T.Mesh(gm, mat); pivot.add(mesh);
        edges = new T.LineSegments(new T.EdgesGeometry(gm, 35), new T.LineBasicMaterial({ color: getComputedStyle(el).getPropertyValue('color') || '#16181d' })); pivot.add(edges);
        edges.material.color.set(getComputedStyle(el).color);
        gm.computeBoundingSphere(); gm.computeBoundingBox(); const bb = gm.boundingBox.getSize(new T.Vector3()); stage.querySelector('.dv').textContent = bb.x.toFixed(1) + ' x ' + bb.y.toFixed(1) + ' x ' + bb.z.toFixed(1) + ' mm'; const r = gm.boundingSphere.radius;
        const d = r / Math.sin(cam.fov * Math.PI / 360) / Math.min(1, cam.aspect) * 1.2; cam.position.set(d * 0.45, d * 0.35, d * 0.85); cam.lookAt(0, 0, 0);
        pivot.rotation.x = -Math.PI / 2 + 0.0; ang = 0.6;
        btns.forEach((b, k) => b.setAttribute('aria-pressed', k === i)); note.textContent = PARTS[i].note;
        draw();
      };
      const draw = () => { mat.color.set(accent()); if (edges) edges.material.color.set(getComputedStyle(el).color); pivot.rotation.z = ang; renderer.render(scene, cam); };
      const loop = () => { if (running || reduce) return; running = true; last = performance.now();
        const f = (t) => { if (disposed || !visible || !el.isConnected) { running = false; return; } ang += (t - last) * 0.0006; last = t; draw(); requestAnimationFrame(f); };
        requestAnimationFrame(f); };
      three = { show, loop };
      await show(0); if (visible) loop();
      cleanup3 = () => { ro.disconnect(); geos.forEach(g => g && g.dispose()); mat.dispose(); renderer.dispose(); renderer.domElement.remove(); };
    } catch (e) { console.warn('workbench viewer', e); stage.insertAdjacentHTML('afterbegin', '<p style="padding:16px;margin:0;font:12px var(--font-mono);color:var(--ink-muted)">3D viewer needs network access (three.js from jsDelivr).</p>'); }
  })();
  start();

  return () => { disposed = true; cancelAnimationFrame(raf); io.disconnect(); cleanup3(); el.remove(); style.remove(); };
}
