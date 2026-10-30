// Builds the gas chromatograph figure. `node build.mjs` writes gc.html and gc-light.html;
// `node build.mjs --audit` proves the geometry in every pose (tray, needle, plunger, gates, shuttle).
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SKILL = "/home/davidhatley/.claude/skills/anatomy";
const k = await import(`${SKILL}/kit/iso-kit.mjs`);
const G = await import(`${SKILL}/kit/lathe.mjs`);
const { tubePieces, tubeSvg } = await import(`${SKILL}/kit/tube.mjs`);
const A = await import(`${SKILL}/kit/audit.mjs`);
const { glCamera } = await import(`${SKILL}/kit/gl.mjs`);
const { kitScript, glScript } = await import(`${SKILL}/scripts/inline-kit.mjs`);
import * as M from "./gc-model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const W = 680;
const H = 660;
const AZ = 57;
const EL = 25;

// ---------- world layout (x along the case, y toward the front, z up) ----------
const PLATE = { x: -152, y: -14, w: 412, d: 214, r: 10 };
const PLATE_H = 8;
const FOOT_H = 4;
const CASE = { x0: -129, x1: 215, y0: 0, y1: 170 };
const Z = { plinth: 6, shell: 16, floor: 22, top: 118, deck: 130, rail: 96, gate: 100, cz: 60 };
const WALL_Y = 90; // rear wall of the chambers
const PART = 44; // partition centre, each side of the oven
const BAY = 86; // the shuttle's throw
const ROOF_Y = 136; // the roof is cut back to here over the oven
const LANE_Y = 150;
const STUB = { y: 128, inlet: -26, fid: 0, ecd: 26, bar: 100 };
const INLET = { x: STUB.inlet, y: 126 };
const FID = { x0: -12, x1: 12, y0: 116, y1: ROOF_Y, z1: 172 };
const WIN = { x0: -8, x1: 8, z0: 136, z1: 167, y1: ROOF_Y, y0: 124 };
const FLAME = { x: 0, y: 130, jetTop: 143, collector: 155 };
const ECD = { x: STUB.ecd, y: 126 };
const NUT_TOP = 162;
const NEEDLE = { rest: 190, r: 0.5, len: 30 };

const MOVES = {
  sampler: [0, 0, -(NEEDLE.rest - (NUT_TOP - 16))],
  plunger: [0, 0, -(NEEDLE.rest - (NUT_TOP - 16))],
  tray: [10, 0, 0],
  swap: [BAY, 0, 0],
  gate: [0, -76, 0],
};
// Every pose the page can rest in or pass through: the audit and the depth keys see all of them.
const pose = (label, shares) => ({ label, shares });
const VIAL = 16 / 44;
const POSES = [
  pose("tray out", { tray: 0.5 }),
  pose("tray under needle", { tray: 1 }),
  pose("needle in vial", { tray: 1, sampler: VIAL, plunger: VIAL }),
  pose("sample drawn", { tray: 1, sampler: VIAL, plunger: VIAL - 6.5 / 44 }),
  pose("lifted", { tray: 1, plunger: -6.5 / 44 }),
  pose("parked, drawn", { plunger: -6.5 / 44 }),
  pose("descending", { sampler: 0.5, plunger: 0.5 - 6.5 / 44 }),
  pose("needle at septum", { sampler: 0.8, plunger: 0.8 - 6.5 / 44 }),
  pose("in the inlet", { sampler: 1, plunger: 1 - 6.5 / 44 }),
  pose("plunger down", { sampler: 1, plunger: 1 }),
  pose("gates half", { gate: 0.5 }),
  pose("gates open", { gate: 1 }),
  ...[0.15, 0.3, 0.5, 0.7, 0.85, 1].map((s) => pose(`shuttle ${s}`, { gate: 1, swap: s })),
  pose("552.3 closed", { swap: 1 }),
  pose("552.3 tray", { swap: 1, tray: 1 }),
  pose("552.3 inject", { swap: 1, sampler: 1, plunger: 1 }),
];

const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [INLET.x - 20, 76, 280], [CASE.x1, 0, 272], [-40, 0, 272], [CASE.x1 + 8, 40, 140]], W, H, { pad: 10, azimuth: AZ, elevation: EL });
const V = G.viewOf(P);
const KS = G.scaleOf(P);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const Faded = (list, style) => k.fadedSvg(list, style);
const path3 = (points, closed = false) => k.pathOf(points.map(at), closed);
const f2 = (v) => Math.round(v * 100) / 100;

const R = A.recorder(P);
const record = R.solid;
function put(name, ref, svg, shapes = [], { bias = 0, piece, cls, attrs = "", ...rest } = {}) {
  const extra = `${piece ? ` data-p="${piece}"` : ""}${cls ? ` data-c="${cls}"` : ""}${attrs}`;
  return R.put({ name, at: ref, bias, svg, shapes, piece: piece ?? "gc", ride: piece ?? "gc", move: piece ? MOVES[piece] : undefined, attrs: extra, ...rest });
}
function box(name, [x0, y0, z0], [x1, y1, z1], style = {}, { r = 0.4, steps = 2, bevel = 0, extra = "", inner = "", bias = 0, piece, cls, owner, attrs } = {}) {
  const plan = { x: x0, y: y0, w: x1 - x0, d: y1 - y0, r };
  const shape = record(A.slab(plan, z0, z1 - z0, { name, owner }, steps));
  return put(name, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], S(k.slabOf(plan, z0, z1 - z0, P, steps, bevel), { tone: "mid", ...style, inner }) + extra, [shape], { bias, piece, cls, attrs });
}
function turned(name, F, profile, style = {}, { extra = "", inner = "", bias = 0, steps, bevel = 0, owner, piece, cls, attrs } = {}) {
  const opts = { bevel, ...(steps ? { steps } : {}) };
  const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
  const shape = record(A.solid(F, profile, { name, owner }));
  return put(name, G.add3(F.o, G.mul3(F.a, mid)), S(G.solidOf(profile, F, P, opts), { tone: "mid", ...style, inner }) + extra, [shape], { bias, piece, cls, attrs });
}
const disc = (name, F, s0, s1, r, style = {}, options = {}) => turned(name, F, [[s0, r], [s1, r]], style, { steps: Math.min(40, Math.max(12, Math.round(r * 5))), ...options });
function prism(name, F, poly, s0, s1, style = {}, { extra = "", inner = "", bias = 0, piece, cls, owner, ref } = {}) {
  const shape = record(A.prism(F, poly, s0, s1, { name, owner }));
  const cx = poly.reduce((a, p) => a + p[0], 0) / poly.length;
  const cy = poly.reduce((a, p) => a + p[1], 0) / poly.length;
  const c = ref ?? G.add3(G.add3(G.add3(F.o, G.mul3(F.a, (s0 + s1) / 2)), G.mul3(F.u, cx)), G.mul3(F.v, cy));
  return put(name, c, S(G.prismOf(F, poly, s0, s1, P), { tone: "mid", ...style, inner }) + extra, [shape], { bias, piece, cls });
}
let ringIds = 0;
// A ring you can see through: the kit's band with its bore clipped out and the bore's far wall drawn.
function ringPart(name, F, s0, s1, rIn, rOut, style = {}, { extra = "", under = "", bias = 0, piece, cls, owner, steps = 44 } = {}) {
  const shape = record(A.ring(F, s0, s1, rIn, rOut, { name, owner }));
  const near = G.dot3(F.a, V) > 0 ? s1 : s0;
  const far = near === s1 ? s0 : s1;
  const nearC = G.circleOf(F, near, rIn, P, 48);
  const farC = G.circleOf(F, far, rIn, P, 48);
  const id = `gc-r${ringIds++}`;
  const big = `M-50 -50H${W + 50}V${H + 50}H-50Z`;
  const svg = `<clipPath id="${id}"><path clip-rule="evenodd" d="${big}${nearC}"/></clipPath><clipPath id="${id}n"><path d="${nearC}"/></clipPath>`
    + `<g clip-path="url(#${id}n)"><path class="gc-bore" fill-rule="evenodd" d="${big}${farC}"/>${under}</g>`
    + `<path class="iso-line" data-tone="lo" d="${nearC}"/>`
    + `<g clip-path="url(#${id})">${S(G.ringBand(s0, s1, rIn, rOut, F, P, { steps }), { tone: "mid", ...style })}${extra}</g>`;
  return put(name, G.add3(F.o, G.mul3(F.a, (s0 + s1) / 2)), svg, [shape], { bias, piece, cls });
}
function planeMatrix(o, ex, ey) {
  const p0 = at(o);
  const px = at(G.add3(o, ex));
  const py = at(G.add3(o, ey));
  const v = (x) => x.toFixed(4);
  return `matrix(${v(px[0] - p0[0])} ${v(px[1] - p0[1])} ${v(py[0] - p0[0])} ${v(py[1] - p0[1])} ${p0[0].toFixed(2)} ${p0[1].toFixed(2)})`;
}
const yFace = (x, y, z) => planeMatrix([x, y, z], [1, 0, 0], [0, 0, -1]);
const xFace = (x, y, z) => planeMatrix([x, y, z], [0, 1, 0], [0, 0, -1]);

const LINES = [];
function line(name, points, r = 0.9, { tone = "hi", bend = 4, shells = [true, true], ends = [true, true], maxLength = 40, bias = 0.05, limp = true, touch, bundle, gaps: extraGaps = [], piece, cls, raw = false, attrs = "" } = {}) {
  const route = raw ? points : G.fillet(points, Math.max(bend, r * 2.6), 8, { P, tube: r });
  const total = G.pathLength(route);
  const SHELL = Math.max(1.6, r * 2.4);
  const gaps = [...(shells[0] ? [[0, SHELL]] : []), ...extraGaps, ...(shells[1] ? [[total - SHELL, total]] : [])];
  const move = piece ? MOVES[piece] : undefined;
  R.route(name, route, r, { gaps, limp, touch, bundle, rims: shells.map((on) => (on ? r * 1.9 : r)), piece: piece ?? "gc", ride: piece ?? "gc", move });
  LINES.push(name);
  tubePieces(route, r, P, { maxLength, spacing: Math.max(0.6, Math.min(1.6, r)), gaps }).forEach((tp, index) =>
    put(`${name}:${index}`, tp.mid, tubeSvg(tp, { tone }), [A.tube(tp.points, tp.radii)], { bias, piece, cls, route: name, chunk: index, attrs: ` data-route="${name}"${attrs}` }),
  );
  [0, 1].forEach((index) => {
    const end = index ? route[route.length - 1] : route[0];
    if (shells[index]) {
      const tangent = G.tangentAlong(route, index ? total : 0);
      const F = G.frameAlong(end, tangent);
      const [s0, s1] = index ? [-SHELL, 0] : [0, SHELL];
      const shape = record(A.disc(F, s0, s1, r * 1.9, { name: `${name}.nut${index}`, owner: name }));
      put(`${name}.nut${index}`, G.add3(end, G.mul3(tangent, (s0 + s1) / 2)), S(G.disc(s0, s1, r * 1.9, F, P, { steps: 6 }), { tone: "mid" }), [shape], { bias: bias + 0.1, piece, cls });
    } else if (ends[index]) {
      const size = Math.max(0.5, r * KS * 0.9);
      put(`${name}.end${index}`, end, Dots([at(end)], { size, tone: "hi" }), [A.ball(end, size / KS, { name: `${name}.end${index}`, owner: name })], { bias: bias + 0.15, piece, cls });
    }
  });
  return route;
}
const screws = (points, size = 0.45) => Dots(points.map(at), { size });

