// font library preview: one family at a time set large in its own face, stepping through all eighteen, with
// the index of names beside it. A name is a link to that family's page. Reads fonts/files/families.json.
const CSS = `
.pv-fonts{display:grid;grid-template-columns:minmax(0,1fr) 14rem;gap:32px;align-items:stretch;color:var(--ink)}
.pv-fonts *{box-sizing:border-box}
.pv-fonts .fl-stage{display:grid;align-content:space-between;gap:24px;min-height:15rem;padding:24px;background:var(--sheet);border:1px solid var(--rule);min-width:0}
.pv-fonts .fl-k{display:flex;justify-content:space-between;gap:16px;font:500 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted)}
.pv-fonts .fl-k b{color:var(--accent);font-weight:500}
.pv-fonts .fl-s{margin:0;font-size:48px;line-height:56px;font-weight:400;font-synthesis:none;overflow-wrap:anywhere;min-width:0}
.pv-fonts .fl-s.is-grid{-webkit-font-smoothing:none;line-height:48px}
.pv-fonts .fl-n{margin:0;font-size:32px;line-height:40px;font-weight:400;font-synthesis:none}
.pv-fonts ol{margin:0;padding:0;list-style:none;display:grid;align-content:start;font:500 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase}
.pv-fonts li a{display:grid;grid-template-columns:24px minmax(0,1fr);gap:8px;padding:2px 0;color:var(--ink-muted);text-decoration:none;border-bottom:1px solid transparent}
.pv-fonts li a:hover{color:var(--ink);border-bottom-color:var(--rule)}
.pv-fonts li.on a{color:var(--accent)}
.pv-fonts.is-hero .fl-s{font-size:72px;line-height:80px}
.pv-fonts.is-hero .fl-s.is-grid{line-height:72px}
@media(max-width:639px){.pv-fonts{grid-template-columns:minmax(0,1fr)}.pv-fonts ol{grid-template-columns:repeat(2,minmax(0,1fr));gap:0 16px}.pv-fonts .fl-s,.pv-fonts.is-hero .fl-s{font-size:32px;line-height:40px}}
`;

export default function mount(root, { mode, base }) {
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  if (!document.querySelector('link[data-fontlib]')) {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = base + 'fonts/files/fonts.css'; l.dataset.fontlib = '1'; document.head.appendChild(l);
  }
  const el = document.createElement('div'); el.className = 'pv-fonts' + (mode === 'hero' ? ' is-hero' : ''); root.appendChild(el);
  el.innerHTML = '<div class="fl-stage"><div class="fl-k"><span data-k></span><span data-c></span></div><p class="fl-s" data-s></p><p class="fl-n" data-n></p></div><ol data-list></ol>';
  const sEl = el.querySelector('[data-s]'), nEl = el.querySelector('[data-n]'), kEl = el.querySelector('[data-k]'), cEl = el.querySelector('[data-c]'), list = el.querySelector('[data-list]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let alive = true, visible = true, timer = 0, k = 0, fams = [];
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(el);
  const url = h => /^https?:/.test(h) ? h : base + 'fonts/' + h;
  function show(i) {
    const f = fams[i]; k = i;
    const fam = `"${f.name}", var(--font-mono)`;
    sEl.style.fontFamily = fam; nEl.style.fontFamily = fam; sEl.classList.toggle('is-grid', f.grid);
    sEl.textContent = f.sample; nEl.textContent = f.name;
    kEl.innerHTML = `<b>${String(i + 1).padStart(2, '0')}</b> / ${fams.length}`; cEl.textContent = f.cats.join(' · ') + ' · ' + f.glyphs + ' glyphs';
    list.querySelectorAll('li').forEach((li, j) => li.classList.toggle('on', j === i));
  }
  function tick() { if (!alive) return; if (visible && !document.hidden) show((k + 1) % fams.length); timer = setTimeout(tick, 1800); }
  fetch(base + 'fonts/files/families.json').then(r => r.json()).then(list_ => {
    if (!alive) return;
    fams = list_;
    list.innerHTML = fams.map((f, i) => `<li><a href="${url(f.href)}"><span>${String(i + 1).padStart(2, '0')}</span><span>${f.name}</span></a></li>`).join('');
    list.querySelectorAll('li').forEach((li, i) => li.addEventListener('mouseenter', () => { clearTimeout(timer); show(i); timer = setTimeout(tick, 4000); }));
    show(0);
    if (!reduced) timer = setTimeout(tick, 1800);
  }).catch(() => { sEl.textContent = 'Font library'; });
  return () => { alive = false; clearTimeout(timer); io.disconnect(); el.remove(); style.remove(); };
}
