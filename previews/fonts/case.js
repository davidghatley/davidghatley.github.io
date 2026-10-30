const OPENED = (a) => !!(a[1] && a[1].opened);   // the dossier already opens on the instrument
// font library case page: the shared dossier header sits above this (site.js). Below it, the families one at a
// time (the row preview in hero mode), how they are built (project.body), the numbers and the way into the library.
export default function renderCase(root, { project: p, base }) {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const css = document.createElement('style');
  css.textContent = `
.cs-fonts{display:grid;gap:48px;color:var(--ink)}
.cs-fonts h2{margin:0 0 16px;font:400 32px/40px var(--font-pixel);letter-spacing:0;-webkit-font-smoothing:none}
.cs-fonts .txt{display:grid;gap:16px;max-width:64ch}
.cs-fonts .txt p{margin:0;font:var(--type-body)}
.cs-fonts dl{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin:0}
.cs-fonts dl div{position:relative;padding-top:12px}
.cs-fonts dl div::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:var(--ink)}
.cs-fonts dt{font:400 32px/40px var(--font-pixel);-webkit-font-smoothing:none}
.cs-fonts dd{margin:0;font:400 12px/16px var(--font-mono);color:var(--ink-muted)}
.cs-fonts dd b{display:block;font-weight:500;color:var(--ink);text-transform:uppercase;letter-spacing:.08em}
.cs-fonts .go{justify-self:start}
@media (max-width:639px){.cs-fonts{gap:32px}.cs-fonts h2{font-size:16px;line-height:20px}}
`;
  document.head.appendChild(css);
  const el = document.createElement('div'); el.className = 'cs-fonts';
  const spec = (p.spec || []).map(s => `<div><dt>${esc(s.value)}</dt><dd><b>${esc(s.label)}</b>${esc(s.source)}</dd></div>`).join('');
  const lib = (p.actions || []).find(a => a.primary) || { label: 'Browse the library', url: 'fonts/index.html' };
  el.innerHTML = `<section><h2>one at a time</h2><div class="pv"></div></section>
<section><h2>how they are built</h2><div class="txt">${(p.body || []).map(t => `<p>${esc(t)}</p>`).join('')}</div></section>
${spec ? `<section><h2>the numbers</h2><dl>${spec}</dl></section>` : ''}
<a class="act act--primary go" href="${esc(base + lib.url)}">${esc(lib.label)}</a>`;
  root.appendChild(el);
  let un = () => {};
  if (OPENED(arguments)) el.querySelector('.pv').closest('section').remove(); else import('./preview.js').then(m => { const c = m.default(el.querySelector('.pv'), { mode: 'hero', base }); if (typeof c === 'function') un = c; }).catch(() => {});
  return () => { un(); css.remove(); el.remove(); };
}
