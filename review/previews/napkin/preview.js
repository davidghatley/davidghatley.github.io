const FR = [
  ['canvas-overview.png','canvas','40 components laid out as variant frames on one canvas'],
  ['canvas-inspector.png','canvas','select a layer: measured handles, flex layout, fill and stroke in the inspector'],
  ['radius-edit.gif','canvas + code','change Radius in the inspector, the .tsx file on disk follows','radius-edit-still.png'],
  ['canvas-code.png','files','the Code tray shows the real Button.tsx; click a line to select its node'],
  ['components-inspect.png','components','Inspect lists declared CSS per property, with a Copy usage snippet'],
  ['agents-activity.png','agents ui','Activity feed of agent file events, filterable to agents only'],
  ['history-timeline.png','history','a revision timeline with undo, redo and restore to the live component'],
  ['layout-panel.png','layout','Direction, gap and padding controls with the size row: hug, fill, fixed']
];
const W = 640, H = 400, GX = 120, GY = 150, COLS = 4;
export default function mount(root, { mode, base }) {
  const hero = mode === 'hero';
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const st = document.createElement('style');
  st.textContent = `
.pv-napkin{position:relative;height:${hero ? 'min(80vh,760px)' : '460px'};background:var(--sheet);border:1px solid var(--ink);overflow:hidden;font-family:var(--font-mono);color:var(--ink);touch-action:none;cursor:grab;user-select:none;
 background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect x='11' y='11' width='2' height='2' fill='%23888' fill-opacity='.45'/%3E%3C/svg%3E")}
.pv-napkin.drag{cursor:grabbing}
.pv-napkin .w{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform}
.pv-napkin .w.an{transition:transform .5s cubic-bezier(.3,.7,.2,1)}
.pv-napkin .f{position:absolute;width:${W}px}
.pv-napkin .h{display:flex;align-items:baseline;gap:12px;height:44px;white-space:nowrap}
.pv-napkin .n{font:400 32px/1 var(--font-pixel);color:var(--napkin-a)}
.pv-napkin .t{font:600 13px/1 var(--font-mono);letter-spacing:.1em;text-transform:uppercase}
.pv-napkin .i{display:block;width:${W}px;height:${H}px;object-fit:contain;background:#121417;border:1px solid var(--ink);cursor:zoom-in}
.pv-napkin .f.on .i{outline:3px solid var(--napkin-a);outline-offset:3px;cursor:zoom-out}
.pv-napkin .c{margin:10px 0 0;font:400 14px/20px var(--font-sans);color:var(--ink-muted);max-width:${W}px;white-space:normal}
.pv-napkin .ui{position:absolute;display:flex;gap:6px;align-items:center;z-index:2}
.pv-napkin .tl{left:10px;top:10px}.pv-napkin .br{right:10px;bottom:10px}
.pv-napkin button{font:600 12px/1 var(--font-mono);letter-spacing:.08em;text-transform:uppercase;min-width:36px;height:36px;padding:0 10px;background:var(--sheet);color:var(--ink);border:1px solid var(--ink);border-radius:0;cursor:pointer}
.pv-napkin button:hover,.pv-napkin button:focus-visible{background:var(--napkin-a);color:var(--napkin-on);outline:none}
.pv-napkin .z{font:400 16px/36px var(--font-pixel);padding:0 10px;background:var(--sheet);border:1px solid var(--ink);height:36px;min-width:72px;text-align:center}
.pv-napkin .hint{font:500 11px/16px var(--font-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-muted);background:var(--sheet);padding:2px 6px}`;
  document.head.appendChild(st);
  const cs = getComputedStyle(document.documentElement);
  const th = document.documentElement.dataset.theme, dark = th === 'dark' || (th !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  const el = document.createElement('div'); el.className = 'pv-napkin'; el.tabIndex = 0;
  el.style.setProperty('--napkin-a', dark ? '#8ea0ff' : '#2236b0'); el.style.setProperty('--napkin-on', dark ? '#121417' : '#f9f9f5');
  const world = document.createElement('div'); world.className = 'w'; el.appendChild(world);
  const frames = FR.map((d, i) => {
    const f = document.createElement('figure'); f.className = 'f'; f.style.margin = 0;
    const x = (i % COLS) * (W + GX), y = Math.floor(i / COLS) * (H + GY + 90);
    f.style.left = x + 'px'; f.style.top = y + 'px';
    const src = rm && d[3] ? d[3] : d[0];
    f.innerHTML = `<div class="h"><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="t">${d[1]}</span></div><img class="i" draggable="false" loading="lazy" alt="napkin ${d[1]}: ${d[2]}" src="${base}public/media/napkin/${src}"><figcaption class="c">${d[2]}</figcaption>`;
    world.appendChild(f); return { f, x, y, h: H + 44 + 70 };
  });
  const rows = Math.ceil(FR.length / COLS), WW = COLS * W + (COLS - 1) * GX, WH = rows * (H + GY + 90) - GY;
  const ui = document.createElement('div'); ui.className = 'ui tl';
  ui.innerHTML = '<button data-a="fit" title="Fit all">Fit</button><button data-a="l" aria-label="Pan left">&larr;</button><button data-a="u" aria-label="Pan up">&uarr;</button><button data-a="d" aria-label="Pan down">&darr;</button><button data-a="r" aria-label="Pan right">&rarr;</button>';
  const br = document.createElement('div'); br.className = 'ui br'; br.innerHTML = '<span class="hint">drag to pan · click a frame to zoom</span><span class="z">100%</span>';
  el.append(ui, br); root.appendChild(el);
  const zl = br.querySelector('.z');
  let s = 1, tx = 0, ty = 0, cur = -1;
  const apply = (an) => { world.classList.toggle('an', !!an && !rm); world.style.transform = `translate(${tx}px,${ty}px) scale(${s})`; zl.textContent = Math.round(s * 100) + '%'; };
  const box = () => el.getBoundingClientRect();
  const fitRect = (x, y, w, h, pad = 40) => { const b = box(); s = Math.min((b.width - pad * 2) / w, (b.height - pad * 2) / h); tx = (b.width - w * s) / 2 - x * s; ty = (b.height - h * s) / 2 - y * s; };
  const focus = (i, an = true) => { cur = i; frames.forEach((q, j) => q.f.classList.toggle('on', j === i)); const q = frames[i]; fitRect(q.x, q.y, W, q.h, hero ? 36 : 30); apply(an); };
  const fit = (an = true) => { cur = -1; frames.forEach(q => q.f.classList.remove('on')); fitRect(0, 0, WW, WH, 30); apply(an); };
  const start = () => { const b = box(); s = hero ? .62 : .5; s = Math.min(s, (b.width - 40) / (W * 2 + GX)); tx = 20; ty = 72; apply(false); };
  start();
  let drag = null, moved = 0;
  const down = e => { if (e.target.closest('.ui')) return; drag = { x: e.clientX, y: e.clientY, tx, ty }; moved = 0; el.setPointerCapture(e.pointerId); el.classList.add('drag'); };
  const move = e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; moved = Math.max(moved, Math.abs(dx) + Math.abs(dy)); if (moved > 4) { tx = drag.tx + dx; ty = drag.ty + dy; apply(false); } };
  const up = e => { if (!drag) return; el.classList.remove('drag'); const was = moved > 4; drag = null; if (!was) { const f = document.elementFromPoint(e.clientX, e.clientY)?.closest('.f'); if (f) { const i = frames.findIndex(q => q.f === f); i === cur ? fit() : focus(i); } } };
  const wheel = e => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); const b = box(), mx = e.clientX - b.left, my = e.clientY - b.top, k = Math.exp(-e.deltaY * .0015), ns = Math.min(2, Math.max(.15, s * k)); tx = mx - (mx - tx) * ns / s; ty = my - (my - ty) * ns / s; s = ns; apply(false); };
  const pan = a => { const d = 160; if (a === 'l') tx += d; if (a === 'r') tx -= d; if (a === 'u') ty += d; if (a === 'd') ty -= d; apply(true); };
  ui.addEventListener('click', e => { const a = e.target.closest('button')?.dataset.a; if (!a) return; a === 'fit' ? fit() : pan(a); });
  const key = e => { const m = { ArrowLeft: 'l', ArrowRight: 'r', ArrowUp: 'u', ArrowDown: 'd' }[e.key]; if (m) { e.preventDefault(); pan(m); } else if (e.key === 'Escape') fit(); };
  el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('wheel', wheel, { passive: false }); el.addEventListener('keydown', key);
  const ro = new ResizeObserver(() => { cur >= 0 ? focus(cur, false) : null; }); ro.observe(el);
  return () => { ro.disconnect(); el.remove(); st.remove(); };
}
