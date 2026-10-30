// Builds the gas chromatograph figure. `node build.mjs` writes gc.html and gc-light.html;
// `node build.mjs --audit` also proves the geometry (kit/audit.mjs) and ends "audit passed".
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
const W = 640;
const H = 668;
const AZ = 57;
const EL = 25;

// ---------- world layout (x right along the case, y toward the front, z up) ----------
const PLATE = { x: -176, y: -18, w: 356, d: 214, r: 10 };
const PLATE_H = 8;
const FOOT_H = 4;
const CASE = { x0: -150, x1: 150, y0: 0, y1: 170 };
const Z = { plinth: 6, shell: 16, floor: 22, door0: 26, door1: 118, under: 124, deck: 192 };
const OVEN = { x0: -146, x1: 50, y0: 90, y1: 170 };
const REC = { x0: -140, x1: 140, z0: 129, z1: 186, y: 168 };
const PAPER = { x0: -126, x1: 126, z0: 134, z1: 182 };
const PLOT = { x0: -122, x1: 122, z0: 139, z1: 178 };
const INLET = [{ x: -88, y: 115 }, { x: -18, y: 115 }];
const TOWER_DX = INLET[1].x - INLET[0].x;
const FID = { x0: 33, x1: 63, y0: 97, y1: 127, z1: 234 };
const WIN = { x0: 39, x1: 57, z0: 198, z1: 228, y1: 127, y0: 115 };
const FLAME = { x: 48, y: 121, jetTop: 205, collector: 216 };
const ECD = { x: 108, y: 112 };
const NEEDLE = { rest: 252, r: 0.5, len: 30 };

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [INLET[0].x - 18, 64, 334], [INLET[0].x + 18, 118, 334], [INLET[1].x + 18, 118, 334]],
  W,
  H,
  { pad: 12, azimuth: AZ, elevation: EL },
);
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
function put(name, ref, svg, shapes = [], { bias = 0, ...rest } = {}) {
  return R.put({ name, at: ref, bias, svg, shapes, piece: "gc", ...rest });
}
const groupAttr = (group, cls) => `${group ? ` data-g="${group}"` : ""}${cls ? ` data-c="${cls}"` : ""}`;

function box(name, [x0, y0, z0], [x1, y1, z1], style = {}, { r = 0.4, steps = 2, bevel = 0, extra = "", inner = "", bias = 0, group, cls, owner } = {}) {
  const plan = { x: x0, y: y0, w: x1 - x0, d: y1 - y0, r };
  const shape = record(A.slab(plan, z0, z1 - z0, { name, owner }, steps));
  put(name, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], S(k.slabOf(plan, z0, z1 - z0, P, steps, bevel), { tone: "mid", ...style, inner }) + extra, [shape], { bias, attrs: groupAttr(group, cls) });
  return shape;
}
function turned(name, F, profile, style = {}, { extra = "", inner = "", bias = 0, smooth, steps, rims, bevel = 0, owner, group, cls, ref } = {}) {
  const opts = { bevel, ...(smooth !== undefined ? { smooth } : {}), ...(steps ? { steps } : {}), ...(rims ? { rims } : {}) };
  const paths = G.solidOf(profile, F, P, opts);
  const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
  const shape = record(A.solid(F, profile, { name, owner, radius: smooth && smooth.radius ? smooth.radius : null }));
  put(name, ref ?? G.add3(F.o, G.mul3(F.a, mid)), S(paths, { tone: "mid", ...style, inner }) + extra, [shape], { bias, attrs: groupAttr(group, cls) });
  return shape;
}
const disc = (name, F, s0, s1, r, style = {}, options = {}) => turned(name, F, [[s0, r], [s1, r]], style, options);
let ringIds = 0;
// A ring you can see through: the kit's band with its bore clipped out and the bore's far wall drawn.
function ringPart(name, F, s0, s1, rIn, rOut, style = {}, { extra = "", bias = 0, group, cls, owner } = {}) {
  const shape = record(A.ring(F, s0, s1, rIn, rOut, { name, owner }));
  const near = G.dot3(F.a, V) > 0 ? s1 : s0;
  const far = near === s1 ? s0 : s1;
  const nearC = G.circleOf(F, near, rIn, P, 64);
  const farC = G.circleOf(F, far, rIn, P, 64);
  const id = `gc-ring${ringIds++}`;
  const big = `M-50 -50H${W + 50}V${H + 50}H-50Z`;
  const svg = `<clipPath id="${id}"><path clip-rule="evenodd" d="${big}${nearC}"/></clipPath><clipPath id="${id}n"><path d="${nearC}"/></clipPath>`
    + `<g clip-path="url(#${id}n)"><path class="gc-bore" fill-rule="evenodd" d="${big}${farC}"/></g>`
    + `<path class="iso-line" data-tone="lo" d="${nearC}"/>`
    + `<g clip-path="url(#${id})">${S(G.ringBand(s0, s1, rIn, rOut, F, P, { steps: 56 }), { tone: "mid", ...style })}${extra}</g>`;
  put(name, G.add3(F.o, G.mul3(F.a, (s0 + s1) / 2)), svg, [shape], { bias, attrs: groupAttr(group, cls) });
  return shape;
}
function planeMatrix(o, ex, ey) {
  const p0 = at(o);
  const px = at(G.add3(o, ex));
  const py = at(G.add3(o, ey));
  const v = (x) => x.toFixed(4);
  return `matrix(${v(px[0] - p0[0])} ${v(px[1] - p0[1])} ${v(py[0] - p0[0])} ${v(py[1] - p0[1])} ${p0[0].toFixed(2)} ${p0[1].toFixed(2)})`;
}
// A flat face at y = const: local x is world x, local y is minus z.
const yFace = (x, y, z) => planeMatrix([x, y, z], [1, 0, 0], [0, 0, -1]);
const xFace = (x, y, z) => planeMatrix([x, y, z], [0, 1, 0], [0, 0, -1]);

const LINES = [];
function line(name, points, r = 0.9, { tone = "hi", bend = 4, shells = [true, true], ends = [true, true], maxLength = 22, bias = 0.05, limp = true, touch, bundle, gaps: extraGaps = [], rings, group, cls } = {}) {
  const route = G.fillet(points, Math.max(bend, r * 2.6), 10, { P, tube: r });
  const total = G.pathLength(route);
  const SHELL = Math.max(1.6, r * 2.4);
  const gaps = [...(shells[0] ? [[0, SHELL]] : []), ...extraGaps, ...(shells[1] ? [[total - SHELL, total]] : [])];
  R.route(name, route, r, { gaps, limp, touch, bundle, rims: shells.map((on) => (on ? r * 1.9 : r)), piece: "gc" });
  LINES.push(name);
  tubePieces(route, r, P, { maxLength, spacing: Math.max(0.6, Math.min(1.6, r)), gaps, ...(rings ? { rings } : {}) }).forEach((piece, index) =>
    put(`${name}:${index}`, piece.mid, tubeSvg(piece, { tone }), [A.tube(piece.points, piece.radii)], { bias, route: name, chunk: index, attrs: ` data-route="${name}"${groupAttr(group, cls)}` }),
  );
  [0, 1].forEach((index) => {
    const end = index ? route[route.length - 1] : route[0];
    if (shells[index]) {
      const tangent = G.tangentAlong(route, index ? total : 0);
      const F = G.frameAlong(end, tangent);
      const [s0, s1] = index ? [-SHELL, 0] : [0, SHELL];
      const shape = record(A.disc(F, s0, s1, r * 1.9, { name: `${name}.shell${index}`, owner: name }));
      put(`${name}.shell${index}`, G.add3(end, G.mul3(tangent, (s0 + s1) / 2)), S(G.disc(s0, s1, r * 1.9, F, P, { steps: 6 }), { tone: "mid" }), [shape], { bias: bias + 0.1, attrs: groupAttr(group, cls) });
    } else if (ends[index]) {
      const size = Math.max(0.5, r * KS * 0.9);
      put(`${name}.end${index}`, end, Dots([at(end)], { size, tone: "hi" }), [A.ball(end, size / KS, { name: `${name}.end${index}`, owner: name })], { bias: bias + 0.15, attrs: groupAttr(group, cls) });
    }
  });
  return route;
}

