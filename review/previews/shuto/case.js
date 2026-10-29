// shuto case page: a production storyboard (numbered panels, director's notes, spec sheet).
import preview from './preview.js';
const CFG = {"slug": "shuto", "accent": "#2559c9", "accentDark": "#7aa2ff", "production": "SHUTO", "shot": "SH13 the duel", "cue": "CUE", "heroTitle": "Key frame, neon look", "h1": "700 clamp(44px,9vw,96px)/.9 'Barlow Condensed',var(--font-sans);letter-spacing:.04em", "serif": "400 15px/22px var(--font-mono)", "ttl": "700 22px/24px 'Barlow Condensed',var(--font-sans);letter-spacing:.08em", "layout": [{"t": "strip", "title": "Previz to final, frame-locked", "cap": "SH13 as four stages on one clock. Hover or drag the wipe."}, {"t": "hero"}, {"t": "note", "i": 0, "k": "Script note"}, {"t": "many", "title": "Previz: the expressway kit", "f": ["previz-SH01_afterglow.jpg", "previz-SH05_tunnel.jpg", "previz-SH06_toll.jpg"]}, {"t": "note", "i": 1, "k": "Script note"}, {"t": "one", "title": "The duel, previz to final", "f": "duel-previz-final.mp4"}, {"t": "one", "title": "The guard, previz to final", "f": "guard-previz-final.mp4"}, {"t": "note", "i": 2, "k": "Script note"}, {"t": "many", "title": "Look lab: one frame, three looks", "f": ["key-backlit-SH13.jpg", "key-boldinked-SH13.jpg", "key-cyberpunk-SH13.jpg"]}, {"t": "many", "title": "Riso plates", "f": ["look-riso-junction.jpg", "look-riso-kiku.jpg", "look-riso-jun.jpg"]}, {"t": "note", "i": 3, "k": "What exists"}]};
export default function renderCase(root, { project: p, base, meta }) {
  const S = '.cs-' + CFG.slug;
  const css = document.createElement('style');
  css.textContent = `
${S}{--acc:var(--cs-acc,${CFG.accent});max-width:1100px;margin:0 auto;padding:24px 16px 64px;display:grid;gap:40px;color:var(--ink);font:400 16px/26px var(--font-sans)}
:root[data-theme="dark"] ${S}{--cs-acc:${CFG.accentDark}}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) ${S}{--cs-acc:${CFG.accentDark}}}
${S} *{box-sizing:border-box}
${S} .slate{display:grid;grid-template-columns:auto 1fr;gap:8px 20px;align-items:center;border:2px solid var(--ink);padding:16px;background:var(--sheet)}
${S} .slate .glyph{width:72px;height:72px;color:var(--acc);grid-row:span 2}
${S} h1{margin:0;font:${CFG.h1};text-transform:uppercase;overflow-wrap:anywhere}
${S} .slate dl{grid-column:1/-1;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin:8px 0 0;border-top:1px solid var(--ink)}
${S} .slate dl div{padding:8px 12px 0 0}
${S} dt,${S} .k{font:500 11px/16px var(--font-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-muted)}
${S} dd{margin:0;font:400 14px/20px var(--font-mono)}
${S} .note-status{grid-column:1/-1;font:${CFG.serif};color:var(--ink-muted);margin:0}
${S} .panel{display:grid;gap:12px;min-width:0}
${S} .ph{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;border-bottom:2px solid var(--ink);padding-bottom:6px}
${S} .ph b{font:400 48px/48px var(--font-pixel);color:var(--acc)}
${S} .ph .tc{font:400 16px/16px var(--font-pixel);text-align:right;white-space:nowrap}
${S} .ph .ttl{flex:1;font:${CFG.ttl};text-transform:uppercase;letter-spacing:.05em}
${S} .frame{background:var(--sheet);border:1px solid var(--ink);padding:12px;min-width:0}
${S} .frame>img,${S} .frame>video{display:block;width:100%;height:auto;max-height:80vh;object-fit:contain;margin:0 auto}
${S} .panel>.cap{margin:0;font:${CFG.serif};color:var(--ink-muted)}
${S} .panel>.cap::before{content:'${CFG.cue}  ';font:500 11px/16px var(--font-mono);font-style:normal;letter-spacing:.12em;color:var(--acc)}
${S} .grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}
${S} .grid2 .frame{padding:8px}${S} .grid2 figcaption{font:italic 400 15px/20px var(--font-serif);color:var(--ink-muted);margin-top:6px}${S} .grid2 figure{margin:0;min-width:0}
${S} .dn{border-left:4px solid var(--acc);padding:4px 0 4px 16px;max-width:68ch}
${S} .dn .k{color:var(--acc);display:block;margin-bottom:4px}
${S} .dn p{margin:0;font:400 18px/28px var(--font-serif)}
${S} .spec,${S} .links{border:2px solid var(--ink);background:var(--sheet)}
${S} .spec h2,${S} .links h2{margin:0;padding:8px 16px;background:var(--ink);color:var(--paper);font:${CFG.ttl};text-transform:uppercase;letter-spacing:.08em}
${S} .row{display:grid;grid-template-columns:minmax(80px,140px) 1fr;gap:4px 16px;align-items:baseline;padding:12px 16px;border-top:1px solid var(--rule)}
${S} h2+.row{border-top:0}
${S} .row .v{font:400 48px/48px var(--font-pixel);color:var(--acc)}
${S} .row .l{font:600 14px/20px var(--font-mono);text-transform:uppercase;letter-spacing:.06em}
${S} .row .s{grid-column:2;font:400 12px/16px var(--font-mono);color:var(--ink-muted);overflow-wrap:anywhere}
${S} .links ul{list-style:none;margin:0;padding:0}${S} .links li{border-top:1px solid var(--rule);padding:10px 16px;font:600 14px/20px var(--font-mono)}
${S} .links li:first-child{border-top:0}
@media (max-width:640px){${S} .ph b{font-size:32px;line-height:32px}${S} .slate{grid-template-columns:1fr}${S} .slate .glyph{grid-row:auto;width:48px;height:48px}${S} .row .v{font-size:32px;line-height:32px}}
`;
  document.head.appendChild(css);
  root.innerHTML = '';
  const w = document.createElement('div'); w.className = 'cs-' + CFG.slug; root.appendChild(w);
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const med = Object.fromEntries((p.media || []).map(m => [m.src.split('/').pop(), m]));
  const used = new Set(); const body = p.body || [];
  let n = 0, f = 0;
  const tc = () => { const s = `TC 01:${pad(Math.floor(f / 24 / 60))}:${pad(Math.floor(f / 24) % 60)}:${pad(f % 24)}`; f += 36; return s; };
  const head = (t) => { n++; return `<div class="ph"><b>${pad(n)}</b><span class="ttl">${esc(t)}</span><span class="tc">${tc()}</span></div>`; };
  const asset = (m) => { used.add(m.src); const u = base + m.src; return /\.mp4$/.test(m.src) ? `<video src="${u}" muted loop playsinline controls preload="none" aria-label="${esc(m.alt)}"></video>` : `<img src="${u}" alt="${esc(m.alt)}" loading="lazy">`; };
  const one = (file, title) => { const m = med[file]; return m ? `<section class="panel">${head(title)}<div class="frame">${asset(m)}</div><p class="cap">${esc(m.caption)}</p></section>` : ''; };
  const many = (files, title) => { const ms = files.map(x => med[x]).filter(Boolean); return ms.length ? `<section class="panel">${head(title)}<div class="grid2">${ms.map(m => `<figure><div class="frame">${asset(m)}</div><figcaption>${esc(m.caption)}</figcaption></figure>`).join('')}</div></section>` : ''; };
  const note = (i, k) => body[i] ? `<div class="dn"><span class="k">${k}</span><p>${esc(body[i])}</p></div>` : '';
  const heroP = () => p.hero ? `<section class="panel">${head(CFG.heroTitle)}<div class="frame"><img src="${base + p.hero.src}" alt="${esc(p.hero.alt)}"></div></section>` : '';
  const parts = CFG.layout.map(x => x.t === 'hero' ? heroP() : x.t === 'strip' ? `<section class="panel">${head(x.title)}<div class="frame" id="strip" style="padding:16px"></div><p class="cap">${esc(x.cap)}</p></section>` : x.t === 'note' ? note(x.i, x.k) : x.t === 'one' ? one(x.f, x.title) : many(x.f, x.title));
  const rest = (p.media || []).filter(m => !used.has(m.src) && !CFG.layout.some(x => (x.f === m.src.split('/').pop()) || (Array.isArray(x.f) && x.f.includes(m.src.split('/').pop()))));
  const hero = p.hero && !rest.length ? '' : '';
  const _unused = p.hero ? `<section class="panel">${head(CFG.heroTitle)}<div class="frame"><img src="${base + p.hero.src}" alt="${esc(p.hero.alt)}"></div></section>` : '';
  w.innerHTML = `
<header class="slate">
 <svg class="glyph" viewBox="0 0 5 5" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">${(p.glyph || []).map((r, y) => [...r].map((c, x) => c === 'X' ? `<rect x="${x}" y="${y}" width="1" height="1"/>` : '').join('')).join('')}</svg>
 <h1>${esc(p.title)}</h1>
 <dl><div><dt>Production</dt><dd>${esc(CFG.production)}</dd></div><div><dt>Status</dt><dd>${esc(p.status)}</dd></div><div><dt>Date</dt><dd>${esc(p.when)}</dd></div><div><dt>Shot</dt><dd>${esc(CFG.shot)}</dd></div></dl>
 <p class="note-status">${esc(p.status_note)}</p>
</header>
${parts.join('\n')}
<section class="spec"><h2>Production spec sheet</h2>${(p.spec || []).map(s => `<div class="row"><span class="v">${esc(s.value)}</span><span class="l">${esc(s.label)}</span><span class="s">${esc(s.source)}</span></div>`).join('')}<div class="row"><span class="l" style="grid-column:1/-1;text-transform:none;font-weight:400">${esc(p.role)}</span></div></section>
${(p.links && p.links.length) ? `<section class="links"><h2>Links</h2><ul>${p.links.map(l => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`).join('')}</ul></section>` : ''}`;
  const strip = w.querySelector('#strip'); strip.style.viewTransitionName = 'hero-' + p.slug;
  const gl = w.querySelector('.slate .glyph'); if (gl) gl.style.viewTransitionName = 'glyph-' + p.slug;
  if (rest.length) { const s = document.createElement('section'); s.className = 'panel'; s.innerHTML = head('More frames') + `<div class="grid2">${rest.map(m => `<figure><div class="frame">${asset(m)}</div><figcaption>${esc(m.caption)}</figcaption></figure>`).join('')}</div>`; w.querySelector('.spec').before(s); }
  const vids = [...w.querySelectorAll('video')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = new IntersectionObserver((es) => es.forEach(e => { if (!reduce) e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause(); }));
  vids.forEach(v => io.observe(v));
  const un = preview(strip, { mode: 'strip', base });
  return () => { un && un(); io.disconnect(); css.remove(); root.innerHTML = ''; };
}
