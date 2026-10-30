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
const PLATE = { x: -176, y: -14, w: 352, d: 272, r: 10 };
const PLATE_H = 8;
const FOOT_H = 4;
const CASE = { x0: -150, x1: 150, y0: 0, y1: 170 };
const Z = { plinth: 6, shell: 30, floor: 36, top: 130, deck: 142, rail: 110, gate: 114, cz: 74 };
const WALL_Y = 90; // the oven's rear wall
const OPEN = { x0: -68, x1: 50 }; // the cutaway: door and roof corner removed
const CX = -10; // the active column's centre
const BAY = 102; // the shuttle's throw: each parked column waits behind the case front in a cold bay
const ROOF_Y = 112; // the roof is cut back to here over the oven
const LANE_Y = 146;
const STUB = { y: 104, inlet: -36, fid: -10, ecd: 16 };
const INLET = { x: STUB.inlet, y: 100 };
const FID = { x0: -22, x1: 2, y0: 88, y1: ROOF_Y, z1: 184 };
const WIN = { x0: -18, x1: -2, z0: 148, z1: 179, y1: ROOF_Y, y0: 100 };
const FLAME = { x: -10, y: 106, jetTop: 155, collector: 167 };
const ECD = { x: STUB.ecd, y: 100 };
const NUT_TOP = 178;
const NEEDLE = { rest: NUT_TOP + 28, r: 0.5, len: 30 };
const TOWER_TOP = NEEDLE.rest + 78;

const MOVES = {
  sampler: [0, 0, -44],
  plunger: [0, 0, -44],
  tray: [10, 0, 0],
  swap: [BAY, 0, 0],
  gate: [0, -74, 0],
};
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