// ---------- bench plate, static, drawn first ----------
const back = [];
back.push(`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
for (const [x, y] of byDepth(k.corners(PLATE, 22))) {
  back.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
  back.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
}
back.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid", inner: Ln(k.sideSeam(PLATE, -3.4, P, 8), { tone: "faint" }) }));
back.push(Ln(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
{
  const screws = k.corners(PLATE, 10);
  back.push(Ln(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  back.push(Dots(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
}
record(A.slab(PLATE, -PLATE_H, PLATE_H, { name: "stand.plate", ground: true }, 8));
{
  const STRIP = { x: PLATE.x + 16, y: PLATE.y + PLATE.d - 15, w: PLATE.w - 118, d: 7, r: 1 };
  back.push(S(k.slabOf(STRIP, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(STRIP.x + 4, STRIP.x + STRIP.w - 4, 4, 5, STRIP.y, 0.6, [1.8, 3.6], P);
  back.push(Ln(ticks.minor, { tone: "lo" }), Ln(ticks.major, { tone: "mid" }));
  const LABEL = { x: 92, y: PLATE.y + PLATE.d - 30, w: 72, d: 22, r: 1.2 };
  back.push(S(k.slabOf(LABEL, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  back.push(Ln(k.planOutline(k.insetPlan(LABEL, 1.4), 0.8, P, 3), { tone: "faint" }));
  back.push(Ln([52, 38, 46, 28].map((w, i) => k.lineOnTop([LABEL.x + 6, LABEL.y + 4.6 + i * 4.2], [LABEL.x + 6 + w, LABEL.y + 4.6 + i * 4.2], 0.8, P)).join(""), { tone: "lo", free: true }));
  back.push(Dots([at([LABEL.x + LABEL.w - 3, LABEL.y + 3, 0.8]), at([LABEL.x + LABEL.w - 3, LABEL.y + LABEL.d - 3, 0.8])], { size: 0.45 }));
}

// ---------- spare vial block on the bench ----------
{
  const B = { x: -152, y: 178, w: 44, d: 20, r: 2 };
  const shape = record(A.slab(B, 0, 6, { name: "vialblock" }, 3));
  put("vialblock", [-130, 188, 3], S(k.slabOf(B, 0, 6, P, 3, 0.5), { tone: "mid" }), [shape]);
  for (const x of [-145, -137, -129, -121, -113]) vial(`bench.vial`, x, 188, 6, null);
}
function vial(name, x, y, z, group) {
  const F = G.frameOf([x, y, z], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  disc(`${name}.glass`, F, 0, 9, 3, { tone: "hi" }, { group, inner: Ln(G.arcOf(F, 5.6, 3, P), { tone: "lo" }), owner: name });
  disc(`${name}.cap`, F, 9, 12, 3.3, { tone: "mid" }, { group, owner: name, bevel: 0.3, extra: Dots([at([x, y, z + 12])], { size: 0.5, tone: "hi" }) });
}

// ---------- the case ----------
for (const [x, y] of byDepth([[-132, 18], [132, 18], [-132, 152], [132, 152]])) {
  const F = G.frameOf([x, y, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  put("foot", [x, y, 3], S(G.disc(0, Z.plinth, 7, F, P, { steps: 28 }), { tone: "lo" }), [record(A.disc(F, 0, Z.plinth, 7, { name: "foot" }))]);
}
box("plinth", [CASE.x0, 0, Z.plinth], [CASE.x1, CASE.y1, Z.shell], { tone: "lo" }, { r: 3, steps: 3 });
box("body.rear", [CASE.x0, 0, Z.shell], [CASE.x1, OVEN.y0 - 6, Z.under], {}, { r: 1, steps: 2 });
const CAV = "cavity";
box("oven.rear", [OVEN.x0, OVEN.y0 - 6, Z.shell], [OVEN.x1, OVEN.y0, Z.under], { tone: "lo" }, { cls: CAV, bias: -60 });
box("oven.left", [CASE.x0, OVEN.y0 - 6, Z.shell], [OVEN.x0, CASE.y1, Z.under], { tone: "lo" }, { cls: CAV, bias: -60 });
box("oven.floor", [OVEN.x0, OVEN.y0, Z.shell], [OVEN.x1, CASE.y1, Z.floor], { tone: "lo" }, { cls: CAV, bias: -60 });
box("bay", [OVEN.x1, OVEN.y0 - 6, Z.shell], [CASE.x1, CASE.y1, Z.under], {}, {
  extra: Ln(Array.from({ length: 9 }, (_, i) => path3([[CASE.x1, 96 + i * 7, 34], [CASE.x1, 100 + i * 7, 34], [CASE.x1, 100 + i * 7, 62], [CASE.x1, 96 + i * 7, 62]], true)).join(""), { tone: "lo" }),
});
const upperSeam = k.sideSeam({ x: CASE.x0, y: 0, w: CASE.x1 - CASE.x0, d: CASE.y1, r: 1 }, Z.under + 1.2, P, 2);
box("upper", [CASE.x0, 0, Z.under], [CASE.x1, CASE.y1, Z.deck], { tone: "hi" }, {
  r: 1, steps: 2, bevel: 0.8, inner: Ln(upperSeam, { tone: "faint" }),
  extra: [
    Ln(k.planOutline({ x: CASE.x0 + 5, y: 5, w: CASE.x1 - CASE.x0 - 10, d: CASE.y1 - 10, r: 3 }, Z.deck, P, 3), { tone: "faint" }),
    Dots([[-144, 6], [144, 6], [-144, 164], [144, 164], [0, 6], [0, 164]].map(([x, y]) => at([x, y, Z.deck])), { size: 0.5 }),
    Ln(Array.from({ length: 12 }, (_, i) => k.planOutline({ x: -138 + i * 7, y: 12, w: 3, d: 34, r: 1.5 }, Z.deck, P, 3)).join(""), { tone: "lo" }),
  ].join(""),
});

// ---------- oven interior ----------
{
  const c = { x: -50, z: 54 };
  const F = G.frameOf([c.x, OVEN.y0, c.z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  const blades = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2;
    const pt = (r, da) => [r * Math.cos(a + da), r * Math.sin(a + da)].map(f2).join(" ");
    return `M${pt(5, 0)}Q${pt(13, 0.22)} ${pt(21, 0.1)}L${pt(21, 0.42)}Q${pt(13, 0.52)} ${pt(5, 0.5)}Z`;
  }).join("");
  const guard = [24, 18, 12].map((r) => `M${r} 0A${r} ${r} 0 1 1 ${-r} 0A${r} ${r} 0 1 1 ${r} 0Z`).join("");
  const spokes = Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI) / 3 + 0.26;
    return `M${f2(5 * Math.cos(a))} ${f2(5 * Math.sin(a))}L${f2(24 * Math.cos(a))} ${f2(24 * Math.sin(a))}`;
  }).join("");
  put("fan", [c.x, OVEN.y0 + 0.5, c.z], `<g transform="${yFace(c.x, OVEN.y0 + 0.02, c.z)}"><circle class="gc-fan-hole" r="24"/><g data-part="fan"><path class="gc-blade" d="${blades}"/></g><circle class="gc-fan-hub" r="5"/><path class="gc-guard" d="${guard}${spokes}"/></g>`, [record(A.disc(F, 0, 0.5, 24, { name: "fan" }))], { attrs: groupAttr(null, CAV) });
  // Heater ring around the fan, on six stand-offs.
  ringPart("heater", F, 2, 3.6, 27.4, 29.2, { tone: "hi" }, { cls: "heater" });
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + 0.5;
    const o = [c.x + 28.3 * Math.cos(a), OVEN.y0, c.z + 28.3 * Math.sin(a)];
    if (o[2] > 86) continue;
    disc("heater.post", G.frameAlong(o, [0, 1, 0]), 0, 2, 0.8, { tone: "lo" }, { cls: CAV });
  }
}

// Floor louvres and the oven's temperature probe on the left wall.
put("oven.louvres", [-60, 112, Z.floor], Ln(Array.from({ length: 7 }, (_, i) => k.planOutline({ x: -128 + i * 26, y: 99, w: 18, d: 3, r: 1.4 }, Z.floor, P, 3)).join(""), { tone: "lo" }), [record(A.box([-128, 99, Z.floor], [38, 102, Z.floor + 0.05], { name: "oven.louvres" }))], { attrs: groupAttr(null, CAV) });
{
  const F = G.frameOf([OVEN.x0, 112, 34], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  disc("oven.probe.boss", F, 0, 2, 2.6, { tone: "mid" }, { cls: CAV });
  disc("oven.probe", F, 2, 16, 0.8, { tone: "hi" }, { cls: CAV, steps: 12 });
}

// Two capillary columns on wire cages, wound in a band.
const COILS = [{ x: -92, ch: 0 }, { x: -14, ch: 1 }];
const COIL = { y: 138, z: 60, rIn: 26.5, rOut: 30 };
for (const coil of COILS) {
  const F = G.frameOf([coil.x, COIL.y, COIL.z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  const own = `cage${coil.ch}`;
  // Band of windings: arcs on the outer skin and rings on the front face.
  const arcs = [];
  for (let i = 0; i < 10; i++) arcs.push(G.arcOf(F, -5.4 + i * 1.2, COIL.rOut, P));
  for (let i = 0; i < 6; i++) arcs.push(G.circleOf(F, 6, COIL.rIn + 0.55 + i * 0.5, P, 56));
  const turns = arcs.map((d, i) => `<path class="iso-line gc-turn" data-tone="lo" data-ch="${coil.ch}" data-turn="${i}" d="${d}"/>`).join("");
  const inside = G.arcOf(F, -6, COIL.rIn, P, { inward: true, least: -0.2 }) + G.arcOf(F, 6, COIL.rIn, P, { inward: true, least: -0.2 });
  ringPart(`coil${coil.ch}`, F, -6, 6, COIL.rIn, COIL.rOut, { tone: "hi", crease: "lo" }, { owner: own, extra: Ln(inside, { tone: "faint" }) + turns, cls: "coil" });
  ringPart(`cage${coil.ch}.hoop`, F, -8.2, -6, COIL.rOut - 2.4, COIL.rOut + 1.2, { tone: "lo" }, { owner: own });
  ringPart(`cage${coil.ch}.hoop`, F, 6, 8.2, COIL.rOut - 1.2, COIL.rOut + 1.2, { tone: "mid" }, { owner: own });
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    const o = [coil.x + (COIL.rOut + 1.9) * Math.cos(a), COIL.y, COIL.z + (COIL.rOut + 1.9) * Math.sin(a)];
    const bar = G.frameAlong(o, [0, 1, 0]);
    disc(`cage${coil.ch}.bar`, bar, -8.2, 8.2, 0.7, { tone: "mid" }, { owner: own, steps: 12 });
  }
  box(`cage${coil.ch}.hanger`, [coil.x + 13, COIL.y - 1, COIL.z + 27.04], [coil.x + 16, COIL.y + 1, Z.under], { tone: "lo" }, { owner: own });
  box(`cage${coil.ch}.hanger`, [coil.x - 16, COIL.y - 1, COIL.z + 27.04], [coil.x - 13, COIL.y + 1, Z.under], { tone: "lo" }, { owner: own });
  const lift = (dx) => COIL.z + Math.sqrt(COIL.rOut ** 2 - dx * dx);
  line(`column${coil.ch}.in`, [[coil.x - 5, COIL.y, lift(5)], [coil.x - 5, COIL.y, Z.under]], 0.4, { tone: "hi", shells: [false, false], touch: [own, `cage${coil.ch}*`, `coil${coil.ch}`] });
  line(`column${coil.ch}.out`, [[coil.x + 5, COIL.y, lift(5)], [coil.x + 5, COIL.y, Z.under]], 0.4, { tone: "hi", shells: [false, false], touch: [own, `cage${coil.ch}*`, `coil${coil.ch}`] });
}

// ---------- the door, cut away to a frame ----------
{
  const y0 = CASE.y1;
  const y1 = y0 + 5;
  const seam = (plan, z) => Ln(k.sideSeam(plan, z, P, 2), { tone: "faint" });
  box("door.bottom", [OVEN.x0, y0, Z.floor], [OVEN.x1, y1, Z.door0], { tone: "mid" });
  box("door.left", [OVEN.x0, y0, Z.door0], [OVEN.x0 + 6, y1, Z.door1], { tone: "mid" });
  box("door.right", [OVEN.x1 - 6, y0, Z.door0], [OVEN.x1, y1, Z.door1], { tone: "mid" });
  box("door.top", [OVEN.x0, y0, Z.door1], [OVEN.x1, y1, Z.under], { tone: "hi" }, { inner: seam({ x: OVEN.x0, y: y0, w: OVEN.x1 - OVEN.x0, d: 5, r: 0.4 }, Z.door1 + 1.5) });
  // Latch bar on the top rail.
  const HANDLE = G.frameOf([OVEN.x0 + 24, y1 + 5, Z.door1 + 3], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  for (const s of [0, 148]) {
    const o = [OVEN.x0 + 24 + s, y1, Z.door1 + 3];
    disc("door.standoff", G.frameAlong(o, [0, 1, 0]), 0, 3.3, 1.5, { tone: "lo" });
  }
  disc("door.handle", HANDLE, -3, 151, 1.8, { tone: "hi" });
  for (const z of [Z.door0 + 10, Z.door1 - 10]) {
    disc("door.hinge", G.frameOf([OVEN.x0 + 2, y1 + 2.2, z], [0, 0, 1], [1, 0, 0], [0, 1, 0]), -6, 6, 1.4, { tone: "mid" });
    box("door.hingeleaf", [OVEN.x0, y1, z - 5], [OVEN.x0 + 5, y1 + 0.8, z + 5], { tone: "lo" }, { extra: Dots([at([OVEN.x0 + 4.2, y1 + 0.8, z - 3.6]), at([OVEN.x0 + 4.2, y1 + 0.8, z + 3.6])], { size: 0.4 }) });
  }
}

// ---------- the recorder band: a paper strip in the plane of the case ----------
const plotU = (id, t) => PLOT.x0 + (t / M.METHODS[id].end) * (PLOT.x1 - PLOT.x0);
const plotV = (s) => -(PLOT.z0 + s * (PLOT.z1 - PLOT.z0)); // paper y coordinate for the matrix with origin z=0
const paperM = planeMatrix([0, REC.y, 0], [1, 0, 0], [0, 0, -1]);
// Ramer-Douglas-Peucker in plot units, so a flat baseline costs nothing and a peak keeps its shape.
function simplify(points, tol) {
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let worst = 0;
    let at = -1;
    const [ax, ay] = points[a];
    const dx = points[b][0] - ax;
    const dy = points[b][1] - ay;
    const len = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((points[i][0] - ax) * dy - (points[i][1] - ay) * dx) / len;
      if (d > worst) {
        worst = d;
        at = i;
      }
    }
    if (worst > tol) {
      keep[at] = 1;
      stack.push([a, at], [at, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}
function traceOf(id) {
  const m = M.METHODS[id];
  const pts = [];
  for (let t = 0; t <= m.end + 1e-6; t += 0.01) pts.push([plotU(id, t), plotV(M.signalAt(id, t))]);
  return `M${simplify(pts, 0.035).map(([x, y]) => `${f2(x)} ${f2(y)}`).join("L")}`;
}
function humpFill() {
  const m = M.METHODS.dro;
  const from = M.peakById("dro", "C10").t;
  const to = M.peakById("dro", "C28").t;
  const top = [];
  for (let t = from; t <= to + 1e-6; t += 0.1) top.push(`${f2(plotU("dro", t))} ${f2(plotV(M.humpAt("dro", t)))}`);
  return `M${f2(plotU("dro", from))} ${f2(plotV(0))}L${top.join("L")}L${f2(plotU("dro", to))} ${f2(plotV(0))}Z`;
}
function sheet(id) {
  const m = M.METHODS[id];
  const y0 = plotV(0);
  const y1 = plotV(1);
  const grid = [];
  const major = [];
  const labels = [];
  for (let t = 0; t <= m.end + 1e-6; t += 1) {
    const u = f2(plotU(id, t));
    if (t % m.axisStep === 0) {
      major.push(`M${u} ${f2(y0)}V${f2(y1)}`);
      labels.push(`<text class="gc-axis" x="${u}" y="${f2(y0 + 3.9)}" text-anchor="middle">${t}</text>`);
    } else grid.push(`M${u} ${f2(y0)}V${f2(y0 - 1.6)}`);
  }
  for (const s of [0.25, 0.5, 0.75]) major.push(`M${PLOT.x0} ${f2(plotV(s))}H${PLOT.x1}`);
  const parts = [`<path class="gc-grid" d="${major.join("")}"/>`, `<path class="gc-tick" d="${grid.join("")}M${PLOT.x0} ${f2(y0)}H${PLOT.x1}"/>`, labels.join("")];
  parts.push(`<text class="gc-axis" x="${PLOT.x1}" y="${f2(y1 - 1.1)}" text-anchor="end">min</text>`);
  // Printed markers: each sits at the top of its peak's own column, read from the model.
  const printed = [];
  if (id === "dro") {
    parts.push(`<path class="gc-hump" d="${humpFill()}" clip-path="url(#gc-clip-${id})"/>`);
    const c10 = plotU(id, M.peakById(id, "C10").t);
    const c28 = plotU(id, M.peakById(id, "C28").t);
    const c40 = plotU(id, M.peakById(id, "C40").t);
    const by = f2(y1 + 1.2);
    parts.push(`<path class="gc-window" d="M${f2(c10)} ${f2(y0)}V${by}M${f2(c28)} ${f2(y0)}V${by}M${f2(c40)} ${f2(y0)}V${by}M${f2(c10)} ${by}H${f2(c40)}"/>`);
    for (const [from, to, label] of [[c10, c28, "DRO"], [c28, c40, "ORO"]]) printed.push(`<text class="gc-band" x="${f2((from + to) / 2)}" y="${f2(y1 + 4.6)}" text-anchor="middle">${label}</text>`);
    for (const p of [["C10", c10], ["C28", c28], ["C40", c40]]) printed.push(`<text class="gc-mark" x="${f2(p[1] + 0.8)}" y="${f2(y1 + 6)}">${p[0]}</text>`);
  } else {
    let level = 0;
    let prev = -99;
    for (const p of m.peaks) {
      const u = plotU(id, p.t);
      level = u - prev < 3.6 ? level + 1 : 0;
      prev = u;
      const top = plotV(p.h + 0.02);
      printed.push(`<text class="gc-code" transform="translate(${f2(u + 1.1)} ${f2(Math.max(y1 + 16, top - 1))}) rotate(-90)">${p.code}</text>`);
    }
  }
  const ghost = `<defs><path id="gc-trace-${id}" vector-effect="non-scaling-stroke" d="${traceOf(id)}"/></defs><use class="gc-ghost" href="#gc-trace-${id}"/>`;
  const ink = `<g clip-path="url(#gc-clip-${id})"><use class="gc-ink" href="#gc-trace-${id}"/></g>`;
  const hits = m.peaks.filter((p) => p.kind !== "solvent").map((p, i, list) => {
    const u = plotU(id, p.t);
    const left = i ? (u + plotU(id, list[i - 1].t)) / 2 : u - 3;
    const right = i < list.length - 1 ? (u + plotU(id, list[i + 1].t)) / 2 : u + 3;
    return `<rect class="gc-hit" data-peak="${p.id}" role="button" tabindex="-1" aria-label="${p.code}: ${p.name}, ${p.t.toFixed(2)} minutes, ${Math.round(m.temp(p.t))} degrees C" x="${f2(left)}" y="${f2(y1 - 1)}" width="${f2(right - left)}" height="${f2(y0 - y1 + 2)}"/>`;
  }).join("");
  return `<g class="gc-sheet" data-sheet="${id}"${id === "dro" ? "" : ' data-off=""'}><clipPath id="gc-clip-${id}"><rect data-clip="${id}" x="${PLOT.x0 - 3}" y="${f2(y1 - 8)}" width="${PLOT.x1 - PLOT.x0 + 6}" height="${f2(y0 - y1 + 14)}"/></clipPath>${parts.join("")}${ghost}${ink}${printed.join("")}<g class="gc-hits">${hits}</g></g>`;
}
{
  const rec = { x0: REC.x0, x1: REC.x1, z0: REC.z0, z1: REC.z1 };
  const y0 = CASE.y1;
  const y1 = REC.y;
  const quad = (a, b, c, d) => path3([a, b, c, d], true);
  const walls = [
    `<path class="iso-shade" data-shade="3" d="${quad([rec.x0, y0, rec.z0], [rec.x1, y0, rec.z0], [rec.x1, y1, rec.z0], [rec.x0, y1, rec.z0])}"/>`,
    `<path class="iso-shade" data-shade="1" d="${quad([rec.x0, y0, rec.z0], [rec.x0, y1, rec.z0], [rec.x0, y1, rec.z1], [rec.x0, y0, rec.z1])}"/>`,
  ].join("");
  const opening = path3([[rec.x0, y0, rec.z0], [rec.x1, y0, rec.z0], [rec.x1, y0, rec.z1], [rec.x0, y0, rec.z1]], true);
  const backWall = path3([[rec.x0, y1, rec.z0], [rec.x1, y1, rec.z0], [rec.x1, y1, rec.z1], [rec.x0, y1, rec.z1]], true);
  const paperRect = `<rect class="gc-paper" x="${PAPER.x0}" y="${-PAPER.z1}" width="${PAPER.x1 - PAPER.x0}" height="${PAPER.z1 - PAPER.z0}"/>`;
  const svg = [
    `<clipPath id="gc-rec"><path d="${opening}"/></clipPath>`,
    `<g clip-path="url(#gc-rec)"><path class="gc-recess" d="${backWall}"/><g transform="${paperM}"><clipPath id="gc-paper"><rect x="${PAPER.x0}" y="${-PAPER.z1}" width="${PAPER.x1 - PAPER.x0}" height="${PAPER.z1 - PAPER.z0}"/></clipPath>${paperRect}<g clip-path="url(#gc-paper)"><g data-part="feed">${sheet("dro")}${sheet("haa")}</g></g><g data-part="tag" class="gc-tag" data-off=""><path data-part="tag-line" class="gc-tag-line"/><text data-part="tag-text" class="gc-tag-text"></text></g></g>${walls}</g>`,
    Ln(opening, { tone: "mid" }),
  ].join("");
  put("recorder", [0, y0, 156], svg, [record(A.box([rec.x0, y0, rec.z0], [rec.x1, y0 + 0.05, rec.z1], { name: "recorder" }))], { bias: 0.2 });
  // Rollers at both ends of the paper, proud of the face.
  for (const x of [PAPER.x0 - 7, PAPER.x1 + 7]) {
    const F = G.frameOf([x, y0 + 2, rec.z0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
    disc("recorder.roller", F, 0, rec.z1 - rec.z0, 2, { tone: "hi" }, {
      extra: Faded(G.ribsOf(F, 0, rec.z1 - rec.z0, 2, 14, P, { fade: [0.15, 0.6] }), { tone: "lo" }),
    });
  }
  // Two guide rods and the carriage riding on their faces; a stylus reaches back to the paper.
  const railY = y0 + 5;
  for (const z of [rec.z1 - 2.5, rec.z0 + 2.5]) {
    const F = G.frameOf([rec.x0 + 2, railY, z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
    disc("recorder.rail", F, 0, rec.x1 - rec.x0 - 4, 0.9, { tone: "mid" });
    for (const x of [rec.x0 + 1, rec.x1 - 1]) box("recorder.block", [x - 1, y0, z - 2], [x + 1, y0 + 5.9, z + 2], { tone: "lo" }, { owner: "recorder.rail" });
  }
  const u0 = plotU("dro", 0);
  const bushY = railY + 0.9;
  for (const z of [rec.z1 - 2.5, rec.z0 + 2.5]) box("pen.bush", [u0 - 2.4, bushY, z - 1.7], [u0 + 2.4, bushY + 2, z + 1.7], { tone: "mid" }, { group: "carriage" });
  const postF = G.frameOf([u0, bushY + 2.7, rec.z0 + 1], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  disc("pen.post", postF, 0, rec.z1 - rec.z0 - 2, 0.7, { tone: "hi" }, { group: "carriage" });
  const zPen = PLOT.z0;
  const slideY = bushY + 3.4;
  box("pen.slider", [u0 - 2.2, slideY, zPen - 2.2], [u0 + 2.2, slideY + 3, zPen + 2.2], { tone: "hi" }, { group: "pen", bevel: 0.3 });
  put("pen.tip", [u0, y0 + 3, zPen], Ln(path3([[u0, slideY, zPen], [u0, REC.y, zPen]]), { tone: "lit" }) + Dots([at([u0, REC.y, zPen])], { size: 1, tone: "hi" }), [record(A.tube([[u0, y0 + 0.2, zPen], [u0, slideY, zPen]], 0.3, { name: "pen.tip", owner: "pen.slider" }))], { attrs: groupAttr("pen"), bias: -0.2 });
  // Screws on the band above the door and panel.
  put("band.screws", [0, y0, 127], Dots([-146, -70, 0, 70, 146].flatMap((x) => [at([x, y0, 126.6]), at([x, y0, 189])]), { size: 0.5 }), [record(A.box([-146, y0, 126], [146, y0 + 0.05, 189.4], { name: "band.screws" }))], { bias: 0.1 });
}

// ---------- control panel on the bay ----------
const PANEL = { y: CASE.y1 };
const DIAL = { x: 79, z: 94, r: 23 };
const KNOB = { x: 125, z: 96, r: 12.5 };
const BTN = { x: 125, z: 58, r: 8 };
const LCD = { x0: 57, x1: 104, z0: 54, z1: 66 };
{
  const y = PANEL.y;
  // Oven temperature dial, drawn in the plane of the case.
  const F = G.frameOf([DIAL.x, y, DIAL.z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  disc("dial.bezel", F, 0, 2.2, DIAL.r + 2, { tone: "mid" }, { bevel: 0.5, steps: 96 });
  const ticks = [];
  const major = [];
  const nums = [];
  for (let T = 0; T <= 420; T += 20) {
    const a = ((M.dialAngle(T) - 90) * Math.PI) / 180;
    const isMajor = T % 100 === 0;
    const r0 = DIAL.r - 0.4;
    const r1 = r0 - (isMajor ? 3.2 : 1.8);
    (isMajor ? major : ticks).push(`M${f2(r0 * Math.cos(a))} ${f2(r0 * Math.sin(a))}L${f2(r1 * Math.cos(a))} ${f2(r1 * Math.sin(a))}`);
    if (isMajor) nums.push(`<text class="gc-dial-num" x="${f2((r1 - 3) * Math.cos(a))}" y="${f2((r1 - 3) * Math.sin(a) + 1.15)}" text-anchor="middle">${T}</text>`);
  }
  const ramp = (id) => {
    const m = M.METHODS[id];
    const T = m.program.at(-1)[1];
    const a = ((M.dialAngle(T) - 90) * Math.PI) / 180;
    return `<path data-bug="${id}" class="gc-bug"${id === "dro" ? "" : ' data-off=""'} d="M${f2(DIAL.r * Math.cos(a))} ${f2(DIAL.r * Math.sin(a))}L${f2((DIAL.r + 1.5) * Math.cos(a + 0.05))} ${f2((DIAL.r + 1.5) * Math.sin(a + 0.05))}L${f2((DIAL.r + 1.5) * Math.cos(a - 0.05))} ${f2((DIAL.r + 1.5) * Math.sin(a - 0.05))}Z"/>`;
  };
  const rest = M.dialAngle(40);
  put("dial.face", [DIAL.x, y + 2.3, DIAL.z], `<g transform="${yFace(DIAL.x, y + 2.25, DIAL.z)}"><circle class="gc-dial" r="${DIAL.r}"/><path class="gc-tick-d" d="${ticks.join("")}"/><path class="gc-tick-D" d="${major.join("")}"/>${nums.join("")}${ramp("dro")}${ramp("haa")}<text class="gc-dial-unit" y="11.4" text-anchor="middle">°C OVEN</text><g data-part="needle" transform="rotate(${f2(rest)})"><path class="gc-needle" d="M0 4.6L0 ${f2(-DIAL.r + 2)}"/></g><circle class="gc-hub" r="2"/></g>`, [record(A.disc(F, 2.2, 2.3, DIAL.r, { name: "dial.face" }))], { bias: 0.2 });
  // Readout window.
  const face = [[LCD.x0, y, LCD.z0], [LCD.x1, y, LCD.z0], [LCD.x1, y, LCD.z1], [LCD.x0, y, LCD.z1]];
  put("lcd", [(LCD.x0 + LCD.x1) / 2, y, (LCD.z0 + LCD.z1) / 2], `<g transform="${yFace(LCD.x0, y, LCD.z1)}"><rect class="gc-window" width="${LCD.x1 - LCD.x0}" height="${LCD.z1 - LCD.z0}" rx=".8"/><text class="gc-lcd" data-part="lcd-t" x="2" y="8.2">40.0</text><text class="gc-lcd" data-part="lcd-m" x="${LCD.x1 - LCD.x0 - 2}" y="8.2" text-anchor="end">0.00</text></g>`, [record(A.box([LCD.x0, y, LCD.z0], [LCD.x1, y + 0.05, LCD.z1], { name: "lcd" }))], { bias: 0.2 });
  // Keypad.
  for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) {
    const x = 57 + col * 9.6;
    const z = 42 - row * 8;
    box("key", [x, y, z], [x + 8, y + 1.2, z + 6], { tone: row === 0 && col === 4 ? "hi" : "mid" }, { r: 0.8, steps: 2, bevel: 0.25 });
  }
  // Selector: a knurled knob on a skirt, two detents.
  const KF = G.frameOf([KNOB.x, y, KNOB.z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  disc("knob.skirt", KF, 0, 1.4, KNOB.r + 5, { tone: "lo" }, { bevel: 0.4, steps: 72 });
  const det = (deg) => {
    const a = ((deg - 90) * Math.PI) / 180;
    const r0 = KNOB.r + 2.4;
    const r1 = KNOB.r + 4.8;
    return `M${f2(r0 * Math.cos(a))} ${f2(r0 * Math.sin(a))}L${f2(r1 * Math.cos(a))} ${f2(r1 * Math.sin(a))}`;
  };
  put("knob.marks", [KNOB.x, y + 1.45, KNOB.z], `<g transform="${yFace(KNOB.x, y + 1.42, KNOB.z)}"><path class="gc-tick-D" d="${det(-45)}${det(45)}"/></g>`, [record(A.disc(KF, 1.4, 1.45, KNOB.r + 5, { name: "knob.marks" }))], { bias: 0.1 });
  disc("knob", KF, 1.4, 9, KNOB.r, { tone: "hi" }, { bevel: 0.6, steps: 96, inner: Ln(G.arcOf(KF, 1.8, KNOB.r, P) + G.arcOf(KF, 8.6, KNOB.r, P), { tone: "lo" }), extra: `<g data-part="knurl">${Faded(G.ribsOf(KF, 1.8, 8.6, KNOB.r, 44, P, { fade: [0.08, 0.5] }), { tone: "lo" })}</g>` });
  put("knob.cap", [KNOB.x, y + 9.05, KNOB.z], `<g transform="${yFace(KNOB.x, y + 9, KNOB.z)}"><g data-part="pointer" transform="rotate(-45)"><path class="gc-pointer" d="M0 -3L0 ${f2(-KNOB.r + 1.2)}"/></g><circle class="gc-hub" r="1.6"/></g>`, [record(A.disc(KF, 9, 9.05, KNOB.r - 0.5, { name: "knob.cap" }))], { bias: 0.1 });
  put("knob.labels", [KNOB.x, y, KNOB.z - 20], `<g transform="${yFace(KNOB.x, y, KNOB.z)}"><text class="gc-engrave" data-for="dro" x="-16.5" y="-18.5" text-anchor="middle">8015</text><text class="gc-engrave" data-for="haa" x="16.5" y="-18.5" text-anchor="middle">552.3</text><text class="gc-engrave" x="0" y="23.6" text-anchor="middle">METHOD</text></g>`, [record(A.box([KNOB.x - 24, y, KNOB.z - 24], [KNOB.x + 24, y + 0.05, KNOB.z - 20], { name: "knob.labels" }))], { bias: 0.1 });
  // Inject button.
  const BF = G.frameOf([BTN.x, y, BTN.z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  disc("button.ring", BF, 0, 1.4, BTN.r + 2, { tone: "lo" }, { bevel: 0.3, steps: 48 });
  disc("button", BF, 1.4, 4, BTN.r, { tone: "hi" }, { bevel: 0.5, steps: 48, group: "button" });
  put("button.label", [BTN.x, y, BTN.z - 12], `<g transform="${yFace(BTN.x, y, BTN.z)}"><text class="gc-engrave" y="13.8" text-anchor="middle">INJECT</text></g>`, [record(A.box([BTN.x - 8, y, BTN.z - 14], [BTN.x + 8, y + 0.05, BTN.z - 11], { name: "button.label" }))], { bias: 0.1 });
  // Status lamps and a power rocker.
  for (const [i, name] of ["ready", "run", "fid", "ecd"].entries()) {
    const x = 110 + i * 9;
    const LF = G.frameOf([x, y, 32], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
    disc(`lamp.${name}`, LF, 0, 1, 2, { tone: "mid" }, { group: `lamp-${name}`, cls: "lamp" });
    put(`lamp.${name}.label`, [x, y, 27], `<g transform="${yFace(x, y, 32)}"><text class="gc-engrave gc-small" y="6.2" text-anchor="middle">${name.toUpperCase()}</text></g>`, [record(A.box([x - 4, y, 25], [x + 4, y + 0.05, 28], { name: `lamp.${name}.label` }))], { bias: 0.1 });
  }
  put("panel.screws", [100, y, 70], Dots([[54, 20], [146, 20], [54, 120], [146, 120]].map(([x, z]) => at([x, y, z])), { size: 0.5 }), [record(A.box([53, y, 19], [147, y + 0.05, 121], { name: "panel.screws" }))], { bias: 0.1 });
}

// ---------- access panels let into the deck, under what stands on them ----------
{
  const panel = (name, plan) => {
    const dots = k.corners(plan, 3).map(([x, y]) => at([x, y, Z.deck + 0.4]));
    const shape = record(A.slab(plan, Z.deck, 0.4, { name }, 2));
    put(name, [plan.x + plan.w / 2, plan.y + plan.d / 2, Z.deck], S(k.slabOf(plan, Z.deck, 0.4, P, 2), { tone: "mid", crease: "none" }) + Dots(dots, { size: 0.45 }), [shape], { bias: -1 });
  };
  panel("deck.inlets", { x: -112, y: 100, w: 118, d: 32, r: 1 });
  panel("deck.detectors", { x: 26, y: 92, w: 106, d: 40, r: 1 });
  panel("deck.front", { x: 26, y: 140, w: 118, d: 22, r: 1 });
}

// ---------- inlets on the deck ----------
const NUT_TOP = 224;
for (const [i, inlet] of INLET.entries()) {
  const F = G.frameOf([inlet.x, inlet.y, Z.deck], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  box(`inlet${i}.block`, [inlet.x - 14, inlet.y - 14, Z.deck], [inlet.x + 14, inlet.y + 14, Z.deck + 10], { tone: "mid" }, {
    r: 1.2, steps: 2, bevel: 0.4,
    extra: Dots([[-11, -11], [11, -11], [-11, 11], [11, 11]].map(([dx, dy]) => at([inlet.x + dx, inlet.y + dy, Z.deck + 10])), { size: 0.5, tone: "hi" }),
  });
  disc(`inlet${i}.body`, F, 10, 22, 9, { tone: "hi" }, { steps: 64, inner: Ln(G.arcOf(F, 13, 9, P) + G.arcOf(F, 16, 9, P) + G.arcOf(F, 19, 9, P), { tone: "faint" }), cls: "inletbody" });
  disc(`inlet${i}.shoulder`, F, 22, 24, 6, { tone: "mid" }, { steps: 40 });
  disc(`inlet${i}.nut`, F, 24, NUT_TOP - Z.deck, 7, { tone: "hi" }, {
    steps: 64, bevel: 0.5,
    extra: Faded(G.ribsOf(F, 24.5, NUT_TOP - Z.deck - 0.5, 7, 30, P, { fade: [0.08, 0.5], seams: true }), { tone: "lo" }) + Ln(G.circleOf(F, NUT_TOP - Z.deck, 2.1, P, 24), { tone: "mid" }) + Dots([at([inlet.x, inlet.y, NUT_TOP])], { size: 0.9, tone: "lo" }),
  });
}
// Charcoal trap on the split vent.
const TRAP = { x: -130, y: 136 };
{
  const F = G.frameOf([TRAP.x, TRAP.y, Z.deck], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  box("trap.base", [TRAP.x - 9, TRAP.y - 9, Z.deck], [TRAP.x + 7, TRAP.y + 9, Z.deck + 2], { tone: "lo" }, { extra: Dots([[-7, -7], [7, 7]].map(([a, b]) => at([TRAP.x + a, TRAP.y + b, Z.deck + 2])), { size: 0.4 }) });
  disc("trap.can", F, 2, 28, 7, { tone: "hi" }, { steps: 48, bevel: 0.5, inner: Ln(G.arcOf(F, 6, 7, P) + G.arcOf(F, 24, 7, P), { tone: "faint" }) });
  disc("trap.cap", F, 28, 31, 3, { tone: "mid" }, { steps: 6 });
}

// ---------- autosampler: a tower that indexes between the inlets ----------
const T0 = INLET[0];
const SY = T0.y;
const RAIL = { x0: T0.x - 24, x1: INLET[1].x + 24, y0: 64, y1: 98 };
box("rail.bed", [RAIL.x0, RAIL.y0, Z.deck], [RAIL.x1, RAIL.y1, Z.deck + 1.6], { tone: "lo" }, { r: 1, extra: Dots([[RAIL.x0 + 3, RAIL.y0 + 3], [RAIL.x1 - 3, RAIL.y0 + 3], [RAIL.x0 + 3, RAIL.y1 - 3], [RAIL.x1 - 3, RAIL.y1 - 3]].map(([x, y]) => at([x, y, Z.deck + 1.6])), { size: 0.4 }) });
for (const y of [70, 92]) {
  const F = G.frameOf([RAIL.x0 + 2, y, Z.deck + 2.8], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  disc("rail.rod", F, 0, RAIL.x1 - RAIL.x0 - 4, 1.2, { tone: "hi" });
}
const TW = "tower";
box("tower.sled", [T0.x - 19, 65, Z.deck + 5], [T0.x + 19, 97, Z.deck + 10], { tone: "mid" }, { group: TW, bevel: 0.4, r: 1, extra: Dots([[-16, -13], [16, -13], [-16, 13], [16, 13]].map(([a, b]) => at([T0.x + a, 81 + b, Z.deck + 10])), { size: 0.45 }) });
for (const y of [70, 92]) for (const x of [-15, 15]) box("tower.shoe", [T0.x + x - 3, y - 2.4, Z.deck + 4], [T0.x + x + 3, y + 2.4, Z.deck + 5], { tone: "lo" }, { group: TW });
{
  const TX0 = T0.x - 14;
  const TX1 = T0.x + 14;
  const ty0 = 68;
  const ty1 = 96;
  const towerPlan = { x: TX0, y: ty0, w: 28, d: 28, r: 1.6 };
  box("tower.column", [TX0, ty0, 208], [TX1, ty1, 322], { tone: "hi" }, {
    group: TW, r: 1.6, steps: 3,
    inner: Ln(k.sideSeam(towerPlan, 212, P, 3) + k.sideSeam(towerPlan, 312, P, 3), { tone: "faint" }),
    extra: Ln(Array.from({ length: 7 }, (_, i) => path3([[TX1, 74 + i * 3, 216], [TX1, 75.6 + i * 3, 216], [TX1, 75.6 + i * 3, 236], [TX1, 74 + i * 3, 236]], true)).join(""), { tone: "lo" }),
  });
  box("tower.head", [TX0 - 2, ty0 - 2, 322], [TX1 + 2, ty1 + 6, 332], { tone: "hi" }, { group: TW, r: 2, steps: 3, bevel: 0.6, extra: Dots([[-12, -11], [12, -11], [-12, 16], [12, 16]].map(([a, b]) => at([T0.x + a, 82 + b - 1, 332])), { size: 0.45 }) });
  box("tower.foot", [TX0 - 2, ty0 - 2, Z.deck + 10], [TX1 + 2, ty1 + 6, 208], { tone: "mid" }, { group: TW, r: 2, steps: 3, bias: 0.05 });
  // Guide rods on the tower's front, below the head.
  for (const dx of [-8, 8]) {
    const F = G.frameOf([T0.x + dx, ty1 + 3, 208], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
    disc("tower.guide", F, 0, 114, 1, { tone: "mid" }, { group: TW });
  }
  // Lead screw between the guides.
  {
    const F = G.frameOf([T0.x, ty1 + 3, 208], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
    disc("tower.screw", F, 0, 114, 0.9, { tone: "lo" }, { group: TW });
  }
  // The syringe carriage, drawn at rest with the needle tip 28 above the nut.
  const SAM = "sampler";
  const tip = NEEDLE.rest;
  const barrelLo = tip + NEEDLE.len;
  const barrelHi = barrelLo + 22;
  const F = G.frameOf([T0.x, SY, tip], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  const needleShape = record(A.disc(F, 0, NEEDLE.len, NEEDLE.r, { name: "needle", owner: SAM }));
  const clipTo = (id, z) => `<clipPath id="${id}"><path d="${path3([[T0.x - 12, SY, z], [T0.x + 12, SY, z], [T0.x + 12, SY, 345], [T0.x - 12, SY, 345]], true)}"/></clipPath>`;
  put("needle", [T0.x, SY, tip + 15], `${clipTo("gc-needle-clip", NUT_TOP)}<g clip-path="url(#gc-needle-clip)"><g data-part="needle-move">${S(G.disc(0, NEEDLE.len, NEEDLE.r, F, P, { steps: 12 }), { tone: "hi" })}</g></g>`, [needleShape], { attrs: groupAttr(TW), bias: 0.3 });
  disc("syringe.hub", F, NEEDLE.len, NEEDLE.len + 2, 1.6, { tone: "mid" }, { group: SAM, owner: SAM });
  disc("syringe.barrel", F, NEEDLE.len + 2, 37, 2.6, { tone: "hi" }, { group: SAM, owner: SAM, inner: Ln([34, 36].map((s) => G.arcOf(F, s, 2.6, P)).join(""), { tone: "lo" }) });
  box("syringe.clamp", [T0.x - 5, SY - 4, barrelLo + 7], [T0.x + 5, SY + 4, barrelLo + 13], { tone: "mid" }, { group: SAM, owner: SAM, bevel: 0.3 });
  disc("syringe.barrel", F, 43, 52, 2.6, { tone: "hi" }, { group: SAM, owner: SAM, inner: Ln([45, 47, 49].map((s) => G.arcOf(F, s, 2.6, P)).join(""), { tone: "lo" }) });
  disc("syringe.flange", F, 52, 53.4, 4.2, { tone: "mid" }, { group: SAM, owner: SAM });
  // Carriage arm: from the guides out to the clamp, and the block riding the rods.
  box("sampler.block", [T0.x - 12, ty1 + 4, barrelLo + 2], [T0.x + 12, ty1 + 8, barrelLo + 18], { tone: "hi" }, { group: SAM, bevel: 0.4, r: 0.8 });
  box("sampler.arm", [T0.x - 4, ty1 + 8, barrelLo + 8], [T0.x + 4, SY - 4, barrelLo + 12], { tone: "mid" }, { group: SAM, owner: SAM });
  // Plunger: a rod from the flange up to a head held by the driver.
  const pl = barrelHi + 8;
  const flangeZ = tip + 53.4;
  const rodShape = record(A.disc(F, 53.4, pl - tip, 0.9, { name: "plunger.rod", owner: SAM }));
  put("plunger.rod", [T0.x, SY, flangeZ + 4], `${clipTo("gc-rod-clip", flangeZ)}<g clip-path="url(#gc-rod-clip)"><g data-part="rod-move">${S(G.disc(53.4 - 8, pl - tip, 0.9, F, P, { steps: 16 }), { tone: "mid" })}</g></g>`, [rodShape], { attrs: groupAttr(SAM) });
  disc("plunger.head", F, pl - tip, pl - tip + 1.6, 3.2, { tone: "hi" }, { group: "plunger", owner: SAM });
  box("plunger.driver", [T0.x - 3, ty1 + 4, pl + 1.6], [T0.x + 3, SY + 3, pl + 4.4], { tone: "mid" }, { group: "plunger", owner: SAM });
  // Vial rack on a fixed shelf; it slides under the needle during the draw.
  const SHELF_Z = 228;
  box("shelf", [T0.x - 46, ty1 + 4, SHELF_Z - 2.4], [T0.x + 12, SY - 4.2, SHELF_Z], { tone: "mid" }, { group: TW, bevel: 0.3 });
  box("rack", [T0.x - 46, SY - 5, SHELF_Z], [T0.x - 5.4, SY + 5, SHELF_Z + 1.6], { tone: "lo" }, { group: "tray" });
  for (let i = 0; i < 4; i++) vial("rack.vial", T0.x - 10 - i * 9.6, SY, SHELF_Z + 1.6, "tray");
}

// ---------- detectors ----------
// FID: a cast block with a window cut in its front, jet and collector inside.
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
  const COL = S(G.lathe([[0, 5], [8, 5], [8, 3.8], [0, 3.8]], CF, P, {}), { tone: "hi" });
  cav.push(COL);
  // Igniter wire and post at the left of the jet.
  cav.push(Ln(path3([[w.x0, FLAME.y, FLAME.jetTop + 2], [FLAME.x - 4.6, FLAME.y, FLAME.jetTop + 2]]), { tone: "mid" }) + Dots([at([FLAME.x - 4.6, FLAME.y, FLAME.jetTop + 2])], { size: 0.8, tone: "mid" }));
  const fb = `<g class="gc-flame-fb"><path d="${flamePath(9)}" class="gc-fb-body"/><path d="${flamePath(5)}" class="gc-fb-core"/></g>`;
  function flamePath(h) {
    const pts = [];
    const steps = 18;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const r = 2.4 * Math.sin(Math.PI * Math.pow(t, 0.62)) * (h / 9);
      pts.push([FLAME.x - r, FLAME.y, FLAME.jetTop - 0.2 + t * h]);
    }
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const r = 2.4 * Math.sin(Math.PI * Math.pow(t, 0.62)) * (h / 9);
      pts.push([FLAME.x + r, FLAME.y, FLAME.jetTop - 0.2 + t * h]);
    }
    return path3(pts, true);
  }
  const opening = q([w.x0, y1, w.z0], [w.x1, y1, w.z0], [w.x1, y1, w.z1], [w.x0, y1, w.z1]);
  const svg = S(k.slabOf({ x: f.x0, y: f.y0, w: f.x1 - f.x0, d: f.y1 - f.y0, r: 1.4 }, Z.deck, f.z1 - Z.deck, P, 3, 0.5), { tone: "hi", inner: Ln(k.sideSeam({ x: f.x0, y: f.y0, w: f.x1 - f.x0, d: f.y1 - f.y0, r: 1.4 }, Z.deck + 4, P, 3), { tone: "faint" }) })
    + `<clipPath id="gc-win"><path d="${opening}"/></clipPath><g clip-path="url(#gc-win)" class="gc-inside">${cav.join("")}${fb}</g>`
    + Ln(opening, { tone: "mid" })
    + Dots([[f.x0 + 3, y1, Z.deck + 2], [f.x1 - 3, y1, Z.deck + 2], [f.x0 + 3, y1, f.z1 - 2], [f.x1 - 3, y1, f.z1 - 2]].map(at), { size: 0.45 })
    + Dots([[-11, -11], [11, -11], [-11, 11], [11, 11]].map(([a, b]) => at([48 + a, 112 + b, f.z1])), { size: 0.45 });
  put("fid", [48, 112, 212], svg, [record(A.slab({ x: f.x0, y: f.y0, w: f.x1 - f.x0, d: f.y1 - f.y0, r: 1.4 }, Z.deck, f.z1 - Z.deck, { name: "fid" }, 3))], { attrs: ' data-part="fid"' });
  // Chimney and collector connector on top of the block.
  const CH = G.frameOf([42, 108, f.z1], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  disc("fid.chimney", CH, 0, 14, 3, { tone: "hi" }, { steps: 32, inner: Ln(G.arcOf(CH, 4, 3, P), { tone: "faint" }) });
  disc("fid.chimneycap", CH, 14, 16, 4.2, { tone: "mid" }, { steps: 32 });
  const PLG = G.frameOf([55, 116, f.z1], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  disc("fid.insulator", PLG, 0, 5, 2.6, { tone: "hi" }, { steps: 28, inner: Ln(G.arcOf(PLG, 2.5, 2.6, P), { tone: "lo" }) });
}
// ECD: a heated cell with a makeup port and a pulse lead.
{
  const e = ECD;
  const F = G.frameOf([e.x, e.y, Z.deck], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  box("ecd.block", [e.x - 13, e.y - 13, Z.deck], [e.x + 13, e.y + 13, Z.deck + 12], { tone: "mid" }, { r: 1.2, steps: 2, bevel: 0.4, extra: Dots([[-10, -10], [10, -10], [-10, 10], [10, 10]].map(([a, b]) => at([e.x + a, e.y + b, Z.deck + 12])), { size: 0.45 }) });
  const cell = G.frameOf([e.x, e.y, Z.deck + 12], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  disc("ecd.can", cell, 0, 20, 10, { tone: "hi" }, { steps: 64, bevel: 0.6, cls: "ecdcan", extra: Faded(G.ribsOf(cell, 1.4, 16, 10, 36, P, { fade: [0.08, 0.5], seams: true }), { tone: "lo" }) });
  disc("ecd.neck", cell, 20, 24, 3.6, { tone: "mid" }, { steps: 32 });
  disc("ecd.vent", cell, 24, 28, 1.2, { tone: "hi" }, { steps: 16 });
  disc("ecd.ventnut", cell, 28, 31, 2.6, { tone: "mid" }, { steps: 6 });
  disc("ecd.vent", cell, 31, 38, 1.2, { tone: "hi" }, { steps: 16 });
  const PF = G.frameAlong([e.x + 10, e.y + 2, 208], [1, 0, 0]);
  disc("ecd.pulse", PF, 0, 5, 2.4, { tone: "mid" }, { steps: 24 });
}

// ---------- pneumatics and electrometer, along the back of the deck ----------
const EPC = { x0: 22, x1: 136, y0: 22, y1: 54, z1: 212 };
box("epc", [EPC.x0, EPC.y0, Z.deck], [EPC.x1, EPC.y1, EPC.z1], { tone: "mid" }, {
  r: 1.2, steps: 2, bevel: 0.5,
  inner: Ln(k.sideSeam({ x: EPC.x0, y: EPC.y0, w: EPC.x1 - EPC.x0, d: EPC.y1 - EPC.y0, r: 1.2 }, Z.deck + 5, P, 2), { tone: "faint" }),
  extra: Dots([[EPC.x0 + 3, EPC.y0 + 3], [EPC.x1 - 3, EPC.y0 + 3], [EPC.x0 + 3, EPC.y1 - 3], [EPC.x1 - 3, EPC.y1 - 3]].map(([x, y]) => at([x, y, EPC.z1])), { size: 0.45 }),
});
for (let i = 0; i < 6; i++) {
  const x = 30 + i * 18 + 14;
  const F = G.frameOf([x, 38, EPC.z1], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  disc("epc.valve", F, 0, 8, 4.6, { tone: "hi" }, { steps: 32, bevel: 0.4, inner: Ln(G.arcOf(F, 2, 4.6, P), { tone: "faint" }) });
  disc("epc.valvecap", F, 8, 10, 2.2, { tone: "mid" }, { steps: 20 });
}
const Y_EPC = EPC.y1;
const GAS = 200;
// The right side: a vent bank, a rating plate and a mains inlet.
put("upper.vents", [CASE.x1, 90, 158], Ln(Array.from({ length: 12 }, (_, i) => path3([[CASE.x1, 66 + i * 7, 138], [CASE.x1, 70 + i * 7, 138], [CASE.x1, 70 + i * 7, 178], [CASE.x1, 66 + i * 7, 178]], true)).join(""), { tone: "lo" }), [record(A.box([CASE.x1, 66, 138], [CASE.x1 + 0.05, 151, 178], { name: "upper.vents" }))], { bias: 0.1 });
box("side.plate", [CASE.x1, 104, 76], [CASE.x1 + 0.6, 146, 100], { tone: "lo" }, {
  extra: Dots([[107, 79], [143, 79], [107, 97], [143, 97]].map(([y, z]) => at([CASE.x1 + 0.6, y, z])), { size: 0.45 }) + Ln([26, 18, 30].map((w, i) => path3([[CASE.x1 + 0.6, 111, 93 - i * 5], [CASE.x1 + 0.6, 111 + w, 93 - i * 5]])).join(""), { tone: "lo", free: true }),
});
box("side.inlet", [CASE.x1, 112, 22], [CASE.x1 + 3, 134, 34], { tone: "mid" }, { r: 0.8, extra: Dots([[116, 28], [123, 28], [130, 28]].map(([y, z]) => at([CASE.x1 + 3, y, z])), { size: 0.7, tone: "lo" }) });

// Gas feeds up the right side of the case, two of them through inline traps.
const LANES = [26, 34, 42, 50];
const SIDE_X = 157;
const BLOCK = { x0: 150, x1: 170, y0: 22, y1: 58 };
box("gas.block", [BLOCK.x0, BLOCK.y0, 0], [BLOCK.x1, BLOCK.y1, 10], { tone: "mid" }, { bevel: 0.4, extra: Dots([[BLOCK.x0 + 2.4, BLOCK.y0 + 2.4], [BLOCK.x1 - 2.4, BLOCK.y1 - 2.4]].map(([x, y]) => at([x, y, 10])), { size: 0.45 }) });
const FEEDS = ["carrier", "hydrogen", "air", "makeup"];
LANES.forEach((y, i) => {
  const path = [[SIDE_X, y, 10], [SIDE_X, y, GAS], [EPC.x1, y, GAS]];
  const route = G.fillet(path, 5, 10, { P, tube: 0.9 });
  const gaps = [];
  if (i === 0) gaps.push([60, 100]);
  line(`feed.${FEEDS[i]}`, path, 0.9, { bend: 5, tone: "hi", gaps, touch: ["gastrap", "gastrap.strap", "side.clip*"] });
  if (i === 0) {
    const F = G.frameOf([SIDE_X, y, 10], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
    disc("gastrap", F, 60, 100, 3.6, { tone: "hi" }, { steps: 32, inner: Ln(G.arcOf(F, 66, 3.6, P) + G.arcOf(F, 94, 3.6, P), { tone: "faint" }) });
    box("gastrap.strap", [CASE.x1, y - 1, 78], [SIDE_X - 3.55, y + 1, 82], { tone: "lo" }, { owner: "gastrap" });
  }
});
for (const [i, y] of LANES.entries()) box("side.clip", [CASE.x1, y - 1.6, 150], [SIDE_X - 0.92, y + 1.6, 153], { tone: "lo" });

// Carriers along the front of the deck to each inlet, hydrogen and air into the FID, makeup into the ECD.
line("carrier.a", [[EPC.x0, 44, GAS], [18, 44, GAS], [18, 158, GAS], [T0.x, 158, GAS], [T0.x, T0.y + 14, GAS]], 0.9, { bend: 5 });
line("carrier.b", [[EPC.x0, 32, GAS], [12, 32, GAS], [12, 150, GAS], [INLET[1].x, 150, GAS], [INLET[1].x, INLET[1].y + 14, GAS]], 0.9, { bend: 5 });
line("fid.h2", [[42, Y_EPC, GAS], [42, FID.y0, GAS]], 0.9, { bend: 4 });
line("fid.air", [[56, Y_EPC, GAS], [56, FID.y0, GAS]], 0.9, { bend: 4 });
line("ecd.makeup", [[ECD.x, Y_EPC, GAS], [ECD.x, ECD.y - 13, GAS]], 0.9, { bend: 4 });
// Split vents to the charcoal trap.
box("trap.manifold", [TRAP.x + 7, TRAP.y - 16, Z.deck], [TRAP.x + 12, TRAP.y + 14, Z.deck + 10], { tone: "mid" }, { extra: Dots([[TRAP.x + 9.5, TRAP.y - 13], [TRAP.x + 9.5, TRAP.y + 11]].map(([x, y]) => at([x, y, Z.deck + 10])), { size: 0.45 }) });
line("vent.a", [[T0.x - 14, 124, 198], [TRAP.x + 12, 124, 198]], 0.7, { bend: 4, tone: "mid" });
line("vent.b", [[INLET[1].x - 14, 124, 198], [-50, 124, 198], [-50, 146, 198], [TRAP.x + 12, 146, 198]], 0.7, { bend: 4, tone: "mid" });
// Signal leads back to the electrometer.
line("signal.fid", [[55, 116, FID.z1 + 5], [55, 116, 246], [55, 46, 246], [55, 46, EPC.z1]], 0.55, { tone: "lo", bend: 5, shells: [false, false] });
line("signal.ecd", [[ECD.x + 15, ECD.y + 2, 208], [132, ECD.y + 2, 208], [132, EPC.y1, 208]], 0.55, { tone: "lo", bend: 4, shells: [false, false] });

A.settle(R, P);
R.items.sort((a, b) => a.key - b.key);

const groups = R.items.map((item) => `<g class="it" data-name="${item.name}"${item.attrs ?? ""}>${item.svg}</g>`).join("");
const LABEL_TEXT = "A benchtop gas chromatograph with its oven door cut away to a frame. Inside the oven are two capillary columns wound on wire cages in front of a fan and heater ring. On the deck above stand an autosampler tower with a syringe over two split/splitless inlets with knurled septum nuts, a flame ionization detector with a window showing its jet and collector, an electron capture cell, a pneumatics block and gas lines. A paper strip across the front of the case carries the chromatogram, and a dial reads oven temperature beside a knurled method selector.";
const svg = k.figureSvg({ width: W, height: H, label: LABEL_TEXT, className: "gc-svg", body: [...back, `<g class="gc-items">${groups}</g>`] });

// The flame's canvas covers only a small box round the FID window.
const corners = [[WIN.x0 - 3, WIN.y1, WIN.z0 - 3], [WIN.x1 + 3, WIN.y1, WIN.z0 - 3], [WIN.x1 + 3, WIN.y1, WIN.z1 + 3], [WIN.x0 - 3, WIN.y1, WIN.z1 + 3], [FLAME.x - 12, FLAME.y, WIN.z0], [FLAME.x + 12, FLAME.y, WIN.z1]].map(at);
const bx0 = Math.floor(Math.min(...corners.map((c) => c[0])));
const by0 = Math.floor(Math.min(...corners.map((c) => c[1])));
const bx1 = Math.ceil(Math.max(...corners.map((c) => c[0])));
const by1 = Math.ceil(Math.max(...corners.map((c) => c[1])));
const camera = glCamera(P);
const DATA = {
  W, H, P,
  G: { TOWER_DX, NEEDLE_TRAVEL: NEEDLE.rest - (NUT_TOP - 16), TRAY: 10, PLUNGER: 6.5, PLOT, KNOB, ky: PANEL.y, knobR: KNOB.r, u0: plotU("dro", 0) },
  gl: { box: [bx0, by0, bx1 - bx0, by1 - by0], camera: { ...camera, origin: [camera.origin[0] - bx0, camera.origin[1] - by0] }, flame: FLAME, win: WIN },
};

const STAGE_CSS = readFileSync(join(HERE, "gc.css"), "utf8");
const modelSource = readFileSync(join(HERE, "gc-model.mjs"), "utf8").replace(/^export /gm, "").replace(/if \(typeof process[\s\S]*$/, "").replace(/^const K0/m, "const K0");
const LIVE = readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify(DATA));

const stageHtml = `<div class="iso-stage gc-stage" data-gc tabindex="0" role="group" aria-label="Gas chromatograph. Press I, or Inject, to run the selected method. Press M to switch between EPA 8015 on the flame ionization detector and EPA 552.3 on the electron capture detector. Left and right arrows step through the peaks on the paper.">${svg}<canvas class="gc-flame" aria-hidden="true" style="left:${f2((bx0 / W) * 100)}%;top:${f2((by0 / H) * 100)}%;width:${f2(((bx1 - bx0) / W) * 100)}%;height:${f2(((by1 - by0) / H) * 100)}%"></canvas><span class="gc-sr" role="status" aria-live="polite" data-status></span></div><div class="gc-controls"><div class="gc-seg" role="group" aria-label="Method"><button type="button" data-method="dro" aria-pressed="true">8015 DRO/ORO · FID</button><button type="button" data-method="haa" aria-pressed="false">552.3 HAAs · ECD</button></div><button type="button" class="gc-inject" data-inject>Inject</button></div><p class="gc-name" data-gc-name></p>`;

const CAPTION = "One benchtop instrument with two channels, each with its own inlet, column and detector. Every trace is computed from a method model, not instrument data. On the 8015 channel, the n-alkane ladder runs C10 to C40 over a diesel hump, with o-terphenyl as surrogate. EPA 8015D defines DRO as C10 to C28; the C28 to C40 oil window is a common laboratory extension, and carbon windows vary by regulator. C10 to C18 and the C40 mark sit at the times of a published DRO/ORO standard (15 m thin-film column, 40 to 400 °C at 19.6 °C/min). Other times come from a retention model fitted to those points, so they are illustrative, as are the hump's shape and the heights. On the 552.3 channel, nine haloacetic acids are extracted into MTBE and heated in acidic methanol to methyl esters, with 2-bromobutanoic acid as surrogate and 1,2,3-trichloropropane as internal standard. Oven program and retention times are EPA Table 1 for its 14% cyanopropylphenyl primary column; heights are read from EPA Figure 1. Dalapon, also in the method at 14.69 min, is not drawn. Runs play at 1.5 run-minutes per second.";

function write(theme) {
  const body = `<style>${STAGE_CSS}</style><div class="gc-root" data-gc-root>` + k.plateHtml({
    fig: "Fig 5",
    title: "Benchtop GC, oven door cut away",
    hint: "I inject · M method · ← → peaks",
    readout: "8015 · ready · 40 °C",
    keys: [
      { mark: "lit", label: "Pen trace: the detector signal against run time" },
      { mark: "red", label: "Coil: lit windings show where compounds are on the column" },
      { mark: "edge", label: "Gas lines: carrier, hydrogen, air, makeup" },
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
A.auditOrExit(R, P, { cover: ["pen.tip"] });
