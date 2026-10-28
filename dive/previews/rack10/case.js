const CSS = `
.cs-rack10{--a:#a5562b;--at:#a5562b;max-width:1200px;margin:0 auto;padding:16px 16px 48px;font:400 14px/22px var(--font-mono);color:var(--ink)}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .cs-rack10{--a:#e3925f;--at:#e3925f}}
:root[data-theme=dark] .cs-rack10{--a:#e3925f;--at:#e3925f}
.cs-rack10 .sheet{border:2px solid var(--ink);background:var(--sheet);padding:16px;position:relative}
.cs-rack10 .sheet:before{content:"";position:absolute;inset:5px;border:1px solid var(--ink-muted);pointer-events:none}
.cs-rack10 .sheet>*{position:relative}
.cs-rack10 .zone{display:flex;justify-content:space-between;font:500 10px/14px var(--font-mono);letter-spacing:.2em;color:var(--ink-muted);margin:0 8px 8px}
.cs-rack10 h1{margin:12px 8px 4px;font:400 32px/40px var(--font-pixel);display:flex;gap:16px;align-items:center;text-transform:uppercase}
.cs-rack10 h1 svg{width:48px;height:48px;color:var(--at);flex:none}
.cs-rack10 .lede{margin:0 8px 16px;color:var(--ink-muted);max-width:70ch}
.cs-rack10 .view{margin:24px 8px 0;border-top:1px solid var(--ink-muted);padding-top:12px;display:grid;grid-template-columns:140px minmax(0,1fr);gap:8px 24px}
.cs-rack10 .view>div{min-width:0}
.cs-rack10 .tw{overflow-x:auto;-webkit-overflow-scrolling:touch}
.cs-rack10 .tag{font:400 16px/20px var(--font-pixel);color:var(--at);height:auto;padding:0;border:0;white-space:normal;min-width:0}
.cs-rack10 .tag small{display:block;font:500 12px/16px var(--font-mono);letter-spacing:.1em;color:var(--ink-muted);margin-top:4px;text-transform:uppercase}
.cs-rack10 .view p{margin:0 0 12px;max-width:68ch}
.cs-rack10 .hero{margin:8px 0 0;border:1px solid var(--ink-muted);padding:12px;background:var(--paper)}
.cs-rack10 .callouts{display:flex;gap:8px 24px;flex-wrap:wrap;margin:0 0 8px;font:500 12px/20px var(--font-mono);letter-spacing:.12em;color:var(--ink-muted);text-transform:uppercase}
.cs-rack10 .callouts b{display:inline-block;width:20px;height:20px;line-height:18px;text-align:center;border:1px solid var(--at);border-radius:50%;color:var(--at);margin-right:6px;font-weight:600}
.cs-rack10 figure{margin:0 0 20px}
.cs-rack10 .dimw{position:relative;padding:0 0 22px 0}
.cs-rack10 .v3d{width:min(100%,520px);aspect-ratio:4/5;position:relative;border:1px solid var(--rule);background:var(--paper)}
.cs-rack10 .v3d canvas{display:block;width:100%;height:100%}
.cs-rack10 .dimw img{display:block;max-width:100%;height:auto;border:1px solid var(--rule)}
.cs-rack10 .dl{position:absolute;left:0;right:0;bottom:2px;height:16px;border-left:1px solid var(--ink-muted);border-right:1px solid var(--ink-muted);display:flex;align-items:center;font-size:12px;color:var(--ink-muted)}
.cs-rack10 .dl:before,.cs-rack10 .dl:after{content:"";flex:1;border-top:1px solid var(--ink-muted)}
.cs-rack10 .dl span{padding:0 6px;background:var(--sheet)}
.cs-rack10 figcaption{font-size:12px;line-height:18px;color:var(--ink-muted)}
.cs-rack10 .bom{width:100%;border-collapse:collapse;font-size:13px}
.cs-rack10 .bom th,.cs-rack10 .bom td{border:1px solid var(--ink-muted);padding:6px 10px;text-align:left;vertical-align:baseline}
.cs-rack10 .bom th{font:500 12px/16px var(--font-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-muted)}
.cs-rack10 code{font:inherit;color:var(--at)}
.cs-rack10 .bom td.v{font:400 16px/20px var(--font-pixel);text-align:right;white-space:nowrap}
.cs-rack10 .bom small{display:block;color:var(--ink-muted);font-size:12px;line-height:16px}
.cs-rack10 ul.refs{margin:0;padding:0;list-style:none}
.cs-rack10 ul.refs li{padding:4px 0;border-bottom:1px dotted var(--ink-muted)}
.cs-rack10 a{color:var(--at);text-underline-offset:3px}
.cs-rack10 .tb{display:grid;grid-template-columns:2fr 1fr 1fr;margin:32px 0 0 auto;max-width:560px;border:2px solid var(--ink);background:var(--sheet)}
.cs-rack10 .tb div{border:1px solid var(--ink-muted);padding:6px 10px;min-width:0}
.cs-rack10 .tb dt{font:500 9px/12px var(--font-mono);letter-spacing:.16em;text-transform:uppercase;color:var(--ink-muted)}
.cs-rack10 .tb dd{margin:0;font:400 16px/22px var(--font-pixel);overflow-wrap:anywhere}
.cs-rack10 .tb .w{grid-column:1/-1}
.cs-rack10 .tb .w dd{font:400 14px/20px var(--font-mono)}
@media(max-width:560px){.cs-rack10 .bom{font-size:12px}.cs-rack10 .bom th,.cs-rack10 .bom td{padding:6px}.cs-rack10 .bom td:last-child{overflow-wrap:anywhere}.cs-rack10 .bom td.v{white-space:normal}.cs-rack10 .ss thead{display:none}.cs-rack10 .ss tr{display:grid;grid-template-columns:minmax(0,1fr) auto;border:1px solid var(--ink-muted);border-top:0}.cs-rack10 .ss tr:first-child{border-top:1px solid var(--ink-muted)}.cs-rack10 .ss td{border:0}.cs-rack10 .ss td:nth-child(2){grid-row:2;grid-column:1/-1;padding-top:0}}
@media(max-width:720px){.cs-rack10 .view{grid-template-columns:minmax(0,1fr)}.cs-rack10 .tag small{display:inline;margin-left:8px}.cs-rack10 h1{font-size:16px;line-height:24px}.cs-rack10 .tb{grid-template-columns:1fr 1fr}.cs-rack10 .tb .w{grid-column:1/-1}}
`;
import { createViewer } from './viewer.js';
import { MODELS } from './preview.js';
const NS = 'http://www.w3.org/2000/svg';
function glyph(rows) { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 5 5'); s.setAttribute('shape-rendering', 'crispEdges'); s.setAttribute('fill', 'currentColor'); s.setAttribute('aria-hidden', 'true'); rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'X') { const e = document.createElementNS(NS, 'rect'); e.setAttribute('x', x); e.setAttribute('y', y); e.setAttribute('width', 1); e.setAttribute('height', 1); s.appendChild(e); } })); return s; }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export default async function renderCase(root, { project: p, base }) {
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const el = document.createElement('div'); el.className = 'cs-rack10'; root.appendChild(el);
  const bodies = p.body, tags = [['A', 'parts turntable', '14 parts'], ['B', 'assembled', '8U'], ['C', 'exploded', 'EXPLODE 40']];
  const joints = [
    ['Dovetail tabs', 'front and rear wall halves (mid-depth seam); tray and crossbar halves', 'profile in the print plane; pieces push together face-on'],
    ['Crossbar neck in notches', 'rear of every level seam, front at base and top', 'head outside the wall, shoulder inside, which fixes wall spacing; the level above caps the notch'],
    ['Bowtie key', 'front column at every level seam', 'press fit with a stop flange'],
    ['Tongue in groove', 'every U, both walls, through the front posts', 'trays slide in from the front; tongues bridging the mid seam also align the wall halves'],
    ['Foot channel', 'under each wall', 'gravity']];
  const parts = [['wall_front_L / R', '3 / 3', ''], ['wall_rear_L / R', '3 / 3', ''], ['crossbar_L / R', '6 / 6', '4 rear (one per seam incl. base and top) + 2 front (base, top)'], ['bowtie_key', '4', '2 intermediate seams x 2 sides'], ['foot', '4-8', ''], ['trays and bays', 'as needed', 'see the payload modules in the repo']];
  const cl = [10, 15, 20, 25];
  const coupon = `<svg viewBox="0 0 400 110" role="img" aria-label="Fit coupon: four clearances 0.10, 0.15, 0.20 and 0.25 mm" style="width:100%;max-width:480px;height:auto;display:block"><g font-family="var(--font-mono)" font-size="10" fill="var(--ink-muted)">${cl.map((c, i) => { const x = 20 + i * 96, gap = c / 25 * 14; return `<rect x="${x}" y="14" width="30" height="52" fill="var(--paper)" stroke="var(--ink)"/><rect x="${x + 30 + gap}" y="14" width="30" height="52" fill="var(--paper)" stroke="var(--ink)"/><path d="M${x + 30} 74v8M${x + 30 + gap} 74v8M${x + 30} 78h${gap}" stroke="var(--at)"/><text x="${x + 30 + gap / 2}" y="96" text-anchor="middle" fill="var(--ink)">0.${String(c).padStart(2, '0')}</text><text x="${x + 5}" y="10">${c}</text>`; }).join('')}</g></svg>`;
  const tbl = (head, rows) => `<div class="tw"><table class="bom"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td${i === r.length - 1 && head.length === 3 && head[2] === 'qty' ? ' class="v"' : ''}>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const views = [...p.media.map(m => [m.src, m.alt, m.caption]),
    ['public/media/rack10/assembly.jpg', 'Assembled rack render', 'The assembled preview, rendered in OpenSCAD.'],
    ['public/media/rack10/wall_front.jpg', 'Front wall, face-on', 'Front wall rendered face-on.'],
    ['public/media/rack10/sheet.jpg', 'Parts laid out flat', 'Parts laid out flat for printing: every part fits the 180 mm bed.']];
  el.innerHTML = `<div class="sheet">
    <div class="zone"><span>A</span><span>B</span><span>C</span><span>D</span></div>
    <h1><span class="gl"></span><span>${esc(p.title)}</span></h1>
    <p class="lede">${esc(p.oneliner)}</p>
    <div class="view"><div class="tag">SHEET 1<small>details A to C</small></div>
      <div><div class="callouts">${tags.map(t => `<span><b>${t[0]}</b>${t[1]}</span>`).join('')}</div><div class="hero"></div></div></div>
    ${bodies.map((t, i) => `<div class="view"><div class="tag">NOTE ${i + 1}<small>${['general', 'joints, detail E', 'tolerance'][i] || ''}</small></div><div><p>${esc(t)}</p></div></div>`).join('')}
    <div class="view"><div class="tag">SCHEDULE J<small>how it locks together</small></div><div>${tbl(['joint', 'where', 'what holds it'], joints)}</div></div>
    <div class="view"><div class="tag">DETAIL E<small>fit coupon, clearance in mm</small></div><div>${coupon}
      <p style="margin-top:8px">Print coupon_male and coupon_female first. The female plate carries a dovetail socket, a bowtie pocket and a neck slot at 0.10, 0.15, 0.20 and 0.25 mm, labelled 10/15/20/25. Pick the tightest set that still goes together by hand, set the clearance <code>CL</code> to match, and rebuild the parts.</p></div></div>
    <div class="view"><div class="tag">SCHEDULE P<small>bill of parts, 12U (3 levels)</small></div><div>${tbl(['part', 'qty', 'note'], parts)}</div></div>
    <div class="view"><div class="tag">PRINT<small>settings</small></div><div><p>PETG for anything structural; PLA is fine for the coupon and test pieces. 0.2 mm layers, 4 walls, 5 top and bottom layers, 25% gyroid, no supports. Walls print outer face down; every other part prints as exported.</p></div></div>
    <div class="view"><div class="tag">VIEWS<small>from the rack10 repo</small></div><div>
      ${MODELS.map((m, i) => `<figure><div class="dimw"><div class="v3d" data-m="${i}"></div><div class="dl"><span>VIEW ${i + 1} / 3D, drag to orbit</span></div></div><figcaption>${esc(m.note)}</figcaption></figure>`).join('')}
      ${views.map((m, i) => `<figure><div class="dimw"><img src="${base + m[0]}" alt="${esc(m[1])}"><div class="dl"><span>VIEW ${i + 3}</span></div></div><figcaption>${esc(m[2])}</figcaption></figure>`).join('')}</div></div>
    <div class="view"><div class="tag">SCHEDULE S<small>counted from the repo</small></div><div>
      <div class="tw"><table class="bom ss"><thead><tr><th>item</th><th>source</th><th style="text-align:right">value</th></tr></thead><tbody>
      ${p.spec.map(s => `<tr><td>${esc(s.label)}</td><td><small>${esc(s.source)}</small></td><td class="v">${esc(s.value)}</td></tr>`).join('')}</tbody></table></div></div></div>
    ${p.links.length ? `<div class="view"><div class="tag">REFS</div><div><ul class="refs">${p.links.map(l => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`).join('')}</ul></div></div>` : ''}
    <dl class="tb"><div class="w"><dt>title</dt><dd>${esc(p.title)}</dd></div>
      <div><dt>drawn by</dt><dd>D.H.</dd></div><div><dt>date</dt><dd>${esc(p.when)}</dd></div><div><dt>status</dt><dd>${esc(p.status)}</dd></div>
      <div class="w"><dt>role</dt><dd>${esc(p.role)}</dd></div><div class="w"><dt>note</dt><dd>${esc(p.status_note)}</dd></div>
      <div><dt>sheet</dt><dd>1/1</dd></div><div><dt>bed</dt><dd>180</dd></div><div><dt>units</dt><dd>mm</dd></div></dl></div>`;
  const g = glyph(p.glyph); g.style.viewTransitionName = 'glyph-' + p.slug; el.querySelector('.gl').appendChild(g);
  const hero = el.querySelector('.hero'); hero.style.viewTransitionName = 'hero-' + p.slug;
  let un = () => {}; const vs = [], reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; let gone = false;
  el.querySelectorAll('.v3d').forEach(st => { const m = MODELS[+st.dataset.m]; createViewer(st, { url: f => base + 'public/media/rack10/' + f, items: [m], el, reduce, speed: 0.0005 }).then(v => { if (gone) v.dispose(); else vs.push(v); }).catch(e => console.warn(e)); });
  try { const m = await import('./preview.js'); un = m.default(hero, { mode: 'hero', base }) || un; } catch (e) { console.warn(e); }
  return () => { gone = true; vs.forEach(v => v.dispose()); un(); el.remove(); style.remove(); };
}
