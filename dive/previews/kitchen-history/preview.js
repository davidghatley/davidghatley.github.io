const CSS = `
.pv-kitchen-history{font:400 13px/18px var(--font-sans);color:var(--ink)}
.pv-kitchen-history svg{display:block;width:100%;height:auto}
.pv-kitchen-history text{font-family:var(--font-mono);font-size:11px;fill:var(--ink-muted)}
.pv-kitchen-history .px{font-family:var(--font-pixel);font-size:16px;fill:var(--ink)}
.pv-kitchen-history .ep{font-family:var(--font-serif);font-style:italic;font-size:12px;fill:var(--ink-muted)}
.pv-kitchen-history .nm{font-size:13px;font-weight:600;fill:var(--ink)}
.pv-kitchen-history .nd rect{fill:var(--sheet);stroke:var(--ink)}
.pv-kitchen-history .nd.new rect{stroke:var(--ink-muted)}
.pv-kitchen-history .lk{fill:none;stroke:var(--ink-muted);stroke-width:1.5;stroke-linecap:butt}
.pv-kitchen-history .hit{fill:none;stroke:transparent;stroke-width:14;cursor:pointer;pointer-events:stroke}
.pv-kitchen-history .ln.on .lk{stroke:var(--vermilion);stroke-width:3}
.pv-kitchen-history .dim .ln:not(.on) .lk{opacity:.3}
.pv-kitchen-history .lb .lk{stroke:var(--rule);stroke-dasharray:3 3;stroke-width:1.2}
.pv-kitchen-history .lb text{fill:var(--ink-muted);opacity:.85;font-size:10px}
.pv-kitchen-history .lb .x{stroke:var(--rule);stroke-width:1.5}
.pv-kitchen-history .out{margin-top:8px;border-top:1px solid var(--rule);padding-top:8px;min-height:44px;font:400 12px/18px var(--font-mono);color:var(--ink-muted)}
.pv-kitchen-history .out b{color:var(--ink);font-weight:600}
.pv-kitchen-history .out i{font-style:normal;color:var(--vermilion-text)}
.pv-kitchen-history .tag{font:600 10px/14px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;fill:var(--ink-muted)}
`;
const OLD = [
  ['gauntlet', '67 tests', 'A loop worth keeping, never measured.'],
  ['system-a', '47 MB', 'Meant to pick primitives; it cloned habits.'],
  ['system-one-mini', '44.5%', 'Fast, and wrong off the script.'],
  ['precision-canvas', '473 caps', 'A spec programme with no pixels.'],
  ['local-mobile-research', '518+94', 'Packing, not search, lost the evidence.'],
];
const NEW = ['bonfire', 'nibble', 'napkin', 'mise_en_place', 'playdough'];
// [old, new, label, detail]
const LINKS = [
  ['gauntlet', 'bonfire', 'loop, schema, store', 'Loop phases, the Finding schema and verify rules, durable store and resume, the scripted-adapter test idea, the orchestration report template.'],
  ['system-a', 'bonfire', 'durable retries', 'One line: model timeouts need durable retries.'],
  ['system-a', 'nibble', 'evidence table', 'Model-card evidence table (the baseline beat it on NLL) and the positive-control-first rule.'],
  ['system-one-mini', 'bonfire', 'worktree noise', 'One lesson: worktree noise, on-disk handoff.'],
  ['system-one-mini', 'nibble', 'retrospective', 'Retrospective excerpt: shared-state speed, and the collapse on unseen wording (44.5% at 97% confidence).'],
  ['precision-canvas', 'napkin', 'invariants, checklists', 'INV-01/03/04/06/08, the AGT-01..28 and COD-01..21 checklists, a condensed transaction model, four test ideas.'],
  ['local-mobile-research', 'mise_en_place', 'packing beats search', '"Packing beats searching" finding, the per-stage required-item survival metric, real-token budgets.'],
  ['local-mobile-research', 'nibble', 'min. difference rule', 'The minimum-meaningful-difference rule.'],
  ['local-mobile-research', 'playdough', 'lessons only', 'Lessons only, no files.'],
];
const LEFT = {
  gauntlet: 'the code, wholesale',
  'system-a': 'all code and data',
  'system-one-mini': 'the 5-head code',
  'precision-canvas': 'the 620 KB spec, governance',
  'local-mobile-research': 'the app, the freeze process',
};
const NS = 'http://www.w3.org/2000/svg';

