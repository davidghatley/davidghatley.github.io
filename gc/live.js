function mountGC(root) {
const D = __DATA__;
const P = D.P;
const stage = root.querySelector("[data-gc]");
const svg = stage.querySelector("svg");
const $ = (sel) => svg.querySelector(sel);
const $$ = (sel) => [...svg.querySelectorAll(sel)];
const readout = root.querySelector("[data-readout]");
const status = stage.querySelector("[data-status]");
const nameLine = root.querySelector("[data-gc-name]");
const injectBtn = root.querySelector("[data-inject]");
const methodBtns = [...root.querySelectorAll("[data-method]")];
const still = matchMedia("(prefers-reduced-motion: reduce)");
const g = D.G;

const el = {
  items: $$(".gc-items > .it").map((node, index) => ({ node, index, k: Number(node.dataset.k), piece: node.dataset.p ?? null, inner: "inner" in node.dataset })),
  layer: $(".gc-items"),
  needleMove: $('[data-part="needle-move"]'),
  rodMove: $('[data-part="rod-move"]'),
  fan: $('[data-part="fan"]'),
  needle: $('[data-part="needle"]'),
  pointer: $('[data-part="pointer"]'),
  knurl: $('[data-part="knurl"]'),
  lcdT: $('[data-part="lcd-t"]'),
  lcdM: $('[data-part="lcd-m"]'),
  tag: $('[data-part="tag"]'),
  tagPeak: $('[data-part="tag-peak"]'),
  tagBack: $('[data-part="tag-back"]'),
  tagText: $('[data-part="tag-text"]'),
  clip: { dro: $('[data-clip="dro"]'), haa: $('[data-clip="haa"]') },
  sheet: { dro: $('[data-sheet="dro"]'), haa: $('[data-sheet="haa"]') },
  ink: { dro: $('[data-sheet="dro"] .gc-ink'), haa: $('[data-sheet="haa"] .gc-ink') },
  bug: { dro: $('[data-bug="dro"]'), haa: $('[data-bug="haa"]') },
  turns: [$$('[data-ch="0"]'), $$('[data-ch="1"]')],
  tails: [$$('[data-tail="0"]'), $$('[data-tail="1"]')],
  nut: $('[data-part="nut"]'),
  flap: $('[data-part="flap"]'),
  plungerHead: $('[data-part="plunger-head"]'),
  vapour: $('[data-part="vapour"]'),
  stem: { inlet: $('[data-stem="inlet"]'), fid: $('[data-stem="fid"]'), ecd: $('[data-stem="ecd"]') },
  seg: [{ in: $$('[data-tail="0"][data-seg="in"]'), out: $$('[data-tail="0"][data-seg="out"]') }, { in: $$('[data-tail="1"][data-seg="in"]'), out: $$('[data-tail="1"][data-seg="out"]') }],
  carriage: $$('[data-name="pen.bush"],[data-name="pen.post"]'),
  pen: $$('[data-name="pen.slider"],[data-name="pen.tip"]'),
  detector: { dro: $$('[data-name^="fid"]'), haa: $$('[data-name^="ecd"]') },
  coil: [$$('[data-name="coil0"]'), $$('[data-name="coil1"]')],
  lamp: Object.fromEntries(["ready", "run", "fid", "ecd"].map((n) => [n, $$(`[data-lamp="${n}"]`)])),
  labels: $$("[data-for]"),
  zoom: root.querySelector(".gc-zoom"),
  zu: { dro: root.querySelector('[data-z="dro"]'), haa: root.querySelector('[data-z="haa"]') },
};
const VIEW = (() => {
  const a = ((P.azimuth ?? 45) * Math.PI) / 180;
  const e = ((P.elevation ?? 30) * Math.PI) / 180;
  return [Math.cos(a) * Math.cos(e), Math.sin(a) * Math.cos(e), Math.sin(e)];
})();
const LIFT = Object.fromEntries(Object.entries(D.MOVES).map(([name, v]) => [name, v[0] * VIEW[0] + v[1] * VIEW[1] + v[2] * VIEW[2]]));
const shares = { sampler: 0, plunger: 0, tray: 0, swap: 0, gate: 0 };
let order = el.items.slice();
function placePieces() {
  const tr = {};
  for (const name in shares) {
    const m = D.MOVES[name];
    const v = shares[name];
    tr[name] = translateAlong(P, [m[0] * v, m[1] * v, m[2] * v]);
  }
  for (const item of el.items) {
    if (!item.piece) continue;
    if (item.inner) continue;
    item.node.setAttribute("transform", tr[item.piece]);
  }
  el.needleMove.setAttribute("transform", tr.sampler);
  const relative = D.MOVES.plunger[2] * (shares.plunger - shares.sampler);
  el.rodMove.setAttribute("transform", translateAlong(P, [0, 0, relative]));
  const next = el.items.slice().sort((a, b) => a.k + (a.piece ? LIFT[a.piece] * shares[a.piece] : 0) - (b.k + (b.piece ? LIFT[b.piece] * shares[b.piece] : 0)) || a.index - b.index);
  let same = true;
  for (let i = 0; i < next.length; i++) if (next[i] !== order[i]) { same = false; break; }
  if (!same) {
    const frag = document.createDocumentFragment();
    next.forEach((item) => frag.appendChild(item.node));
    el.layer.appendChild(frag);
    order = next;
  }
}

const SVGNS = "http://www.w3.org/2000/svg";
const packetLayer = $('[data-part="packets"]');
const PACKETS = Array.from({ length: 9 }, () => {
  const c = document.createElementNS(SVGNS, "circle");
  c.setAttribute("class", "gc-packet");
  c.setAttribute("r", "0");
  packetLayer.appendChild(c);
  return c;
});
const RING = document.createElementNS(SVGNS, "circle");
RING.setAttribute("class", "gc-ring");
RING.setAttribute("opacity", "0");
packetLayer.appendChild(RING);
const FLOW = Object.fromEntries(Object.entries(D.FLOWS).map(([id, pts]) => {
  const at = [0];
  for (let i = 1; i < pts.length; i++) at.push(at[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  pts.lengths = at;
  return [id, pts];
}));
function pointOn(pts, u) {
  const L = pts.lengths;
  const d = u * L[L.length - 1];
  let i = 1;
  while (i < L.length - 1 && L[i] < d) i++;
  const f = (d - L[i - 1]) / (L[i] - L[i - 1] || 1);
  return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f];
}
const plotW = g.PLOT.x1 - g.PLOT.x0;
const uOf = (id, t) => g.PLOT.x0 + (t / METHODS[id].end) * plotW;
const clipX = g.PLOT.x0 - 3;
const KNOB_ANGLE = { dro: -45, haa: 45 };
const CHANNEL = { dro: 0, haa: 1 };
const eu = g.eu;

const s = {
  m: "dro",
  swap: 0,
  knob: -45,
  stroke: null, // seconds since Inject
  t: null, // run minutes, null when no run
  T: 40,
  penT: METHODS.dro.end,
  penS: 0,
  drawn: { dro: METHODS.dro.end, haa: METHODS.haa.end },
  next: null,
  flap: 0,
  arrived: null,
  inkFade: 1,
  lit: { x: 1, v: 0 },
  sig: { x: 0, v: 0 },
  cool: null,
  fan: 0,
  picked: null,
  phase: "ready",
  clock: 0,
};

const setOn = (nodes, on, attr = "data-on") => nodes.forEach((n) => (on ? n.setAttribute(attr, "") : n.removeAttribute(attr)));
const move = (nodes, by) => {
  const tr = translateAlong(P, by);
  nodes.forEach((n) => n.setAttribute("transform", tr));
};
const follow = (x, target, dt, tau, calm) => (calm ? target : x + (target - x) * (1 - Math.exp(-dt / tau)));

function methodLine(id) {
  const m = METHODS[id];
  return id === "dro"
    ? `8015-style DRO/ORO on FID, vendor conditions. Composite: n-alkane ladder, diesel and oil humps, o-terphenyl surrogate. Oven ${programText(id)}.`
    : `EPA 552.3 on ECD. Ten analyte esters (nine haloacetic acids and dalapon), surrogate and internal standard. Oven ${programText(id)}.`;
}
function pickText(id, p) {
  const temp = Math.round(METHODS[id].temp(p.t));
  return `${p.code}: ${p.name}. Elutes at ${timeText(p)} min, oven ${p.approx ? "about " : ""}${temp} °C.${p.approx ? " Modelled time." : ""}`;
}

function say(text) {
  if (readout.textContent !== text) readout.textContent = text;
}
function announce(text) {
  if (status.textContent !== text) status.textContent = text;
}

// ---------- knurl, rebuilt while the knob turns ----------
let lastKnurl = null;
function drawKnurl(deg) {
  const phase = (((deg % 9) + 9) % 9) * (Math.PI / 180);
  if (lastKnurl !== null && Math.abs(phase - lastKnurl) < 1e-3) return;
  lastKnurl = phase;
  const buckets = new Map();
  const { x, z } = g.KNOB;
  const y = g.ky;
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2 + phase;
    const nx = Math.cos(a);
    const nz = Math.sin(a);
    const f = nx * VIEW[0] + nz * VIEW[2];
    const al = smooth(0.08, 0.5, f);
    if (al < 0.02) continue;
    const p0 = iso([x + g.knobR * nx, y + 1.8, z + g.knobR * nz], P);
    const p1 = iso([x + g.knobR * nx, y + 7.6, z + g.knobR * nz], P);
    const key = Math.round(al * 20) / 20;
    buckets.set(key, (buckets.get(key) ?? "") + `M${p0[0].toFixed(1)} ${p0[1].toFixed(1)}L${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`);
  }
  let out = "";
  for (const [al, d] of buckets) out += `<path class="iso-line" data-tone="lo" opacity="${al}" d="${d}"/>`;
  el.knurl.innerHTML = out;
}

// ---------- the flame ----------
const canvas = stage.querySelector(".gc-flame");
const FL = D.gl.flame;
const WN = D.gl.win;
const FRAGMENT = `
uniform float uLit;
uniform float uSig;
const vec4 WIN=vec4(${WN.x0.toFixed(1)},${WN.x1.toFixed(1)},${WN.z0.toFixed(1)},${WN.z1.toFixed(1)});
const float FX=${FL.x.toFixed(1)};
const float FY=${FL.y.toFixed(1)};
const float WY=${WN.y1.toFixed(1)};
const float JT=${FL.jetTop.toFixed(1)};
const float CZ=${FL.collector.toFixed(1)};
void main(){
  if(uLit<.002){gl_FragColor=vec4(0.);return;}
  vec2 vb=viewOf(gl_FragCoord.xy);
  vec3 p=onWallY(vb,FY);
  vec3 q=onWallY(vb,WY);
  float px=pixelOf();
  float mask=window(q.x,WIN.x+.35,WIN.y-.35,px)*window(q.z,WIN.z+.35,WIN.w-.35,px);
  float L=(CZ-JT-.6)*mix(.74,1.,uSig);
  float h=p.z-JT;
  float u=clamp(h/L,0.,1.);
  float sway=(noise2(vec2(h*.42,uTime*4.3))-.5)*1.1*u*u;
  float x=abs(p.x-FX+sway);
  float prof=pow(u+.02,.4)*pow(1.-u,.72)*2.5*(1.+.25*uSig);
  float inside=(1.-smoothstep(prof*.62,prof+.22,x))*smoothstep(-.3,.25,h)*(1.-smoothstep(L-1.4,L,h));
  float core=(1.-smoothstep(prof*.12,prof*.62,x))*smoothstep(-.1,.4,h)*(1.-smoothstep(L*.34,L*.72,h));
  float flick=.9+.1*noise2(vec2(uTime*7.,1.7));
  vec3 body=mix(vec3(.16,.42,1.),vec3(.34,.62,1.),u);
  vec3 pale=vec3(.84,.92,1.);
  float a=inside*.86*flick;
  vec3 col=body*a;
  col=mix(col,pale,core*.82);
  a=max(a,core*.82);
  float d=length(vec2(p.x-FX,(h-L*.3)*.85));
  float wash=exp(-d*d/40.)*.2*(1.+.8*uSig)*(1.-smoothstep(5.5,9.,d));
  vec3 wc=vec3(.2,.42,.95)*wash;
  col=col+wc*(1.-a);
  a=a+wash*(1.-a);
  float n=(hash12(gl_FragCoord.xy+fract(uTime*.61)*91.)-.5)/255.;
  vec4 ink=vec4(col+n,a)*mask*uLit;
  ink.rgb=min(ink.rgb,vec3(ink.a));
  gl_FragColor=max(ink,0.);
}`;
const flame = glLayer({ canvas, fragment: FRAGMENT, view: [D.gl.box[2], D.gl.box[3]], camera: D.gl.camera, uniforms: ["uLit", "uSig"], onError: () => {} });
if (flame) stage.dataset.gl = "";

// ---------- drawing ----------
function drawKnob() {
  el.pointer.setAttribute("transform", `rotate(${s.knob.toFixed(2)})`);
  drawKnurl(s.knob);
}
function drawMechanism() {
  const st = s.stroke === null ? { tray: 0, drop: 0, plunger: 0 } : strokeAt(s.stroke);
  const w = swapAt(s.swap);
  shares.tray = st.tray;
  shares.sampler = st.drop;
  shares.plunger = st.drop - (st.plunger * g.PLUNGER) / g.TRAVEL;
  shares.swap = w.shuttle;
  shares.gate = w.gate;
  placePieces();
}
function drawPen() {
  const id = s.m;
  const t = s.penT;
  const u = uOf(id, t);
  const sig = signalAt(id, Math.min(t, METHODS[id].end));
  const v = sig * (g.PLOT.z1 - g.PLOT.z0);
  move(el.carriage, [u - g.u0, 0, 0]);
  move(el.pen, [u - g.u0 + eu[0] * v, eu[1] * v, eu[2] * v]);
  el.clip[id].setAttribute("width", Math.max(0, uOf(id, s.drawn[id]) - clipX).toFixed(2));
  // Printed labels show once their own peak has been drawn; pre-run the sheet stays dim, markers only.
  el.sheet[id].toggleAttribute("data-dim", s.drawn[id] <= 0.02);
  for (const p of METHODS[id].peaks) {
    const label = LABELS[id][p.id];
    if (label) label.toggleAttribute("data-on", p.t <= s.drawn[id]);
  }
  return sig;
}
const LABELS = { dro: {}, haa: Object.fromEntries($$('[data-sheet="haa"] [data-label]').map((n) => [n.dataset.label, n])) };
const lit = [new Set(), new Set()];
function drawBands() {
  const ch = CHANNEL[s.m];
  const count = el.turns[ch].length;
  const next = new Set();
  if (s.t !== null) for (const f of bandsAt(s.m, s.t)) next.add(Math.min(count - 1, Math.floor(f * count)));
  for (const c of [0, 1]) {
    const want = c === ch ? next : new Set();
    for (const i of lit[c]) if (!want.has(i)) el.turns[c][i]?.removeAttribute("data-on");
    for (const i of want) if (!lit[c].has(i)) el.turns[c][i]?.setAttribute("data-on", "");
    lit[c] = want;
  }
}
function drawDial() {
  el.needle.setAttribute("transform", `rotate(${dialAngle(s.T).toFixed(2)})`);
  stage.style.setProperty("--gc-t", Math.max(0, Math.min(1, (s.T - 45) / 300)).toFixed(3));
  el.lcdT.textContent = s.T.toFixed(1);
  el.lcdM.textContent = (s.t ?? 0).toFixed(2);
}
function drawPick() {
  const id = s.m;
  const p = s.picked;
  if (!p) {
    el.tag.setAttribute("data-off", "");
    nameLine.textContent = methodLine(id);
    return;
  }
  el.tag.removeAttribute("data-off");
  // The true shape of this peak, sampled from the model, drawn over the trace.
  const pts = [];
  const span = p.w * 3.2;
  for (let i = 0; i <= 24; i++) {
    const t = p.t - span + (i / 24) * span * 2;
    pts.push(`${uOf(id, t).toFixed(2)} ${(-(g.PLOT.z0 + signalAt(id, t) * (g.PLOT.z1 - g.PLOT.z0))).toFixed(2)}`);
  }
  el.tagPeak.setAttribute("d", `M${pts.join("L")}`);
  const text = `${p.code} ${timeText(p)} min`;
  const width = text.length * 2.2 + 2;
  const u = uOf(id, p.t);
  const flip = u + width + 2 > g.PLOT.x1;
  const x = Math.max(g.PLOT.x0, Math.min(g.PLOT.x1 - width, flip ? u - width - 1 : u + 1));
  const y = -g.PLOT.z1 + 0.6;
  el.tagBack.setAttribute("x", x.toFixed(2));
  el.tagBack.setAttribute("y", y.toFixed(2));
  el.tagBack.setAttribute("width", width.toFixed(2));
  el.tagText.setAttribute("x", (x + 1).toFixed(2));
  el.tagText.setAttribute("y", (y + 4).toFixed(2));
  el.tagText.textContent = text;
  nameLine.textContent = pickText(id, p);
}
function drawStatusText() {
  const m = METHODS[s.m];
  if (s.picked) {
    const p = s.picked;
    say(`${p.code} · ${timeText(p)} min`);
    return;
  }
  const T = `${Math.round(s.T)} °C`;
  if (s.next) say(`cooling, then swap · ${T}`);
  else if (s.phase === "stroke") say(`${m.short} · ${strokeWord(s.stroke ?? 0)} · 1 µL`);
  else if (s.phase === "run") say(`${m.short} · ${s.t.toFixed(2)} min · ${T}${holdAt(s.m, s.t) ? " hold" : ""}${s.arrived ? ` · ${s.arrived.code} at detector` : ""}`);
  else if (s.phase === "cool") say(`${m.short} · cooling · ${T}`);
  else say(`${m.short} · ${m.detector} · ready · ${T}`);
}
function drawLamps() {
  setOn(el.lamp.ready, s.phase === "ready");
  setOn(el.lamp.run, s.phase === "run" || s.phase === "stroke");
  setOn(el.lamp.fid, s.m === "dro");
  setOn(el.lamp.ecd, s.m === "haa");
}

// ---------- actions ----------
const tour = { on: !still.matches, at: 0, wait: 3.2, quietUntil: 0 };
function requestMethod(id, user) {
  if (user) tour.queued = false;
  // The shuttle never racks a column into a hot oven: stop the run, vent, then swap.
  if (id === s.m && !s.next) return;
  if (s.stroke !== null || s.t !== null) {
    if (s.t !== null) s.drawn[s.m] = s.t;
    s.stroke = null;
    s.t = null;
  }
  if (id === s.m) {
    s.next = null;
    return;
  }
  methodBtns.forEach((b) => b.setAttribute("aria-pressed", b.dataset.method === id ? "true" : "false"));
  if (s.T > SWAP_BELOW && !still.matches) {
    s.next = { id, user };
    if (!s.cool) s.cool = { from: s.T, age: 0 };
    s.phase = "cool";
    announce("Cooling, then swap.");
    run();
    return;
  }
  selectMethod(id, user);
}
function selectMethod(id, user) {
  s.next = null;
  s.phase = s.T > 45 ? "cool" : "ready";
  s.m = id;
  s.cool = s.T > METHODS[id].temp(0) + 0.5 ? { from: s.T, age: 0 } : null;
  s.penT = s.drawn[id];
  pick(null);
  el.sheet.dro.toggleAttribute("data-off", id !== "dro");
  el.sheet.haa.toggleAttribute("data-off", id !== "haa");
  el.bug.dro.toggleAttribute("data-off", id !== "dro");
  el.bug.haa.toggleAttribute("data-off", id !== "haa");
  el.zu.dro.toggleAttribute("data-off", id !== "dro");
  el.zu.haa.toggleAttribute("data-off", id !== "haa");
  el.labels.forEach((n) => n.toggleAttribute("data-on", n.dataset.for === id));
  methodBtns.forEach((b) => b.setAttribute("aria-pressed", b.dataset.method === id ? "true" : "false"));
  setOn(el.detector.dro, id === "dro", "data-active");
  setOn(el.detector.haa, id === "haa", "data-active");
  setOn(el.coil[0], id === "dro", "data-active");
  setOn(el.coil[1], id === "haa", "data-active");
  const hits = $$(`[data-sheet="${id}"] .gc-hit`);
  $$(".gc-hit").forEach((h) => h.setAttribute("tabindex", "-1"));
  hits[0]?.setAttribute("tabindex", "0");
  drawPick();
  drawLamps();
  announce(`${METHODS[id].label}, ${METHODS[id].detector}. ${user ? "Press I to inject." : ""}`.trim());
  run();
}
function inject() {
  const id = s.m;
  if (s.next) return;
  pick(null);
  if (still.matches) {
    s.drawn[id] = METHODS[id].end;
    s.penT = METHODS[id].end;
    s.t = null;
    s.stroke = null;
    s.T = METHODS[id].temp(0);
    s.phase = "ready";
    s.cool = null;
    announce(`${METHODS[id].label} run complete.`);
    drawAll();
    return;
  }
  s.stroke = 0;
  s.t = null;
  s.phase = "stroke";
  if (s.T > METHODS[id].temp(0) + 0.5) s.cool = { from: s.T, age: 0 };
  s.inkFade = 1;
  s.pendingClear = true;
  announce(`${METHODS[id].label}: injecting.`);
  run();
}
function pick(p) {
  s.picked = p;
  drawPick();
  drawStatusText();
}
function hold() {
  tour.on = false;
  clearTimeout(tour.timer);
  if (!still.matches) tour.timer = setTimeout(() => {
    tour.on = true;
    tour.wait = 0.6;
    run();
  }, 3600);
}

// ---------- the loop ----------
let frame = 0;
let last = 0;
let visible = false;
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  s.clock += dt;
  const id = s.m;
  const m = METHODS[id];
  const swapTarget = CHANNEL[id];
  const swapping = s.swap !== swapTarget;
  if (swapping) {
    const step = dt / 1.7;
    s.swap = calm ? swapTarget : s.swap < swapTarget ? Math.min(swapTarget, s.swap + step) : Math.max(swapTarget, s.swap - step);
  }
  if (tour.on && !swapping && s.stroke === null && s.t === null && s.phase === "ready") {
    tour.wait -= dt;
    if (tour.wait <= 0) {
      if (tour.queued) {
        tour.queued = false;
        tour.wait = 1.2;
        selectMethod(id === "dro" ? "haa" : "dro", false);
      } else {
        tour.queued = true;
        tour.wait = 6;
        inject();
      }
    }
  }
  if (s.next && s.T <= SWAP_BELOW) selectMethod(s.next.id, s.next.user);
  if (s.stroke !== null && !swapping) {
    s.stroke += dt;
    if (s.pendingClear) {
      s.inkFade = Math.max(0, s.inkFade - dt / 0.45);
      el.ink[id].style.opacity = s.inkFade.toFixed(3);
      if (s.inkFade === 0) {
        s.pendingClear = false;
        s.drawn[id] = 0;
        s.penT = 0;
        el.ink[id].style.opacity = "";
      } else s.penT = s.drawn[id] * s.inkFade;
    }
    if (s.stroke >= INJECT_AT) {
      if (s.t === null) {
        s.phase = "run";
        announce(`${m.label}: run started.`);
      }
      s.t = runOf(s.stroke - INJECT_AT);
      if (s.t >= m.end) {
        s.t = null;
        s.stroke = null;
        s.drawn[id] = m.end;
        s.penT = m.end;
        s.cool = { from: s.T, age: 0 };
        s.phase = "cool";
        announce(`${m.label}: run complete. Arrow keys step through the peaks.`);
      } else {
        s.drawn[id] = s.t;
        s.penT = s.t;
        s.cool = null;
        s.T = follow(s.T, m.temp(s.t), dt, 0.12, calm);
      }
    }
  }
  if (s.cool) {
    s.cool.age += dt;
    s.T = coolAt(s.cool.from, m.temp(0), s.cool.age);
    if (s.T < m.temp(0) + 0.3) {
      s.T = m.temp(0);
      s.cool = null;
      if (s.phase === "cool") s.phase = "ready";
      if (s.next) selectMethod(s.next.id, s.next.user);
    }
  }
  const knobTarget = KNOB_ANGLE[id];
  const knobMoving = Math.abs(s.knob - knobTarget) > 0.05;
  s.knob = knobMoving ? follow(s.knob, knobTarget, dt, 0.14, calm) : knobTarget;
  if (s.fanOn !== false) s.fan = (s.fan + dt * 720) % 360;
  el.fan.setAttribute("transform", `rotate(${s.fan.toFixed(1)})`);
  drawKnob();
  drawMechanism();
  const sig = drawPen();
  // The flow path lights in order: plunger, nut, liner vapour, inlet stem, pigtail, windings; each elution lights the outlet pigtail, the stem and the detector.
  const age = s.stroke === null ? -9 : s.stroke - INJECT_AT;
  const ch = CHANNEL[id];
  el.plungerHead.toggleAttribute("data-on", age > -0.4 && age < 0.5);
  el.nut.toggleAttribute("data-on", age > -0.3 && age < 0.9);
  const puff = age > -0.1 && age < 1.5 ? Math.sin(Math.PI * Math.min(1, (age + 0.1) / 1.6)) : 0;
  el.vapour.setAttribute("opacity", puff.toFixed(2));
  el.vapour.setAttribute("r", (1 + 3.4 * Math.min(1, Math.max(0, age + 0.1))).toFixed(2));
  el.vapour.setAttribute("cy", (-3 + 7 * Math.min(1, Math.max(0, age) / 1.2)).toFixed(2));
  el.stem.inlet.toggleAttribute("data-on", age > 0.3 && age < 1.5);
  el.seg[0].in.forEach((n) => n.toggleAttribute("data-on", ch === 0 && age > 0.8 && age < 2.1));
  el.seg[1].in.forEach((n) => n.toggleAttribute("data-on", ch === 1 && age > 0.8 && age < 2.1));
  // The coin-run moment: each compound leaves the coil as a packet and reaches the detector as the pen kicks.
  let arrived = null;
  let flash = 0;
  let inFlight = 0;
  const route = FLOW[id];
  if (s.t !== null) {
    for (const p of m.peaks) {
      if (p.kind === "solvent") continue;
      const u = (s.t - (p.t - FLOW_LEAD)) / FLOW_LEAD;
      if (u >= 0 && u < 1 && inFlight < PACKETS.length) {
        const q = pointOn(route, u);
        PACKETS[inFlight].setAttribute("cx", q[0].toFixed(1));
        PACKETS[inFlight].setAttribute("cy", q[1].toFixed(1));
        PACKETS[inFlight].setAttribute("r", (p.h > 0.3 ? 1.9 : 1.3).toFixed(1));
        inFlight++;
      }
      if (s.t >= p.t && s.t - p.t < 0.6) {
        arrived = p;
        flash = Math.max(flash, burst((s.t - p.t) / MIN_PER_S, 0.02, 0.1) * Math.min(1, 0.45 + p.h));
      }
    }
  }
  for (let i = 0; i < PACKETS.length; i++) if (i >= inFlight && PACKETS[i].getAttribute("r") !== "0") PACKETS[i].setAttribute("r", "0");
  s.arrived = arrived;
  const endPt = route[route.length - 1];
  RING.setAttribute("cx", endPt[0]);
  RING.setAttribute("cy", endPt[1]);
  RING.setAttribute("r", (3 + 14 * (1 - flash)).toFixed(1));
  RING.setAttribute("opacity", (flash * 0.9).toFixed(2));
  const eluting = s.t !== null && m.peaks.some((p) => p.kind !== "solvent" && s.t > p.t - FLOW_LEAD * 0.45 && s.t < p.t + 0.1);
  const flapOpen = s.cool ? 1 : 0;
  s.flap += (flapOpen - s.flap) * (calm ? 1 : 1 - Math.exp(-dt / 0.2));
  el.flap.setAttribute("transform", `scale(1 ${(1 - 0.72 * s.flap).toFixed(3)})`);
  el.seg[ch].out.forEach((n) => n.toggleAttribute("data-on", eluting));
  el.seg[1 - ch].out.forEach((n) => n.removeAttribute("data-on"));
  el.stem.fid.toggleAttribute("data-on", eluting && id === "dro");
  el.stem.ecd.toggleAttribute("data-on", eluting && id === "haa");
  el.detector.dro.forEach((n) => n.toggleAttribute("data-pulse", eluting && id === "dro"));
  el.detector.haa.forEach((n) => n.toggleAttribute("data-pulse", eluting && id === "haa"));
  drawBands();
  drawDial();
  drawLamps();
  drawStatusText();
  const flameOn = id === "dro" ? 1 : 0;
  const liveSig = s.t !== null && id === "dro" ? Math.min(1, sig * 1.2 + flash) : 0;
  const movingLit = settle(s.lit, flameOn, dt, 0.24, calm);
  settle(s.sig, liveSig, dt, 0.05, calm);
  stage.style.setProperty("--gc-lit", s.lit.x.toFixed(3));
  if (flame) flame.draw({ uLit: s.lit.x, uSig: s.sig.x }, calm ? 0.8 : s.clock);
  const keepGoing = !calm && (tour.on || s.stroke !== null || s.cool || s.next || knobMoving || swapping || movingLit || s.lit.x > 0.002);
  frame = visible && keepGoing ? requestAnimationFrame(tick) : 0;
}
function run() {
  if (!frame && visible) {
    last = 0;
    frame = requestAnimationFrame(tick);
  }
}
function drawAll() {
  frame = 0;
  last = 0;
  run();
}
const observer = new IntersectionObserver((entries) => {
  visible = entries[entries.length - 1].isIntersecting;
  if (visible) run();
  else if (frame) {
    cancelAnimationFrame(frame);
    frame = 0;
  }
}, { rootMargin: "120px 0px" });
observer.observe(stage);

