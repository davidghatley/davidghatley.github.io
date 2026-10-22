const CSS = `
.cs-workbench{--a:#2f8f9d;--at:#1d6c77;max-width:1200px;margin:0 auto;padding:16px 16px 48px;font:400 14px/22px var(--font-mono);color:var(--ink)}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .cs-workbench{--a:#3fb0bd;--at:#3fb0bd}}
:root[data-theme=dark] .cs-workbench{--a:#3fb0bd;--at:#3fb0bd}
.cs-workbench .sheet{border:2px solid var(--ink);background:var(--sheet);padding:16px;position:relative}
.cs-workbench .sheet:before{content:"";position:absolute;inset:5px;border:1px solid var(--ink-muted);pointer-events:none}
.cs-workbench .sheet>*{position:relative}
.cs-workbench .zone{display:flex;justify-content:space-between;font:500 10px/14px var(--font-mono);letter-spacing:.2em;color:var(--ink-muted);margin:0 8px 8px}
.cs-workbench h1{margin:12px 8px 4px;font:400 32px/40px var(--font-pixel);display:flex;gap:16px;align-items:center;text-transform:uppercase}
.cs-workbench h1 svg{width:48px;height:48px;color:var(--at);flex:none}
.cs-workbench .lede{margin:0 8px 16px;color:var(--ink-muted);max-width:70ch}
.cs-workbench .view{margin:24px 8px 0;border-top:1px solid var(--ink-muted);padding-top:12px;display:grid;grid-template-columns:140px 1fr;gap:8px 24px}
.cs-workbench .tag{font:400 16px/20px var(--font-pixel);color:var(--at)}
.cs-workbench .tag small{display:block;font:500 10px/14px var(--font-mono);letter-spacing:.14em;color:var(--ink-muted);margin-top:4px;text-transform:uppercase}
.cs-workbench .view p{margin:0 0 12px;max-width:68ch}
.cs-workbench .hero{margin:8px 0 0;border:1px solid var(--ink-muted);padding:12px;background:var(--paper)}
.cs-workbench .callouts{display:flex;gap:24px;flex-wrap:wrap;margin:0 0 8px;font:500 10px/14px var(--font-mono);letter-spacing:.12em;color:var(--ink-muted);text-transform:uppercase}
.cs-workbench .callouts b{display:inline-block;width:20px;height:20px;line-height:18px;text-align:center;border:1px solid var(--at);border-radius:50%;color:var(--at);margin-right:6px;font-weight:600}
.cs-workbench figure{margin:0 0 20px}
.cs-workbench .dimw{position:relative;padding:0 0 22px 0}
.cs-workbench .dimw img{display:block;max-width:100%;height:auto;border:1px solid var(--rule)}
.cs-workbench .dl{position:absolute;left:0;right:0;bottom:2px;height:14px;border-left:1px solid var(--ink-muted);border-right:1px solid var(--ink-muted);display:flex;align-items:center;font-size:10px;color:var(--ink-muted)}
.cs-workbench .dl:before,.cs-workbench .dl:after{content:"";flex:1;border-top:1px solid var(--ink-muted)}
.cs-workbench .dl span{padding:0 6px;background:var(--sheet)}
.cs-workbench figcaption{font-size:12px;line-height:18px;color:var(--ink-muted)}
.cs-workbench .bom{width:100%;border-collapse:collapse;font-size:13px}
.cs-workbench .bom th,.cs-workbench .bom td{border:1px solid var(--ink-muted);padding:6px 10px;text-align:left;vertical-align:baseline}
.cs-workbench .bom th{font:500 10px/14px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted)}
.cs-workbench .bom td.v{font:400 16px/20px var(--font-pixel);text-align:right;white-space:nowrap}
.cs-workbench .bom small{display:block;color:var(--ink-muted);font-size:11px;line-height:15px}
.cs-workbench ul.refs{margin:0;padding:0;list-style:none}
.cs-workbench ul.refs li{padding:4px 0;border-bottom:1px dotted var(--ink-muted)}
.cs-workbench a{color:var(--at);text-underline-offset:3px}
.cs-workbench .tb{display:grid;grid-template-columns:2fr 1fr 1fr;margin:32px 0 0 auto;max-width:560px;border:2px solid var(--ink);background:var(--sheet)}
.cs-workbench .tb div{border:1px solid var(--ink-muted);padding:6px 10px;min-width:0}
.cs-workbench .tb dt{font:500 9px/12px var(--font-mono);letter-spacing:.16em;text-transform:uppercase;color:var(--ink-muted)}
.cs-workbench .tb dd{margin:0;font:400 16px/22px var(--font-pixel);overflow-wrap:anywhere}
.cs-workbench .tb .w{grid-column:1/-1}
.cs-workbench .tb .w dd{font:400 14px/20px var(--font-mono)}
@media(max-width:720px){.cs-workbench .view{grid-template-columns:1fr}.cs-workbench h1{font-size:16px;line-height:24px}.cs-workbench .tb{grid-template-columns:1fr 1fr}.cs-workbench .tb .w{grid-column:1/-1}}
`;
const NS = 'http://www.w3.org/2000/svg';
function glyph(rows) { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 5 5'); s.setAttribute('shape-rendering', 'crispEdges'); s.setAttribute('fill', 'currentColor'); s.setAttribute('aria-hidden', 'true'); rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'X') { const e = document.createElementNS(NS, 'rect'); e.setAttribute('x', x); e.setAttribute('y', y); e.setAttribute('width', 1); e.setAttribute('height', 1); s.appendChild(e); } })); return s; }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export default async function renderCase(root, { project: p, base }) {
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const el = document.createElement('div'); el.className = 'cs-workbench'; root.appendChild(el);
  const bodies = p.body, tags = [['A', 'rack10', 'the printed rack'], ['B', 'vram', 'one shared card'], ['C', 'corpus', 'transcripts, queued']];
  el.innerHTML = `<div class="sheet">
    <div class="zone"><span>A</span><span>B</span><span>C</span><span>D</span></div>
    <h1><span class="gl"></span><span>${esc(p.title)}</span></h1>
    <p class="lede">${esc(p.oneliner)}</p>
    <div class="view"><div class="tag">SHEET 1<small>overview, details A to C</small></div>
      <div><div class="callouts">${tags.map(t => `<span><b>${t[0]}</b>${t[1]}</span>`).join('')}</div><div class="hero"></div></div></div>
    ${bodies.map((t, i) => `<div class="view"><div class="tag">NOTE ${i + 1}<small>${['detail A, B, C', 'detail A, C', 'general'][i] || ''}</small></div><div><p>${esc(t)}</p></div></div>`).join('')}
    <div class="view"><div class="tag">VIEWS<small>from the rack10 repo</small></div><div>
      ${p.media.map((m, i) => `<figure><div class="dimw"><img src="${base + m.src}" alt="${esc(m.alt)}"><div class="dl"><span>FIG ${i + 1}</span></div></div><figcaption>${esc(m.caption)}</figcaption></figure>`).join('')}</div></div>
    <div class="view"><div class="tag">SCHEDULE<small>counted from the repos</small></div><div>
      <table class="bom"><thead><tr><th>item</th><th>source</th><th style="text-align:right">qty</th></tr></thead><tbody>
      ${p.spec.map(s => `<tr><td>${esc(s.label)}</td><td><small>${esc(s.source)}</small></td><td class="v">${esc(s.value)}</td></tr>`).join('')}</tbody></table></div></div>
    <div class="view"><div class="tag">REFS<small>manual and notes</small></div><div><ul class="refs">${p.links.length ? p.links.map(l => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`).join('') : '<li>none</li>'}</ul></div></div>
    <dl class="tb"><div class="w"><dt>title</dt><dd>${esc(p.title)}</dd></div>
      <div><dt>drawn by</dt><dd>D.H.</dd></div><div><dt>date</dt><dd>${esc(p.when)}</dd></div><div><dt>status</dt><dd>${esc(p.status)}</dd></div>
      <div class="w"><dt>role</dt><dd>${esc(p.role)}</dd></div><div class="w"><dt>note</dt><dd>${esc(p.status_note)}</dd></div>
      <div><dt>sheet</dt><dd>1/1</dd></div><div><dt>scale</dt><dd>1:1</dd></div><div><dt>units</dt><dd>mm</dd></div></dl></div>`;
  const g = glyph(p.glyph); g.style.viewTransitionName = 'glyph-' + p.slug; el.querySelector('.gl').appendChild(g);
  const hero = el.querySelector('.hero'); hero.style.viewTransitionName = 'hero-' + p.slug;
  let un = () => {};
  try { const m = await import('./preview.js'); un = m.default(hero, { mode: 'hero', base }) || un; } catch (e) { console.warn(e); }
  return () => { un(); el.remove(); style.remove(); };
}
