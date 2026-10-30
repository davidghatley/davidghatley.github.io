// One pure model behind every number the GC figure shows or moves.
// No DOM, no clocks. Times are in minutes of run time, temperatures in degrees C.
// Sources for each constant: gc/SOURCES.md.

export const MIN_PER_S = 1.5; // the figure plays a run at 1.5 run-minutes per real second

const K0 = 273.15;
const alkaneNames = { 10: "n-decane", 12: "n-dodecane", 14: "n-tetradecane", 16: "n-hexadecane", 18: "n-octadecane", 20: "n-icosane", 22: "n-docosane", 24: "n-tetracosane", 26: "n-hexacosane", 28: "n-octacosane", 30: "n-triacontane", 32: "n-dotriacontane", 34: "n-tetratriacontane", 36: "n-hexatriacontane", 38: "n-octatriacontane", 40: "n-tetracontane" };

// Retention of an n-alkane on the thin-film 15 m column: ln k = a0 + a1 n + (b0 + b1 n) / T.
// Fitted (fit-retention in the --check run below) to the five published times C10..C18
// and the published C40 elution mark, so carbon numbers in between are interpolated by physics.
export const ALKANE_FIT = { a0: -13.78552, a1: -0.557303, b0: 2006.34, b1: 487.6298 };
const lnkAlkane = (n, T) => ALKANE_FIT.a0 + ALKANE_FIT.a1 * n + (ALKANE_FIT.b0 + ALKANE_FIT.b1 * n) / (T + K0);

// Published anchors: tR in seconds for C10..C18; C40 read off the chromatogram's mark (about 860 s).
export const ALKANE_ANCHORS = [[10, 124.3], [12, 203.5], [14, 279.8], [16, 348.9], [18, 411.5], [40, 860]];

function makeTemp(program) {
  return (t) => {
    if (t <= program[0][0]) return program[0][1];
    for (let i = 1; i < program.length; i++) {
      const [t1, T1] = program[i];
      if (t <= t1) {
        const [t0, T0] = program[i - 1];
        return T0 + ((T1 - T0) * (t - t0)) / (t1 - t0);
      }
    }
    return program[program.length - 1][1];
  };
}

// Fraction of the column a compound has travelled by run time t: the retention integral.
const STEP = 0.01;
function travelTable(lnk, tM, temp, end) {
  const table = [0];
  let sum = 0;
  for (let i = 1, count = Math.ceil(end / STEP); i <= count; i++) {
    const T = temp((i - 0.5) * STEP);
    sum += STEP / (tM * (1 + Math.exp(lnk(T))));
    table.push(sum);
  }
  return table;
}
function solveElution(table) {
  for (let i = 1; i < table.length; i++) if (table[i] >= 1) return (i - 1 + (1 - table[i - 1]) / (table[i] - table[i - 1])) * STEP;
  return Infinity;
}
const readTable = (table, t) => {
  const x = t / STEP;
  const i = Math.floor(x);
  if (i >= table.length - 1) return table[table.length - 1];
  if (i < 0) return 0;
  return table[i] + (table[i + 1] - table[i]) * (x - i);
};

// ---------- 8015: DRO/ORO on FID ----------
const droProgram = [[0, 40], [0.1, 40], [0.1 + 360 / 19.6, 400], [20, 400]];
const droTemp = makeTemp(droProgram);
const DRO_TM = 0.45;
export function alkaneTime(n) {
  return solveElution(travelTable((T) => lnkAlkane(n, T), DRO_TM, droTemp, 20));
}
const droPeaks = [];
// The solvent front's time and height are illustrative; the standard's diluent is methylene chloride.
droPeaks.push({ id: "solvent", kind: "solvent", code: "solvent", name: "Methylene chloride, the solvent", t: 0.58, h: 1.5, w: 0.05, offScale: true, approx: true });
for (let n = 10; n <= 40; n += 2) {
  const window = n === 10 || n === 28 || n === 40;
  const h = n <= 28 ? 0.66 - 0.006 * (n - 10) : 0.552 - 0.024 * (n - 28);
  const tabulated = ALKANE_ANCHORS.find(([c]) => c === n && c <= 18);
  droPeaks.push({ id: `C${n}`, kind: window ? "window" : "alkane", code: `C${n}`, name: alkaneNames[n], carbon: n, h, w: n > 30 ? 0.06 : 0.045, lnk: (T) => lnkAlkane(n, T), published: tabulated ? tabulated[1] / 60 : null, approx: !tabulated });
}
droPeaks.push({ id: "OTP", kind: "surrogate", code: "SUR", name: "o-Terphenyl, the surrogate", carbon: 18.9, h: 0.72, w: 0.045, lnk: (T) => lnkAlkane(18.9, T), approx: true });

