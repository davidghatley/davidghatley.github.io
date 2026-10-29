const GLYPH = '<rect x="0" y="0" width="4" height="4"/><rect x="8" y="0" width="4" height="4"/><rect x="16" y="0" width="4" height="4"/><rect x="0" y="8" width="4" height="4"/><rect x="8" y="8" width="4" height="4"/><rect x="16" y="8" width="4" height="4"/><rect x="0" y="16" width="4" height="4"/><rect x="4" y="16" width="4" height="4"/><rect x="8" y="16" width="4" height="4"/><rect x="12" y="16" width="4" height="4"/><rect x="16" y="16" width="4" height="4"/>';
export default function mount(root, { mode }) {
  const S = 'pv-mise_en_place';
  const sentence = 'launch a landing page for a small open-source library';
  const bowls = [
    { n: 'research/', note: 'web search', items: ['keyword-study.md', 'competitors.md'] },
    { n: 'assets/', note: 'made locally', items: ['hero-draft-1.png', 'hero-draft-2.png', 'hero-draft-3.png'] },
    { n: 'references/', note: 'your inspiration library', items: ['ref-01-type-specimen', 'ref-02-docs-layout', 'ref-03-hero-crop'] },
    { n: 'context.md', note: 'read from the repo', items: ['what the repo does', 'stack, entry points'] },
    { n: 'index.md', note: 'every item + its source', items: ['competitor table: web search', 'hero drafts: generated here', 'open: lead with speed or accuracy?'] },
  ];
  const style = document.createElement('style');
  style.textContent = `
.${S}{--a:var(--mep-accent,#2236b0);font-family:var(--font-sans);color:var(--ink);position:relative}
.${S} .q{display:flex;gap:12px;align-items:baseline;border:1px solid var(--ink);background:var(--sheet);padding:12px 16px;font:500 14px/20px var(--font-mono)}
.${S} .q b{color:var(--a);letter-spacing:.14em;font-size:11px;text-transform:uppercase;font-weight:600;white-space:nowrap}
.${S} .q span.t:after{content:"";display:inline-block;width:8px;height:14px;background:var(--a);margin-left:2px;vertical-align:-2px;animation:${S}b 1s steps(2) infinite}
.${S} .q.done span.t:after{display:none}
@keyframes ${S}b{50%{opacity:0}}
.${S} .tray{margin-top:14px;border:2px solid var(--ink);background:var(--paper);padding:12px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.${S}.hero .tray{padding:18px;gap:16px}
.${S} .bowl{border:1px solid var(--ink);background:var(--sheet);min-height:150px;padding:10px 12px;display:flex;flex-direction:column;opacity:.45;transition:opacity .3s,border-color .3s}
.${S}.hero .bowl{min-height:190px;padding:14px 16px}
.${S} .bowl.on{opacity:1;border-color:var(--a)}
.${S} .bowl h4{margin:0;font:600 13px/18px var(--font-mono);color:var(--a);display:flex;justify-content:space-between;gap:8px;border-bottom:1px solid var(--rule);padding-bottom:6px;margin-bottom:6px}
.${S} .bowl h4 i{font:500 10px/18px var(--font-mono);font-style:normal;color:var(--ink-muted);letter-spacing:.1em;text-transform:uppercase;text-align:right}
.${S} .gl{width:32px;height:32px;color:var(--a);flex:none;align-self:center}
.${S} .ct{position:absolute;right:12px;bottom:6px;font:400 32px/32px var(--font-pixel);color:var(--a);opacity:.9}
.${S}.hero .ct{font-size:48px;line-height:48px;right:16px;bottom:10px}
.${S} .bowl{position:relative}
.${S} .card p{font-family:var(--font-display,var(--font-sans));font-weight:900;letter-spacing:-.02em}
.${S} .card b,.${S} .q b{font-family:var(--font-pixel);font-weight:400;font-size:16px;line-height:16px;letter-spacing:.06em}
.${S} .q{align-items:center}
.${S} .card small{font-family:var(--font-serif);font-style:italic;font-size:14px}
.${S} .it{font:400 12px/20px var(--font-mono);display:flex;gap:8px;align-items:center;transform:translateY(-8px);opacity:0;transition:transform .35s,opacity .35s}
.${S}.hero .it{font-size:13px}
.${S} .it.on{transform:none;opacity:1}
.${S} .it:before{content:"";width:8px;height:8px;border:1px solid var(--a);flex:none}
.${S} .it.on:before{background:var(--a)}
.${S} .card{border:2px solid var(--a);background:var(--sheet);padding:14px 16px;display:flex;flex-direction:column;justify-content:space-between;gap:8px;opacity:.45;transition:opacity .3s}
.${S} .card.on{opacity:1}
.${S} .card b{font:600 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--a)}
.${S} .card p{margin:0;font-size:30px;line-height:28px}
.${S}.hero .card p{font-size:44px;line-height:40px}
.${S} .card small{font:400 12px/18px var(--font-mono);color:var(--ink-muted)}
.${S} .tag{position:absolute;right:0;top:-22px;font:500 10px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted)}
@media(max-width:760px){.${S} .tray{grid-template-columns:1fr 1fr}.${S} .q{flex-direction:column;gap:4px}}
@media(max-width:480px){.${S} .tray{grid-template-columns:1fr}}
`;
  document.head.appendChild(style);
  const el = document.createElement('div');
  el.className = S + (mode === 'hero' ? ' hero' : '');
  el.style.marginTop = '22px';
  el.innerHTML = `<div class="tag">example pack</div>
<div class="q">${mode === 'row' ? '' : `<svg class="gl" viewBox="0 0 20 20" shape-rendering="crispEdges" fill="currentColor">${GLYPH}</svg>`}<b>task</b><span class="t"></span></div>
<div class="tray">${bowls.map(b => `<div class="bowl"><h4>${b.n}<i>${b.note}</i></h4><div class="ct">${String(b.items.length).padStart(2,'0')}</div>${b.items.map(i => `<div class="it">${i}</div>`).join('')}</div>`).join('')}
<div class="card"><b>ready for the cook</b><p>Target: zero setup steps.</p><small>Hand the folder to you, Claude Code or bonfire</small></div></div>`;
  root.appendChild(el);
  const th = document.documentElement.dataset.theme; const dark = th ? th === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  el.style.setProperty('--mep-accent', dark ? '#7f92ff' : '#2236b0');
  const q = el.querySelector('.q'), qt = el.querySelector('.t');
  const bw = [...el.querySelectorAll('.bowl')], card = el.querySelector('.card');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timers = [], dead = false;
  const at = (ms, f) => timers.push(setTimeout(() => !dead && f(), ms));
  function reset() { qt.textContent = ''; q.classList.remove('done'); bw.forEach(b => { b.classList.remove('on'); b.querySelectorAll('.it').forEach(i => i.classList.remove('on')); }); card.classList.remove('on'); }
  function still() { qt.textContent = sentence; q.classList.add('done'); bw.forEach(b => { b.classList.add('on'); b.querySelectorAll('.it').forEach(i => i.classList.add('on')); }); card.classList.add('on'); }
  function run() {
    reset(); let t = 200;
    for (let i = 1; i <= sentence.length; i++) at(t + i * 28, () => qt.textContent = sentence.slice(0, i));
    t += sentence.length * 28 + 400; at(t, () => q.classList.add('done'));
    bw.forEach(b => { t += 350; at(t, () => b.classList.add('on'));
      b.querySelectorAll('.it').forEach(i => { t += 280; at(t, () => i.classList.add('on')); }); });
    t += 500; at(t, () => card.classList.add('on'));
    t += 5000; at(t, run);
  }
  if (reduce) still(); else run();
  return () => { dead = true; timers.forEach(clearTimeout); style.remove(); el.remove(); };
}
