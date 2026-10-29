// stem 7 preview: each letter of a word is built on its cell grid, one cell per tick, while the same word sits in
// the real font beside it at the house sizes, with the letter being built picked out in the accent.
const CSS = `
.pv-stem7{--c:20px;display:grid;grid-template-columns:auto minmax(0,1fr);gap:32px;align-items:start;color:var(--ink)}
.pv-stem7 *{box-sizing:border-box}
.pv-stem7 .s7-build{display:grid;gap:12px;align-content:start}
.pv-stem7 .s7-cells{justify-self:start;display:grid;grid-template-rows:repeat(9,var(--c));gap:0;background:var(--sheet);border:1px solid var(--rule);position:relative}
.pv-stem7 .s7-cells i{width:var(--c);height:var(--c);border-right:1px solid var(--rule-faint);border-bottom:1px solid var(--rule-faint)}
.pv-stem7 .s7-cells i.on{background:var(--ink);border-color:var(--ink)}
.pv-stem7 .s7-cells i.new{background:var(--accent);border-color:var(--accent)}
.pv-stem7 .s7-cells b{position:absolute;left:0;right:0;height:1px;background:var(--accent);opacity:.7}
.pv-stem7 .s7-k{font:500 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted)}
.pv-stem7 .s7-k b{color:var(--ink);font-weight:500}
.pv-stem7 .s7-src{margin:0;font:400 13px/20px var(--font-mono);color:var(--ink-muted);white-space:pre;min-height:40px}
.pv-stem7 .s7-fall{display:grid;gap:16px;min-width:0}
.pv-stem7 .s7-line{display:grid;grid-template-columns:96px minmax(0,1fr);align-items:end;gap:16px;border-bottom:1px solid var(--rule);padding-bottom:12px;min-width:0}
.pv-stem7 .s7-t{font-family:var(--font-pixel);line-height:1;font-synthesis:none;font-kerning:normal;font-variant-ligatures:common-ligatures;-webkit-font-smoothing:none;white-space:nowrap;overflow:hidden}
.pv-stem7 .s7-t span.cur{color:var(--accent)}
.pv-stem7 .s7-bar{height:2px;background:var(--rule);position:relative;overflow:hidden}
.pv-stem7 .s7-bar i{position:absolute;inset:0 auto 0 0;width:0;background:var(--accent)}
@media(max-width:639px){.pv-stem7{grid-template-columns:minmax(0,1fr);--c:14px}.pv-stem7 .s7-l72{display:none}.pv-stem7 .s7-line{grid-template-columns:64px minmax(0,1fr)}}
`;
const WORDS = ['Stem 7', 'place', 'SEED 4127', 'dh'];

export default function mount(root, { mode, base }) {
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const el = document.createElement('div'); el.className = 'pv-stem7'; root.appendChild(el);
  if (mode === 'hero') el.style.setProperty('--c', innerWidth < 640 ? '16px' : '28px');
  const sizes = mode === 'hero' ? [16, 32, 48, 72, 120] : [16, 32, 48, 72];
  el.innerHTML = `<div class="s7-build"><div class="s7-k">Building <b data-n>·</b></div><div class="s7-cells" data-cells></div><pre class="s7-src" data-src></pre><div class="s7-bar"><i data-bar></i></div></div>
    <div class="s7-fall">${sizes.map(s => `<div class="s7-line s7-l${s}${s === 120 ? ' s7-l72' : ''}"><span class="s7-k"><b>${s} px</b><br>${s / 8} px cells</span><div class="s7-t" data-t style="font-size:${s}px;height:${s}px${s === 16 ? ';text-transform:uppercase' : ''}"></div></div>`).join('')}</div>`;
  const cellsEl = el.querySelector('[data-cells]'), srcEl = el.querySelector('[data-src]'), nEl = el.querySelector('[data-n]'), bar = el.querySelector('[data-bar]');
  const lines = [...el.querySelectorAll('[data-t]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let alive = true, visible = true, timer = 0, wake = null;
  const sleep = ms => new Promise(r => { timer = setTimeout(() => { if (visible) r(); else wake = r; }, ms); });
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && wake) { const w = wake; wake = null; w(); } });
  io.observe(el);

  let data = null;
  const byChar = {};
  const setWord = (w, k) => lines.forEach(t => { t.innerHTML = [...w].map((c, i) => `<span${i === k ? ' class="cur"' : ''}>${c === ' ' ? '&nbsp;' : c.replace('<', '&lt;')}</span>`).join(''); });

  function grid(g) {
    const rows = g.r.length >= 9 ? g.r : [...g.r, ...Array(9 - g.r.length).fill('.'.repeat(g.r[0].length))];
    const w = rows[0].length + 2;
    cellsEl.style.gridTemplateColumns = `repeat(${w},var(--c))`;
    cellsEl.innerHTML = '';
    const cells = [];
    for (let y = 0; y < 9; y++) for (let x = 0; x < w; x++) {
      const i = document.createElement('i'); cellsEl.appendChild(i);
      if (rows[y][x - 1] === 'X') cells.push(i);
    }
    for (const y of [0, 3, 7]) { const b = document.createElement('b'); b.style.top = `calc(${y} * var(--c))`; cellsEl.appendChild(b); }
    srcEl.textContent = `glyph ${g.n} U+${g.u[0]}\n${rows[0].length} × 9 cells · ${cells.length} drawn`;
    nEl.textContent = g.n;
    return cells;
  }

  async function run() {
    data = await fetch(base + 'public/media/stem7/glyphs.json').then(r => r.json());
    await document.fonts.load('400 32px "Stem 7"').catch(() => {});
    for (const g of data.regular) for (const u of g.u) byChar[String.fromCodePoint(parseInt(u, 16))] = g;
    if (!alive) return;
    if (reduced) { setWord(WORDS[0], 0); grid(byChar.S).forEach(i => i.classList.add('on')); bar.style.width = '100%'; return; }
    for (let w = 0; alive; w = (w + 1) % WORDS.length) {
      const word = WORDS[w];
      const chars = word === 'dh' ? [{ k: 0, g: data.regular.find(g => g.n === 'dh.mark') }] : [...word].map((c, k) => ({ k, g: byChar[c] })).filter(o => o.g && o.g.r.length);
      for (let n = 0; n < chars.length && alive; n++) {
        const { k, g } = chars[n];
        setWord(word, word === 'dh' ? -1 : k);
        const cells = grid(g);
        for (let i = 0; i < cells.length && alive; i++) {
          cells[i].classList.add('new');
          if (i) cells[i - 1].classList.replace('new', 'on');
          bar.style.width = ((n + (i + 1) / cells.length) / chars.length * 100) + '%';
          await sleep(28);
        }
        cells.at(-1)?.classList.replace('new', 'on');
        await sleep(word === 'dh' ? 2400 : 700);
      }
      setWord(word, -1);
      await sleep(1400);
    }
  }
  run();
  return () => { alive = false; clearTimeout(timer); io.disconnect(); el.remove(); style.remove(); };
}
