export default function renderCase(root, { project: p, base, meta }) {
  const S = 'cs-mise_en_place';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const style = document.createElement('style');
  style.textContent = `
.${S}{--a:#2236b0;--ab:#4a60db;color:var(--ink);font-family:var(--font-sans);max-width:1100px;margin:0 auto;padding:0 16px 48px}
:root[data-theme="dark"] .${S}{--a:#7f92ff}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]) .${S}{--a:#7f92ff}}
.${S} *{box-sizing:border-box}
.${S} .card{border:2px solid var(--ink);background:var(--sheet);margin-top:16px}
.${S} .hd{display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center;padding:20px;border-bottom:2px solid var(--ink)}
.${S} .gl{width:64px;height:64px;color:var(--a)}
.${S} h1{margin:0;font:900 clamp(44px,9vw,96px)/.9 var(--font-display,var(--font-sans));letter-spacing:-.03em;text-transform:none}
.${S} .no{font:400 16px/16px var(--font-pixel);color:var(--a);text-align:right}
.${S} .one{font:italic 400 20px/28px var(--font-serif);margin:0;padding:14px 20px;border-bottom:1px solid var(--rule)}
.${S} .meta{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:2px solid var(--ink)}
.${S} .meta div{padding:12px 20px;border-right:1px solid var(--rule)}
.${S} .meta div:last-child{border:0}
.${S} .k{font:400 16px/16px var(--font-pixel);color:var(--a);display:block;margin-bottom:6px}
.${S} .v{font:500 14px/20px var(--font-mono)}
.${S} .v em{font:500 10px/14px var(--font-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-muted);font-style:normal;display:block}
.${S} .cols{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr)}
.${S} .cols>section{padding:20px}
.${S} .cols>section+section{border-left:1px solid var(--ink)}
.${S} h2{margin:0 0 12px;font:400 32px/32px var(--font-pixel);color:var(--a)}
.${S} ul.ing{list-style:none;margin:0;padding:0;font:400 14px/22px var(--font-mono)}
.${S} ul.ing li{display:flex;gap:10px;border-bottom:1px dotted var(--rule);padding:6px 0}
.${S} ul.ing li:before{content:"";flex:none;width:10px;height:10px;border:1px solid var(--a);margin-top:6px}
.${S} ul.ing small{display:block;color:var(--ink-muted);font-size:12px;line-height:18px}
.${S} ol.m{list-style:none;margin:0;padding:0;counter-reset:s}
.${S} ol.m li{counter-increment:s;display:grid;grid-template-columns:48px 1fr;gap:12px;padding:0 0 16px;font:400 17px/26px var(--font-sans)}
.${S} ol.m li:before{content:counter(s);font:400 32px/32px var(--font-pixel);color:var(--a)}
.${S} .plate{padding:20px;border-top:2px solid var(--ink)}
.${S} .plate .cap,.${S} .fig figcaption{font:500 11px/16px var(--font-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:10px;display:flex;justify-content:space-between}
.${S} .notes{border-top:2px solid var(--ink);padding:20px;background:var(--paper)}
.${S} .notes p{margin:0 0 8px;font:italic 400 17px/26px var(--font-serif);max-width:70ch}
.${S} .notes p b{font:400 16px/16px var(--font-pixel);color:var(--a);font-style:normal;margin-right:8px}
.${S} table{border-collapse:collapse;width:100%;margin-top:12px;font:400 13px/20px var(--font-mono)}
.${S} td{border-top:1px solid var(--rule);padding:6px 0;vertical-align:top}
.${S} td:first-child{color:var(--ink-muted);width:40%}
.${S} .figs{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:20px;border-top:2px solid var(--ink)}
.${S} .fig{margin:0}.${S} .fig img{display:block;width:100%;height:auto;border:1px solid var(--ink)}
.${S} .fig.wide{grid-column:1/-1}
.${S} .fig figcaption{text-transform:none;letter-spacing:0;font-size:12px;margin:8px 0 0}
.${S} .links{display:flex;flex-wrap:wrap;gap:8px;padding:20px;border-top:2px solid var(--ink)}
.${S} .links a{font:500 13px/20px var(--font-mono);color:var(--ink);border:1px solid var(--ink);padding:6px 12px;text-decoration:none}
.${S} .links a.pri{background:var(--a);color:#f9f9f5;border-color:var(--a)}
:root[data-theme="dark"] .${S} .links a.pri{background:var(--ab)}
.${S} .links a:hover{text-decoration:underline}
.${S} .links h3{width:100%;margin:0;font:400 16px/16px var(--font-pixel);color:var(--a)}
@media(max-width:760px){.${S} .cols{grid-template-columns:1fr}.${S} .cols>section+section{border-left:0;border-top:1px solid var(--ink)}.${S} .meta{grid-template-columns:1fr 1fr}.${S} .meta div:nth-child(2){border-right:0}.${S} .meta div:nth-child(-n+2){border-bottom:1px solid var(--rule)}.${S} .figs{grid-template-columns:1fr}.${S} .hd{grid-template-columns:auto 1fr}.${S} .no{display:none}}
`;
  document.head.appendChild(style);
  const rows = p.glyph || [];
  const g = rows.map((r, y) => [...r].map((c, x) => c === 'X' ? `<rect x="${x}" y="${y}" width="1" height="1"/>` : '').join('')).join('');
  const body = p.body || [];
  const spec = p.spec || [];
  const links = p.links || [];
  const pri = l => /^(Landing page|GitHub)$/.test(l.label);
  const ordered = links.filter(pri).concat(links.filter(l => !pri(l)));
  const figs = [p.hero].concat(p.media || []).filter(Boolean);
  const el = document.createElement('div');
  el.className = S;
  el.innerHTML = `<article class="card">
<header class="hd"><svg class="gl" viewBox="0 0 5 5" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">${g}</svg>
<h1>${esc(p.title)}</h1><span class="no">RECIPE<br>${esc(p.when)}</span></header>
<p class="one">${esc(p.oneliner)}</p>
<div class="meta">
<div><span class="k">YIELD</span><span class="v">1 prep pack<em>target, not built</em></span></div>
<div><span class="k">PREP TIME</span><span class="v">Not measured<em>target: zero setup steps</em></span></div>
<div><span class="k">STATUS</span><span class="v">${esc(p.status)}<em>${esc(p.when)}</em></span></div>
<div><span class="k">COOK</span><span class="v">${esc(p.role || '')}</span></div></div>
<div class="cols">
<section><h2>Ingredients</h2><ul class="ing">
<li><span>Template<small>chosen starting template</small></span></li>
<li><span>Asset kit<small>made fresh for this task</small></span></li>
<li><span>Context brief<small>what the agent needs to know</small></span></li>
<li><span>Manifest<small>every item and its source</small></span></li></ul>
${spec.length ? `<table>${spec.map(s => `<tr><td>${esc(s.label)}${s.source ? `<br><small>${esc(s.source)}</small>` : ''}</td><td>${esc(s.value)}${s.target ? ' (target)' : ''}</td></tr>`).join('')}</table>` : ''}</section>
<section><h2>Method</h2><ol class="m">${body.map(t => `<li><span>${esc(t)}</span></li>`).join('')}</ol></section></div>
<div class="plate"><div class="cap"><span>Plated · example pack</span><span>sentence in, bowls out</span></div><div class="pv" style="view-transition-name:hero-${esc(p.slug)}"></div></div>
<div class="notes"><h2>Chef's notes</h2>
${p.status_note ? `<p><b>NOT YET</b>${esc(p.status_note)}</p>` : ''}</div>
${figs.length ? `<div class="figs">${figs.map((m, i) => `<figure class="fig${i === 0 ? ' wide' : ''}"><img src="${esc(base + m.src)}" alt="${esc(m.alt || '')}" loading="lazy">${m.caption ? `<figcaption>${esc(m.caption)}</figcaption>` : ''}</figure>`).join('')}</div>` : ''}
<div class="links"><h3>SERVE WITH</h3>${ordered.map(l => `<a class="${pri(l) ? 'pri' : ''}" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</div>
</article>`;
  root.appendChild(el);
  el.querySelector('.gl').style.viewTransitionName = 'glyph-' + p.slug;
  let un = null, dead = false;
  import(new URL(base + 'previews/mise_en_place/preview.js', location.href).href).then(m => { if (!dead) un = m.default(el.querySelector('.pv'), { mode: 'hero', base }); }).catch(() => {});
  return () => { dead = true; if (un) un(); style.remove(); el.remove(); };
}
