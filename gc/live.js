const D = __DATA__;
const P = D.P;
const stage = document.querySelector("[data-gc]");
const root = stage.closest("[data-gc-root]");
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
  tower: $$('[data-g="tower"]'),
  sampler: $$('[data-g="sampler"]'),
  plunger: $$('[data-g="plunger"]'),
  tray: $$('[data-g="tray"]'),
  button: $$('[data-g="button"]'),
  carriage: $$('[data-g="carriage"]'),
  pen: $$('[data-g="pen"]'),
  needleMove: $('[data-part="needle-move"]'),
  rodMove: $('[data-part="rod-move"]'),
  fan: $('[data-part="fan"]'),
  needle: $('[data-part="needle"]'),
  pointer: $('[data-part="pointer"]'),
  knurl: $('[data-part="knurl"]'),
  lcdT: $('[data-part="lcd-t"]'),
  lcdM: $('[data-part="lcd-m"]'),
  tag: $('[data-part="tag"]'),
  tagLine: $('[data-part="tag-line"]'),
  tagText: $('[data-part="tag-text"]'),
  clip: { dro: $('[data-clip="dro"]'), haa: $('[data-clip="haa"]') },
  sheet: { dro: $('[data-sheet="dro"]'), haa: $('[data-sheet="haa"]') },
  ink: { dro: $('[data-sheet="dro"] .gc-ink'), haa: $('[data-sheet="haa"] .gc-ink') },
  hump: $('.gc-hump'),
  bug: { dro: $('[data-bug="dro"]'), haa: $('[data-bug="haa"]') },
  turns: [$$('[data-ch="0"]'), $$('[data-ch="1"]')],
  detector: { dro: $$('[data-name^="fid"]'), haa: $$('[data-name^="ecd"]') },
  lamp: Object.fromEntries(["ready", "run", "fid", "ecd"].map((n) => [n, $$(`[data-g="lamp-${n}"]`)])),
  labels: $$("[data-for]"),
};

const plotW = g.PLOT.x1 - g.PLOT.x0;
const uOf = (id, t) => g.PLOT.x0 + (t / METHODS[id].end) * plotW;
const clipX = g.PLOT.x0 - 3;
const KNOB_ANGLE = { dro: -45, haa: 45 };
const CHANNEL = { dro: 0, haa: 1 };

const s = {
  m: "dro",
  tower: 0,
  knob: -45,
  stroke: null, // seconds since Inject
  t: null, // run minutes, null when no run
  T: 40,
  penT: METHODS.dro.end,
  penS: 0,
  drawn: { dro: METHODS.dro.end, haa: 0 },
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
    ? `EPA 8015 on FID. n-Alkane ladder, DRO window C10 to C28, oil window C28 to C40, diesel hump, o-terphenyl surrogate. Oven ${programText(id)}.`
    : `EPA 552.3 on ECD. Nine haloacetic acid methyl esters, surrogate and internal standard. Oven ${programText(id)}.`;
}
function pickText(id, p) {
  return `${p.code}: ${p.name}. Elutes at ${p.t.toFixed(2)} min, oven ${Math.round(METHODS[id].temp(p.t))} °C.`;
}

function say(text) {
  if (readout.textContent !== text) readout.textContent = text;
}
function announce(text) {
  if (status.textContent !== text) status.textContent = text;
}