// ---------- input ----------
const hitsNow = () => $$(`[data-sheet="${s.m}"] .gc-hit`);
const peakOf = (node) => peakById(s.m, node.dataset.peak);
function stepPeak(by, to) {
  const hits = hitsNow();
  const now = hits.indexOf(document.activeElement);
  const i = to !== undefined ? to : Math.max(0, Math.min(hits.length - 1, (now < 0 ? (by > 0 ? -1 : hits.length) : now) + by));
  hits.forEach((h, j) => h.setAttribute("tabindex", j === i ? "0" : "-1"));
  hits[i].focus();
}
stage.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const key = e.key.toLowerCase();
  if (key === "i" || ((key === " " || key === "enter") && e.target === stage)) {
    hold();
    inject();
  } else if (key === "m") {
    hold();
    requestMethod((s.next?.id ?? s.m) === "dro" ? "haa" : "dro", true);
  } else if (key === "arrowright" || key === "arrowdown") {
    hold();
    stepPeak(1);
  } else if (key === "arrowleft" || key === "arrowup") {
    hold();
    stepPeak(-1);
  } else if (key === "home") {
    hold();
    stepPeak(0, 0);
  } else if (key === "end") {
    hold();
    stepPeak(0, hitsNow().length - 1);
  } else if (key === "escape") {
    pick(null);
    stage.focus();
  } else return;
  e.preventDefault();
});
svg.addEventListener("focusin", (e) => {
  if (e.target.classList?.contains("gc-hit")) {
    hold();
    pick(peakOf(e.target));
  }
});
svg.addEventListener("focusout", (e) => {
  if (e.target.classList?.contains("gc-hit")) pick(null);
});
stage.addEventListener("pointerover", (e) => {
  if (e.target.classList?.contains("gc-hit")) {
    hold();
    pick(peakOf(e.target));
  }
});
stage.addEventListener("pointerout", (e) => {
  if (e.target.classList?.contains("gc-hit") && document.activeElement !== e.target) pick(null);
});
stage.addEventListener("click", (e) => {
  const item = e.target.closest?.(".it");
  const name = item?.dataset.name ?? "";
  if (e.target.classList?.contains("gc-hit")) return;
  if (name.startsWith("knob")) {
    hold();
    requestMethod((s.next?.id ?? s.m) === "dro" ? "haa" : "dro", true);
  } else if (name.startsWith("button")) {
    hold();
    inject();
  }
});
injectBtn.addEventListener("click", () => {
  hold();
  inject();
});
methodBtns.forEach((b) => b.addEventListener("click", () => {
  hold();
  requestMethod(b.dataset.method, true);
}));
stage.addEventListener("pointerenter", () => hold());
root.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => {
  hold();
  const hits = hitsNow();
  const i = s.picked ? hits.findIndex((h) => h.dataset.peak === s.picked.id) : -1;
  const n = Math.max(0, Math.min(hits.length - 1, i + Number(b.dataset.step)));
  pick(peakOf(hits[n]));
}));
// The enlarged crop on a phone: a tap picks the nearest peak, so every band ends at a midpoint.
el.zoom?.addEventListener("pointerdown", (e) => {
  hold();
  const box = el.zoom.getBoundingClientRect();
  const vb = el.zoom.viewBox.baseVal;
  const x = vb.x + ((e.clientX - box.left) / box.width) * vb.width;
  let best = null;
  for (const p of METHODS[s.m].peaks) {
    if (p.kind === "solvent") continue;
    const d = Math.abs(uOf(s.m, p.t) - x);
    if (!best || d < best.d) best = { p, d };
  }
  if (best) pick(best.p);
});
el.zu.haa.setAttribute("data-off", "");

// ---------- first paint ----------
el.labels.forEach((n) => n.toggleAttribute("data-on", n.dataset.for === "dro"));
setOn(el.detector.dro, true, "data-active");
$$('[data-sheet="dro"] .gc-hit')[0]?.setAttribute("tabindex", "0");
setOn(el.coil[0], true, "data-active");
drawKnob();
drawMechanism();
drawPen();
drawDial();
drawLamps();
drawPick();
drawStatusText();
return {
  inject,
  destroy() {
    observer.disconnect();
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    clearTimeout(tour.timer);
    visible = false;
  },
};
}