// ---------- 552.3: nine haloacetic acid methyl esters on ECD ----------
// Oven program, retention times and the primary column are EPA 552.3 Table 1 (MTBE).
// Heights are read by eye from EPA 552.3 Figure 1, counts above baseline.
const haaProgram = [[0, 40], [10, 40], [20, 65], [22, 85], [28, 205], [35, 205]];
const haaTemp = makeTemp(haaProgram);
const HAA_TM = 30 / 0.33 / 60; // 30 m at 33 cm/s
const FULL = 12500;
const ester = (id, kind, name, t, counts) => ({ id, kind, code: id, name, t, h: (0.7 * counts) / FULL, published: t, w: 0.055 });
const haaPeaks = [
  ester("MCAA", "ester", "Methyl chloroacetate, from MCAA", 9.29, 250),
  ester("MBAA", "ester", "Methyl bromoacetate, from MBAA", 14.19, 1300),
  ester("DAL", "ester", "Methyl 2,2-dichloropropanoate, from dalapon", 14.69, 1300),
  ester("DCAA", "ester", "Methyl dichloroacetate, from DCAA", 15.07, 1800),
  ester("TCAA", "ester", "Methyl trichloroacetate, from TCAA", 18.89, 5400),
  ester("IS", "internal", "1,2,3-Trichloropropane, the internal standard", 20.69, 3000),
  ester("BCAA", "ester", "Methyl bromochloroacetate, from BCAA", 21.22, 5800),
  ester("SUR", "surrogate", "Methyl 2-bromobutanoate, from the surrogate 2-bromobutanoic acid", 21.63, 3300),
  ester("BDCAA", "ester", "Methyl bromodichloroacetate, from BDCAA", 23.6, 11700),
  ester("DBAA", "ester", "Methyl dibromoacetate, from DBAA", 24.01, 12500),
  ester("CDBAA", "ester", "Methyl chlorodibromoacetate, from CDBAA", 25.55, 9000),
  ester("TBAA", "ester", "Methyl tribromoacetate, from TBAA", 26.88, 3700),
];
// Each ester gets ln k = A + B/T with one enthalpy; A is solved so the integral lands on the published time.
const HAA_B = 5600;
function solveHaa(peak) {
  let lo = -40;
  let hi = 0;
  for (let i = 0; i < 40; i++) {
    const A = (lo + hi) / 2;
    const end = solveElution(travelTable((T) => A + HAA_B / (T + K0), HAA_TM, haaTemp, 35));
    if (end > peak.t) hi = A;
    else lo = A;
  }
  const A = (lo + hi) / 2;
  return (T) => A + HAA_B / (T + K0);
}

export const METHODS = {
  dro: {
    id: "dro",
    short: "8015-style",
    label: "8015-style DRO/ORO, vendor conditions",
    detector: "FID",
    channel: 0,
    end: 20,
    axisStep: 5,
    tM: DRO_TM,
    temp: droTemp,
    program: droProgram,
    peaks: droPeaks,
    windows: [{ id: "DRO", from: "C10", to: "C28" }, { id: "ORO", from: "C28", to: "C40" }],
  },
  haa: {
    id: "haa",
    short: "552.3",
    label: "552.3 HAAs",
    detector: "ECD",
    channel: 1,
    end: 35,
    axisStep: 5,
    tM: HAA_TM,
    temp: haaTemp,
    program: haaProgram,
    peaks: haaPeaks,
    windows: [],
  },
};

for (const peak of droPeaks) {
  if (peak.lnk) {
    peak.table = travelTable(peak.lnk, DRO_TM, droTemp, 20);
    peak.t = solveElution(peak.table);
  }
}
for (const peak of haaPeaks) peak.table = travelTable(solveHaa(peak), HAA_TM, haaTemp, 35);
droPeaks.sort((a, b) => a.t - b.t);

// What the figure may claim about a time: published values to two decimals, modelled ones as "about".
export const timeText = (p) => (p.approx ? `about ${p.t.toFixed(1)}` : (p.published ?? p.t).toFixed(2));

// Carbon number at a run time, for the hump: inverts the alkane times.
const ladder = droPeaks.filter((p) => p.carbon && p.kind !== "surrogate");
function carbonAt(t) {
  if (t <= ladder[0].t) return 10 - (ladder[0].t - t) * 1.5;
  for (let i = 1; i < ladder.length; i++) if (t <= ladder[i].t) return ladder[i - 1].carbon + ((t - ladder[i - 1].t) / (ladder[i].t - ladder[i - 1].t)) * 2;
  return 40;
}

// The unresolved diesel hump and its grass, illustrative in shape, placed by carbon number.
function humpOf(n) {
  if (n <= 8.6 || n >= 27.5) return 0;
  const x = (n - 8.6) / (27.5 - 8.6);
  return 0.335 * Math.pow(x, 1.25) * Math.pow(1 - x, 1.85) * 7.35;
}
// The oil hump of the composite: a low broad mound over the ORO window, illustrative in shape.
function oilOf(n) {
  if (n <= 25 || n >= 41) return 0;
  const x = (n - 25) / 16;
  return 0.2 * Math.pow(x, 1.2) * Math.pow(1 - x, 1.1) * 4.3;
}
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}
const grass = (() => {
  const rnd = seeded(8015);
  const list = [];
  for (let t = 1.6; t < 11.2; t += 0.035 + rnd() * 0.05) list.push({ t, h: 0.03 + rnd() * rnd() * 0.17, w: 0.022 + rnd() * 0.018 });
  return list;
})();
const gauss = (t, c, w) => {
  const x = (t - c) / w;
  return x * x > 18 ? 0 : Math.exp(-0.5 * x * x);
};

