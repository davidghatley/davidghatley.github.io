// anime-pipeline case page: a production storyboard. Numbered panels, director's notes between, spec sheet.
import preview from './preview.js';
export default function renderCase(root, { project: p, base, meta }) {
  const M = base;
  const css = document.createElement('style');
  css.textContent = `
.cs-anime-pipeline{--acc:${(meta && meta.accent) || '#c93a24'};max-width:1100px;margin:0 auto;padding:24px 16px 64px;display:grid;gap:40px;color:var(--ink);font:400 16px/26px var(--font-sans)}
.cs-anime-pipeline *{box-sizing:border-box}
.cs-anime-pipeline .slate{display:grid;grid-template-columns:auto 1fr;gap:8px 20px;align-items:center;border:2px solid var(--ink);padding:16px;background:var(--sheet)}
.cs-anime-pipeline .slate .glyph{width:72px;height:72px;color:var(--acc);grid-row:span 2}
.cs-anime-pipeline h1{margin:0;font:900 clamp(36px,7vw,72px)/.95 'Archivo',var(--font-sans);font-stretch:62%;text-transform:uppercase;letter-spacing:.01em;overflow-wrap:anywhere}
.cs-anime-pipeline .slate dl{grid-column:1/-1;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:0;margin:8px 0 0;border-top:1px solid var(--ink)}
.cs-anime-pipeline .slate dl div{padding:8px 12px 0 0}
.cs-anime-pipeline dt,.cs-anime-pipeline .k{font:500 11px/16px var(--font-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-muted)}
.cs-anime-pipeline dd{margin:0;font:400 14px/20px var(--font-mono)}
.cs-anime-pipeline .note-status{grid-column:1/-1;font:italic 400 16px/24px 'Newsreader',var(--font-serif);color:var(--ink-muted);margin:0}
.cs-anime-pipeline .panel{display:grid;gap:12px;min-width:0}
.cs-anime-pipeline .ph{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;border-bottom:2px solid var(--ink);padding-bottom:6px}
.cs-anime-pipeline .ph b{font:400 48px/48px var(--font-pixel);color:var(--acc)}
.cs-anime-pipeline .ph .tc{font:400 16px/16px var(--font-pixel);text-align:right}
.cs-anime-pipeline .ph .ttl{flex:1;font:800 20px/24px 'Archivo',var(--font-sans);font-stretch:62%;text-transform:uppercase;letter-spacing:.05em}
.cs-anime-pipeline .frame{background:var(--sheet);border:1px solid var(--ink);padding:12px;min-width:0}
.cs-anime-pipeline .frame>img,.cs-anime-pipeline .frame>video{display:block;width:100%;height:auto;max-height:80vh;object-fit:contain;margin:0 auto}
.cs-anime-pipeline .pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.cs-anime-pipeline .pair .frame{padding:8px}
.cs-anime-pipeline .panel>.cap{margin:0;font:italic 400 17px/24px 'Newsreader',var(--font-serif);color:var(--ink-muted)}
.cs-anime-pipeline .panel>.cap::before{content:'ACTION  ';font:500 11px/16px var(--font-mono);font-style:normal;letter-spacing:.12em;color:var(--acc)}
.cs-anime-pipeline .dn{border-left:4px solid var(--acc);padding:4px 0 4px 16px;max-width:68ch}
.cs-anime-pipeline .dn .k{color:var(--acc);display:block;margin-bottom:4px}
.cs-anime-pipeline .dn p{margin:0;font:400 18px/28px var(--font-serif)}
.cs-anime-pipeline .spec{border:2px solid var(--ink);background:var(--sheet)}
.cs-anime-pipeline .spec h2,.cs-anime-pipeline .links h2{margin:0;padding:8px 16px;background:var(--ink);color:var(--paper);font:800 18px/24px 'Archivo',var(--font-sans);font-stretch:62%;text-transform:uppercase;letter-spacing:.08em}
.cs-anime-pipeline .row{display:grid;grid-template-columns:minmax(80px,140px) 1fr;gap:4px 16px;align-items:baseline;padding:12px 16px;border-top:1px solid var(--rule)}
.cs-anime-pipeline .row:first-of-type{border-top:0}
.cs-anime-pipeline .row .v{font:400 48px/48px var(--font-pixel);color:var(--acc)}
.cs-anime-pipeline .row .l{font:600 14px/20px var(--font-mono);text-transform:uppercase;letter-spacing:.06em}
.cs-anime-pipeline .row .s{grid-column:2;font:400 12px/16px var(--font-mono);color:var(--ink-muted);overflow-wrap:anywhere}
.cs-anime-pipeline .links ul{list-style:none;margin:0;padding:0;border:1px solid var(--ink)}
.cs-anime-pipeline .links li{border-top:1px solid var(--rule);display:flex;gap:12px;align-items:baseline;padding:10px 16px}
.cs-anime-pipeline .links li:first-child{border-top:0}
.cs-anime-pipeline .links li i{font:400 16px/16px var(--font-pixel);color:var(--acc);font-style:normal}
.cs-anime-pipeline .links a{color:var(--ink);font:600 15px/22px var(--font-mono);text-decoration:underline;text-decoration-color:var(--acc);text-underline-offset:4px;overflow-wrap:anywhere}
@media (max-width:640px){.cs-anime-pipeline .pair{grid-template-columns:1fr}.cs-anime-pipeline .ph b{font-size:32px;line-height:32px}.cs-anime-pipeline .slate{grid-template-columns:1fr}.cs-anime-pipeline .slate .glyph{grid-row:auto;width:48px;height:48px}}
`;
  document.head.appendChild(css);
  root.innerHTML = '';
  const w = document.createElement('div'); w.className = 'cs-anime-pipeline'; root.appendChild(w);
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const src = (m) => base + m.src;
  const med = Object.fromEntries((p.media || []).map(m => [m.src.split('/').pop(), m]));
  const body = p.body || [];
  const note = (i, k) => body[i] ? `<div class="dn"><span class="k">${k}</span><p>${esc(body[i])}</p></div>` : '';
  let n = 0;
  const tc = (f) => `TC 01:${pad(Math.floor(f / 24 / 60))}:${pad(Math.floor(f / 24) % 60)}:${pad(f % 24)}`;
  const head = (title, f) => { n++; return `<div class="ph"><b>${pad(n)}</b><span class="ttl">${esc(title)}</span><span class="tc">${tc(f)}</span></div>`; };
  const fig = (file, title, f, pair) => { const m = med[file]; return m ? `<section class="panel">${head(title, f)}<div class="frame"><img src="${src(m)}" alt="${esc(m.alt)}" loading="lazy"></div><p class="cap">${esc(m.caption)}</p></section>` : ''; };
  const hero = p.hero ? { alt: p.hero.alt, src: p.hero.src } : null;
  const vid = med['blockout-to-final.mp4'], riso = med['previz-riso.jpg'];
  w.innerHTML = `
<header class="slate">
 <svg class="glyph" viewBox="0 0 5 5" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">${(p.glyph || []).map((r, y) => [...r].map((c, x) => c === 'X' ? `<rect x="${x}" y="${y}" width="1" height="1"/>` : '').join('')).join('')}</svg>
 <h1>${esc(p.title)}</h1>
 <dl><div><dt>Production</dt><dd>Meguri</dd></div><div><dt>Status</dt><dd>${esc(p.status)}</dd></div><div><dt>Date</dt><dd>${esc(p.when)}</dd></div><div><dt>Shot</dt><dd>S01_SH050</dd></div></dl>
 <p class="note-status">${esc(p.status_note)}</p>
</header>
<section class="panel">${head('Previz to final, frame-locked', 0)}<div class="frame" id="strip" style="padding:16px"></div><p class="cap">Four stages of one shot, one clock. Hover or drag the wipe.</p></section>
${note(0, "Director's note")}
${hero ? `<section class="panel">${head('Key frame, both ways', 12)}<div class="frame"><img src="${base + hero.src}" alt="${esc(hero.alt)}"></div></section>` : ''}
${vid ? `<section class="panel">${head('The blockout becomes the shot', 48)}<div class="frame"><video src="${src(vid)}" muted loop playsinline controls preload="none" aria-label="${esc(vid.alt)}"></video></div><p class="cap">${esc(vid.caption)}</p></section>` : ''}
${note(1, "Director's note")}
${riso ? `<section class="panel">${head('Same frame, other print', 96)}<div class="frame"><img src="${src(riso)}" alt="${esc(riso.alt)}" loading="lazy"></div><p class="cap">${esc(riso.caption)}</p></section>` : ''}
${fig('storyboard.jpg', 'Storyboard contact sheet', 144)}
${note(2, "Director's note")}
${fig('character-turnaround.jpg', 'Character turnaround', 192)}
${fig('depth-passes.jpg', 'Line and depth passes', 240)}
${note(3, "Lessons, and what is not solved")}
<section class="spec"><h2>Production spec sheet</h2>${(p.spec || []).map(s => `<div class="row"><span class="v">${esc(s.value)}</span><span class="l">${esc(s.label)}</span><span class="s">${esc(s.source)}</span></div>`).join('')}<div class="row"><span class="v" style="font-size:16px;line-height:24px">ROLE</span><span class="l" style="text-transform:none;font-weight:400">${esc(p.role)}</span></div></section>
<section class="links"><h2>Links</h2><ul>${(p.links || []).map((l, i) => `<li><i>${pad(i + 1)}</i><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`).join('')}</ul></section>`;
  const sh = w.querySelector('.slate .glyph'); if (sh) sh.style.viewTransitionName = 'glyph-' + p.slug;
  const strip = w.querySelector('#strip'); strip.style.viewTransitionName = 'hero-' + p.slug;
  const vv = w.querySelector('video');
  let io, un;
  if (vv && !matchMedia('(prefers-reduced-motion: reduce)').matches) { io = new IntersectionObserver(([e]) => { e.isIntersecting ? vv.play().catch(() => {}) : vv.pause(); }); io.observe(vv); }
  un = preview(strip, { mode: 'strip', base });
  return () => { un && un(); io && io.disconnect(); css.remove(); root.innerHTML = ''; };
}
