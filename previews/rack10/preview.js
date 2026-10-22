const CSS = `
.pv-rack10{--a:#2f8f9d;--at:#1d6c77;font:400 13px/18px var(--font-mono);color:var(--ink)}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .pv-rack10{--a:#3fb0bd;--at:#3fb0bd}}
:root[data-theme=dark] .pv-rack10{--a:#3fb0bd;--at:#3fb0bd}
.pv-rack10 .board{display:grid;grid-template-columns:1.25fr 1fr;gap:16px}
.pv-rack10 .tool{background:var(--sheet);border:1px solid var(--rule);padding:12px 14px 14px;min-width:0;display:flex;flex-direction:column}
.pv-rack10 h4{margin:0 0 2px;font:600 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--at)}
.pv-rack10 .sub{font:400 12px/16px var(--font-mono);color:var(--ink-muted);margin-bottom:10px}
.pv-rack10 .stage{height:320px;position:relative;border:1px solid var(--rule-faint);background:var(--paper)}
.pv-rack10.hero .stage{height:min(54vh,480px)}
.pv-rack10 canvas{display:block;width:100%;height:100%}
.pv-rack10 .pick{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.pv-rack10 button{font:500 11px/16px var(--font-mono);padding:3px 8px;background:transparent;color:var(--ink);border:1px solid var(--rule);cursor:pointer;border-radius:0}
.pv-rack10 button[aria-pressed=true]{background:var(--a);color:#16181d;border-color:var(--a)}
.pv-rack10 button:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
.pv-rack10 .note{font:400 11px/16px var(--font-mono);color:var(--ink-muted);margin-top:auto;padding-top:8px}
.pv-rack10 .dim{position:absolute;left:8px;right:8px;bottom:6px;height:16px;border-left:1px solid var(--ink-muted);border-right:1px solid var(--ink-muted);display:flex;align-items:center;font:400 10px/12px var(--font-mono);color:var(--ink-muted)}
.pv-rack10 .dim:before,.pv-rack10 .dim:after{content:"";flex:1;border-top:1px solid var(--ink-muted)}
.pv-rack10 .dim span{padding:0 6px;background:var(--paper)}
.pv-rack10 .imgs{display:grid;grid-template-columns:1fr 1fr;gap:10px;flex:1;min-height:0}
.pv-rack10 .imgs figure{margin:0;display:flex;flex-direction:column;min-width:0}
.pv-rack10 .imgs .fr{flex:1;border:1px solid var(--rule-faint);background:#f9f9f5;display:flex;align-items:center;justify-content:center;height:320px}
.pv-rack10.hero .imgs .fr{height:min(54vh,480px)}
.pv-rack10 .imgs img{max-width:100%;max-height:100%;object-fit:contain;display:block}
.pv-rack10 .imgs figcaption{font:400 11px/16px var(--font-mono);color:var(--ink-muted);margin-top:6px}
@media(max-width:820px){.pv-rack10 .board{grid-template-columns:1fr}.pv-rack10 .stage{height:260px}.pv-rack10 .imgs .fr{height:240px}}
`;
const PARTS = [
  { f: 'wall_front_L.stl', label: 'wall_front_L', note: 'Front wall half: dovetail tabs at the mid-depth seam, tongue-in-groove for trays.' },
  { f: 'crossbar_L.stl', label: 'crossbar_L', note: 'Crossbar: the neck sits in wall notches, the head outside, shoulder inside; sets wall spacing.' },
  { f: 'bowtie_key.stl', label: 'bowtie_key', note: 'Bowtie key: press fit with a stop flange, at the front column of every level seam.' },
  { f: 'tray_front_L.stl', label: 'tray_front_L', note: 'Tray half: slides in on tongues at any U; the halves join by dovetail.' },
];

export default function mount(root, { mode, base }) {
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const el = document.createElement('div'); el.className = 'pv-rack10 ' + mode; root.appendChild(el);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const M = base + 'public/media/rack10/';
  el.innerHTML = `<div class="board">
  <section class="tool"><h4>rack 10 / STL turntable</h4><div class="sub">real parts, OpenSCAD to STL</div>
    <div class="stage"><div class="dim"><span class="dv"></span></div></div><div class="pick"></div><div class="note"></div></section>
  <section class="tool"><h4>assembled / exploded</h4><div class="sub">254 W x 336 D mm outer, 4U per level</div>
    <div class="imgs"><figure><div class="fr"><img src="${M}assembly.jpg" alt="Assembled rack render"></div><figcaption>assembled</figcaption></figure>
    <figure><div class="fr"><img src="${M}exploded.jpg" alt="Exploded view of the rack parts"></div><figcaption>exploded</figcaption></figure></div></section></div>`;

  const stage = el.querySelector('.stage'), pick = el.querySelector('.pick'), note = el.querySelector('.note');
  let visible = true, disposed = false, three, renderer, cleanup3 = () => {};
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && three) three.loop(); }, { threshold: 0.05 });
  io.observe(el);
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
      const size = () => { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); if (three) draw(); };
      const ro = new ResizeObserver(size); ro.observe(stage); size();
      let mesh, edges, ang = 0, last = 0, running = false;
      const load = (i) => new Promise((res, rej) => { if (geos[i]) return res(geos[i]); loader.load(M + PARTS[i].f, gm => { gm.computeVertexNormals(); gm.center(); geos[i] = gm; res(gm); }, undefined, rej); });
      const show = async (i) => {
        const gm = await load(i); if (disposed) return;
        if (mesh) { pivot.remove(mesh, edges); edges.geometry.dispose(); }
        mesh = new T.Mesh(gm, mat); pivot.add(mesh);
        edges = new T.LineSegments(new T.EdgesGeometry(gm, 35), new T.LineBasicMaterial({ color: getComputedStyle(el).color })); pivot.add(edges);
        gm.computeBoundingSphere(); gm.computeBoundingBox(); const bb = gm.boundingBox.getSize(new T.Vector3());
        stage.querySelector('.dv').textContent = bb.x.toFixed(1) + ' x ' + bb.y.toFixed(1) + ' x ' + bb.z.toFixed(1) + ' mm';
        const r = gm.boundingSphere.radius, d = r / Math.sin(cam.fov * Math.PI / 360) / Math.min(1, cam.aspect) * 1.2;
        cam.position.set(d * 0.45, d * 0.35, d * 0.85); cam.lookAt(0, 0, 0);
        pivot.rotation.x = -Math.PI / 2; ang = 0.6;
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
    } catch (e) { console.warn('rack10 viewer', e); stage.insertAdjacentHTML('afterbegin', '<p style="padding:16px;margin:0;font:12px var(--font-mono);color:var(--ink-muted)">3D viewer needs network access (three.js from jsDelivr).</p>'); }
  })();

  return () => { disposed = true; io.disconnect(); cleanup3(); el.remove(); style.remove(); };
}