// ---------- bench plate, static, drawn first ----------
const back = [];
back.push(`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
for (const [x, y] of byDepth(k.corners(PLATE, 22))) back.push(S(k.cylinder(x, y, 6, -PLATE_H - FOOT_H, FOOT_H, P, 20), { tone: "lo" }));
back.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid", inner: Ln(k.sideSeam(PLATE, -3.4, P, 8), { tone: "faint" }) }));
back.push(Ln(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
{
  const cs = k.corners(PLATE, 10);
  back.push(Ln(cs.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 14)).join(""), { tone: "lo" }), screws(cs.map(([x, y]) => [x, y, 0]), 0.5));
}
record(A.slab(PLATE, -PLATE_H, PLATE_H, { name: "stand.plate", ground: true }, 8));
{
  const STRIP = { x: PLATE.x + 70, y: PLATE.y + PLATE.d - 14, w: 230, d: 7, r: 1 };
  back.push(S(k.slabOf(STRIP, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(STRIP.x + 4, STRIP.x + STRIP.w - 4, 4, 5, STRIP.y, 0.6, [1.8, 3.6], P);
  back.push(Ln(ticks.minor, { tone: "lo" }), Ln(ticks.major, { tone: "mid" }));
  const LABEL = { x: 168, y: PLATE.y + PLATE.d - 26, w: 72, d: 19, r: 1.2 };
  back.push(S(k.slabOf(LABEL, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  back.push(Ln(k.planOutline(k.insetPlan(LABEL, 1.4), 0.8, P, 3), { tone: "faint" }));
  back.push(Ln([52, 38, 46].map((w, i) => k.lineOnTop([LABEL.x + 6, LABEL.y + 5 + i * 4.2], [LABEL.x + 6 + w, LABEL.y + 5 + i * 4.2], 0.8, P)).join(""), { tone: "lo", free: true }));
}
function vial(name, x, y, z, piece) {
  const F = G.frameOf([x, y, z], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  disc(`${name}.glass`, F, 0, 9, 3, { tone: "hi" }, { piece, inner: Ln(G.arcOf(F, 5.6, 3, P), { tone: "lo" }), owner: name });
  disc(`${name}.cap`, F, 9, 12, 3.3, { tone: "mid" }, { piece, owner: name, bevel: 0.3, extra: Dots([at([x, y, z + 12])], { size: 0.5, tone: "hi" }) });
}
{
  const B = { x: -120, y: 176, w: 44, d: 16, r: 2 };
  put("vialblock", [-98, 184, 3], S(k.slabOf(B, 0, 6, P, 3, 0.5), { tone: "mid" }), [record(A.slab(B, 0, 6, { name: "vialblock" }, 3))]);
  for (const x of [-113, -105, -97, -89, -81]) vial("bench.vial", x, 184, 6, null);
}

// ---------- the case ----------
for (const [x, y] of byDepth([[-110, 18], [196, 18], [-110, 152], [196, 152]])) {
  const F = G.frameOf([x, y, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  put("foot", [x, y, 3], S(G.disc(0, Z.plinth, 7, F, P, { steps: 20 }), { tone: "lo" }), [record(A.disc(F, 0, Z.plinth, 7, { name: "foot" }))]);
}
const CAV = "cavity";
const sideSeam = (plan, z) => Ln(k.sideSeam(plan, z, P, 2), { tone: "faint" });
box("plinth", [CASE.x0, 0, Z.plinth], [CASE.x1, CASE.y1, Z.shell], { tone: "lo" }, { r: 3, steps: 3 });
// Rear wall in three blocks with two pocket slots between them, and a back plate behind.
box("back", [CASE.x0, 0, Z.shell], [CASE.x1, 14, Z.top], {}, { r: 1 });
box("rear.left", [CASE.x0, 14, Z.shell], [-PART - 3, WALL_Y, Z.top], { tone: "lo" }, { cls: CAV });
box("rear.mid", [-PART + 3, 14, Z.shell], [PART - 3, WALL_Y, Z.top], { tone: "lo" }, { cls: CAV });
box("rear.right", [PART + 3, 14, Z.shell], [129, WALL_Y, Z.top], { tone: "lo" }, { cls: CAV });
box("wall.left", [CASE.x0, WALL_Y, Z.shell], [CASE.x0 + 4, CASE.y1, Z.top], { tone: "lo" }, { cls: CAV });
for (const [x0, x1] of [[CASE.x0 + 4, -PART - 3], [-PART + 3, PART - 3], [PART + 3, 125]]) {
  box("floor", [x0, WALL_Y, Z.shell], [x1, CASE.y1, Z.floor], { tone: "lo" }, { cls: CAV, extra: Ln(Array.from({ length: 3 }, (_, i) => k.planOutline({ x: x0 + 6 + i * 22, y: 100, w: 16, d: 3, r: 1.4 }, Z.floor, P, 3)).join(""), { tone: "lo" }) });
}
box("wall.right", [125, WALL_Y, Z.shell], [129, CASE.y1, Z.top], { tone: "lo" }, { cls: CAV });
// Panel column to the right of the chambers.
box("bay", [129, 14, Z.shell], [CASE.x1, CASE.y1, Z.top], {}, {
  extra: Ln(Array.from({ length: 10 }, (_, i) => path3([[CASE.x1, 86 + i * 7, 26], [CASE.x1, 90 + i * 7, 26], [CASE.x1, 90 + i * 7, 56], [CASE.x1, 86 + i * 7, 56]], true)).join(""), { tone: "lo" }),
});
// Partitions: fixed header above each pocket gate and a jamb at the front.
for (const sx of [-1, 1]) {
  const x0 = sx * PART - 3;
  const x1 = sx * PART + 3;
  box("header", [x0, WALL_Y, Z.gate], [x1, CASE.y1, Z.top], { tone: "mid" }, { cls: CAV });
  box("jamb", [x0, 165, Z.floor], [x1, CASE.y1, Z.gate], { tone: "mid" }, { cls: CAV });
  box("floor.slot", [x0, WALL_Y, Z.shell], [x1, CASE.y1, Z.floor], { tone: "lo" }, { cls: CAV });
  box("gate", [x0 + 1.5, WALL_Y, Z.floor], [x1 - 1.5, 165, Z.gate], { tone: "hi" }, { piece: "gate", cls: CAV, extra: screws([[x1 - 1.5, 160, 90], [x1 - 1.5, 160, 32]]) });
}
// Roof, cut back over the oven so the column stubs show.
const roofSeam = (plan) => sideSeam(plan, Z.top + 2.4);
{
  const left = { x: CASE.x0, y: 0, w: -PART - 3 - CASE.x0, d: CASE.y1, r: 1 };
  const mid = { x: -PART - 3, y: 0, w: 2 * PART + 6, d: ROOF_Y, r: 0.4 };
  const right = { x: PART + 3, y: 0, w: CASE.x1 - PART - 3, d: CASE.y1, r: 1 };
  for (const [name, plan, shadow] of [["roof.left", left, 0], ["roof.mid", mid, 1], ["roof.right", right, 0]]) {
    box(name, [plan.x, plan.y, Z.top], [plan.x + plan.w, plan.y + plan.d, Z.deck], { tone: "hi" }, {
      r: plan.r, bevel: 0.6, inner: roofSeam(plan),
      extra: screws(k.corners(plan, 4).map(([x, y]) => [x, y, Z.deck])),
    });
  }
  // Header strips over the left and right chambers, with a service seam.
  put("band.screws", [100, CASE.y1, 124], screws([-120, -60, 60, 120, 170, 208].map((x) => [x, CASE.y1, 124])), [record(A.box([-122, CASE.y1, 123], [209, CASE.y1 + 0.05, 125], { name: "band.screws" }))], { bias: 0.05 });
}
// Sill and door stub: what is left of the door, cut away.
box("sill", [CASE.x0, CASE.y1, Z.floor - 6], [129, CASE.y1 + 4, Z.floor + 3], { tone: "mid" }, { inner: sideSeam({ x: CASE.x0, y: CASE.y1, w: 258, d: 4, r: 0.4 }, Z.floor - 2) });
for (const z of [36, 92]) {
  const o = [CASE.x0 + 2, CASE.y1 + 2.2, z];
  box("door.hingeleaf", [CASE.x0, CASE.y1, z - 5], [CASE.x0 + 5, CASE.y1 + 0.8, z + 5], { tone: "lo" }, { extra: screws([[CASE.x0 + 4.2, CASE.y1 + 0.8, z - 3.6], [CASE.x0 + 4.2, CASE.y1 + 0.8, z + 3.6]], 0.4) });
  disc("door.hinge", G.frameOf(o, [0, 0, 1], [1, 0, 0], [0, 1, 0]), -6, 6, 1.4, { tone: "mid" });
}

// ---------- oven interior ----------
{
  const c = { x: 0, z: 56 };
  const F = G.frameOf([c.x, WALL_Y, c.z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  const blades = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2;
    const pt = (r, da) => [r * Math.cos(a + da), r * Math.sin(a + da)].map(f2).join(" ");
    return `M${pt(4, 0)}Q${pt(11, 0.25)} ${pt(20, 0.12)}L${pt(20, 0.52)}Q${pt(11, 0.62)} ${pt(4, 0.6)}Z`;
  }).join("");
  const guard = [23, 17, 11].map((r) => `M${r} 0A${r} ${r} 0 1 1 ${-r} 0A${r} ${r} 0 1 1 ${r} 0Z`).join("");
  const spokes = Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI) / 3 + 0.26;
    return `M${f2(4 * Math.cos(a))} ${f2(4 * Math.sin(a))}L${f2(23 * Math.cos(a))} ${f2(23 * Math.sin(a))}`;
  }).join("");
  put("fan", [c.x, WALL_Y + 0.5, c.z], `<g transform="${yFace(c.x, WALL_Y + 0.02, c.z)}"><circle class="gc-fan-hole" r="23"/><g data-part="fan"><path class="gc-blade" d="${blades}"/></g><circle class="gc-fan-hub" r="4"/><path class="gc-guard" d="${guard}${spokes}"/></g>`, [record(A.disc(F, 0, 0.5, 23, { name: "fan" }))], { cls: CAV });
  ringPart("heater", F, 2, 3.4, 24.6, 26.2, { tone: "hi" }, { cls: "heater", steps: 36 });
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    disc("heater.post", G.frameAlong([c.x + 25.4 * Math.cos(a), WALL_Y, c.z + 25.4 * Math.sin(a)], [0, 1, 0]), 0, 2, 0.8, { tone: "lo" }, { cls: CAV, steps: 10 });
  }
  const PF = G.frameOf([c.x + 33, WALL_Y, 32], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  disc("oven.probe.boss", PF, 0, 2, 2, { tone: "mid" }, { cls: CAV });
  disc("oven.probe", PF, 2, 16, 0.7, { tone: "hi" }, { cls: CAV, steps: 10 });
}
// Rail: three sections, ended in brackets on the outer walls and on the partition headers.
{
  const y = LANE_Y;
  const z = Z.rail;
  for (const [x0, x1] of [[CASE.x0 + 4, -PART - 3], [-PART + 3, PART - 3], [PART + 3, 125]]) {
    disc("rail", G.frameOf([x0, y, z], [1, 0, 0], [0, 1, 0], [0, 0, 1]), 0, x1 - x0, 1, { tone: "hi" }, { steps: 12 });
    for (const [x, sgn] of [[x0, 1], [x1, -1]]) {
      box("rail.bracket", [sgn > 0 ? x : x - 2.4, y - 2.4, z + 1], [sgn > 0 ? x + 2.4 : x, y + 2.4, Z.gate + 2], { tone: "mid" }, { extra: screws([[x + sgn * 1.2, y + 2.4, z + 3]], 0.4) });
    }
  }
}
// Two column cages on one shuttle: wire hoops and a 4-spoke spider, coil across their full depth.
const COILS = [{ x: 0, ch: 0, in: STUB.inlet, out: STUB.fid }, { x: -BAY, ch: 1, in: STUB.inlet, out: STUB.ecd }];
const COIL = { y: LANE_Y, z: Z.cz, rIn: 28.4, rOut: 30, half: 8 };
for (const coil of COILS) {
  const F = G.frameOf([coil.x, COIL.y, COIL.z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  const own = `cage${coil.ch}`;
  const piece = "swap";
  const turnsOuter = [];
  for (let i = 0; i < 12; i++) turnsOuter.push(G.arcOf(F, -7.2 + i * 1.31, COIL.rOut, P));
  const turnsInner = [];
  for (let i = 0; i < 8; i++) turnsInner.push(G.arcOf(F, -7 + i * 2, COIL.rIn, P, { inward: true, least: -0.15 }));
  const mk = (list, base) => list.map((d, i) => `<path class="iso-line gc-turn" data-tone="lo" data-ch="${coil.ch}" data-turn="${base + i}" d="${d}"/>`).join("");
  ringPart(`coil${coil.ch}`, F, -COIL.half, COIL.half, COIL.rIn, COIL.rOut, { tone: "hi", crease: "lo" }, { owner: own, piece, cls: "coil", extra: mk(turnsOuter, 0), under: mk(turnsInner, 12), attrs: "" });
  ringPart(`cage${coil.ch}.hoop`, F, -COIL.half - 1.2, -COIL.half, COIL.rIn - 0.6, COIL.rOut + 1.2, { tone: "mid" }, { owner: own, piece, steps: 32 });
  ringPart(`cage${coil.ch}.hoop`, F, COIL.half, COIL.half + 1.2, COIL.rIn - 0.6, COIL.rOut + 1.2, { tone: "mid" }, { owner: own, piece, steps: 32 });
  // Spider in the front hoop's plane: four wire spokes and a hub, see-through.
  const sy = COIL.y + COIL.half + 0.6;
  disc(`cage${coil.ch}.hub`, F, COIL.half, COIL.half + 1.2, 3, { tone: "hi" }, { owner: own, piece, extra: Dots([at([coil.x, sy + 0.6, COIL.z])], { size: 0.6, tone: "lo" }) });
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    const u = [Math.cos(a), 0, Math.sin(a)];
    const from = G.add3([coil.x, sy, COIL.z], G.mul3(u, 2.8));
    disc(`cage${coil.ch}.spoke`, G.frameAlong(from, u), 0, COIL.rIn - 3.3, 0.45, { tone: "hi" }, { owner: own, piece, steps: 8 });
  }
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const o = [coil.x + (COIL.rOut + 1.9) * Math.cos(a), COIL.y, COIL.z + (COIL.rOut + 1.9) * Math.sin(a)];
    disc(`cage${coil.ch}.bar`, G.frameAlong(o, [0, 1, 0]), -COIL.half - 1.2, COIL.half + 1.2, 0.7, { tone: "mid" }, { owner: own, piece, steps: 8 });
  }
  // Trolley on the rail, sitting on the hoops, and a ferrule bar reaching back under the stubs.
  const top = COIL.z + COIL.rOut + 1.2;
  box(`cage${coil.ch}.trolley`, [coil.x - 9, COIL.y - 10, top], [coil.x + 9, COIL.y + 10, Z.rail - 1], { tone: "mid" }, { piece, owner: own, extra: screws([[coil.x - 7, COIL.y + 10, top + 1.8], [coil.x + 7, COIL.y + 10, top + 1.8]], 0.4) });
  box(`cage${coil.ch}.arm`, [coil.x + 5, STUB.y + 2, top], [coil.x + 9, COIL.y - 10, top + 2], { tone: "lo" }, { piece, owner: own });
  box(`cage${coil.ch}.armpost`, [coil.x + 5, STUB.y + 2, top + 2], [coil.x + 9, STUB.y + 6, Z.gate - 3], { tone: "lo" }, { piece, owner: own });
  const rel = (stub) => coil.x + stub;
  box(`cage${coil.ch}.ferrulebar`, [coil.x - 32, STUB.y - 2, Z.gate - 3], [coil.x + 32, STUB.y + 2, Z.gate - 0.15], { tone: "mid" }, { piece, owner: own, extra: screws([[coil.x - 30, STUB.y + 2, Z.gate - 1.5], [coil.x + 30, STUB.y + 2, Z.gate - 1.5]], 0.35) });
  // Tails: each leaves the back of the coil, makes one visible loop, and ends on the ferrule bar under its stub.
  const tail = (name, dx, stub, side, cls) => {
    const startR = COIL.rOut - 0.3;
    const start = [coil.x + dx, COIL.y - COIL.half - 1.2, COIL.z + Math.sqrt(startR * startR - dx * dx)];
    const cz = start[2] + 5;
    const cx = coil.x + dx + side * 2;
    const pts = [start, [start[0], start[1] - 2.5, start[2]]];
    const yy = start[1] - 3.2;
    for (let i = 0; i <= 20; i++) {
      const a = -Math.PI / 2 + (i / 20) * Math.PI * 2 * side;
      pts.push([cx + 4.6 * Math.cos(a), yy - (i / 20) * 2.4, cz + 4.6 * Math.sin(a)]);
    }
    const end = [rel(stub), STUB.y, Z.gate - 3];
    pts.push([end[0], STUB.y + 0.6, cz - 1], [end[0], STUB.y, cz + 1.4], end);
    line(name, pts, 0.3, { tone: "hi", raw: false, bend: 1.2, shells: [false, true], piece, touch: [own, `cage${coil.ch}*`, `coil${coil.ch}`, "rail", `cage${coil.ch}.ferrulebar`], cls, attrs: ` data-tail="${coil.ch}"` });
  };
  tail(`tail${coil.ch}.in`, -15, coil.in, -1, "tail");
  tail(`tail${coil.ch}.out`, coil.out > 0 ? 16 : -3, coil.out, coil.out > 0 ? 1 : -1, "tail");
}

// ---------- stubs through the roof: the chain from inlet to column to detector ----------
for (const [name, x] of [["inlet", STUB.inlet], ["fid", STUB.fid], ["ecd", STUB.ecd]]) {
  const F = G.frameOf([x, STUB.y, Z.gate], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  disc(`stub.${name}`, F, 3.4, Z.top - Z.gate, 1.8, { tone: "hi" }, { steps: 14 });
  disc(`stub.${name}.nut`, F, 0, 3.4, 2.8, { tone: "mid" }, { steps: 6 });
  put(`stub.${name}.flange`, [x, STUB.y, Z.deck + 0.1], Ln(k.ring(x, STUB.y, 4.2, Z.deck, P, 18), { tone: "lo" }), [record(A.box([x - 4, STUB.y - 4, Z.deck], [x + 4, STUB.y + 4, Z.deck + 0.05], { name: `stub.${name}.flange` }))], { bias: -0.2 });
}

// ---------- inlet on the deck ----------
{
  const inlet = INLET;
  const F = G.frameOf([inlet.x, inlet.y, Z.deck], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  box("inlet.block", [inlet.x - 12, inlet.y - 10, Z.deck], [inlet.x + 12, inlet.y + 10, Z.deck + 10], { tone: "mid" }, { r: 1, bevel: 0.4, extra: Dots([[-10, -8], [10, -8], [-10, 8], [10, 8]].map(([dx, dy]) => at([inlet.x + dx, inlet.y + dy, Z.deck + 10])), { size: 0.5, tone: "hi" }) });
  disc("inlet.body", F, 10, 22, 8.4, { tone: "hi" }, { steps: 40, inner: Ln(G.arcOf(F, 13, 8.4, P) + G.arcOf(F, 16, 8.4, P) + G.arcOf(F, 19, 8.4, P), { tone: "faint" }) });
  disc("inlet.shoulder", F, 22, 24, 5.6, { tone: "mid" }, { steps: 28 });
  disc("inlet.nut", F, 24, NUT_TOP - Z.deck, 7, { tone: "hi" }, {
    steps: 44, bevel: 0.5, attrs: ' data-part="nut"',
    extra: Faded(G.ribsOf(F, 24.5, NUT_TOP - Z.deck - 0.5, 7, 28, P, { fade: [0.08, 0.5], seams: true }), { tone: "lo" }) + Ln(G.circleOf(F, NUT_TOP - Z.deck, 2.1, P, 20), { tone: "mid" }) + Dots([at([inlet.x, inlet.y, NUT_TOP])], { size: 0.9, tone: "lo" }),
  });
}
// Charcoal trap on the split vent, on the left roof.
const TRAP = { x: -86, y: 132 };
{
  const F = G.frameOf([TRAP.x, TRAP.y, Z.deck], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  box("trap.base", [TRAP.x - 9, TRAP.y - 9, Z.deck], [TRAP.x + 7, TRAP.y + 9, Z.deck + 2], { tone: "lo" });
  disc("trap.can", F, 2, 26, 7, { tone: "hi" }, { steps: 32, bevel: 0.5, inner: Ln(G.arcOf(F, 6, 7, P) + G.arcOf(F, 22, 7, P), { tone: "faint" }) });
  disc("trap.cap", F, 26, 29, 3, { tone: "mid" }, { steps: 6 });
  box("trap.bulkhead", [TRAP.x + 7, TRAP.y - 8, Z.deck], [TRAP.x + 11, TRAP.y + 8, Z.deck + 9], { tone: "mid" }, { extra: screws([[TRAP.x + 9, TRAP.y - 6, Z.deck + 9], [TRAP.x + 9, TRAP.y + 6, Z.deck + 9]], 0.4) });
}

// ---------- autosampler tower, fixed over the inlet ----------
const T0 = INLET;
const SY = INLET.y;
{
  const ty0 = 78;
  const ty1 = 106;
  const TX0 = T0.x - 14;
  const TX1 = T0.x + 14;
  const FOOT = 146;
  const TOP = 268;
  box("tower.base", [T0.x - 19, ty0 - 4, Z.deck], [T0.x + 19, ty1 + 6, Z.deck + 3], { tone: "lo" }, { r: 1, extra: Dots([[-16, -13], [16, -13], [-16, 15], [16, 15]].map(([a, b]) => at([T0.x + a, 92 + b, Z.deck + 3])), { size: 0.45 }) });
  box("tower.foot", [TX0 - 2, ty0 - 2, Z.deck + 3], [TX1 + 2, ty1 + 6, FOOT], { tone: "mid" }, { r: 2, steps: 3, bevel: 0.4 });
  const towerPlan = { x: TX0, y: ty0, w: 28, d: 28, r: 1.6 };
  box("tower.column", [TX0, ty0, FOOT], [TX1, ty1, TOP], { tone: "hi" }, {
    r: 1.6, steps: 3,
    inner: Ln(k.sideSeam(towerPlan, 156, P, 3) + k.sideSeam(towerPlan, 250, P, 3), { tone: "faint" }),
    extra: Ln(Array.from({ length: 7 }, (_, i) => path3([[TX1, 83 + i * 3, 216], [TX1, 84.6 + i * 3, 216], [TX1, 84.6 + i * 3, 240], [TX1, 83 + i * 3, 240]], true)).join(""), { tone: "lo" }),
  });
  box("tower.head", [TX0 - 2, ty0 - 2, TOP], [TX1 + 2, ty1 + 6, TOP + 10], { tone: "hi" }, { r: 2, steps: 3, bevel: 0.6, extra: Dots([[-12, -11], [12, -11], [-12, 16], [12, 16]].map(([a, b]) => at([T0.x + a, 92 + b - 1, TOP + 10])), { size: 0.45 }) });
  for (const dx of [-8, 8]) disc("tower.guide", G.frameOf([T0.x + dx, ty1 + 3, FOOT], [0, 0, 1], [1, 0, 0], [0, 1, 0]), 0, TOP - FOOT, 1, { tone: "mid" }, { steps: 12 });
  disc("tower.screw", G.frameOf([T0.x, ty1 + 3, FOOT], [0, 0, 1], [1, 0, 0], [0, 1, 0]), 0, TOP - FOOT, 0.9, { tone: "lo" }, { steps: 10 });
  const SAM = "sampler";
  const tip = NEEDLE.rest;
  const barrelLo = tip + NEEDLE.len;
  const F = G.frameOf([T0.x, SY, tip], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  const clipTo = (id, z) => `<clipPath id="${id}"><path d="${path3([[T0.x - 12, SY, z], [T0.x + 12, SY, z], [T0.x + 12, SY, 300], [T0.x - 12, SY, 300]], true)}"/></clipPath>`;
  put("needle", [T0.x, SY, tip + 15], `${clipTo("gc-needle-clip", NUT_TOP)}<g clip-path="url(#gc-needle-clip)"><g data-part="needle-move">${S(G.disc(0, NEEDLE.len, NEEDLE.r, F, P, { steps: 10 }), { tone: "hi" })}</g></g>`, [record(A.disc(F, 0, NEEDLE.len, NEEDLE.r, { name: "needle", owner: SAM }))], { piece: SAM, attrs: ' data-inner=""', bias: 0.3 });
  const sp = { piece: SAM, owner: SAM };
  disc("syringe.hub", F, NEEDLE.len, NEEDLE.len + 2, 1.6, { tone: "mid" }, sp);
  disc("syringe.barrel", F, NEEDLE.len + 2, 37, 2.6, { tone: "hi" }, { ...sp, inner: Ln([34, 36].map((s) => G.arcOf(F, s, 2.6, P)).join(""), { tone: "lo" }) });
  box("syringe.clamp", [T0.x - 5, SY - 4, barrelLo + 7], [T0.x + 5, SY + 4, barrelLo + 13], { tone: "mid" }, { ...sp, bevel: 0.3, extra: screws([[T0.x - 3.6, SY + 4, barrelLo + 10], [T0.x + 3.6, SY + 4, barrelLo + 10]], 0.4) });
  disc("syringe.barrel", F, 43, 52, 2.6, { tone: "hi" }, { ...sp, inner: Ln([45, 47, 49].map((s) => G.arcOf(F, s, 2.6, P)).join(""), { tone: "lo" }) });
  disc("syringe.flange", F, 52, 53.4, 4.2, { tone: "mid" }, sp);
  box("sampler.block", [T0.x - 12, ty1 + 4, barrelLo + 2], [T0.x + 12, ty1 + 8, barrelLo + 18], { tone: "hi" }, { piece: SAM, bevel: 0.4, r: 0.8, extra: screws([[T0.x - 10, ty1 + 8, barrelLo + 4], [T0.x + 10, ty1 + 8, barrelLo + 4], [T0.x - 10, ty1 + 8, barrelLo + 16], [T0.x + 10, ty1 + 8, barrelLo + 16]], 0.4) });
  box("sampler.arm", [T0.x - 4, ty1 + 8, barrelLo + 8], [T0.x + 4, SY - 4, barrelLo + 12], { tone: "mid" }, sp);
  const pl = barrelLo + 22 + 8;
  const flangeZ = tip + 53.4;
  put("plunger.rod", [T0.x, SY, flangeZ + 4], `${clipTo("gc-rod-clip", flangeZ)}<g clip-path="url(#gc-rod-clip)"><g data-part="rod-move">${S(G.disc(53.4 - 8, pl - tip, 0.9, F, P, { steps: 12 }), { tone: "mid" })}</g></g>`, [record(A.disc(F, 53.4, pl - tip, 0.9, { name: "plunger.rod", owner: SAM }))], { piece: SAM });
  const pk = { piece: "plunger", owner: SAM };
  disc("plunger.head", F, pl - tip, pl - tip + 1.6, 3.2, { tone: "hi" }, pk);
  box("plunger.driver", [T0.x - 3, ty1 + 4, pl + 1.6], [T0.x + 3, SY + 3, pl + 4.4], { tone: "mid" }, pk);
  // Vial shelf with a recessed lane; the rack parks to the left, clear of the needle's axis.
  const SHELF_Z = 166;
  const shelfPlan = { x: T0.x - 56, y: ty1 + 4, w: 66, d: SY - 4.2 - ty1 - 4, r: 0.4 };
  box("shelf", [shelfPlan.x, ty1 + 4, SHELF_Z - 2.4], [shelfPlan.x + 66, SY - 4.2, SHELF_Z], { tone: "mid" }, { bevel: 0.3, extra: Ln(k.planOutline({ x: shelfPlan.x + 1, y: ty1 + 5.4, w: 64, d: SY - 7 - ty1 - 4, r: 0.6 }, SHELF_Z, P, 2), { tone: "lo" }) });
  box("rack", [T0.x - 46, SY - 5, SHELF_Z], [T0.x - 5.4, SY + 5, SHELF_Z + 1.6], { tone: "lo" }, { piece: "tray" });
  for (let i = 0; i < 4; i++) vial("rack.vial", T0.x - 10 - i * 9.6, SY, SHELF_Z + 1.6, "tray");
}

// ---------- detectors, both over the oven ----------
{
  const f = FID;
  const y1 = f.y1;
  const w = WIN;
  const cav = [];
  const q = (a, b, c, d) => path3([a, b, c, d], true);
  cav.push(`<path class="gc-cav-back" d="${q([w.x0, w.y0, w.z0], [w.x1, w.y0, w.z0], [w.x1, w.y0, w.z1], [w.x0, w.y0, w.z1])}"/>`);
  cav.push(`<path class="gc-cav-floor" d="${q([w.x0, w.y0, w.z0], [w.x1, w.y0, w.z0], [w.x1, y1, w.z0], [w.x0, y1, w.z0])}"/>`);
  cav.push(`<path class="gc-cav-side" d="${q([w.x0, w.y0, w.z0], [w.x0, y1, w.z0], [w.x0, y1, w.z1], [w.x0, w.y0, w.z1])}"/>`);
  const JF = G.frameOf([FLAME.x, FLAME.y, w.z0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  cav.push(S(G.disc(0, 2, 3.4, JF, P), { tone: "mid" }));
  cav.push(S(G.disc(2, FLAME.jetTop - w.z0 - 1.2, 1.3, JF, P), { tone: "hi" }));
  cav.push(S(G.solidOf([[FLAME.jetTop - w.z0 - 1.2, 1.3], [FLAME.jetTop - w.z0, 0.7]], JF, P), { tone: "hi" }));
  const CF = G.frameOf([FLAME.x, FLAME.y, FLAME.collector], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  cav.push(S(G.disc(w.z1 - FLAME.collector - 3.4, w.z1 - FLAME.collector, 1.2, CF, P), { tone: "mid" }));
  cav.push(S(G.lathe([[0, 5], [8, 5], [8, 3.8], [0, 3.8]], CF, P, {}), { tone: "hi" }));
  cav.push(Ln(path3([[w.x0, FLAME.y, FLAME.jetTop + 2], [FLAME.x - 4, FLAME.y, FLAME.jetTop + 2]]), { tone: "mid" }) + Dots([at([FLAME.x - 4, FLAME.y, FLAME.jetTop + 2])], { size: 0.8, tone: "mid" }));
  const flamePath = (h) => {
    const side = (sgn, list) => list.map((i) => {
      const t = i / 14;
      const r = 2.2 * Math.sin(Math.PI * Math.pow(t, 0.62)) * (h / 9);
      return [FLAME.x + sgn * r, FLAME.y, FLAME.jetTop - 0.2 + t * h];
    });
    const up = Array.from({ length: 15 }, (_, i) => i);
    return path3([...side(-1, up), ...side(1, [...up].reverse())], true);
  };
  const fb = `<g class="gc-flame-fb"><path d="${flamePath(9)}" class="gc-fb-body"/><path d="${flamePath(5)}" class="gc-fb-core"/></g>`;
  const opening = q([w.x0, y1, w.z0], [w.x1, y1, w.z0], [w.x1, y1, w.z1], [w.x0, y1, w.z1]);
  const plan = { x: f.x0, y: f.y0, w: f.x1 - f.x0, d: f.y1 - f.y0, r: 1 };
  const svg = S(k.slabOf(plan, Z.deck, f.z1 - Z.deck, P, 2, 0.5), { tone: "hi", inner: sideSeam(plan, Z.deck + 4) })
    + `<clipPath id="gc-win"><path d="${opening}"/></clipPath><g clip-path="url(#gc-win)" class="gc-inside">${cav.join("")}${fb}</g>`
    + Ln(opening, { tone: "mid" })
    + screws([[f.x0 + 2, y1, Z.deck + 2], [f.x1 - 2, y1, Z.deck + 2], [f.x0 + 2, y1, f.z1 - 2], [f.x1 - 2, y1, f.z1 - 2]]);
  put("fid", [0, 126, 150], svg, [record(A.slab(plan, Z.deck, f.z1 - Z.deck, { name: "fid" }, 2))]);
  const CH = G.frameOf([-4, 122, f.z1], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  disc("fid.chimney", CH, 0, 12, 3, { tone: "hi" }, { steps: 24, inner: Ln(G.arcOf(CH, 4, 3, P), { tone: "faint" }) });
  disc("fid.chimneycap", CH, 12, 14, 4.2, { tone: "mid" }, { steps: 24 });
  const PLG = G.frameOf([6, 126, f.z1], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  disc("fid.insulator", PLG, 0, 5, 2.4, { tone: "hi" }, { steps: 20, inner: Ln(G.arcOf(PLG, 2.5, 2.4, P), { tone: "lo" }) });
}
{
  const e = ECD;
  box("ecd.block", [e.x - 11.5, e.y - 10, Z.deck], [e.x + 12, e.y + 10, Z.deck + 12], { tone: "mid" }, { r: 1, bevel: 0.4, extra: Dots([[-9.5, -8], [10, -8], [-9.5, 8], [10, 8]].map(([a, b]) => at([e.x + a, e.y + b, Z.deck + 12])), { size: 0.45 }) });
  const cell = G.frameOf([e.x, e.y, Z.deck + 12], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  disc("ecd.can", cell, 0, 18, 9, { tone: "hi" }, { steps: 40, bevel: 0.6, extra: Faded(G.ribsOf(cell, 1.4, 15, 9, 28, P, { fade: [0.08, 0.5], seams: true }), { tone: "lo" }) });
  disc("ecd.neck", cell, 18, 21, 3.4, { tone: "mid" }, { steps: 20 });
  disc("ecd.vent", cell, 21, 25, 1.2, { tone: "hi" }, { steps: 10 });
  disc("ecd.ventnut", cell, 25, 28, 2.6, { tone: "mid" }, { steps: 6 });
  disc("ecd.vent", cell, 28, 34, 1.2, { tone: "hi" }, { steps: 10 });
  disc("ecd.pulse", G.frameAlong([e.x + 9, e.y + 3, Z.deck + 20], [1, 0, 0]), 0, 5, 2.2, { tone: "mid" }, { steps: 18 });
}

// ---------- pneumatics on the deck, recorder console behind ----------
const EPC = { x0: -6, x1: 136, y0: 56, y1: 82, z1: 146 };
{
  const plan = { x: EPC.x0, y: EPC.y0, w: EPC.x1 - EPC.x0, d: EPC.y1 - EPC.y0, r: 1 };
  box("epc", [EPC.x0, EPC.y0, Z.deck], [EPC.x1, EPC.y1, EPC.z1], { tone: "mid" }, {
    r: 1, bevel: 0.5, inner: sideSeam(plan, Z.deck + 4),
    extra: screws(k.corners(plan, 3).map(([x, y]) => [x, y, EPC.z1])),
  });
  for (let i = 0; i < 5; i++) {
    const x = 24 + i * 22;
    const F = G.frameOf([x, 69, EPC.z1], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
    disc("epc.valve", F, 0, 7, 4.4, { tone: "hi" }, { steps: 24, bevel: 0.4, inner: Ln(G.arcOf(F, 2, 4.4, P), { tone: "faint" }) });
    disc("epc.valvecap", F, 7, 9, 2, { tone: "mid" }, { steps: 14 });
  }
}
const GAS = 136;
// Feeds rise up the right side in one bundle, clamped every 60 units, to the block's far end.
const LANES = [61, 67, 73, 79];
const SIDE_X = CASE.x1 + 7;
const FEEDS = ["carrier", "hydrogen", "air", "makeup"];
const CLAMP_Z = [40, 100];
box("gas.block", [CASE.x1 + 1, 52, 0], [CASE.x1 + 14, 85, 10], { tone: "mid" }, { bevel: 0.4, extra: screws([[CASE.x1 + 3, 54, 10], [CASE.x1 + 12, 83, 10]]) });
LANES.forEach((y, i) => {
  const gaps = CLAMP_Z.map((z) => [z - 10, z - 10 + 3]);
  line(`feed.${FEEDS[i]}`, [[SIDE_X, y, 10], [SIDE_X, y, GAS], [EPC.x1, y, GAS]], 0.9, { bend: 5, gaps, touch: ["clamp*"], bundle: "feed" });
});
for (const z of CLAMP_Z) {
  box("clamp", [SIDE_X - 2, LANES[0] - 2.4, z], [SIDE_X + 2, LANES[3] + 2.4, z + 3], { tone: "hi" }, { owner: "clamp", bevel: 0.25, extra: screws([[SIDE_X, LANES[0] - 1.2, z + 3], [SIDE_X, LANES[3] + 1.2, z + 3]], 0.4) });
  box("clamp.arm", [CASE.x1, 66.5, z], [SIDE_X - 2, 70.5, z + 3], { tone: "lo" });
}
// The right side: vent bank, rating plate with rule lines, and a mains inlet with a cable gland.
{
  const x = CASE.x1;
  put("upper.seam", [x, 110, 124], Ln(path3([[x, 14, Z.top], [x, CASE.y1, Z.top]]), { tone: "lo" }), [record(A.box([x, 14, Z.top - 0.1], [x + 0.05, CASE.y1, Z.top + 0.1], { name: "upper.seam" }))], { bias: 0.1 });
  box("side.plate", [x, 104, 72], [x + 0.6, 150, 100], { tone: "lo" }, {
    extra: screws([[x + 0.6, 107, 75], [x + 0.6, 147, 75], [x + 0.6, 107, 97], [x + 0.6, 147, 97]]) + Ln([30, 22, 34, 18].map((w, i) => path3([[x + 0.6, 111, 94 - i * 5], [x + 0.6, 111 + w, 94 - i * 5]])).join(""), { tone: "lo", free: true }),
  });
  box("side.inlet", [x, 24, 22], [x + 3, 46, 36], { tone: "mid" }, { r: 0.8, extra: Dots([[28, 29], [35, 29], [42, 29]].map(([y, z]) => at([x + 3, y, z])), { size: 0.7, tone: "lo" }) });
}
// Carrier round the back of the tower to the inlet, split vent to the charcoal trap.
line("carrier", [[EPC.x0, 62, GAS], [-54, 62, GAS], [-54, 120, GAS], [INLET.x - 12, 120, GAS]], 0.9, { bend: 5 });
line("vent", [[INLET.x - 12, 132, GAS], [TRAP.x + 11, 132, GAS]], 0.7, { bend: 3, tone: "mid" });
// Hydrogen and air straight into the FID; makeup through a tee to FID and ECD.
line("fid.h2", [[-3, EPC.y1, GAS], [-3, FID.y0, GAS]], 0.9, {});
line("fid.air", [[2, EPC.y1, GAS], [2, FID.y0, GAS]], 0.9, {});
const TEE = [9, 98, GAS];
{
  const r = 2.2;
  box("tee.post", [TEE[0] - 1, TEE[1] - 1, Z.deck], [TEE[0] + 1, TEE[1] + 1, GAS - r + 0.02], { tone: "lo" });
  put("tee", TEE, S(G.sphereOf(TEE, r, P, { steps: 20 }), { tone: "hi" }), [record(A.ball(TEE, r, { name: "tee" }))]);
  const rim = Math.sqrt(r * r - 0.81);
  line("makeup", [[TEE[0], EPC.y1, GAS], [TEE[0], TEE[1] - rim, GAS]], 0.9, { shells: [true, false], ends: [true, false], touch: ["tee"] });
  line("makeup.fid", [[TEE[0], TEE[1] + rim, GAS], [TEE[0], FID.y0, GAS]], 0.9, { shells: [false, true], ends: [false, true], touch: ["tee"] });
  line("makeup.ecd", [[TEE[0] + rim, TEE[1], GAS], [ECD.x + 4, TEE[1], GAS], [ECD.x + 4, ECD.y - 10, GAS]], 0.9, { shells: [false, true], ends: [false, true], touch: ["tee"], bend: 4 });
}

// Recorder console: a tilted face at the back of the deck, in the plane of its own case.
const TILT = { yBot: 50, zBot: 206, yTop: 34, zTop: 272 };
const REC_X = { x0: -38, x1: 212 };
const eu = G.unit3([0, TILT.yTop - TILT.yBot, TILT.zTop - TILT.zBot]);
const en = [0, eu[2], -eu[1]];
const LEN = Math.hypot(TILT.yTop - TILT.yBot, TILT.zTop - TILT.zBot);
const OF = [0, TILT.yBot, TILT.zBot];
const onFace = (x, v, n = 0) => G.add3(G.add3([x, TILT.yBot, TILT.zBot], G.mul3(eu, v)), G.mul3(en, n));
const CF = G.frameOf([0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
{
  const section = [[0, Z.deck], [TILT.yBot, Z.deck], [TILT.yBot, TILT.zBot], [TILT.yTop, TILT.zTop], [0, TILT.zTop]];
  const shape = record(A.prism(CF, section, REC_X.x0 - 4, REC_X.x1 + 3, { name: "console" }));
  const vents = Ln(Array.from({ length: 14 }, (_, i) => path3([[60 + i * 7, TILT.yBot, 150], [64 + i * 7, TILT.yBot, 150], [64 + i * 7, TILT.yBot, 192], [60 + i * 7, TILT.yBot, 192]], true)).join(""), { tone: "lo" });
  const seam = path3([[REC_X.x0 - 4, TILT.yBot, 200], [REC_X.x1 + 3, TILT.yBot, 200], [REC_X.x1 + 3, 0, 200]]);
  put("console", [80, 25, 190], S(G.prismOf(CF, section, REC_X.x0 - 4, REC_X.x1 + 3, P), { tone: "hi", inner: Ln(seam, { tone: "faint" }) }) + vents + screws([[-34, TILT.yBot, 138], [-34, TILT.yBot, 196], [208, TILT.yBot, 138], [208, TILT.yBot, 196]]), [shape]);
}
const PAPER = { x0: REC_X.x0 + 14, x1: REC_X.x1 - 14, v0: 3, v1: LEN - 3 };
const PLOT = { x0: PAPER.x0 + 4, x1: PAPER.x1 - 4, z0: PAPER.v0 + 6, z1: PAPER.v1 - 3 };
const plotU = (id, t) => PLOT.x0 + (t / M.METHODS[id].end) * (PLOT.x1 - PLOT.x0);
const plotV = (s) => -(PLOT.z0 + s * (PLOT.z1 - PLOT.z0));
const paperM = planeMatrix(OF, [1, 0, 0], G.mul3(eu, -1));
function simplify(points, tol) {
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let worst = 0;
    let at_ = -1;
    const [ax, ay] = points[a];
    const dx = points[b][0] - ax;
    const dy = points[b][1] - ay;
    const len = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((points[i][0] - ax) * dy - (points[i][1] - ay) * dx) / len;
      if (d > worst) {
        worst = d;
        at_ = i;
      }
    }
    if (worst > tol) {
      keep[at_] = 1;
      stack.push([a, at_], [at_, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}
const pathOf2 = (pts) => `M${pts.map(([x, y]) => `${f2(x)} ${f2(y)}`).join("L")}`;
function traceOf(id) {
  const pts = [];
  for (let t = 0; t <= M.METHODS[id].end + 1e-6; t += 0.01) pts.push([plotU(id, t), plotV(M.signalAt(id, t))]);
  return pathOf2(simplify(pts, 0.04));
}
function humpFill() {
  const pts = [[plotU("dro", 1.4), plotV(0)]];
  for (let t = 1.4; t <= 16; t += 0.1) pts.push([plotU("dro", t), plotV(M.humpAt("dro", t))]);
  pts.push([plotU("dro", 16), plotV(0)]);
  return `${pathOf2(pts)}Z`;
}
function sheet(id) {
  const m = M.METHODS[id];
  const y0 = plotV(0);
  const y1 = plotV(1);
  const major = [];
  const grid = [];
  const labels = [];
  for (let t = 0; t <= m.end + 1e-6; t += 1) {
    const u = f2(plotU(id, t));
    if (t % m.axisStep === 0) {
      major.push(`M${u} ${f2(y0)}V${f2(y1)}`);
      labels.push(`<text class="gc-axis" x="${u}" y="${f2(y0 + 3.9)}" text-anchor="middle">${t}</text>`);
    } else grid.push(`M${u} ${f2(y0)}V${f2(y0 - 1.5)}`);
  }
  for (const s of [0.25, 0.5, 0.75]) major.push(`M${PLOT.x0} ${f2(plotV(s))}H${PLOT.x1}`);
  labels.push(`<text class="gc-axis" x="${f2(PLOT.x1 - 9)}" y="${f2(y0 + 3.9)}" text-anchor="end">min</text>`);
  const printed = [];
  const markers = [];
  if (id === "dro") {
    const u = (pid) => plotU(id, M.peakById(id, pid).t);
    const by = f2(y1 + 1.2);
    markers.push(`<path class="gc-window" d="M${f2(u("C10"))} ${f2(y0)}V${by}M${f2(u("C28"))} ${f2(y0)}V${by}M${f2(u("C40"))} ${f2(y0)}V${by}M${f2(u("C10"))} ${by}H${f2(u("C40"))}"/>`);
    for (const [a, b, label] of [["C10", "C28", "DRO"], ["C28", "C40", "ORO"]]) markers.push(`<text class="gc-band" x="${f2((u(a) + u(b)) / 2)}" y="${f2(y1 + 5)}" text-anchor="middle">${label}</text>`);
    for (const pid of ["C10", "C28", "C40"]) markers.push(`<text class="gc-mark" x="${f2(u(pid) + 0.8)}" y="${f2(y1 + 5)}">${pid}</text>`);
  } else {
    // Labels fanned along a row at the top of the sheet, each on a leader to its own peak.
    const list = m.peaks.map((p) => ({ p, x: plotU(id, p.t) }));
    const GAP = 5.6;
    for (let pass = 0; pass < 60; pass++) for (let i = 1; i < list.length; i++) {
      const push = GAP - (list[i].x - list[i - 1].x);
      if (push > 0) {
        list[i].x += push / 2;
        list[i - 1].x -= push / 2;
      }
    }
    for (const { p, x } of list) {
      const u = plotU(id, p.t);
      const top = plotV(p.h + 0.03);
      const low = y1 + 11;
      printed.push(`<g class="gc-label" data-label="${p.id}"><path class="gc-leader" d="M${f2(x)} ${f2(low)}L${f2(u)} ${f2(Math.max(low + 1.5, top))}"/><text class="gc-code" transform="translate(${f2(x + 1)} ${f2(low - 0.6)}) rotate(-90)">${p.code}</text></g>`);
    }
  }
  const hump = id === "dro" ? `<path class="gc-hump" d="${humpFill()}" clip-path="url(#gc-clip-${id})"/>` : "";
  const ink = `<g clip-path="url(#gc-clip-${id})"><path class="gc-ink" vector-effect="non-scaling-stroke" d="${traceOf(id)}"/></g>`;
  const hits = m.peaks.filter((p) => p.kind !== "solvent").map((p, i, list) => {
    const u = plotU(id, p.t);
    const left = i ? (u + plotU(id, list[i - 1].t)) / 2 : u - 3;
    const right = i < list.length - 1 ? (u + plotU(id, list[i + 1].t)) / 2 : u + 3;
    return `<rect class="gc-hit" data-peak="${p.id}" role="button" tabindex="-1" aria-label="${p.code}: ${p.name}, ${M.timeText(p)} minutes" x="${f2(left)}" y="${f2(y1 - 1)}" width="${f2(right - left)}" height="${f2(y0 - y1 + 2)}"/>`;
  }).join("");
  return `<g class="gc-sheet" data-sheet="${id}"${id === "dro" ? "" : ' data-off=""'}><clipPath id="gc-clip-${id}"><rect data-clip="${id}" x="${PLOT.x0 - 3}" y="${f2(y1 - 8)}" width="${PLOT.x1 - PLOT.x0 + 6}" height="${f2(y0 - y1 + 14)}"/></clipPath><g id="gc-print-${id}"><path class="gc-grid" d="${major.join("")}"/><path class="gc-tick" d="${grid.join("")}M${PLOT.x0} ${f2(y0)}H${PLOT.x1}"/>${labels.join("")}${markers.join("")}${hump}${ink}${printed.join("")}</g><g class="gc-hits">${hits}</g></g>`;
}
{
  const f = (x, v, n = 0) => onFace(x, v, n);
  const openingPts = [f(REC_X.x0 + 4, 1), f(REC_X.x1 - 4, 1), f(REC_X.x1 - 4, LEN - 1), f(REC_X.x0 + 4, LEN - 1)];
  const opening = path3(openingPts, true);
  const svg = `<path class="gc-recess" d="${opening}"/><g transform="${paperM}"><rect class="gc-paper" x="${PAPER.x0}" y="${-PAPER.v1}" width="${PAPER.x1 - PAPER.x0}" height="${PAPER.v1 - PAPER.v0}"/><clipPath id="gc-paper"><rect x="${PAPER.x0}" y="${-PAPER.v1}" width="${PAPER.x1 - PAPER.x0}" height="${PAPER.v1 - PAPER.v0}"/></clipPath><g clip-path="url(#gc-paper)">${sheet("dro")}${sheet("haa")}</g><g id="gc-tag" data-part="tag" class="gc-tag" data-off=""><path data-part="tag-peak" class="gc-tag-peak"/><rect data-part="tag-back" class="gc-tag-back" height="5.4" rx=".6"/><text data-part="tag-text" class="gc-tag-text"></text></g></g>${Ln(opening, { tone: "mid" })}`;
  put("recorder", [80, TILT.yBot, 240], svg, [record(A.prism(G.frameOf(f(0, 0, 0.02), en, [1, 0, 0], eu), [[REC_X.x0 + 4, 1], [REC_X.x1 - 4, 1], [REC_X.x1 - 4, LEN - 1], [REC_X.x0 + 4, LEN - 1]], 0, 0.5, { name: "recorder" }))], { bias: 3 });
  // Rollers and rails on standoffs in front of the face.
  const RF = (x, n) => G.frameOf(f(x, 1, n), eu, [1, 0, 0], en);
  for (const x of [PAPER.x0 - 4, PAPER.x1 + 4]) {
    const F = RF(x, 2.6);
    disc("recorder.roller", F, 0, LEN - 2, 2, { tone: "hi" }, { steps: 14, bias: 3.2, extra: Faded(G.ribsOf(F, 0, LEN - 2, 2, 10, P, { fade: [0.15, 0.6] }), { tone: "lo" }) });
  }
  const railN = 5;
  const vRails = [LEN - 4, 4];
  for (const v of vRails) {
    const F = G.frameOf(f(REC_X.x0 + 5, v, railN), [1, 0, 0], eu, en);
    disc("recorder.rail", F, 0, REC_X.x1 - REC_X.x0 - 10, 0.8, { tone: "mid" }, { steps: 10, bias: 3.3 });
    for (const x of [REC_X.x0 + 5, REC_X.x1 - 5]) {
      const BF = G.frameOf(f(x, v, 0), en, [1, 0, 0], eu);
      prism("recorder.block", BF, [[-1.6, -1.8], [1.6, -1.8], [1.6, 1.8], [-1.6, 1.8]], 0.5, railN - 0.8, { tone: "lo" }, { bias: 3.35 });
    }
  }
  const u0 = plotU("dro", 0);
  const bn = railN + 0.8;
  const PF = (v) => G.frameOf(f(u0, v, bn), en, [1, 0, 0], eu);
  for (const v of vRails) prism("pen.bush", PF(v), [[-2.2, -1.5], [2.2, -1.5], [2.2, 1.5], [-2.2, 1.5]], 0, 1.8, { tone: "mid" }, { bias: 3.5, attrs: "" });
  const postO = f(u0, 2, bn + 2.4);
  const postF = G.frameOf(postO, eu, [1, 0, 0], en);
  disc("pen.post", postF, 0, LEN - 4, 0.6, { tone: "hi" }, { steps: 10, bias: 3.6 });
  const penN = bn + 3;
  const SF = G.frameOf(f(u0, PLOT.z0, penN), en, [1, 0, 0], eu);
  prism("pen.slider", SF, [[-2, -2], [2, -2], [2, 2], [-2, 2]], 0, 2.6, { tone: "hi" }, { bias: 3.7 });
  put("pen.tip", f(u0, PLOT.z0, 2), Ln(path3([f(u0, PLOT.z0, penN), f(u0, PLOT.z0, 0)]), { tone: "lit" }) + Dots([at(f(u0, PLOT.z0, 0))], { size: 1, tone: "hi" }), [record(A.tube([f(u0, PLOT.z0, 0.2), f(u0, PLOT.z0, penN)], 0.3, { name: "pen.tip", owner: "pen.slider" }))], { bias: 3.65 });
}
// Detector signal leads into a gland plate on the console.
{
  const GL = { x0: 0, x1: 42, z0: 152, z1: 182 };
  box("gland", [GL.x0, TILT.yBot, GL.z0], [GL.x1, TILT.yBot + 1, GL.z1], { tone: "mid" }, { extra: screws([[GL.x0 + 2, TILT.yBot + 1, GL.z0 + 2], [GL.x1 - 2, TILT.yBot + 1, GL.z1 - 2], [GL.x0 + 2, TILT.yBot + 1, GL.z1 - 2], [GL.x1 - 2, TILT.yBot + 1, GL.z0 + 2]], 0.4) });
  line("signal.fid", [[6, 126, FID.z1 + 5], [6, 126, 178], [6, TILT.yBot + 1, 178]], 0.55, { tone: "lo", bend: 3, shells: [false, true] });
  line("signal.ecd", [[ECD.x + 14, ECD.y + 3, Z.deck + 20], [ECD.x + 20, ECD.y + 3, Z.deck + 20], [ECD.x + 20, 92, Z.deck + 20], [35, 86, 160], [35, TILT.yBot + 1, 160]], 0.55, { tone: "lo", bend: 3, shells: [false, true] });
}

// ---------- control panel ----------
const PANEL = { y: CASE.y1 };
const DIAL = { x: 153, z: 92, r: 18 };
const KNOB = { x: 194, z: 88, r: 10.5 };
const BTN = { x: 194, z: 55, r: 7 };
const LCD = { x0: 134, x1: 174, z0: 56, z1: 68 };
{
  const y = PANEL.y;
  const F = G.frameOf([DIAL.x, y, DIAL.z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  disc("dial.bezel", F, 0, 2, DIAL.r + 1.8, { tone: "mid" }, { bevel: 0.5, steps: 56 });
  const ticks = [];
  const major = [];
  const nums = [];
  for (let T = 0; T <= 420; T += 20) {
    const a = ((M.dialAngle(T) - 90) * Math.PI) / 180;
    const isMajor = T % 100 === 0;
    const r0 = DIAL.r - 0.3;
    const r1 = r0 - (isMajor ? 2.8 : 1.6);
    (isMajor ? major : ticks).push(`M${f2(r0 * Math.cos(a))} ${f2(r0 * Math.sin(a))}L${f2(r1 * Math.cos(a))} ${f2(r1 * Math.sin(a))}`);
    if (isMajor) nums.push(`<text class="gc-dial-num" x="${f2((r1 - 2.8) * Math.cos(a))}" y="${f2((r1 - 2.8) * Math.sin(a) + 1)}" text-anchor="middle">${T}</text>`);
  }
  const bug = (id) => {
    const a = ((M.dialAngle(M.METHODS[id].program.at(-1)[1]) - 90) * Math.PI) / 180;
    const r = DIAL.r;
    return `<path data-bug="${id}" class="gc-bug"${id === "dro" ? "" : ' data-off=""'} d="M${f2(r * Math.cos(a))} ${f2(r * Math.sin(a))}L${f2((r + 1.5) * Math.cos(a + 0.06))} ${f2((r + 1.5) * Math.sin(a + 0.06))}L${f2((r + 1.5) * Math.cos(a - 0.06))} ${f2((r + 1.5) * Math.sin(a - 0.06))}Z"/>`;
  };
  put("dial.face", [DIAL.x, y + 2.1, DIAL.z], `<g transform="${yFace(DIAL.x, y + 2.05, DIAL.z)}"><circle class="gc-dial" r="${DIAL.r}"/><path class="gc-tick-d" d="${ticks.join("")}"/><path class="gc-tick-D" d="${major.join("")}"/>${nums.join("")}${bug("dro")}${bug("haa")}<text class="gc-dial-unit" y="9.4" text-anchor="middle">°C OVEN</text><g data-part="needle" transform="rotate(${f2(M.dialAngle(40))})"><path class="gc-needle" d="M0 3.6L0 ${f2(-DIAL.r + 1.6)}"/></g><circle class="gc-hub" r="1.6"/></g>`, [record(A.disc(F, 2, 2.1, DIAL.r, { name: "dial.face" }))], { bias: 0.2 });
  put("lcd", [(LCD.x0 + LCD.x1) / 2, y, (LCD.z0 + LCD.z1) / 2], `<g transform="${yFace(LCD.x0, y, LCD.z1)}"><rect class="gc-lcd-win" width="${LCD.x1 - LCD.x0}" height="${LCD.z1 - LCD.z0}" rx=".8"/><text class="gc-lcd" data-part="lcd-t" x="1.6" y="8.2">40.0</text><text class="gc-lcd" data-part="lcd-m" x="${LCD.x1 - LCD.x0 - 1.6}" y="8.2" text-anchor="end">0.00</text></g>`, [record(A.box([LCD.x0, y, LCD.z0], [LCD.x1, y + 0.05, LCD.z1], { name: "lcd" }))], { bias: 0.2 });
  const KEYS = ["7", "8", "9", "OVEN", "4", "5", "6", "INLET", "1", "2", "3", "DET"];
  KEYS.forEach((key, i) => {
    const x = 134 + (i % 4) * 10.4;
    const z = 42 - Math.floor(i / 4) * 8.6;
    const wide = 9;
    box("key", [x, y, z], [x + wide, y + 1, z + 7], { tone: i % 4 === 3 ? "hi" : "mid" }, { r: 0.7, bevel: 0.2 });
    put("key.legend", [x + wide / 2, y + 1.02, z + 3.5], `<g transform="${yFace(x + wide / 2, y + 1.01, z + 2.5)}"><text class="gc-engrave gc-key" text-anchor="middle">${key}</text></g>`, [record(A.box([x + 0.5, y + 1, z + 1], [x + wide - 0.5, y + 1.05, z + 6], { name: "key.legend" }))], { bias: 0.1 });
  });
  const KF = G.frameOf([KNOB.x, y, KNOB.z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  disc("knob.skirt", KF, 0, 1.4, KNOB.r + 4.5, { tone: "lo" }, { bevel: 0.4, steps: 48 });
  const det = (deg) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `M${f2((KNOB.r + 2) * Math.cos(a))} ${f2((KNOB.r + 2) * Math.sin(a))}L${f2((KNOB.r + 4.2) * Math.cos(a))} ${f2((KNOB.r + 4.2) * Math.sin(a))}`;
  };
  put("knob.marks", [KNOB.x, y + 1.45, KNOB.z], `<g transform="${yFace(KNOB.x, y + 1.42, KNOB.z)}"><path class="gc-tick-D" d="${det(-45)}${det(45)}"/></g>`, [record(A.disc(KF, 1.4, 1.45, KNOB.r + 4.5, { name: "knob.marks" }))], { bias: 0.1 });
  disc("knob", KF, 1.4, 8, KNOB.r, { tone: "hi" }, { bevel: 0.6, steps: 56, inner: Ln(G.arcOf(KF, 1.8, KNOB.r, P) + G.arcOf(KF, 7.6, KNOB.r, P), { tone: "lo" }), extra: `<g data-part="knurl">${Faded(G.ribsOf(KF, 1.8, 7.6, KNOB.r, 40, P, { fade: [0.08, 0.5] }), { tone: "lo" })}</g>` });
  put("knob.cap", [KNOB.x, y + 8.05, KNOB.z], `<g transform="${yFace(KNOB.x, y + 8, KNOB.z)}"><g data-part="pointer" transform="rotate(-45)"><path class="gc-pointer" d="M0 -2.4L0 ${f2(-KNOB.r + 1)}"/></g><circle class="gc-hub" r="1.4"/></g>`, [record(A.disc(KF, 8, 8.05, KNOB.r - 0.4, { name: "knob.cap" }))], { bias: 0.1 });
  put("knob.labels", [KNOB.x, y, KNOB.z - 18], `<g transform="${yFace(KNOB.x, y, KNOB.z)}"><text class="gc-engrave" data-for="dro" x="-11" y="-16.6" text-anchor="middle">DRO/ORO</text><text class="gc-engrave" data-for="haa" x="13" y="-16.6" text-anchor="middle">552.3</text><text class="gc-engrave" x="0" y="20" text-anchor="middle">METHOD</text></g>`, [record(A.box([KNOB.x - 18, y, KNOB.z - 21], [KNOB.x + 18, y + 0.05, KNOB.z - 18], { name: "knob.labels" }))], { bias: 0.1 });
  const BF = G.frameOf([BTN.x, y, BTN.z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  disc("button.ring", BF, 0, 1.4, BTN.r + 2, { tone: "lo" }, { bevel: 0.3, steps: 32 });
  disc("button", BF, 1.4, 4, BTN.r, { tone: "hi" }, { bevel: 0.5, steps: 32 });
  put("button.label", [BTN.x, y, BTN.z - 11], `<g transform="${yFace(BTN.x, y, BTN.z)}"><text class="gc-engrave" y="12.4" text-anchor="middle">INJECT</text></g>`, [record(A.box([BTN.x - 8, y, BTN.z - 13], [BTN.x + 8, y + 0.05, BTN.z - 10], { name: "button.label" }))], { bias: 0.1 });
  for (const [i, name] of ["ready", "run", "fid", "ecd"].entries()) {
    const x = 183 + i * 8;
    const LF = G.frameOf([x, y, 31], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
    disc(`lamp.${name}`, LF, 0, 1, 1.8, { tone: "mid" }, { steps: 14, cls: "lamp", attrs: ` data-lamp="${name}"` });
    put(`lamp.${name}.label`, [x, y, 26], `<g transform="${yFace(x, y, 31)}"><text class="gc-engrave gc-small" y="5.6" text-anchor="middle">${name.toUpperCase()}</text></g>`, [record(A.box([x - 3, y, 24], [x + 3, y + 0.05, 27], { name: `lamp.${name}.label` }))], { bias: 0.1 });
  }
  put("panel.screws", [170, y, 70], screws([[133, 20], [211, 20], [133, 114], [211, 114]].map(([x, z]) => [x, y, z]), 0.5), [record(A.box([132, y, 19], [212, y + 0.05, 115], { name: "panel.screws" }))], { bias: 0.1 });
}

// ---------- settle every pose, then write ----------
const skip = A.sameRun;
A.settle(R, P, { states: [0, ...POSES], skip });
R.items.sort((a, b) => a.key - b.key);
if (process.argv.includes("--dropped")) console.log(R.settled.solved.dropped.map((d) => `${R.settled.items[d.front]?.name ?? d.front} > ${R.settled.items[d.back]?.name ?? d.back} ${d.label ?? ""} ${JSON.stringify(d).slice(0, 120)}`).join("\n"));
const liftOf = (item) => (item.move ? G.dot3(item.move, V) : 0);
const groups = R.items.map((item, i) => `<g class="it" data-name="${item.name}" data-k="${item.key.toFixed(2)}"${item.attrs ?? ""}>${item.svg}</g>`).join("");
const LABEL_TEXT = "A benchtop gas chromatograph shown as one flow path. An autosampler tower holds a syringe over a split/splitless inlet with a knurled septum nut. A column stub runs from the inlet down through the roof, which is cut back over the oven, to a wound capillary column on a wire cage hanging from a rail in front of a fan and heater. The column's outlet tail rises to a stub under the flame ionization detector or the electron capture cell, both on the roof over the oven. A second column waits in a bay behind a pocket gate; the method selector swaps them. A chart recorder in a tilted console at the back of the deck draws the chromatogram, and a dial reads oven temperature on the front panel.";
const svg = k.figureSvg({ width: W, height: H, label: LABEL_TEXT, className: "gc-svg", body: [...back, `<g class="gc-items">${groups}</g>`] });
const corners = [[WIN.x0 - 3, WIN.y1, WIN.z0 - 3], [WIN.x1 + 3, WIN.y1, WIN.z0 - 3], [WIN.x1 + 3, WIN.y1, WIN.z1 + 3], [WIN.x0 - 3, WIN.y1, WIN.z1 + 3], [FLAME.x - 12, FLAME.y, WIN.z0], [FLAME.x + 12, FLAME.y, WIN.z1]].map(at);
const bx0 = Math.floor(Math.min(...corners.map((c) => c[0])));
const by0 = Math.floor(Math.min(...corners.map((c) => c[1])));
const bx1 = Math.ceil(Math.max(...corners.map((c) => c[0])));
const by1 = Math.ceil(Math.max(...corners.map((c) => c[1])));
const camera = glCamera(P);
const DATA = {
  P, MOVES,
  G: { PLOT, KNOB, ky: PANEL.y, knobR: KNOB.r, u0: plotU("dro", 0), eu, TRAY: 10, PLUNGER: 6.5, TRAVEL: -MOVES.sampler[2] },
  gl: { box: [bx0, by0, bx1 - bx0, by1 - by0], camera: { ...camera, origin: [camera.origin[0] - bx0, camera.origin[1] - by0] }, flame: FLAME, win: WIN },
};
const CSS = readFileSync(join(HERE, "gc.css"), "utf8");
const modelSource = readFileSync(join(HERE, "gc-model.mjs"), "utf8").replace(/^export /gm, "").replace(/if \(typeof process[\s\S]*$/, "");
const LIVE = readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify(DATA));
const zoom = `<svg class="gc-zoom" viewBox="${PLOT.x0 - 3} ${f2(plotV(1) - 2)} ${PLOT.x1 - PLOT.x0 + 6} ${f2(plotV(0) - plotV(1) + 8)}" aria-hidden="true"><use class="gc-zu" data-z="dro" href="#gc-print-dro"/><use class="gc-zu" data-z="haa" href="#gc-print-haa"/><use href="#gc-tag"/></svg>`;
const stageHtml = `<div class="iso-stage gc-stage" data-gc tabindex="0" role="group" aria-label="Gas chromatograph. Press I, or Inject, to run the selected method. Press M to swap the column and detector for the other method. Left and right arrows step through the peaks on the chart.">${svg}<canvas class="gc-flame" aria-hidden="true" style="left:${f2((bx0 / W) * 100)}%;top:${f2((by0 / H) * 100)}%;width:${f2(((bx1 - bx0) / W) * 100)}%;height:${f2(((by1 - by0) / H) * 100)}%"></canvas><span class="gc-sr" role="status" aria-live="polite" data-status></span></div>${zoom}<div class="gc-controls"><div class="gc-seg" role="group" aria-label="Method"><button type="button" data-method="dro" aria-pressed="true">8015-style · FID</button><button type="button" data-method="haa" aria-pressed="false">552.3 · ECD</button></div><div class="gc-steps"><button type="button" data-step="-1" aria-label="Previous peak">‹ peak</button><button type="button" data-step="1" aria-label="Next peak">peak ›</button></div><button type="button" class="gc-inject" data-inject>Inject</button></div><p class="gc-name" data-gc-name></p>`;
const CAPTION = "A computed figure, not instrument data. A lab runs these two methods on separate instruments, because a 400 °C program would exceed the 552.3 column's limit of about 280 to 300 °C. They share one chassis here for comparison: the selector racks the chosen column into the oven and parks the other behind a gate. The left trace is composite, not one injection: an n-alkane ladder from C10 to C40, a diesel hump and an oil hump, with o-terphenyl as surrogate. It uses a published vendor DRO/ORO standard's conditions (40 to 400 °C at 19.6 °C/min, hydrogen carrier, 50:1 split), which is not a typical lab program and not EPA 8015D's own 45 to 275 °C. EPA 8015D defines DRO as C10 to C28; C28 to C40 is a laboratory extension, and windows vary by regulator. C10 to C18 are that standard's tabulated times. C40 is read off its plot, and other times come from a fitted retention model, so they read \"about\". Hump shapes and these heights are illustrative. The 552.3 trace uses EPA's Table 1 times and oven program for its primary column, with heights read from its Figure 1. It shows ten analyte esters (nine haloacetic acids and dalapon), with 2-bromobutanoic acid as surrogate and 1,2,3-trichloropropane as internal standard; samples are extracted into MTBE and heated in acidic methanol. Unlabelled peaks are omitted. Runs play at 1.5 run-minutes per second.";
function write(theme) {
  const body = `<style>${CSS}</style><div class="gc-root" data-gc-root>` + k.plateHtml({
    fig: "Fig 5",
    title: "Benchtop GC, flow path",
    hint: "I inject · M method · ← → peaks",
    readout: "8015-style · ready · 40 °C",
    keys: [
      { mark: "lit", label: "Pen trace: detector signal against run time" },
      { mark: "red", label: "Lit windings: compounds on the column" },
      { mark: "edge", label: "Lines: carrier, hydrogen, air, makeup through a tee" },
    ],
    caption: CAPTION,
    body: stageHtml,
  }) + `</div>`;
  const page = k.pageHtml({ title: "Gas chromatograph", theme, body, script: kitScript() + glScript() + modelSource + LIVE, width: 720 });
  const name = theme === "light" ? "gc-light.html" : "gc.html";
  writeFileSync(join(HERE, name), page);
  console.log("wrote", name, `${(page.length / 1024).toFixed(0)} KB`, `${R.items.length} items`, `${R.solids.length} solids`, `scale ${KS.toFixed(3)}`, `${LINES.length} lines`);
}
write("dark");
write("light");

const NEEDLE_ALLOW = [["needle", "rack.vial*"], ["needle", "inlet.*"]];
if (process.argv.includes("--audit")) {
  const started = Date.now();
  const result = A.audit(R, P, { frames: POSES, apart: false, cover: ["pen.tip"], allow: NEEDLE_ALLOW, crowd: [["tail1.out", "header"], ["signal.fid", "tower.column"]] });
  // The needle is meant to enter the septum nut and the vial: that one contact is the mechanism.
  const excused = /^(needle)$/;
  const okHost = /^(inlet\.|rack\.vial|stub\.inlet|syringe)/;
  result.flight = result.flight.filter((c) => !(excused.test(c.tube ?? c.a ?? "") && okHost.test(c.other ?? c.b ?? "")) && !(excused.test(c.other ?? c.b ?? "") && okHost.test(c.tube ?? c.a ?? "")));
  // Every pose is a real frame: an interlock in any of them is a failure, not "in passing".
  const { overlaps, solved } = R.settled;
  const allPoses = A.depthOrder(R.settled.items, P, { overlaps, solved, rest: [0, ...POSES], allow: NEEDLE_ALLOW });
  result.depth = allPoses;
  console.log(A.report(result));
  const count = A.failures(result);
  console.log(`audit · ${R.tubes.length} tubes · ${R.solids.length} solids · ${R.items.length} items · ${POSES.length + 1} poses · ${((Date.now() - started) / 1000).toFixed(1)} s`);
  console.log(count ? `audit failed: ${count} problem${count === 1 ? "" : "s"}` : "audit passed");
  if (count) process.exitCode = 1;
}
