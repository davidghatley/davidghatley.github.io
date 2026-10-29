// Shared three.js turntable for rack10 (preview.js and case.js). Binary or ASCII STL, no import map needed.
const CDN = 'https://cdn.jsdelivr.net/npm/three@0.170.0/';
let libP;
export function loadLib() {
  return libP || (libP = (async () => {
    const T = await import(CDN + 'build/three.module.js');
    const src = await (await fetch(CDN + 'examples/jsm/loaders/STLLoader.js')).text();
    const blob = URL.createObjectURL(new Blob([src.replace(/from\s+['"]three['"]/, `from '${CDN}build/three.module.js'`)], { type: 'text/javascript' }));
    const { STLLoader } = await import(blob); URL.revokeObjectURL(blob);
    return { T, STLLoader };
  })());
}
// o: { url(file) -> string, items:[{f,label,note}], el (element carrying --a), reduce, autoMs, speed, onShow(i, dims, item), onInteract() }
export async function createViewer(stage, o) {
  const { T, STLLoader } = await loadLib();
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  stage.insertBefore(renderer.domElement, stage.firstChild);
  renderer.domElement.style.touchAction = 'pan-y';
  renderer.domElement.style.cursor = 'grab';
  const scene = new T.Scene(), cam = new T.PerspectiveCamera(35, 1, 0.1, 8000);
  scene.add(new T.HemisphereLight(0xffffff, 0x777777, 1.1));
  const dl = new T.DirectionalLight(0xffffff, 1.6); dl.position.set(1, 1.4, 1.2); scene.add(dl);
  const css = () => getComputedStyle(o.el);
  const accent = () => css().getPropertyValue('--a').trim() || '#a5562b';
  const mat = new T.MeshLambertMaterial({ color: accent(), flatShading: true });
  const pivot = new T.Group(); scene.add(pivot);
  const loader = new STLLoader(), geos = [];
  let mesh, edges, ang = 0.6, tilt = 0, cur = -1, visible = true, disposed = false, running = false, spinning = !o.reduce, advTimer = 0, last = 0, touched = false;
  const size = () => { const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); fit(); draw(); };
  let rad = 1, dims = null;
  // fit the rotating model (a cylinder about its Z axis) with 8% margin for the pane's real aspect
  const fit = () => {
    const v = new T.Vector3(0.45, 0.35, 0.85).normalize(), el = Math.asin(v.y);
    let R = rad, hz = rad;
    if (dims) { R = Math.hypot(dims[0], dims[1]) / 2; hz = dims[2] / 2; }
    const ph = hz * Math.cos(el) + R * Math.sin(el), tv = Math.tan(cam.fov * Math.PI / 360), th = tv * cam.aspect;
    const d = (Math.max(ph / tv, R / th) + R) * 1.08;
    cam.position.copy(v.multiplyScalar(d)); cam.lookAt(0, 0, 0);
  };
  const draw = () => { mat.color.set(accent()); if (edges) edges.material.color.set(css().color); pivot.rotation.x = -Math.PI / 2 + tilt; pivot.rotation.z = ang; renderer.render(scene, cam); };
  const ro = new ResizeObserver(size); ro.observe(stage);
  const load = i => new Promise((res, rej) => { if (geos[i]) return res(geos[i]); loader.load(o.url(o.items[i].f), g => { g.computeVertexNormals(); g.center(); geos[i] = g; res(g); }, undefined, rej); });
  async function show(i) {
    const g = await load(i); if (disposed) return; cur = i;
    if (mesh) { pivot.remove(mesh, edges); edges.geometry.dispose(); edges.material.dispose(); }
    mesh = new T.Mesh(g, mat); pivot.add(mesh);
    edges = new T.LineSegments(new T.EdgesGeometry(g, 35), new T.LineBasicMaterial({ color: css().color })); pivot.add(edges);
    g.computeBoundingSphere(); g.computeBoundingBox(); rad = g.boundingSphere.radius;
    const b = g.boundingBox.getSize(new T.Vector3()); dims = [b.x, b.y, b.z];
    ang = 0.6; tilt = 0; size(); fit(); draw();
    o.onShow && o.onShow(i, [b.x, b.y, b.z], o.items[i]);
  }
  const loop = () => {
    if (running || !visible || document.hidden) return; running = true; last = performance.now();
    const f = t => { if (disposed || !visible || document.hidden || !stage.isConnected) { running = false; return; } if (spinning) ang += (t - last) * (o.speed || 0.0006); last = t; draw(); requestAnimationFrame(f); };
    requestAnimationFrame(f);
  };
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) { loop(); arm(); } else clearTimeout(advTimer); }, { threshold: 0.05 });
  io.observe(stage);
  const onVis = () => { if (!document.hidden) loop(); };
  document.addEventListener('visibilitychange', onVis);
  function arm() { clearTimeout(advTimer); if (!o.autoMs || o.reduce || touched || disposed || !visible) return; advTimer = setTimeout(async () => { await show((cur + 1) % o.items.length); arm(); }, o.autoMs); }
  function interact() { if (touched) return; touched = true; clearTimeout(advTimer); o.onInteract && o.onInteract(); }
  // drag to orbit
  const cv = renderer.domElement; let drag = null;
  const pd = e => { drag = { x: e.clientX, y: e.clientY, a: ang, t: tilt, moved: false }; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; };
  const pm = e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 3 && !drag.moved) { drag.moved = true; spinning = false; interact(); } if (drag.moved) { ang = drag.a + dx * 0.01; tilt = Math.max(-0.4, Math.min(0.4, drag.t + dy * 0.008)); draw(); } };
  const pu = () => { drag = null; cv.style.cursor = 'grab'; };
  cv.addEventListener('pointerdown', pd); cv.addEventListener('pointermove', pm); cv.addEventListener('pointerup', pu); cv.addEventListener('pointercancel', pu);
  cv.addEventListener('click', () => interact());
  await show(0); loop(); arm();
  return {
    show: i => { interact(); return show(i); },
    stopAuto: interact,
    dispose() { disposed = true; clearTimeout(advTimer); io.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', onVis); geos.forEach(g => g && g.dispose()); mat.dispose(); renderer.dispose(); cv.remove(); },
  };
}