const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [INLET.x - 16, 44, TOWER_TOP + 10], [INLET.x + 16, 84, TOWER_TOP + 10]], W, H, { pad: 10, azimuth: AZ, elevation: EL });
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
  const STRIP = { x: -120, y: PLATE.y + PLATE.d - 9, w: 240, d: 5, r: 1 };
  back.push(S(k.slabOf(STRIP, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(STRIP.x + 4, STRIP.x + STRIP.w - 4, 4, 5, STRIP.y, 0.6, [1.6, 3.2], P);
  back.push(Ln(ticks.minor, { tone: "lo" }), Ln(ticks.major, { tone: "mid" }));
}
function vial(name, x, y, z, piece) {
  const F = G.frameOf([x, y, z], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  disc(`${name}.glass`, F, 0, 9, 3, { tone: "hi" }, { piece, inner: Ln(G.arcOf(F, 5.6, 3, P), { tone: "lo" }), owner: name });
  disc(`${name}.cap`, F, 9, 12, 3.3, { tone: "mid" }, { piece, owner: name, bevel: 0.3, extra: Dots([at([x, y, z + 12])], { size: 0.5, tone: "hi" }) });
}

// ---------- the case: one box ----------
for (const [x, y] of byDepth([[-130, 18], [130, 18], [-130, 152], [130, 152]])) {
  const F = G.frameOf([x, y, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  put("foot", [x, y, 3], S(G.disc(0, Z.plinth, 7, F, P, { steps: 20 }), { tone: "lo" }), [record(A.disc(F, 0, Z.plinth, 7, { name: "foot" }))]);
}
const CAV = "cavity";
const sideSeam = (plan, z) => Ln(k.sideSeam(plan, z, P, 2), { tone: "faint" });
const PL = OPEN.x0 - 3; // left partition centre
const PR = OPEN.x1 + 3; // right partition centre
box("plinth", [CASE.x0, 0, Z.plinth], [CASE.x1, CASE.y1, Z.shell], { tone: "lo" }, { r: 3, steps: 3 });
box("back", [CASE.x0, 0, Z.shell], [CASE.x1, 14, Z.top], {}, { r: 1 });
box("rear.left", [CASE.x0, 14, Z.shell], [PL - 3, WALL_Y, Z.top], { tone: "lo" }, { cls: CAV });
box("rear.mid", [PL + 3, 14, Z.shell], [PR - 3, WALL_Y, Z.top], { tone: "lo" }, { cls: CAV });
box("rear.right", [PR + 3, 14, Z.shell], [CASE.x1, WALL_Y, Z.top], {}, {});
box("wall.left", [CASE.x0, WALL_Y, Z.shell], [CASE.x0 + 4, CASE.y1 - 4, Z.top], { tone: "lo" }, { cls: CAV });
box("wall.right", [CASE.x1 - 4, WALL_Y, Z.shell], [CASE.x1, CASE.y1 - 4, Z.top], {}, {
  extra: Ln(Array.from({ length: 8 }, (_, i) => path3([[CASE.x1, 100 + i * 7, 40], [CASE.x1, 104 + i * 7, 40], [CASE.x1, 104 + i * 7, 72], [CASE.x1, 100 + i * 7, 72]], true)).join(""), { tone: "lo" }),
});
for (const [x0, x1] of [[CASE.x0 + 4, PL - 3], [PL + 3, PR - 3], [PR + 3, CASE.x1 - 4]]) {
  box("floor", [x0, WALL_Y, Z.shell], [x1, CASE.y1 - 4, Z.floor], { tone: "lo" }, { cls: CAV, extra: x0 === PL + 3 ? Ln(Array.from({ length: 5 }, (_, i) => k.planOutline({ x: x0 + 5 + i * 22, y: 98, w: 16, d: 3, r: 1.4 }, Z.floor, P, 3)).join(""), { tone: "lo" }) : "" });
}
// The cold bays are closed off by the partition headers and pocket gates, which sit behind the case front.
for (const px of [PL, PR]) {
  const x0 = px - 3;
  const x1 = px + 3;
  box("header", [x0, WALL_Y, Z.gate], [x1, CASE.y1 - 4, Z.top], { tone: "lo" }, { cls: CAV });
  box("floor.slot", [x0, WALL_Y, Z.shell], [x1, CASE.y1 - 4, Z.floor], { tone: "lo" }, { cls: CAV });
  box("gate", [x0 + 1.5, WALL_Y, Z.floor], [x1 - 1.5, CASE.y1 - 6, Z.gate], { tone: "lo" }, { piece: "gate", cls: CAV, extra: screws([[x1 - 1.5, 150, 100], [x1 - 1.5, 150, 46]]) });
}
// The case front: left is what remains of the oven door, right is the control panel. The cutaway lies between.
{
  const y0 = CASE.y1 - 4;
  const y1 = CASE.y1;
  const doorPlan = { x: CASE.x0, y: y0, w: OPEN.x0 - CASE.x0, d: 4, r: 0.4 };
  box("door", [CASE.x0, y0, Z.shell], [OPEN.x0, y1, Z.top], { tone: "hi" }, {
    inner: sideSeam(doorPlan, Z.shell + 4) + sideSeam(doorPlan, Z.top - 4),
    extra: Ln(Array.from({ length: 9 }, (_, i) => path3([[-136 + i * 6.6, y1, 44], [-132 + i * 6.6, y1, 44], [-132 + i * 6.6, y1, 66], [-136 + i * 6.6, y1, 66]], true)).join(""), { tone: "lo" }) + screws([[-147, y1, 34], [-71, y1, 34], [-147, y1, 126], [-71, y1, 126]]),
  });
  const panelPlan = { x: OPEN.x1, y: y0, w: CASE.x1 - OPEN.x1, d: 4, r: 0.4 };
  box("panel", [OPEN.x1, y0, Z.shell], [CASE.x1, y1, Z.top], { tone: "hi" }, { inner: sideSeam(panelPlan, Z.shell + 4) + sideSeam(panelPlan, Z.top - 4) });
  // Door handle and hinges on the remaining door.
  for (const z of [84, 118]) disc("door.standoff", G.frameAlong([-80, y1, z], [0, 1, 0]), 0, 3.4, 1.4, { tone: "lo" }, { steps: 12 });
  disc("door.handle", G.frameOf([-80, y1 + 5, 80], [0, 0, 1], [1, 0, 0], [0, 1, 0]), 0, 42, 1.8, { tone: "hi" }, { steps: 16 });
  for (const z of [50, 110]) {
    box("door.hingeleaf", [CASE.x0, y1, z - 5], [CASE.x0 + 5, y1 + 0.8, z + 5], { tone: "lo" }, { extra: screws([[CASE.x0 + 4.2, y1 + 0.8, z - 3.6], [CASE.x0 + 4.2, y1 + 0.8, z + 3.6]], 0.4) });
    disc("door.hinge", G.frameOf([CASE.x0 + 2, y1 + 2.2, z], [0, 0, 1], [1, 0, 0], [0, 1, 0]), -6, 6, 1.4, { tone: "mid" }, { steps: 12 });
  }
  box("sill", [OPEN.x0, y0, Z.shell], [OPEN.x1, y1 + 2, Z.floor + 2], { tone: "mid" }, {});
}
// Roof in one sheet, with the corner over the oven cut back so the stems and pigtails show.
{
  const left = { x: CASE.x0, y: 0, w: OPEN.x0 - CASE.x0, d: CASE.y1, r: 0.4 };
  const mid = { x: OPEN.x0, y: 0, w: OPEN.x1 - OPEN.x0, d: ROOF_Y, r: 0.4 };
  const right = { x: OPEN.x1, y: 0, w: CASE.x1 - OPEN.x1, d: CASE.y1, r: 0.4 };
  const slots = (x0, y0, n) => Ln(Array.from({ length: n }, (_, i) => k.planOutline({ x: x0 + i * 7, y: y0, w: 3.4, d: 40, r: 1.6 }, Z.deck, P, 3)).join(""), { tone: "lo" });
  box("roof.left", [left.x, left.y, Z.top], [left.x + left.w, left.d, Z.deck], { tone: "hi" }, { r: 0.4, bevel: 0.6, inner: sideSeam(left, Z.top + 2.4), extra: slots(-142, 28, 9) + screws([[-146, 166, Z.deck], [-72, 166, Z.deck], [-146, 4, Z.deck]]) });
  box("roof.mid", [mid.x, 0, Z.top], [mid.x + mid.w, ROOF_Y, Z.deck], { tone: "hi" }, { r: 0.4, bevel: 0.6, inner: sideSeam(mid, Z.top + 2.4) + sideSeam(mid, Z.deck - 2) });
  box("roof.right", [right.x, 0, Z.top], [CASE.x1, CASE.y1, Z.deck], { tone: "hi" }, { r: 0.4, bevel: 0.6, inner: sideSeam(right, Z.top + 2.4), extra: slots(80, 118, 9) + screws([[54, 166, Z.deck], [146, 166, Z.deck], [146, 4, Z.deck]]) });
}
// Hinged inlet and detector cover plate on the deck: seam, hinge barrels and a lift handle.
{
  const plan = { x: -66, y: 36, w: 112, d: 74, r: 0.8 };
  box("deck.cover", [plan.x, plan.y, Z.deck], [plan.x + plan.w, plan.y + plan.d, Z.deck + 0.5], { tone: "mid" }, { r: 0.8, extra: screws(k.corners(plan, 3).map(([x, y]) => [x, y, Z.deck + 0.5])) });
  for (const x of [28, 40]) disc("deck.hinge", G.frameOf([x - 3, 34.6, Z.deck + 1.4], [1, 0, 0], [0, 1, 0], [0, 0, 1]), 0, 6, 1.4, { tone: "mid" }, { steps: 10 });
}

// ---------- oven interior ----------
{
  const c = { x: -34, z: 72 };
  const F = G.frameOf([c.x, WALL_Y, c.z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  const blades = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2;
    const pt = (r, da) => [r * Math.cos(a + da), r * Math.sin(a + da)].map(f2).join(" ");
    return `M${pt(4, 0)}Q${pt(13, 0.25)} ${pt(24, 0.12)}L${pt(24, 0.5)}Q${pt(13, 0.6)} ${pt(4, 0.6)}Z`;
  }).join("");
  const guard = [28, 21, 14].map((r) => `M${r} 0A${r} ${r} 0 1 1 ${-r} 0A${r} ${r} 0 1 1 ${r} 0Z`).join("");
  const spokes = Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI) / 3 + 0.26;
    return `M${f2(4 * Math.cos(a))} ${f2(4 * Math.sin(a))}L${f2(28 * Math.cos(a))} ${f2(28 * Math.sin(a))}`;
  }).join("");
  put("fan", [c.x, WALL_Y + 0.5, c.z], `<g transform="${yFace(c.x, WALL_Y + 0.02, c.z)}"><circle class="gc-fan-hole" r="28"/><g data-part="fan"><path class="gc-blade" d="${blades}"/></g><circle class="gc-fan-hub" r="4"/><path class="gc-guard" d="${guard}${spokes}"/></g>`, [record(A.disc(F, 0, 0.5, 28, { name: "fan" }))], { cls: CAV });
  ringPart("heater", F, 2, 3.4, 29.6, 31.2, { tone: "hi" }, { cls: "heater", steps: 36 });
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    disc("heater.post", G.frameAlong([c.x + 30.4 * Math.cos(a), WALL_Y, c.z + 30.4 * Math.sin(a)], [0, 1, 0]), 0, 2, 0.8, { tone: "lo" }, { cls: CAV, steps: 10 });
  }
  // Rear vent flap, up and to the right of the fan: it exhausts the oven when it cools.
  box("vent.frame", [-58, WALL_Y, 106], [-14, WALL_Y + 1, 124], { tone: "lo" }, { cls: CAV });
  box("vent.flap", [-56.6, WALL_Y + 1, 107.4], [-15.4, WALL_Y + 1.8, 122.6], { tone: "mid" }, { cls: CAV, extra: `<g transform="${yFace(-56.6, WALL_Y + 1.82, 122.6)}"><rect class="gc-slot" width="41.2" height="15.2"/><rect data-part="flap" class="gc-flap" width="41.2" height="15.2"/></g>` });
  const PF = G.frameOf([-65, WALL_Y, 44], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  disc("oven.probe.boss", PF, 0, 2, 2, { tone: "mid" }, { cls: CAV, steps: 12 });
  disc("oven.probe", PF, 2, 18, 0.7, { tone: "hi" }, { cls: CAV, steps: 10 });
}
// Rail: sections end in brackets on the outer walls and partition headers.
// The left section only reaches the parked trolley's bay, behind the door.
for (const [x0, x1] of [[CASE.x0 + 4, -118], [PL + 3, PR - 3], [PR + 3, CASE.x1 - 4]]) {
  const y = LANE_Y;
  const z = Z.rail;
  disc("rail", G.frameOf([x0, y, z], [1, 0, 0], [0, 1, 0], [0, 0, 1]), 0, x1 - x0, 1, { tone: "hi" }, { steps: 12 });
  for (const [x, sgn] of [[x0, 1], [x1, -1]]) box("rail.bracket", [sgn > 0 ? x : x - 2.4, y - 2.4, z + 1], [sgn > 0 ? x + 2.4 : x, y + 2.4, Z.gate + 2], { tone: "mid" }, { extra: screws([[x + sgn * 1.2, y + 2.4, z + 3]], 0.4) });
}
// Column cages: the wound coil is the mass; the cage is thin wire with two hanger tabs.
const COILS = [{ x: CX, ch: 0, out: 0 }, { x: CX - BAY, ch: 1, out: 26 }];
const COIL = { y: LANE_Y, z: Z.cz, rIn: 28, rOut: 30, half: 7 };
for (const coil of COILS) {
  const F = G.frameOf([coil.x, COIL.y, COIL.z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  const own = `cage${coil.ch}`;
  const piece = "swap";
  const outer = [];
  for (let i = 0; i < 16; i++) outer.push(G.arcOf(F, -6.4 + i * 0.85, COIL.rOut, P));
  const face = [];
  for (let i = 0; i < 3; i++) face.push(G.circleOf(F, COIL.half, COIL.rIn + 0.5 + i * 0.5, P, 44));
  const inner = [];
  for (let i = 0; i < 5; i++) inner.push(G.arcOf(F, -6 + i * 2.6, COIL.rIn, P, { inward: true, least: -0.15 }));
  const mk = (list, base) => list.map((d, i) => `<path class="iso-line gc-turn" data-tone="lo" data-ch="${coil.ch}" data-turn="${base + i}" d="${d}"/>`).join("");
  ringPart(`coil${coil.ch}`, F, -COIL.half, COIL.half, COIL.rIn, COIL.rOut, { tone: "mid", crease: "faint" }, { owner: own, piece, cls: "coil", extra: mk(outer, 0) + mk(face, 16), under: mk(inner, 19), steps: 40 });
  // The cage: two thin wire hoops, cross wires, and a spider of wire spokes at the front to a small hub.
  for (const s of [-COIL.half - 0.5, COIL.half]) ringPart(`cage${coil.ch}.hoop`, F, s, s + 0.5, COIL.rOut, COIL.rOut + 0.6, { tone: "mid" }, { owner: own, piece, steps: 28 });
  const sy = COIL.y + COIL.half + 0.25;
  disc(`cage${coil.ch}.hub`, G.frameOf([coil.x, sy, COIL.z], [0, 1, 0], [1, 0, 0], [0, 0, 1]), -0.25, 0.25, 1.5, { tone: "hi" }, { owner: own, piece, steps: 12 });
  for (const deg of [30, 150, 270]) {
    const a = (deg * Math.PI) / 180;
    const u = [Math.cos(a), 0, Math.sin(a)];
    disc(`cage${coil.ch}.spoke`, G.frameAlong(G.add3([coil.x, sy, COIL.z], G.mul3(u, 1.4)), u), 0, COIL.rOut - 1.4, 0.2, { tone: "mid" }, { owner: own, piece, steps: 6 });
  }
  for (const a of [Math.PI * 0.5 + 2.2, Math.PI * 0.5 - 2.2, -Math.PI / 2]) {
    const o = [coil.x + (COIL.rOut + 0.9) * Math.cos(a), COIL.y, COIL.z + (COIL.rOut + 0.9) * Math.sin(a)];
    disc(`cage${coil.ch}.wire`, G.frameAlong(o, [0, 1, 0]), -COIL.half - 0.5, COIL.half + 0.5, 0.3, { tone: "mid" }, { owner: own, piece, steps: 6 });
  }
  const top = Z.rail - 4;
  box(`cage${coil.ch}.trolley`, [coil.x - 10, COIL.y - 2, top], [coil.x + 10, COIL.y + 2, Z.rail - 1], { tone: "mid" }, { piece, owner: own, extra: screws([[coil.x - 8, COIL.y + 2, top + 1.5], [coil.x + 8, COIL.y + 2, top + 1.5]], 0.35) });
  for (const dx of [-9, 8]) box(`cage${coil.ch}.tab`, [coil.x + dx, COIL.y - 0.8, COIL.z + 29], [coil.x + dx + 1, COIL.y + 0.8, top], { tone: "lo" }, { piece, owner: own });
  box(`cage${coil.ch}.arm`, [coil.x + 5, STUB.y + 2, top], [coil.x + 8, COIL.y - 2, top + 1.4], { tone: "lo" }, { piece, owner: own });
  box(`cage${coil.ch}.armpost`, [coil.x + 5, STUB.y + 2, top + 1.4], [coil.x + 8, STUB.y + 5, Z.gate - 3], { tone: "lo" }, { piece, owner: own });
  box(`cage${coil.ch}.ferrulebar`, [coil.x - 32, STUB.y - 2, Z.gate - 3], [coil.x + 32, STUB.y + 2, Z.gate - 0.15], { tone: "mid" }, { piece, owner: own, extra: screws([[coil.x - 30, STUB.y + 2, Z.gate - 1.5], [coil.x + 30, STUB.y + 2, Z.gate - 1.5]], 0.35) });
  const tail = (name, dx, stubDx, side, kind) => {
    const startR = COIL.rOut - 0.5;
    const start = [coil.x + dx, COIL.y - COIL.half, COIL.z + Math.sqrt(startR * startR - dx * dx)];
    const cz = start[2] + 3;
    const cx = coil.x + dx + side * 2;
    const pts = [start, [start[0], start[1] - 2.5, start[2]]];
    const yy = start[1] - 3.2;
    for (let i = 0; i <= 18; i++) {
      const a = -Math.PI / 2 + (i / 18) * Math.PI * 2 * side;
      pts.push([cx + 3 * Math.cos(a), yy - (i / 18) * 1.6, cz + 3 * Math.sin(a)]);
    }
    const end = [coil.x + stubDx, STUB.y, Z.gate - 3];
    pts.push([(cx + end[0]) / 2, (yy + STUB.y) / 2, cz + 2], [end[0], STUB.y, end[2] - 5], end);
    line(name, pts, 0.22, { raw: false, bend: 1, shells: [false, true], piece, touch: [own, `cage${coil.ch}*`, `coil${coil.ch}`, "rail", `cage${coil.ch}.ferrulebar`], cls: "tail", attrs: ` data-tail="${coil.ch}" data-seg="${kind}"` });
  };
  tail(`tail${coil.ch}.in`, -15, -26, -1, "in");
  tail(`tail${coil.ch}.out`, coil.out > 0 ? 16 : -3, coil.out, coil.out > 0 ? 1 : -1, "out");
}
// Stems through the roof: inlet to column, column to detector.
for (const [name, x] of [["inlet", STUB.inlet], ["fid", STUB.fid], ["ecd", STUB.ecd]]) {
  const F = G.frameOf([x, STUB.y, Z.gate], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  disc(`stub.${name}`, F, 3.4, Z.top - Z.gate, 1.8, { tone: "hi" }, { steps: 14, attrs: ` data-stem="${name}"` });
  disc(`stub.${name}.nut`, F, 0, 3.4, 2.8, { tone: "mid" }, { steps: 6 });
}

// ---------- inlet: block with a window on its liner ----------
{
  const inlet = INLET;
  const F = G.frameOf([inlet.x, inlet.y, Z.deck], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  const fy = inlet.y + 12;
  const plan = { x: inlet.x - 12, y: inlet.y - 12, w: 24, d: 24, r: 0.8 };
  const liner = `<g transform="${yFace(inlet.x, fy, Z.deck + 9)}"><rect class="gc-liner-win" x="-5" y="-6" width="10" height="12" rx=".6"/><rect class="gc-liner" x="-1.6" y="-6" width="3.2" height="12"/><circle data-part="vapour" class="gc-vapour" r="1.2" opacity="0"/></g>`;
  box("inlet.block", [plan.x, plan.y, Z.deck], [plan.x + 24, plan.y + 24, Z.deck + 16], { tone: "mid" }, { r: 0.8, bevel: 0.4, extra: liner + Dots([[-10, -10], [10, -10], [-10, 10], [10, 10]].map(([dx, dy]) => at([inlet.x + dx, inlet.y + dy, Z.deck + 16])), { size: 0.5, tone: "hi" }) });
  disc("inlet.body", F, 16, 26, 8.4, { tone: "hi" }, { steps: 40, inner: Ln(G.arcOf(F, 18.5, 8.4, P) + G.arcOf(F, 21, 8.4, P) + G.arcOf(F, 23.5, 8.4, P), { tone: "faint" }) });
  disc("inlet.shoulder", F, 26, 28, 5.6, { tone: "mid" }, { steps: 28 });
  disc("inlet.nut", F, 28, NUT_TOP - Z.deck, 7, { tone: "hi" }, {
    steps: 44, bevel: 0.5, attrs: ' data-part="nut"',
    extra: Faded(G.ribsOf(F, 28.5, NUT_TOP - Z.deck - 0.5, 7, 28, P, { fade: [0.08, 0.5], seams: true }), { tone: "lo" }) + Ln(G.circleOf(F, NUT_TOP - Z.deck, 2.1, P, 20), { tone: "mid" }) + Dots([at([inlet.x, inlet.y, NUT_TOP])], { size: 0.9, tone: "lo" }),
  });
}
// Charcoal trap on the split vent, on the left of the deck, with an engraved VENT port.
const TRAP = { x: -108, y: 100 };
{
  const F = G.frameOf([TRAP.x, TRAP.y, Z.deck], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  box("trap.base", [TRAP.x - 10, TRAP.y - 10, Z.deck], [TRAP.x + 8, TRAP.y + 10, Z.deck + 2], { tone: "lo" });
  disc("trap.can", F, 2, 28, 8, { tone: "hi" }, { steps: 32, bevel: 0.5, inner: Ln(G.arcOf(F, 6, 8, P) + G.arcOf(F, 24, 8, P), { tone: "faint" }) });
  disc("trap.cap", F, 28, 31, 3, { tone: "mid" }, { steps: 6 });
  const fy = TRAP.y + 10;
  box("trap.bulkhead", [TRAP.x + 8, TRAP.y - 10, Z.deck], [TRAP.x + 12, fy, Z.deck + 12], { tone: "mid" }, { extra: screws([[TRAP.x + 10, TRAP.y - 8, Z.deck + 12], [TRAP.x + 10, TRAP.y + 8, Z.deck + 12]], 0.4) + `<g transform="${xFace(TRAP.x + 12, TRAP.y - 7, Z.deck + 10)}"><text class="gc-engrave gc-small" x="7" y="1">SPLIT VENT</text></g>` });
}

// ---------- autosampler tower standing on the case ----------
const T0 = INLET;
const SY = INLET.y;
{
  const ty0 = 46;
  const ty1 = 74;
  const TX0 = T0.x - 12;
  const TX1 = T0.x + 12;
  const FOOT = 158;
  const TOP = TOWER_TOP;
  box("tower.base", [T0.x - 14, ty0 - 4, Z.deck + 0.5], [T0.x + 14, ty1 + 6, Z.deck + 3], { tone: "lo" }, { r: 1 });
  box("tower.foot", [TX0 - 2, ty0 - 2, Z.deck + 3], [TX1 + 2, ty1 + 6, FOOT], { tone: "mid" }, { r: 2, steps: 3, bevel: 0.4 });
  const towerPlan = { x: TX0, y: ty0, w: 24, d: 28, r: 1.6 };
  box("tower.column", [TX0, ty0, FOOT], [TX1, ty1, TOP], { tone: "hi" }, {
    r: 1.6, steps: 3,
    inner: Ln(k.sideSeam(towerPlan, 168, P, 3) + k.sideSeam(towerPlan, TOP - 10, P, 3), { tone: "faint" }),
    extra: Ln(Array.from({ length: 7 }, (_, i) => path3([[TX1, 51 + i * 3, 228], [TX1, 52.6 + i * 3, 228], [TX1, 52.6 + i * 3, 252], [TX1, 51 + i * 3, 252]], true)).join(""), { tone: "lo" }),
  });
  box("tower.head", [TX0 - 2, ty0 - 2, TOP], [TX1 + 2, ty1 + 6, TOP + 10], { tone: "hi" }, { r: 2, steps: 3, bevel: 0.6, extra: Dots([[-10, -11], [10, -11], [-10, 16], [10, 16]].map(([a, b]) => at([T0.x + a, 60 + b - 1, TOP + 10])), { size: 0.45 }) });
  for (const dx of [-7, 7]) disc("tower.guide", G.frameOf([T0.x + dx, ty1 + 3, FOOT], [0, 0, 1], [1, 0, 0], [0, 1, 0]), 0, TOP - FOOT, 1, { tone: "mid" }, { steps: 12 });
  disc("tower.screw", G.frameOf([T0.x, ty1 + 3, FOOT], [0, 0, 1], [1, 0, 0], [0, 1, 0]), 0, TOP - FOOT, 0.9, { tone: "lo" }, { steps: 10 });
  const SAM = "sampler";
  const tip = NEEDLE.rest;
  const barrelLo = tip + NEEDLE.len;
  const F = G.frameOf([T0.x, SY, tip], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  const clipTo = (id, z) => `<clipPath id="${id}"><path d="${path3([[T0.x - 12, SY, z], [T0.x + 12, SY, z], [T0.x + 12, SY, 320], [T0.x - 12, SY, 320]], true)}"/></clipPath>`;
  put("needle", [T0.x, SY, tip + 15], `${clipTo("gc-needle-clip", NUT_TOP)}<g clip-path="url(#gc-needle-clip)"><g data-part="needle-move">${S(G.disc(0, NEEDLE.len, NEEDLE.r, F, P, { steps: 10 }), { tone: "hi" })}</g></g>`, [record(A.disc(F, 0, NEEDLE.len, NEEDLE.r, { name: "needle", owner: SAM }))], { piece: SAM, attrs: ' data-inner=""', bias: 0.3 });
  const sp = { piece: SAM, owner: SAM };
  disc("syringe.hub", F, NEEDLE.len, NEEDLE.len + 2, 1.6, { tone: "mid" }, sp);
  disc("syringe.barrel", F, NEEDLE.len + 2, 37, 2.6, { tone: "hi" }, { ...sp, inner: Ln([34, 36].map((s) => G.arcOf(F, s, 2.6, P)).join(""), { tone: "lo" }) });
  box("syringe.clamp", [T0.x - 5, SY - 4, barrelLo + 7], [T0.x + 5, SY + 4, barrelLo + 13], { tone: "mid" }, { ...sp, bevel: 0.3 });
  disc("syringe.barrel", F, 43, 52, 2.6, { tone: "hi" }, { ...sp, inner: Ln([45, 47, 49].map((s) => G.arcOf(F, s, 2.6, P)).join(""), { tone: "lo" }) });
  disc("syringe.flange", F, 52, 53.4, 4.2, { tone: "mid" }, sp);
  box("sampler.block", [T0.x - 10, ty1 + 4, barrelLo + 2], [T0.x + 10, ty1 + 8, barrelLo + 18], { tone: "hi" }, { piece: SAM, bevel: 0.4, r: 0.8, extra: screws([[T0.x - 8, ty1 + 8, barrelLo + 4], [T0.x + 8, ty1 + 8, barrelLo + 4], [T0.x - 8, ty1 + 8, barrelLo + 16], [T0.x + 8, ty1 + 8, barrelLo + 16]], 0.4) });
  box("sampler.arm", [T0.x - 4, ty1 + 8, barrelLo + 8], [T0.x + 4, SY - 4, barrelLo + 12], { tone: "mid" }, sp);
  const pl = barrelLo + 30;
  const flangeZ = tip + 53.4;
  put("plunger.rod", [T0.x, SY, flangeZ + 4], `${clipTo("gc-rod-clip", flangeZ)}<g clip-path="url(#gc-rod-clip)"><g data-part="rod-move">${S(G.disc(53.4 - 8, pl - tip, 0.9, F, P, { steps: 12 }), { tone: "mid" })}</g></g>`, [record(A.disc(F, 53.4, pl - tip, 0.9, { name: "plunger.rod", owner: SAM }))], { piece: SAM });
  const pk = { piece: "plunger", owner: SAM };
  disc("plunger.head", F, pl - tip, pl - tip + 1.6, 3.2, { tone: "hi" }, { ...pk, attrs: ' data-part="plunger-head"' });
  box("plunger.driver", [T0.x - 3, ty1 + 4, pl + 1.6], [T0.x + 3, SY + 3, pl + 4.4], { tone: "mid" }, pk);
  const SHELF_Z = NUT_TOP + 4;
  const shelfPlan = { x: T0.x - 56, y: ty1 + 4, w: 64, d: SY - 4.2 - ty1 - 4, r: 0.4 };
  box("shelf", [shelfPlan.x, ty1 + 4, SHELF_Z - 2.4], [shelfPlan.x + 64, SY - 4.2, SHELF_Z], { tone: "mid" }, { bevel: 0.3, extra: Ln(k.planOutline({ x: shelfPlan.x + 1, y: ty1 + 5.4, w: 62, d: SY - 7 - ty1 - 4, r: 0.6 }, SHELF_Z, P, 2), { tone: "lo" }) });
  box("rack", [T0.x - 46, SY - 5, SHELF_Z], [T0.x - 5.4, SY + 5, SHELF_Z + 1.6], { tone: "lo" }, { piece: "tray" });
  for (let i = 0; i < 4; i++) vial("rack.vial", T0.x - 10 - i * 9.6, SY, SHELF_Z + 1.6, "tray");
}

// ---------- detectors on the deck, over the oven ----------
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
  put("fid", [FLAME.x, 100, 160], svg, [record(A.slab(plan, Z.deck, f.z1 - Z.deck, { name: "fid" }, 2))]);
  const CH = G.frameOf([FLAME.x - 4, 94, f.z1], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  disc("fid.chimney", CH, 0, 12, 3, { tone: "hi" }, { steps: 24, inner: Ln(G.arcOf(CH, 4, 3, P), { tone: "faint" }) });
  disc("fid.chimneycap", CH, 12, 14, 4.2, { tone: "mid" }, { steps: 24 });
  const PLG = G.frameOf([FLAME.x + 6, 100, f.z1], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  disc("fid.insulator", PLG, 0, 5, 2.4, { tone: "hi" }, { steps: 20, inner: Ln(G.arcOf(PLG, 2.5, 2.4, P), { tone: "lo" }) });
}
{
  const e = ECD;
  const fy = e.y + 12;
  // A trefoil plate: the standard radiation mark on the Ni-63 cell.
  const blade = (deg) => {
    const a0 = ((deg - 30 - 90) * Math.PI) / 180;
    const a1 = ((deg + 30 - 90) * Math.PI) / 180;
    const r0 = 1.1;
    const r1 = 4.1;
    return `M${f2(r0 * Math.cos(a0))} ${f2(r0 * Math.sin(a0))}L${f2(r1 * Math.cos(a0))} ${f2(r1 * Math.sin(a0))}A${r1} ${r1} 0 0 1 ${f2(r1 * Math.cos(a1))} ${f2(r1 * Math.sin(a1))}L${f2(r0 * Math.cos(a1))} ${f2(r0 * Math.sin(a1))}A${r0} ${r0} 0 0 0 ${f2(r0 * Math.cos(a0))} ${f2(r0 * Math.sin(a0))}Z`;
  };
  const plate = `<g transform="${yFace(e.x, fy, Z.deck + 7.6)}"><rect class="gc-rad-plate" x="-10.6" y="-5.6" width="21.2" height="11.2" rx=".6"/><g transform="translate(-5.4 0)"><path class="gc-rad" d="${blade(0)}${blade(120)}${blade(240)}"/><circle class="gc-rad" r=".7"/></g><text class="gc-rad-text" x="4.6" y="1.2" text-anchor="middle">Ni-63</text></g>`;
  box("ecd.block", [e.x - 12, e.y - 12, Z.deck], [e.x + 12, fy, Z.deck + 14], { tone: "mid" }, { r: 0.8, bevel: 0.4, extra: plate + Dots([[-10, -10], [10, -10], [-10, 10], [10, 10]].map(([a, b]) => at([e.x + a, e.y + b, Z.deck + 14])), { size: 0.45, tone: "hi" }) });
  const cell = G.frameOf([e.x, e.y, Z.deck + 14], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  disc("ecd.can", cell, 0, 18, 9, { tone: "hi" }, { steps: 40, bevel: 0.6, extra: Faded(G.ribsOf(cell, 1.4, 15, 9, 28, P, { fade: [0.08, 0.5], seams: true }), { tone: "lo" }) });
  disc("ecd.neck", cell, 18, 21, 3.4, { tone: "mid" }, { steps: 20 });
  disc("ecd.vent", cell, 21, 25, 1.2, { tone: "hi" }, { steps: 10 });
  disc("ecd.ventnut", cell, 25, 28, 2.6, { tone: "mid" }, { steps: 6 });
  disc("ecd.vent", cell, 28, 34, 1.2, { tone: "hi" }, { steps: 10 });
  disc("ecd.pulse", G.frameAlong([e.x + 9, e.y + 2, Z.deck + 22], [1, 0, 0]), 0, 5, 2.2, { tone: "mid" }, { steps: 18 });
}

// ---------- gas: a labelled bulkhead bar at the back of the deck ----------
const BAR = { x0: -104, x1: 60, y0: 4, y1: 26, z1: Z.deck + 18 };
const GAS = Z.deck + 8;
const PORTS = { carrier: -92, h2: -18, air: -10, makeup: -2 };
{
  const plan = { x: BAR.x0, y: BAR.y0, w: BAR.x1 - BAR.x0, d: BAR.y1 - BAR.y0, r: 0.8 };
  const labels = [["CARRIER", PORTS.carrier + 6, 0], ["H2", PORTS.h2, 0], ["AIR", PORTS.air, 0], ["MAKEUP", PORTS.makeup + 12, 0]];
  const text = labels.map(([t, x]) => `<text class="gc-engrave gc-port" x="${x}" y="${-(GAS + 5.6)}" text-anchor="middle">${t}</text>`).join("");
  box("bar", [BAR.x0, BAR.y0, Z.deck], [BAR.x1, BAR.y1, BAR.z1], { tone: "mid" }, {
    r: 0.8, bevel: 0.5, inner: sideSeam(plan, Z.deck + 3),
    extra: `<g transform="${yFace(0, BAR.y1, 0)}">${text}</g>` + screws(k.corners(plan, 3).map(([x, y]) => [x, y, BAR.z1])),
  });
  for (const [i, x] of [-60, -74, 14, 32, 48].entries()) {
    const F = G.frameOf([x, 15, BAR.z1], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
    disc("bar.valve", F, 0, 6, 3.6, { tone: "hi" }, { steps: 22, bevel: 0.4, inner: Ln(G.arcOf(F, 2, 3.6, P), { tone: "faint" }) });
    disc("bar.valvecap", F, 6, 8, 1.8, { tone: "mid" }, { steps: 14 });
  }
}
// Four feeds up the right side, clamped every 60 units, in through the bar's end.
const LANES = [9, 13, 17, 21];
const SIDE_X = CASE.x1 + 7;
const CLAMP_Z = [60, 120];
box("gas.block", [CASE.x1 + 1, 4, 0], [CASE.x1 + 14, 26, 10], { tone: "mid" }, { bevel: 0.4, extra: screws([[CASE.x1 + 3, 6, 10], [CASE.x1 + 12, 24, 10]]) + `<g transform="${xFace(CASE.x1 + 14, 6, 6)}"><text class="gc-engrave gc-small">GAS IN</text></g>` });
["carrier", "hydrogen", "air", "makeup"].forEach((name, i) => {
  const y = LANES[i];
  const gaps = CLAMP_Z.map((z) => [z - 10, z - 10 + 3]);
  line(`feed.${name}`, [[SIDE_X, y, 10], [SIDE_X, y, GAS], [BAR.x1, y, GAS]], 0.7, { bend: 4, gaps, touch: ["clamp*"], bundle: "feed" });
});
for (const z of CLAMP_Z) {
  box("clamp", [SIDE_X - 1.6, LANES[0] - 2, z], [SIDE_X + 1.6, LANES[3] + 2, z + 3], { tone: "hi" }, { owner: "clamp", bevel: 0.2 });
  box("clamp.arm", [CASE.x1, 13, z], [SIDE_X - 1.6, 17, z + 3], { tone: "lo" });
}
// Carrier to the inlet, split vent to the trap, hydrogen and air into the FID, makeup through a tee to both detectors.
line("carrier", [[PORTS.carrier, BAR.y1, GAS], [PORTS.carrier, 92, GAS], [INLET.x - 12, 92, GAS]], 0.9, { bend: 5, tone: "hi" });
line("vent", [[INLET.x - 12, 108, GAS], [TRAP.x + 12, 108, GAS]], 0.7, { bend: 3, tone: "mid" });
line("fid.h2", [[PORTS.h2, BAR.y1, GAS], [PORTS.h2, FID.y0, GAS]], 0.9);
line("fid.air", [[PORTS.air, BAR.y1, GAS], [PORTS.air, FID.y0, GAS]], 0.9);
const TEE = [PORTS.makeup, 72, GAS];
{
  const r = 2.2;
  box("tee.post", [TEE[0] - 1, TEE[1] - 1, Z.deck + 0.5], [TEE[0] + 1, TEE[1] + 1, GAS - r + 0.02], { tone: "lo" });
  put("tee", TEE, S(G.sphereOf(TEE, r, P, { steps: 20 }), { tone: "hi" }), [record(A.ball(TEE, r, { name: "tee" }))]);
  const rim = Math.sqrt(r * r - 0.81);
  line("makeup", [[TEE[0], BAR.y1, GAS], [TEE[0], TEE[1] - rim, GAS]], 0.9, { shells: [true, false], ends: [true, false], touch: ["tee"] });
  line("makeup.fid", [[TEE[0], TEE[1] + rim, GAS], [TEE[0], FID.y0, GAS]], 0.9, { shells: [false, true], ends: [false, true], touch: ["tee"] });
  line("makeup.ecd", [[TEE[0] + rim, TEE[1], GAS], [ECD.x, TEE[1], GAS], [ECD.x, ECD.y - 12, GAS]], 0.9, { shells: [false, true], ends: [false, true], touch: ["tee"], bend: 4 });
}
// Right side: rating plate and mains inlet with a cable gland.
{
  const x = CASE.x1;
  box("side.plate", [x, 100, 88], [x + 0.6, 146, 116], { tone: "lo" }, {
    extra: screws([[x + 0.6, 103, 91], [x + 0.6, 143, 91], [x + 0.6, 103, 113], [x + 0.6, 143, 113]]) + Ln([30, 22, 34, 18].map((w, i) => path3([[x + 0.6, 107, 110 - i * 5], [x + 0.6, 107 + w, 110 - i * 5]])).join(""), { tone: "lo", free: true }),
  });
  // A service hatch with seams and a cooling fan behind a guard, so the right face has its own parts.
  box("side.hatch", [x, 22, 70], [x + 0.5, 90, 122], { tone: "lo" }, { extra: screws([[x + 0.5, 25, 73], [x + 0.5, 87, 73], [x + 0.5, 25, 119], [x + 0.5, 87, 119]]) + `<g transform="${xFace(x + 0.52, 56, 96)}"><path class="gc-guard" d="M18 0A18 18 0 1 1 -18 0A18 18 0 1 1 18 0ZM12 0A12 12 0 1 1 -12 0A12 12 0 1 1 12 0ZM6 0A6 6 0 1 1 -6 0A6 6 0 1 1 6 0ZM-18 0H18M0 -18V18"/></g>` });
  box("side.inlet", [x, 36, 34], [x + 3, 60, 50], { tone: "mid" }, { r: 0.8, extra: Dots([[41, 42], [48, 42], [55, 42]].map(([y, z]) => at([x + 3, y, z])), { size: 0.7, tone: "lo" }) });
}
// Electrometer on the deck; signal leads in, then one cable down the right side to the chart recorder on the bench.
const EM = { x0: 48, x1: 84, y0: 74, y1: 106, z1: Z.deck + 12 };
{
  const plan = { x: EM.x0, y: EM.y0, w: EM.x1 - EM.x0, d: EM.y1 - EM.y0, r: 0.8 };
  box("electrometer", [EM.x0, EM.y0, Z.deck], [EM.x1, EM.y1, EM.z1], { tone: "mid" }, { r: 0.8, bevel: 0.4, inner: sideSeam(plan, Z.deck + 3), extra: screws(k.corners(plan, 3).map(([x, y]) => [x, y, EM.z1])) + Ln(Array.from({ length: 5 }, (_, i) => k.planOutline({ x: EM.x0 + 6 + i * 5, y: EM.y0 + 7, w: 2.4, d: 18, r: 1 }, EM.z1, P, 3)).join(""), { tone: "lo" }) });
  line("signal.fid", [[FLAME.x + 6, 100, FID.z1 + 5], [FLAME.x + 6, 100, 194], [EM.x0 + 8, 100, 194], [EM.x0 + 8, 100, EM.z1]], 0.45, { tone: "mid", bend: 4, shells: [false, true] });
  line("signal.ecd", [[ECD.x + 14, ECD.y + 2, Z.deck + 22], [ECD.x + 20, ECD.y + 2, Z.deck + 22], [ECD.x + 20, 92, Z.deck + 8], [EM.x0, 92, Z.deck + 8]], 0.55, { tone: "lo", bend: 3, shells: [false, true] });
}

// ---------- the chart recorder on the bench, in front of the case ----------
// The face's slope is chosen so its up direction projects at right angles to the time axis:
// peaks stand upright on the page instead of shearing (dy/dz = 0.552 at this camera).
const TILT = { yBot: 241.6, zBot: 6, yTop: 214, zTop: 56 };
const REC_X = { x0: -146, x1: 146 };
const eu = G.unit3([0, TILT.yTop - TILT.yBot, TILT.zTop - TILT.zBot]);
const nv = G.unit3([0, TILT.zTop - TILT.zBot, TILT.yBot - TILT.yTop]);
const LEN = Math.hypot(TILT.yTop - TILT.yBot, TILT.zTop - TILT.zBot);
const OF = [0, TILT.yBot, TILT.zBot];
const onFace = (x, v, n = 0) => G.add3(G.add3([x, TILT.yBot, TILT.zBot], G.mul3(eu, v)), G.mul3(nv, n));
const CF = G.frameOf([0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
{
  const section = [[TILT.yTop - 6, 0], [TILT.yBot + 3, 0], [TILT.yBot + 3, TILT.zBot], [TILT.yBot, TILT.zBot], [TILT.yTop, TILT.zTop], [TILT.yTop - 6, TILT.zTop]];
  const shape = record(A.prism(CF, section, REC_X.x0, REC_X.x1, { name: "recorder.case", ground: true }));
  put("recorder.case", [0, 225, 8], S(G.prismOf(CF, section, REC_X.x0, REC_X.x1, P), { tone: "hi" }) + screws([[-146, TILT.yBot + 1.5, TILT.zBot], [146, TILT.yBot + 1.5, TILT.zBot]]), [shape]);
}
const PAPER = { x0: REC_X.x0 + 16, x1: REC_X.x1 - 16, v0: 3, v1: LEN - 3 };
const PLOT = { x0: PAPER.x0 + 4, x1: PAPER.x1 - 4, z0: PAPER.v0 + 8, z1: PAPER.v1 - 2 };
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
      const top = plotV(p.h + 0.02);
      const low = top - 2.4;
      printed.push(`<g class="gc-label" data-label="${p.id}" data-on=""><path class="gc-leader" d="M${f2(x)} ${f2(low)}L${f2(u)} ${f2(top)}"/><text class="gc-code" transform="translate(${f2(x + 1)} ${f2(low - 0.5)}) rotate(-90)">${p.code}</text></g>`);
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
  put("recorder", [80, TILT.yBot, 240], svg, [record(A.prism(G.frameOf(f(0, 0, 0.02), nv, [1, 0, 0], eu), [[REC_X.x0 + 4, 1], [REC_X.x1 - 4, 1], [REC_X.x1 - 4, LEN - 1], [REC_X.x0 + 4, LEN - 1]], 0, 0.5, { name: "recorder" }))], { bias: 3 });
  // Rollers and rails on standoffs in front of the face.
  const RF = (x, n) => G.frameOf(f(x, 1, n), eu, [1, 0, 0], nv);
  for (const x of [PAPER.x0 - 4, PAPER.x1 + 4]) {
    const F = RF(x, 2.6);
    disc("recorder.roller", F, 0, LEN - 2, 2, { tone: "hi" }, { steps: 14, bias: 3.2, extra: Faded(G.ribsOf(F, 0, LEN - 2, 2, 10, P, { fade: [0.15, 0.6] }), { tone: "lo" }) });
  }
  const railN = 5;
  const vRails = [LEN - 2.4, 1.4];
  for (const v of vRails) {
    const F = G.frameOf(f(REC_X.x0 + 5, v, railN), [1, 0, 0], eu, nv);
    disc("recorder.rail", F, 0, REC_X.x1 - REC_X.x0 - 10, 0.8, { tone: "mid" }, { steps: 10, bias: 3.3 });
    for (const x of [REC_X.x0 + 5, REC_X.x1 - 5]) {
      const BF = G.frameOf(f(x, v, 0), nv, [1, 0, 0], eu);
      prism("recorder.block", BF, [[-1.6, -1.8], [1.6, -1.8], [1.6, 1.8], [-1.6, 1.8]], 0.5, railN - 0.8, { tone: "lo" }, { bias: 3.35 });
    }
  }
  const u0 = plotU("dro", 0);
  const bn = railN + 0.8;
  const PF = (v) => G.frameOf(f(u0, v, bn), nv, [1, 0, 0], eu);
  for (const v of vRails) prism("pen.bush", PF(v), [[-2.2, -1.5], [2.2, -1.5], [2.2, 1.5], [-2.2, 1.5]], 0, 1.8, { tone: "mid" }, { bias: 3.5, attrs: "" });
  const postO = f(u0, 2, bn + 2.4);
  const postF = G.frameOf(postO, eu, [1, 0, 0], nv);
  disc("pen.post", postF, 0, LEN - 4, 0.6, { tone: "hi" }, { steps: 10, bias: 3.6 });
  const penN = bn + 3;
  const SF = G.frameOf(f(u0, PLOT.z0, penN), nv, [1, 0, 0], eu);
  prism("pen.slider", SF, [[-2, -2], [2, -2], [2, 2], [-2, 2]], 0, 2.6, { tone: "hi" }, { bias: 3.7 });
  put("pen.tip", f(u0, PLOT.z0, 2), Ln(path3([f(u0, PLOT.z0, penN), f(u0, PLOT.z0, 0)]), { tone: "lit" }) + Dots([at(f(u0, PLOT.z0, 0))], { size: 1, tone: "hi" }), [record(A.tube([f(u0, PLOT.z0, 0.2), f(u0, PLOT.z0, penN)], 0.3, { name: "pen.tip", owner: "pen.slider" }))], { bias: 3.65 });
}
// The signal cable from the electrometer, down the right side, into the recorder's back.
// Clipped to the right face at two heights, it enters the recorder's back through a gland.
line("signal.chart", [[EM.x1, 96, 148], [CASE.x1 + 5, 96, 148], [CASE.x1 + 5, 96, 14], [CASE.x1 + 5, TILT.yTop - 18, 14], [120, TILT.yTop - 18, 14], [120, TILT.yTop - 6, 14]], 0.9, { tone: "hi", bend: 5, gaps: [] , touch: ["chart.clip"] });
for (const z of [60, 110]) box("chart.clip", [CASE.x1, 94, z], [CASE.x1 + 4.1, 98, z + 3], { tone: "lo" }, { extra: screws([[CASE.x1 + 4.1, 94.8, z + 1.5]], 0.3) });

// ---------- control panel ----------
const PANEL = { y: CASE.y1 };
const DIAL = { x: 78, z: 106, r: 18 };
const KNOB = { x: 121, z: 102, r: 10.5 };
const BTN = { x: 121, z: 69, r: 7 };
const LCD = { x0: 59, x1: 99, z0: 72, z1: 84 };
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
  put("lcd", [(LCD.x0 + LCD.x1) / 2, y, (LCD.z0 + LCD.z1) / 2], `<g transform="${yFace(LCD.x0, y, LCD.z1)}"><rect class="gc-lcd-win" width="${LCD.x1 - LCD.x0}" height="${LCD.z1 - LCD.z0}" rx=".8"/><text class="gc-lcd" data-part="lcd-t" x="1.6" y="8.2">40.0</text><text class="gc-lcd" data-part="lcd-m" x="${LCD.x1 - LCD.x0 - 1.6}" y="8.2" text-anchor="end">0.00</text></g>`, [record(A.box([LCD.x0, y, LCD.z0], [LCD.x1, y + 0.4, LCD.z1], { name: "lcd" }))], { bias: 0.2 });
  const KEYS = ["7", "8", "9", "OVEN", "4", "5", "6", "INLET", "1", "2", "3", "DET"];
  KEYS.forEach((key, i) => {
    const x = 59 + (i % 4) * 10.4;
    const z = 56 - Math.floor(i / 4) * 8.6;
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
  put("knob.labels", [KNOB.x, y, KNOB.z - 18], `<g transform="${yFace(KNOB.x, y, KNOB.z)}"><text class="gc-engrave" data-for="dro" x="-11" y="-16.6" text-anchor="middle">DRO/ORO</text><text class="gc-engrave" data-for="haa" x="13" y="-16.6" text-anchor="middle">552.3</text><text class="gc-engrave" x="0" y="20" text-anchor="middle">METHOD</text></g>`, [record(A.box([KNOB.x - 18, y, KNOB.z - 21], [KNOB.x + 18, y + 0.4, KNOB.z - 18], { name: "knob.labels" }))], { bias: 0.1 });
  const BF = G.frameOf([BTN.x, y, BTN.z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  disc("button.ring", BF, 0, 1.4, BTN.r + 2, { tone: "lo" }, { bevel: 0.3, steps: 32 });
  disc("button", BF, 1.4, 4, BTN.r, { tone: "hi" }, { bevel: 0.5, steps: 32 });
  put("button.label", [BTN.x, y, BTN.z - 11], `<g transform="${yFace(BTN.x, y, BTN.z)}"><text class="gc-engrave" y="12.4" text-anchor="middle">INJECT</text></g>`, [record(A.box([BTN.x - 8, y, BTN.z - 13], [BTN.x + 8, y + 0.4, BTN.z - 10], { name: "button.label" }))], { bias: 0.1 });
  for (const [i, name] of ["ready", "run", "fid", "ecd"].entries()) {
    const x = 109 + i * 8;
    const LF = G.frameOf([x, y, 45], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
    disc(`lamp.${name}`, LF, 0, 1, 1.8, { tone: "mid" }, { steps: 14, cls: "lamp", attrs: ` data-lamp="${name}"` });
    put(`lamp.${name}.label`, [x, y, 40], `<g transform="${yFace(x, y, 45)}"><text class="gc-engrave gc-small" y="5.6" text-anchor="middle">${name.toUpperCase()}</text></g>`, [record(A.box([x - 3, y, 38], [x + 3, y + 0.4, 41], { name: `lamp.${name}.label` }))], { bias: 0.1 });
  }
  put("panel.screws", [100, y, 80], screws([[54, 36], [146, 36], [54, 124], [146, 124]].map(([x, z]) => [x, y, z]), 0.5), [record(A.box([53, y, 35], [147, y + 0.4, 125], { name: "panel.screws" }))], { bias: 0.1 });
}

// ---------- settle every pose, then write ----------
const skip = A.sameRun;
A.settle(R, P, { states: [0, ...POSES], skip });
R.items.sort((a, b) => a.key - b.key);
if (process.argv.includes("--rules")) { const n = R.settled.items; const want = /^(rail|rail.bracket|gate|cage1\.(tab|trolley|arm)|coil1|header|door|wall.left|rear.left|floor)/; const seen = new Set(); for (const p of R.settled.overlaps.pairs) { const A1 = n[p.a].name, B1 = n[p.b].name; if (!want.test(A1) || !want.test(B1)) continue; const [fa, fb] = p.front; const f = fa.area >= 0.25 && fb.area < 0.25 ? A1 : fb.area >= 0.25 && fa.area < 0.25 ? B1 : "both"; const key = `${A1}|${B1}|${f}|${p.a}|${p.b}`; if (seen.has(key)) continue; seen.add(key); console.log(`${A1}#${p.a} ${B1}#${p.b} front=${f} ${A.labelOf(p.state)}`); } }
if (process.argv.includes("--dropped")) console.log(R.settled.solved.dropped.map((d) => `${R.settled.items[d.front]?.name ?? d.front} > ${R.settled.items[d.back]?.name ?? d.back} ${d.label ?? ""} ${JSON.stringify(d).slice(0, 120)}`).join("\n"));
const liftOf = (item) => (item.move ? G.dot3(item.move, V) : 0);
const groups = R.items.map((item, i) => `<g class="it" data-name="${item.name}" data-k="${item.key.toFixed(2)}"${item.attrs ?? ""}>${item.svg}</g>`).join("");
const LABEL_TEXT = "A benchtop gas chromatograph, one boxy case with its front top corner cut away over the oven. An autosampler tower stands on top with a syringe over a split/splitless inlet with a knurled septum nut. A stem runs from the inlet through the roof to a wound capillary column on a thin wire cage hanging from a rail, in front of a guarded fan. The outlet pigtail rises to a stem under the flame ionization detector or the electron capture cell, which carries a Ni-63 radiation plate. Labelled gas bulkheads feed the deck. The unused column waits unseen in a cold bay behind the case front. A dial and method selector are on the front panel, and a chart recorder on the bench draws the chromatogram.";
const svg = k.figureSvg({ width: W, height: H, label: LABEL_TEXT, className: "gc-svg", body: [...back, `<g class="gc-items">${groups}</g>`, `<g class="gc-packets" data-part="packets"></g>`] });
const corners = [[WIN.x0 - 3, WIN.y1, WIN.z0 - 3], [WIN.x1 + 3, WIN.y1, WIN.z0 - 3], [WIN.x1 + 3, WIN.y1, WIN.z1 + 3], [WIN.x0 - 3, WIN.y1, WIN.z1 + 3], [FLAME.x - 12, FLAME.y, WIN.z0], [FLAME.x + 12, FLAME.y, WIN.z1]].map(at);
const bx0 = Math.floor(Math.min(...corners.map((c) => c[0])));
const by0 = Math.floor(Math.min(...corners.map((c) => c[1])));
const bx1 = Math.ceil(Math.max(...corners.map((c) => c[0])));
const by1 = Math.ceil(Math.max(...corners.map((c) => c[1])));
const camera = glCamera(P);
// Where a compound travels after it leaves the coil: outlet pigtail, stem through the roof, into the detector.
const flowOf = (name, shift, x, end) => [...R.routes.find((r) => r.name === name).points.map((p) => [p[0] + shift, p[1], p[2]]), [x, STUB.y, Z.gate], [x, STUB.y, Z.deck], end].map((p) => at(p).map(f2));
const FLOWS = { dro: flowOf("tail0.out", 0, STUB.fid, [FLAME.x, FLAME.y, FLAME.jetTop]), haa: flowOf("tail1.out", BAY, STUB.ecd, [ECD.x, ECD.y, Z.deck + 24]) };
const DATA = {
  P, MOVES, FLOWS,
  G: { PLOT, KNOB, ky: PANEL.y, knobR: KNOB.r, u0: plotU("dro", 0), eu, TRAY: 10, PLUNGER: 6.5, TRAVEL: -MOVES.sampler[2] },
  gl: { box: [bx0, by0, bx1 - bx0, by1 - by0], camera: { ...camera, origin: [camera.origin[0] - bx0, camera.origin[1] - by0] }, flame: FLAME, win: WIN },
};
const CSS = readFileSync(join(HERE, "gc.css"), "utf8");
const modelSource = readFileSync(join(HERE, "gc-model.mjs"), "utf8").replace(/^export /gm, "").replace(/if \(typeof process[\s\S]*$/, "");
const LIVE = readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify(DATA));
const zoom = `<svg class="gc-zoom" viewBox="${PLOT.x0 - 3} ${f2(plotV(1) - 2)} ${PLOT.x1 - PLOT.x0 + 6} ${f2(plotV(0) - plotV(1) + 8)}" aria-hidden="true"><use class="gc-zu" data-z="dro" href="#gc-print-dro"/><use class="gc-zu" data-z="haa" href="#gc-print-haa"/><use href="#gc-tag"/></svg>`;
const OVERLAY = "";
const stageHtml = `<div class="iso-stage gc-stage" data-gc tabindex="0" role="group" aria-label="Gas chromatograph. Press I, or Inject, to run the selected method. Press M to swap the column and detector for the other method. Left and right arrows step through the peaks on the chart.">${svg}<canvas class="gc-flame" aria-hidden="true" style="left:${f2((bx0 / W) * 100)}%;top:${f2((by0 / H) * 100)}%;width:${f2(((bx1 - bx0) / W) * 100)}%;height:${f2(((by1 - by0) / H) * 100)}%"></canvas><span class="gc-sr" role="status" aria-live="polite" data-status></span></div>${zoom}<div class="gc-controls"><div class="gc-seg" role="group" aria-label="Method"><button type="button" data-method="dro" aria-pressed="true">8015-style · FID</button><button type="button" data-method="haa" aria-pressed="false">552.3 · ECD</button></div><div class="gc-steps"><button type="button" data-step="-1" aria-label="Previous peak">‹ peak</button><button type="button" data-step="1" aria-label="Next peak">peak ›</button></div><button type="button" class="gc-inject" data-inject>Inject</button></div><p class="gc-name" data-gc-name></p>`;
const CAPTION = "A computed figure, not instrument data. A lab would normally run these two methods on separate instruments, because a 400 °C program exceeds the limit typical for the 552.3 column's phase. They share one chassis here for comparison: the selector racks the chosen column into the oven and the other waits behind a gate in an unheated bay. The left trace is composite, not one injection: an n-alkane ladder from C10 to C40, a diesel hump and an oil hump, with o-terphenyl as surrogate. Its conditions are a vendor's, from a published DRO/ORO standard (40 to 400 °C at 19.6 °C/min, hydrogen carrier, 50:1 split), not EPA 8015D's own 45 to 275 °C program. EPA 8015D defines DRO as C10 to C28. Other carbon windows vary by regulator and lab; this figure shows C28 to C40 as one lab report does. C10 to C18 are that standard's tabulated times. C40 is read off its plot, and other times come from a fitted retention model, so they read \"about\". Hump shapes and these heights are illustrative. The 552.3 trace uses EPA's Table 1 times, oven program and helium carrier for its primary column, with heights read from its Figure 1. It shows ten analyte esters (nine haloacetic acids and dalapon), with 2-bromobutanoic acid as surrogate and 1,2,3-trichloropropane as internal standard; samples are extracted into MTBE and heated in acidic methanol. Unlabelled peaks are omitted. Runs play at 1.5 run-minutes per second.";
function write(theme) {
  const body = `<style>${CSS}</style><div class="gc-root" data-gc-root>` + k.plateHtml({
    fig: "Fig 5",
    title: "Benchtop GC, oven cut away",
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
  const boot = `\nmountGC(document.querySelector("[data-gc-root]"));\n`;
  const page = k.pageHtml({ title: "Gas chromatograph", theme, body, script: kitScript() + glScript() + modelSource + LIVE + boot, width: 720 });
  const name = theme === "light" ? "gc-light.html" : "gc.html";
  writeFileSync(join(HERE, name), page);
  console.log("wrote", name, `${(page.length / 1024).toFixed(0)} KB`, `${R.items.length} items`, `${R.solids.length} solids`, `scale ${KS.toFixed(3)}`, `${LINES.length} lines`);
}
write("dark");
write("light");
// Lazy-load entry: `const { mountGC } = await import("./gc-embed.mjs"); mountGC(el, { theme: "light" });`
{
  const markup = `<style>${k.ISO_CSS}${CSS}</style><div class="gc-root" data-gc-root>` + k.plateHtml({ fig: "Fig 5", title: "Benchtop GC, oven cut away", hint: "I inject · M method · ← → peaks", readout: "8015-style · ready · 40 °C", keys: [], caption: CAPTION, body: stageHtml }) + `</div>`;
  const live = LIVE.replace("function mountGC(root)", "function mountFigure(root)");
  const embed = `${kitScript()}${glScript()}${modelSource}${live}\nexport function mountGC(el, { theme = "light" } = {}) {\n  el.classList.add("iso");\n  el.dataset.theme = theme;\n  el.innerHTML = ${JSON.stringify(markup)};\n  return mountFigure(el.querySelector("[data-gc-root]"));\n}\n`;
  writeFileSync(join(HERE, "gc-embed.mjs"), embed);
}

const CROWD_OK = [["signal.fid", "tower.column"]];
const NEEDLE_ALLOW = [["needle", "rack.vial*"], ["needle", "inlet.*"]];
if (process.argv.includes("--audit")) {
  const started = Date.now();
  const result = A.audit(R, P, { frames: POSES, apart: false, cover: ["pen.tip"], allow: NEEDLE_ALLOW, crowd: CROWD_OK });
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
