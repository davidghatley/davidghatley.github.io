const CSS = `
.pv-rack10{--a:#a5562b;--at:#a5562b;font:400 13px/18px var(--font-mono);color:var(--ink)}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .pv-rack10{--a:#e3925f;--at:#e3925f}}
:root[data-theme=dark] .pv-rack10{--a:#e3925f;--at:#e3925f}
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
.pv-rack10.hero .imgs .fr{height:min(54vh,480px)}
.pv-rack10 .pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pv-rack10 .pair .stage{height:320px}
.pv-rack10.hero .pair .stage{height:min(54vh,480px)}
.pv-rack10 .cap{position:absolute;left:8px;top:6px;font:500 11px/16px var(--font-mono);color:var(--ink);letter-spacing:.04em;pointer-events:none}
.pv-rack10 .cap i{font-style:normal;color:var(--at)}
.pv-rack10 .pick button{padding:2px 6px;font-size:10px;line-height:14px}
.pv-rack10 .hint{font:400 10px/14px var(--font-mono);color:var(--ink-muted);margin-top:6px}
@media(max-width:820px){.pv-rack10 .board{grid-template-columns:1fr}.pv-rack10 .stage{height:260px}`;
export const PARTS = [
  { f: 'wall_front_L.stl', label: 'wall_front_L', note: 'Front wall half: dovetail tabs at the mid-depth seam, tongue-in-groove for trays.' },
  { f: 'wall_rear_L.stl', label: 'wall_rear_L', note: 'Rear wall half: joins its front half by dovetail tabs at the mid-depth seam.' },
  { f: 'crossbar_L.stl', label: 'crossbar_L', note: 'Crossbar: the neck sits in wall notches, head outside, shoulder inside; it sets wall spacing.' },
  { f: 'bowtie_key.stl', label: 'bowtie_key', note: 'Bowtie key: press fit with a stop flange, at the front column of every level seam.' },
  { f: 'foot.stl', label: 'foot', note: 'Foot: sits in a foot channel under each wall, held by gravity.' },
  { f: 'tray_front_L.stl', label: 'tray_front_L', note: 'Tray half: slides in at any U on tongues; halves join by dovetail.' },
  { f: 'hdd_bay_L.stl', label: 'hdd_bay_L', note: 'Drive bay half: 7 x 3.5 inch drives on edge, SATA to the rear, 3U.' },
  { f: 'psu_atx_L.stl', label: 'psu_atx_L', note: 'ATX power supply cradle half (150 x 140), 2 to 3U.' },
  { f: 'tiny_m75q_LF.stl', label: 'tiny_m75q_LF', note: 'Cradle piece for a Lenovo M75q Tiny (179 x 183), 1U, 4 pieces.' },
  { f: 'z2mini_LF.stl', label: 'z2mini_LF', note: 'Cradle piece for an HP Z2 Mini G5 (216 x 216), 2U, 4 pieces.' },
  { f: 'carrier_o7050_FL.stl', label: 'carrier_o7050_FL', note: 'One of 4 pieces of the Dell 7050 SFF blade carrier; board data is an estimate until measured.' },
  { f: 'push_pin.stl', label: 'push_pin', note: 'Push pin: double-ended standoff that mounts boards without screws.' },
  { f: 'coupon_male.stl', label: 'coupon_male', note: 'Fit coupon, male plate: print it first.' },
  { f: 'coupon_female.stl', label: 'coupon_female', note: 'Fit coupon, female plate: socket, pocket and slot at 0.10, 0.15, 0.20 and 0.25 mm.' },
];
export const MODELS = [
  { f: 'assembled.stl', label: 'assembled', note: '8U assembly (2 levels) from assembly.scad, EXPLODE = 0.' },
  { f: 'exploded.stl', label: 'exploded', note: 'The same 8U assembly with EXPLODE = 40.' },
];
import { createViewer } from './viewer.js';

// stepped label: reveal in chunks, instant under reduced motion
export function stepText(node, text, reduce, timers) {
  timers.forEach(clearTimeout); timers.length = 0;
  if (reduce) { node.textContent = text; return; }
  const n = Math.ceil(text.length / 4);
  for (let k = 1; k <= n; k++) timers.push(setTimeout(() => { node.textContent = text.slice(0, k * 4); }, k * 45));
}

export default function mount(root, { mode, base }) {
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const el = document.createElement('div'); el.className = 'pv-rack10 ' + mode; root.appendChild(el);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const M = base + 'public/media/rack10/';
  el.innerHTML = `<div class="board">
  <section class="tool"><h4>rack10 / parts turntable</h4><div class="sub">14 real parts, OpenSCAD to STL</div>
    <div class="stage"><div class="cap"></div><div class="dim"><span class="dv"></span></div></div><div class="pick"></div><div class="note"></div><div class="hint"></div></section>
  <section class="tool"><h4>rack10 / assembled + exploded</h4><div class="sub">8U, two levels, 254 W x 336 D mm outer</div>
    <div class="pair"><div class="stage" data-m="0"><div class="cap"></div></div><div class="stage" data-m="1"><div class="cap"></div></div></div>
    <div class="hint">drag to orbit</div></section></div>`;
  const stage = el.querySelector('.stage'), pick = el.querySelector('.pick'), note = el.querySelector('.note'), cap = el.querySelector('.cap'), dv = el.querySelector('.dv'), hint = el.querySelector('.hint');
  const timers = []; let disposed = false; const vs = [];
  hint.textContent = reduce ? 'pick a part' : 'auto-cycling; pick or drag to take over';
  const btns = PARTS.map((p, i) => { const b = document.createElement('button'); b.textContent = p.label; b.setAttribute('aria-pressed', i === 0); b.onclick = () => vs[0] && vs[0].show(i); pick.appendChild(b); return b; });
  note.textContent = PARTS[0].note;
  const fail = (st, e) => { console.warn('rack10 viewer', e); st.insertAdjacentHTML('afterbegin', '<p style="padding:16px;margin:0;font:12px var(--font-mono);color:var(--ink-muted)">3D viewer needs network access (three.js from jsDelivr).</p>'); };
  createViewer(stage, {
    url: f => M + f, items: PARTS, el, reduce, autoMs: reduce ? 0 : 3500,
    onInteract: () => { hint.textContent = 'manual'; },
    onShow: (i, d, it) => {
      btns.forEach((b, k) => b.setAttribute('aria-pressed', k === i));
      stepText(cap, String(i + 1).padStart(2, '0') + '/' + PARTS.length + '  ' + it.label, reduce, timers);
      dv.textContent = d.map(x => x.toFixed(1)).join(' x ') + ' mm'; note.textContent = it.note;
    },
  }).then(v => { if (disposed) v.dispose(); else vs[0] = v; }).catch(e => fail(stage, e));
  el.querySelectorAll('.pair .stage').forEach(st => {
    const m = MODELS[+st.dataset.m], c = st.querySelector('.cap');
    createViewer(st, { url: f => M + f, items: [m], el, reduce, speed: 0.0005, onShow: () => { c.textContent = m.label; } })
      .then(v => { if (disposed) v.dispose(); else vs.push(v); }).catch(e => fail(st, e));
  });
  return () => { disposed = true; timers.forEach(clearTimeout); vs.forEach(v => v.dispose()); el.remove(); style.remove(); };
}