export default function mount(root, { mode }) {
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const el = document.createElement('div'); el.className = 'pv-kitchen-history ' + mode; root.appendChild(el);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const H = mode === 'hero' ? 520 : 400, W = 1000, top = 36, bot = H - 20;
  const step = (bot - top - 64) / 4;
  const oy = i => top + i * step, ny = i => top + i * step;
  const NW = 250, NH = 64, LX = 0, RX = W - NW - 1;
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Salvage map: five earlier experiments on the left, five new repos on the right, with a line for each excerpt carried over');
  const h = (t, a = {}, p = svg) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; };
  h('text', { x: LX, y: 14, class: 'tag' }).textContent = 'earlier experiments';
  h('text', { x: W, y: 14, class: 'tag', 'text-anchor': 'end' }).textContent = 'new kitchen repos';
  h('text', { x: W / 2, y: 16, class: 'px', 'text-anchor': 'middle' }).textContent = 'AUDIT 2026-10-17';
  const oi = Object.fromEntries(OLD.map((o, i) => [o[0], i])), ni = Object.fromEntries(NEW.map((n, i) => [n, i]));
  const g = h('g'), lbG = h('g', { class: 'lb' }), nodes = h('g');
  OLD.forEach(([n, d, ep], i) => {
    const gg = h('g', { class: 'nd' }, nodes); h('rect', { x: LX + .5, y: oy(i) + .5, width: NW, height: NH }, gg);
    h('text', { x: 12, y: oy(i) + 20, class: 'nm' }, gg).textContent = n;
    h('text', { x: 12, y: oy(i) + 58, class: 'px' }, gg).textContent = d;
    h('text', { x: 12, y: oy(i) + 38, class: 'ep' }, gg).textContent = ep;
    // left-behind stub from the lower right of the node
    const y = oy(i) + NH - 8, x = LX + NW + 1;
    h('line', { x1: x, x2: x + 26, y1: y, y2: y, class: 'lk' }, lbG);
    h('path', { d: `M${x + 26} ${y - 4}l8 8M${x + 34} ${y - 4}l-8 8`, class: 'x', fill: 'none' }, lbG);
    h('text', { x: x + 42, y: y + 3 }, lbG).textContent = 'left: ' + LEFT[n];
  });
  NEW.forEach((n, i) => {
    const gg = h('g', { class: 'nd new' }, nodes); h('rect', { x: RX + .5, y: ny(i) + .5, width: NW, height: NH }, gg);
    h('text', { x: RX + 12, y: ny(i) + 20, class: 'nm' }, gg).textContent = n;
    const cnt = LINKS.filter(l => l[1] === n).length;
    h('text', { x: RX + 12, y: ny(i) + 58, class: 'px' }, gg).textContent = cnt + (cnt === 1 ? ' IN' : ' IN');
  });
  // fan out per-node attachment points
  const outN = {}, inN = {}; LINKS.forEach(l => { outN[l[0]] = (outN[l[0]] || 0) + 1; inN[l[1]] = (inN[l[1]] || 0) + 1; });
  const outK = {}, inK = {};
  const lines = LINKS.map((l, idx) => {
    const a = oi[l[0]], b = ni[l[1]];
    const ko = outK[l[0]] = (outK[l[0]] ?? -1) + 1, ki = inK[l[1]] = (inK[l[1]] ?? -1) + 1;
    const y1 = oy(a) + 10 + (outN[l[0]] > 1 ? ko * (NH - 28) / (outN[l[0]] - 1) : (NH - 28) / 2 + 4);
    const y2 = ny(b) + 8 + (inN[l[1]] > 1 ? ki * (NH - 16) / (inN[l[1]] - 1) : (NH - 16) / 2);
    const x1 = LX + NW + 1, x2 = RX - 1, mx = (x1 + x2) / 2;
    const gl = h('g', { class: 'ln', tabindex: 0 }, g);
    const d = `M${x1} ${y1}C${mx + 60} ${y1} ${mx - 60} ${y2} ${x2} ${y2}`;
    const p = h('path', { d, class: 'lk' }, gl); h('path', { d, class: 'hit' }, gl);
    const len = p.getTotalLength ? p.getTotalLength() : 600;
    p.style.strokeDasharray = len; p.style.strokeDashoffset = reduce ? 0 : len;
    gl.setAttribute('aria-label', `${l[0]} to ${l[1]}: ${l[3]}`);
    gl._i = idx; gl._p = p; gl._len = len; return gl;
  });
  // left-behind items are drawn below the carried lines only visually; keep them behind
  el.appendChild(svg);
  const out = document.createElement('div'); out.className = 'out'; el.appendChild(out);
  const idle = () => { out.innerHTML = 'Hover or focus a line to see what was carried. Grey dashed stubs were <b>left behind</b>: the default verdict was to leave.'; svg.classList.remove('dim'); lines.forEach(x => x.classList.remove('on')); };
  const show = (gl) => { const l = LINKS[gl._i]; lines.forEach(x => x.classList.toggle('on', x === gl)); svg.classList.add('dim');
    out.innerHTML = `<b>${l[0]}</b> <i>to</i> <b>${l[1]}</b>: ${l[3]}`; };
  lines.forEach(gl => { gl.addEventListener('pointerenter', () => show(gl)); gl.addEventListener('focus', () => show(gl)); gl.addEventListener('click', () => show(gl)); gl.addEventListener('pointerleave', idle); gl.addEventListener('blur', idle); });
  idle();

  // drawn in steps: one old repo at a time, then its lines
  lbG.style.opacity = reduce ? 1 : 0; lbG.style.transition = 'opacity .6s';
  const timers = []; let raf = 0;
  if (!reduce) {
    const order = OLD.map(o => o[0]);
    let t0 = 0; const per = 650, dur = 600;
    const tick = (t) => {
      if (!t0) t0 = t;
      let more = false;
      lines.forEach((gl, k) => { const s = order.indexOf(LINKS[gl._i][0]) * per + (k % 3) * 80;
        const p = Math.max(0, Math.min(1, (t - t0 - s) / dur)), e = 1 - Math.pow(1 - p, 3);
        gl._p.style.strokeDashoffset = gl._len * (1 - e); if (p < 1) more = true; });
      if (t - t0 > order.length * per + 200) lbG.style.opacity = 1;
      if (more || t - t0 < order.length * per + 900) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  return () => { cancelAnimationFrame(raf); el.remove(); style.remove(); };
}
