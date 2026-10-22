export default async function renderCase(root, { project: p, base, meta }) {
  const M = base + 'public/media/vaasf/';
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fl = document.createElement('link'); fl.rel = 'stylesheet'; fl.href = M + 'fonts/fonts.css'; document.head.appendChild(fl);
  const st = document.createElement('style');
  st.textContent = `
.cs-vaasf{--cr:#f6f0e3;--cr2:#efe7d4;--tx:#1d2a36;--mu:#4d5a66;--bl:#587187;--ln:#c9bfa6;background:var(--cr);color:var(--tx);font:400 19px/28px 'EB Garamond',serif;padding:0 16px 64px;overflow-x:hidden}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .cs-vaasf{--cr:#161a20;--cr2:#1d232b;--tx:#ece5d4;--mu:#a9b0b7;--bl:#8aa3b8;--ln:#3a4450}}
:root[data-theme=dark] .cs-vaasf{--cr:#161a20;--cr2:#1d232b;--tx:#ece5d4;--mu:#a9b0b7;--bl:#8aa3b8;--ln:#3a4450}
.cs-vaasf *{box-sizing:border-box}
.cs-vaasf .w{max-width:1000px;margin:0 auto}
.cs-vaasf .sc{font-variant:all-small-caps;letter-spacing:.12em;color:var(--bl);font-size:19px}
.cs-vaasf h1,.cs-vaasf h2,.cs-vaasf h3{font-family:'DM Serif Display',serif;font-weight:400;margin:0;color:var(--tx)}
.cs-vaasf .title{display:grid;display:block;padding:56px 0 48px;border-bottom:1px solid var(--ln)}
.cs-vaasf .title img{display:block;width:100%;height:auto;border:1px solid var(--ln)}
.cs-vaasf .title h1{font-style:italic;font-size:clamp(56px,10vw,112px);line-height:.95;letter-spacing:-.015em;margin:12px 0 16px}
.cs-vaasf .title .glyph{width:40px;height:40px;color:var(--bl);display:block}
.cs-vaasf .title p{margin:0;font-style:italic;color:var(--mu)}
.cs-vaasf .title .meta{margin-top:20px;display:flex;gap:8px 24px;flex-wrap:wrap}
.cs-vaasf section{padding:48px 0;border-bottom:1px solid var(--ln)}
.cs-vaasf h2{font-size:clamp(32px,5vw,48px);line-height:1.1;font-style:italic;margin-bottom:20px}
.cs-vaasf h2 small{display:block;font:400 19px/24px 'EB Garamond',serif;font-variant:all-small-caps;letter-spacing:.12em;color:var(--bl);font-style:normal;margin-bottom:6px}
.cs-vaasf ol.prog{list-style:none;margin:0;padding:0}
.cs-vaasf ol.prog li{margin:0 0 18px}
.cs-vaasf .ent{display:flex;align-items:baseline;gap:8px}
.cs-vaasf .ent b{font-family:'DM Serif Display',serif;font-weight:400;font-size:26px;line-height:32px}
.cs-vaasf .ent i{flex:1;min-width:16px;border-bottom:2px dotted var(--mu);transform:translateY(-5px)}
.cs-vaasf .ent span{font-variant:all-small-caps;letter-spacing:.1em;color:var(--bl);white-space:nowrap}
.cs-vaasf .ent+p{margin:0;font-style:italic;color:var(--mu);font-size:18px;line-height:24px}
.cs-vaasf .centre{padding:40px 0;border-bottom:1px solid var(--ln)}
.cs-vaasf .centre .cap{text-align:center;margin-bottom:14px}
.cs-vaasf .notes{columns:2 340px;column-gap:48px}
.cs-vaasf .notes p{margin:0 0 16px;text-align:justify;hyphens:auto}
.cs-vaasf .notes p:first-child::first-letter{font:400 72px/56px 'DM Serif Display',serif;float:left;padding:6px 8px 0 0;color:var(--bl)}
.cs-vaasf .notes p.last{font-style:italic;color:var(--mu)}
.cs-vaasf figure{margin:0}
.cs-vaasf figure img{display:block;max-width:100%;height:auto;border:1px solid var(--ln)}
.cs-vaasf figcaption{font-style:italic;color:var(--mu);font-size:17px;line-height:24px;margin-top:8px}
.cs-vaasf .mv{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.5fr);gap:32px;align-items:start}
.cs-vaasf .links a,.cs-vaasf a{font:inherit !important;font-family:'EB Garamond',serif !important;letter-spacing:normal;text-transform:none;color:var(--bl);text-underline-offset:3px}
.cs-vaasf .plates{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:28px;align-items:start}
.cs-vaasf dl{margin:0}
.cs-vaasf dl div{display:flex;align-items:baseline;gap:8px;margin-bottom:6px;flex-wrap:wrap}
.cs-vaasf dt{font-variant:all-small-caps;letter-spacing:.1em}
.cs-vaasf dl i.d{flex:1;min-width:16px;border-bottom:2px dotted var(--mu);transform:translateY(-5px)}
.cs-vaasf dd{margin:0;font-weight:600}
.cs-vaasf dd+dd,.cs-vaasf .src{flex-basis:100%;font-weight:400;font-style:italic;color:var(--mu);font-size:16px;line-height:22px;margin:-2px 0 8px}
.cs-vaasf .links{display:flex;flex-wrap:wrap;gap:8px 28px;margin-top:24px}
.cs-vaasf .end{text-align:center;padding-top:40px;font-style:italic;color:var(--mu)}
.cs-vaasf :focus-visible{outline:2px solid var(--bl);outline-offset:3px}
@media (max-width:720px){.cs-vaasf .title,.cs-vaasf .mv{grid-template-columns:minmax(0,1fr)}.cs-vaasf .title img{max-width:260px}.cs-vaasf .ent b{font-size:22px}.cs-vaasf .ent{flex-wrap:wrap}.cs-vaasf .ent i{display:none}}`;
  document.head.appendChild(st);
  const gl = p.glyph.map(r => [...r].map((c, x) => c === 'X' ? `M${x} ${p.glyph.indexOf(r)}h1v1h-1z` : '').join('')).join('');
  const glyph = `<svg class="glyph" viewBox="0 0 5 5" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="${gl}"/></svg>`;
    const prog = [
    ['The Program Booklet', '16 pp', 'Designed and coded in Python from the repertoire data; saddle-stitched, to the printer.'],
    ['The Website', 'Webflow', 'Owned and maintained, with the redesigned events schedule.'],
    ['The Application', '2026', 'Collected 92 to 94 entries.']
  ];
  const body = p.body;
  root.innerHTML = `<div class="cs-vaasf"><div class="w">
<header class="title">
  <div><span class="g" style="display:inline-block">${glyph}</span>
    <div class="sc" style="margin-top:12px">Vocal Artistry Art Song Festival &middot; ${esc(p.when)}</div>
    <h1>${esc(p.title)}</h1>
    <p>${esc(p.oneliner)}</p>
    <div class="meta"><span class="sc">${esc(p.status)}</span></div>
    <p style="margin-top:12px">${esc(p.role)}</p>
    <p style="margin-top:8px;font-size:17px">${esc(p.status_note)}</p></div>
</header>
<div class="centre"><div class="cap sc">The program and the site, set out together</div><div class="hero-slot"></div></div>
<section><h2><small>Program notes</small>On the making</h2><div class="notes">${body.map((t, i) => `<p${i === body.length - 1 ? ' class="last"' : ''}>${esc(t)}</p>`).join('')}</div></section>
<section><h2><small>Order of the work</small>Program</h2>
<ol class="prog">${prog.map(e => `<li><div class="ent"><b>${e[0]}</b><i></i><span>${e[1]}</span></div><p>${e[2]}</p></li>`).join('')}</ol><div class="links">${p.links.map(l => `<a href="${esc(l.url)}" rel="noopener">${esc(l.label)}</a>`).join('')}</div></section>
<section style="border:0"><h2><small>Colophon</small>Particulars</h2><dl>${p.spec.map(s => `<div><dt>${esc(s.label)}</dt><i class="d"></i><dd>${esc(s.value)}</dd><dd>${esc(s.source)}</dd></div>`).join('')}</dl>
<div class="end">Set in DM Serif Display and EB Garamond.</div></section>
</div></div>`;
  const cs = root.querySelector('.cs-vaasf');
  const g = cs.querySelector('.glyph'); g.style.viewTransitionName = 'glyph-' + p.slug;
  const slot = cs.querySelector('.hero-slot'); slot.style.viewTransitionName = 'hero-' + p.slug;
  let un = () => {};
  try { const m = await import('./preview.js'); un = m.default(slot, { mode: 'hero', base }) || un; } catch (e) {}
  return () => { un(); st.remove(); fl.remove(); root.innerHTML = ''; };
}