// ---------- knurl, rebuilt while the knob turns ----------
const VIEW = (() => {
  const a = ((P.azimuth ?? 45) * Math.PI) / 180;
  const e = ((P.elevation ?? 30) * Math.PI) / 180;
  return [Math.cos(a) * Math.cos(e), Math.sin(a) * Math.cos(e), Math.sin(e)];
})();
let lastKnurl = null;
function drawKnurl(deg) {
  const phase = (((deg % 8.1818) + 8.1818) % 8.1818) * (Math.PI / 180);
  if (lastKnurl !== null && Math.abs(phase - lastKnurl) < 1e-3) return;
  lastKnurl = phase;
  const buckets = new Map();
  const { x, z } = g.KNOB;
  const y = g.ky;
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * Math.PI * 2 + phase;
    const nx = Math.cos(a);
    const nz = Math.sin(a);
    const f = nx * VIEW[0] + nz * VIEW[2];
    const al = smooth(0.08, 0.5, f);
    if (al < 0.02) continue;
    const p0 = iso([x + g.knobR * nx, y + 1.8, z + g.knobR * nz], P);
    const p1 = iso([x + g.knobR * nx, y + 8.6, z + g.knobR * nz], P);
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
function drawTower() {
  const x = s.tower * g.TOWER_DX;
  const st = s.stroke === null ? { tray: 0, drop: 0, plunger: 0 } : strokeAt(s.stroke);
  const dz = -st.drop * g.NEEDLE_TRAVEL;
  const pz = st.plunger * g.PLUNGER;
  move(el.tower, [x, 0, 0]);
  move(el.sampler, [x, 0, dz]);
  move(el.plunger, [x, 0, dz + pz]);
  move(el.tray, [x + st.tray * g.TRAY, 0, 0]);
  el.needleMove.setAttribute("transform", translateAlong(P, [0, 0, dz]));
  el.rodMove.setAttribute("transform", translateAlong(P, [0, 0, pz]));
  return st;
}
function drawPen() {
  const id = s.m;
  const t = s.penT;
  const u = uOf(id, t);
  const sig = signalAt(id, Math.min(t, METHODS[id].end));
  const z = sig * (g.PLOT.z1 - g.PLOT.z0);
  move(el.carriage, [u - g.u0, 0, 0]);
  move(el.pen, [u - g.u0, 0, z]);
  el.clip[id].setAttribute("width", Math.max(0, uOf(id, s.drawn[id]) - clipX).toFixed(2));
  return sig;
}
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
  const u = uOf(id, p.t);
  const y0 = -g.PLOT.z0;
  const y = -(g.PLOT.z0 + signalAt(id, p.t) * (g.PLOT.z1 - g.PLOT.z0));
  el.tag.removeAttribute("data-off");
  el.tagLine.setAttribute("d", `M${u.toFixed(2)} ${y0}V${(y - 1).toFixed(2)}`);
  const left = u > 46;
  el.tagText.setAttribute("x", (u + (left ? -1.4 : 1.4)).toFixed(2));
  el.tagText.setAttribute("y", (-g.PLOT.z1 + 1).toFixed(2));
  el.tagText.setAttribute("text-anchor", left ? "end" : "start");
  el.tagText.textContent = `${p.code} ${p.t.toFixed(2)} min`;
  nameLine.textContent = pickText(id, p);
}
function drawStatusText() {
  const m = METHODS[s.m];
  if (s.picked) {
    const p = s.picked;
    say(`${p.code} · ${p.t.toFixed(2)} min · ${Math.round(m.temp(p.t))} °C`);
    return;
  }
  const T = `${Math.round(s.T)} °C`;
  if (s.phase === "stroke") say(`${m.short} · injecting 1 µL`);
  else if (s.phase === "run") say(`${m.short} · ${s.t.toFixed(2)} min · ${T}`);
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
const tour = { on: !still.matches, at: 0, wait: 1.4, quietUntil: 0 };
function selectMethod(id, user) {
  if (id === s.m) return;
  if (s.stroke !== null || s.t !== null) {
    if (s.t !== null) s.drawn[s.m] = s.t;
    s.stroke = null;
    s.t = null;
  }
  s.phase = s.T > 45 ? "cool" : "ready";
  s.m = id;
  s.cool = s.T > METHODS[id].temp(0) + 0.5 ? { from: s.T, age: 0 } : null;
  s.penT = s.drawn[id];
  pick(null);
  el.sheet.dro.toggleAttribute("data-off", id !== "dro");
  el.sheet.haa.toggleAttribute("data-off", id !== "haa");
  el.bug.dro.toggleAttribute("data-off", id !== "dro");
  el.bug.haa.toggleAttribute("data-off", id !== "haa");
  el.labels.forEach((n) => n.toggleAttribute("data-on", n.dataset.for === id));
  methodBtns.forEach((b) => b.setAttribute("aria-pressed", b.dataset.method === id ? "true" : "false"));
  setOn(el.detector.dro, id === "dro", "data-active");
  setOn(el.detector.haa, id === "haa", "data-active");
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
  if (tour.on && s.stroke === null && s.t === null && s.phase === "ready") {
    tour.wait -= dt;
    if (tour.wait <= 0) {
      if (tour.queued) {
        tour.queued = false;
        tour.wait = 0.9;
        selectMethod(id === "dro" ? "haa" : "dro", false);
      } else {
        tour.queued = true;
        tour.wait = 2.2;
        inject();
      }
    }
  }
  if (s.stroke !== null) {
    s.stroke += dt;
    if (s.pendingClear) {
      s.inkFade = Math.max(0, s.inkFade - dt / 0.45);
      el.ink[id].style.opacity = s.inkFade.toFixed(3);
      if (id === "dro") el.hump.style.opacity = "";
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
    }
  }
  const towerTarget = CHANNEL[id];
  const armed = Math.abs(s.tower - towerTarget) < 0.002;
  s.tower = armed ? towerTarget : follow(s.tower, towerTarget, dt, 0.28, calm);
  const knobTarget = KNOB_ANGLE[id];
  const knobMoving = Math.abs(s.knob - knobTarget) > 0.05;
  s.knob = knobMoving ? follow(s.knob, knobTarget, dt, 0.14, calm) : knobTarget;
  if (s.fanOn !== false) s.fan = (s.fan + dt * 720) % 360;
  el.fan.setAttribute("transform", `rotate(${s.fan.toFixed(1)})`);
  drawKnob();
  drawTower();
  const sig = drawPen();
  drawBands();
  drawDial();
  drawLamps();
  drawStatusText();
  const flameOn = id === "dro" ? 1 : 0;
  const liveSig = s.t !== null && id === "dro" ? Math.min(1, sig * 1.6) : 0;
  const movingLit = settle(s.lit, flameOn, dt, 0.24, calm);
  settle(s.sig, liveSig, dt, 0.05, calm);
  stage.style.setProperty("--gc-lit", s.lit.x.toFixed(3));
  if (flame) flame.draw({ uLit: s.lit.x, uSig: s.sig.x }, calm ? 0.8 : s.clock);
  const keepGoing = !calm && (tour.on || s.stroke !== null || s.cool || knobMoving || !armed || movingLit || s.lit.x > 0.002);
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
new IntersectionObserver((entries) => {
  visible = entries[entries.length - 1].isIntersecting;
  if (visible) run();
  else if (frame) {
    cancelAnimationFrame(frame);
    frame = 0;
  }
}, { rootMargin: "120px 0px" }).observe(stage);

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
    selectMethod(s.m === "dro" ? "haa" : "dro", true);
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
    selectMethod(s.m === "dro" ? "haa" : "dro", true);
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
  selectMethod(b.dataset.method, true);
}));
stage.addEventListener("pointerenter", () => hold());

// ---------- first paint ----------
el.labels.forEach((n) => n.toggleAttribute("data-on", n.dataset.for === "dro"));
setOn(el.detector.dro, true, "data-active");
$$('[data-sheet="dro"] .gc-hit')[0]?.setAttribute("tabindex", "0");
drawKnob();
drawTower();
drawPen();
drawDial();
drawLamps();
drawPick();
drawStatusText();