// Detector signal on the recorder's 0..1 scale.
export function humpAt(id, t) {
  if (id !== "dro") return 0;
  const n = carbonAt(t);
  return humpOf(n) + oilOf(t > 14.33 ? 40 + (t - 14.33) * 1.6 : n);
}
export function signalAt(id, t) {
  const m = METHODS[id];
  let s = 0;
  if (id === "dro") {
    const n = carbonAt(t);
    const hump = humpOf(n);
    s += hump + oilOf(t > 14.33 ? 40 + (t - 14.33) * 1.6 : n);
    if (hump > 0) for (const g of grass) if (Math.abs(g.t - t) < g.w * 4.2) s += g.h * Math.min(1, hump * 4.2) * gauss(t, g.t, g.w);
    s += 0.012 * Math.max(0, m.temp(t) - 250) / 150; // column bleed rising with the oven
  }
  for (const p of m.peaks) s += p.h * gauss(t, p.t, p.w);
  return Math.min(1, s);
}

export const tempAt = (id, t) => METHODS[id].temp(t);
export const peakById = (id, peakId) => METHODS[id].peaks.find((p) => p.id === peakId);
export function travelOf(id, peak, t) {
  return peak.table ? readTable(peak.table, t) : t / peak.t;
}
// Every compound's position on the column at run time t, for the bands on the coil.
export function bandsAt(id, t) {
  const out = [];
  for (const p of METHODS[id].peaks) {
    if (!p.table) continue;
    const f = readTable(p.table, t);
    if (f > 0 && f < 1) out.push(f);
  }
  return out;
}
export function lastPeakBefore(id, t) {
  let last = null;
  for (const p of METHODS[id].peaks) if (p.t <= t) last = p;
  return last;
}
export function nextPeakAfter(id, t) {
  return METHODS[id].peaks.find((p) => p.t > t) ?? null;
}
export function programText(id) {
  return id === "dro" ? "40 °C, 19.6 °C/min to 400 °C, 1.5 min hold" : "40 °C 10 min, 2.5 to 65, 10 to 85, 20 to 205 °C, 7 min";
}

// Dial: 0..420 °C over 270 degrees of sweep, starting lower left.
export const DIAL = { min: 0, max: 420, from: -135, sweep: 270 };
export const dialAngle = (T) => DIAL.from + (DIAL.sweep * (T - DIAL.min)) / (DIAL.max - DIAL.min);

// The autosampler's stroke, as a pure function of seconds since Inject was pressed.
// Run time zero is the instant the plunger bottoms out.
export const STROKE = [
  ["tray", 0.7],
  ["dip", 0.6],
  ["draw", 0.5],
  ["lift", 0.6],
  ["park", 0.65],
  ["descend", 0.95],
  ["depress", 0.4],
  ["dwell", 0.25],
  ["retract", 0.8],
];
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
export const STROKE_END = STROKE.reduce((a, [, d]) => a + d, 0);
export const INJECT_AT = STROKE.slice(0, 7).reduce((a, [, d]) => a + d, 0);
const LEVELS = { up: 0, vial: 16 / 44, septum: 1 };
export function strokeAt(s) {
  let at = 0;
  const seg = {};
  for (const [name, d] of STROKE) {
    seg[name] = ease((s - at) / d);
    at += d;
  }
  const tray = seg.tray * (1 - seg.park);
  const drop = LEVELS.vial * seg.dip * (1 - seg.lift) + LEVELS.septum * seg.descend * (1 - seg.retract);
  const plunger = seg.draw * (1 - seg.depress);
  let phase = "idle";
  at = 0;
  for (const [name, d] of STROKE) {
    if (s >= at && s < at + d) phase = name;
    at += d;
  }
  return { tray, drop, plunger, phase };
}
// The selector's swap: pocket gates open, the shuttle moves one bay, the gates close. u is 0 to 1 toward the 552.3 column.
export function swapAt(u) {
  const gate = ease(Math.min(1, u / 0.22)) * (1 - ease((u - 0.78) / 0.22));
  return { gate, shuttle: ease((u - 0.2) / 0.6) };
}
export const runOf = (seconds) => seconds * MIN_PER_S;
// Oven door vents after a run: a plain exponential toward the start temperature, about 4 s of figure time.
export const coolAt = (from, to, seconds) => to + (from - to) * Math.exp(-seconds / 1.1);

if (typeof process !== "undefined" && process.argv?.includes("--check")) {
  for (const [n, s] of ALKANE_ANCHORS) console.log(`C${n}`, "published", (s / 60).toFixed(2), "model", alkaneTime(n).toFixed(2));
  for (const p of droPeaks) console.log(p.id.padEnd(8), p.t.toFixed(2), droTemp(p.t).toFixed(0));
  for (const p of haaPeaks) console.log(p.id.padEnd(8), p.t.toFixed(2), solveElution(p.table).toFixed(2), haaTemp(p.t).toFixed(0));
}
