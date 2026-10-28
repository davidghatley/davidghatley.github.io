// Shared case page for the experiments section: what I tried, how the data was made, the model, what happened,
// what I learned, and what it became. Each experiment's own preview runs as the hero.
const CSS = `
.cs-exp{max-width:944px;margin:0 auto;padding:0 0 64px;color:var(--ink)}
.cs-exp *{box-sizing:border-box}
.cs-exp .cx-top{padding:32px 0 24px;border-bottom:1px solid var(--ink)}
.cs-exp .cx-kick{font:500 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted);display:flex;gap:16px;flex-wrap:wrap}
.cs-exp .cx-kick b{font-weight:500;color:var(--accent)}
.cs-exp .cx-top h1{margin:16px 0 0;display:flex;align-items:center;gap:24px;font:400 48px/48px var(--font-pixel);-webkit-font-smoothing:none;overflow-wrap:anywhere}
.cs-exp .cx-top h1 svg{width:48px;height:48px;flex:none;color:var(--accent)}
.cs-exp .cx-sub{margin:16px 0 0 72px;font:400 16px/20px var(--font-pixel);color:var(--ink-muted);-webkit-font-smoothing:none}
.cs-exp .cx-lede{margin:24px 0 0;max-width:40ch;font:var(--type-h3)}
.cs-exp .cx-hero{margin-top:32px}
.cs-exp .cx-q{margin:48px 0 0;padding:24px 0;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);font:italic 400 25px/32px var(--font-serif);max-width:36ch}
.cs-exp .cx-q small{display:block;font:500 11px/16px var(--font-mono);font-style:normal;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:8px}
.cs-exp .cx-secs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:16px;row-gap:48px;margin-top:48px}
.cs-exp .cx-sec h2{margin:0 0 16px;padding-bottom:8px;border-bottom:1px solid var(--ink);display:flex;gap:12px;align-items:baseline;font:400 16px/20px var(--font-pixel);-webkit-font-smoothing:none}
.cs-exp .cx-sec h2 span{color:var(--accent)}
.cs-exp .cx-sec ul{margin:0;padding:0;list-style:none;display:grid;gap:12px}
.cs-exp .cx-sec li{font:var(--type-body);padding-left:16px;position:relative;max-width:60ch}
.cs-exp .cx-sec li::before{content:'';position:absolute;left:0;top:9px;width:6px;height:6px;background:var(--accent)}
.cs-exp .cx-sec.cx-wide{grid-column:1/-1}
.cs-exp .cx-tally{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-top:48px}
.cs-exp .cx-tally>div{border-top:2px solid var(--ink);padding-top:8px;min-width:0}
.cs-exp .cx-tally .cx-v{font:400 32px/40px var(--font-pixel);-webkit-font-smoothing:none;white-space:nowrap}
.cs-exp .cx-tally .cx-l{font:var(--type-small);color:var(--ink)}
.cs-exp .cx-tally small{display:block;font:400 12px/16px var(--font-mono);color:var(--ink-muted);overflow-wrap:anywhere}
.cs-exp .cx-learn{margin-top:64px}
.cs-exp .cx-learn h2{margin:0;font:400 32px/40px var(--font-pixel);-webkit-font-smoothing:none;padding-bottom:8px;border-bottom:1px solid var(--ink)}
.cs-exp .cx-learn ol{margin:0;padding:0;list-style:none;counter-reset:l}
.cs-exp .cx-learn li{counter-increment:l;display:grid;grid-template-columns:80px minmax(0,1fr);column-gap:16px;padding:16px 0;border-bottom:1px solid var(--rule);font:var(--type-h3)}
.cs-exp .cx-learn li::before{content:counter(l,decimal-leading-zero);font:400 16px/32px var(--font-pixel);color:var(--accent)}
.cs-exp .cx-became{margin-top:48px;display:grid;grid-template-columns:80px minmax(0,1fr);column-gap:16px;align-items:start;padding:24px 0;border-top:2px solid var(--to);border-bottom:1px solid var(--rule)}
.cs-exp .cx-became svg{width:40px;height:40px;color:var(--to)}
.cs-exp .cx-became .cx-k{font:500 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted)}
.cs-exp .cx-became a{display:inline-flex;gap:12px;align-items:baseline;margin:4px 0 12px;font:400 32px/40px var(--font-pixel);color:var(--ink);text-decoration:none;-webkit-font-smoothing:none}
.cs-exp .cx-became a:hover,.cs-exp .cx-became a:focus-visible{color:var(--to)}
.cs-exp .cx-became p{margin:0;font:var(--type-body);max-width:60ch}
.cs-exp .cx-links{margin:32px 0 0;padding:0;list-style:none;display:flex;gap:24px;flex-wrap:wrap;font:var(--type-body)}
.cs-exp .cx-links a{color:var(--ink);text-underline-offset:4px;text-decoration-color:var(--accent)}
.cs-exp .cx-colo{margin-top:32px;font:400 13px/20px var(--font-mono);color:var(--ink-muted)}
@media(max-width:1023px){.cs-exp .cx-tally{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:639px){
 .cs-exp .cx-top h1{font-size:32px;line-height:32px;gap:16px}.cs-exp .cx-top h1 svg{width:32px;height:32px}.cs-exp .cx-sub{margin-left:48px}
 .cs-exp .cx-secs{grid-template-columns:1fr}.cs-exp .cx-learn li,.cs-exp .cx-became{grid-template-columns:40px minmax(0,1fr)}
 .cs-exp .cx-learn li{font:var(--type-body)}.cs-exp .cx-q{font-size:20px;line-height:28px}
}
`;
const NS = 'http://www.w3.org/2000/svg';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SLUG = { 'nibble': 'nibble', 'bonfire': 'bonfire', 'mise en place': 'mise_en_place', 'napkin': 'napkin', 'playdough': 'playdough' };
function glyph(rows) {
  const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 5 5'); s.setAttribute('shape-rendering', 'crispEdges'); s.setAttribute('fill', 'currentColor'); s.setAttribute('aria-hidden', 'true');
  (rows || []).forEach((r, y) => [...r].forEach((c, x) => { if (c === 'X') { const e = document.createElementNS(NS, 'rect'); e.setAttribute('x', x); e.setAttribute('y', y); e.setAttribute('width', 1); e.setAttribute('height', 1); s.appendChild(e); } }));
  return s;
}
const list = a => `<ul>${a.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;

export default async function renderCase(root, { project: p, base, meta }) {
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const el = document.createElement('article'); el.className = 'cs-exp'; root.appendChild(el);
  // the project it became: its accent and glyph, from its own meta and content
  const toSlug = SLUG[p.became];
  let to = null;
  if (toSlug) {
    try {
      const [m, all] = await Promise.all([fetch(base + 'previews/' + toSlug + '/meta.json').then(r => r.json()), fetch(base + 'content/kitchen.json').then(r => r.json())]);
      to = { m, p: all.find(q => q.slug === toSlug) };
    } catch (e) { /* the link still works without its colour */ }
  }
  const dark = document.documentElement.dataset.theme === 'dark' || (document.documentElement.dataset.theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  if (to && to.m) el.style.setProperty('--to', dark ? (to.m.accent_dark || to.m.accent) : to.m.accent);
  else el.style.setProperty('--to', 'var(--accent)');
  const secs = [
    ['What I tried', p.tried],
    ['How the data was made', p.data],
    ['The model', p.model],
    ['What happened', p.results],
  ].filter(s => s[1] && s[1].length);
  el.innerHTML = `<header class="cx-top"><div class="cx-kick"><span>Experiment</span><span>${esc(p.when)}</span>${p.became ? `<b>&rarr; ${esc(p.became)}</b>` : ''}</div>
    <h1><span class="cx-gl"></span><span>${esc(p.title)}</span></h1>${p.title_sub ? `<p class="cx-sub">${esc(p.title_sub)}</p>` : ''}
    <p class="cx-lede">${esc(p.oneliner)}</p></header>
    <div class="cx-hero"></div>
    ${p.question ? `<p class="cx-q"><small>The question</small>${esc(p.question)}</p>` : ''}
    <div class="cx-secs">${secs.map((s, i) => `<section class="cx-sec${secs.length % 2 && i === secs.length - 1 ? ' cx-wide' : ''}"><h2><span>${String(i + 1).padStart(2, '0')}</span>${esc(s[0])}</h2>${list(s[1])}</section>`).join('')}</div>
    ${p.spec && p.spec.length ? `<div class="cx-tally">${p.spec.map(s => `<div><div class="cx-v">${esc(s.value)}</div><div class="cx-l">${esc(s.label)}</div><small>${esc(s.source)}</small></div>`).join('')}</div>` : ''}
    <section class="cx-learn"><h2>What I learned</h2><ol>${(p.learned || []).map(t => `<li>${esc(t)}</li>`).join('')}</ol></section>
    ${p.became ? `<section class="cx-became"><span class="cx-bg"></span><div><div class="cx-k">What it became</div>${toSlug ? `<a href="case.html?p=${toSlug}">${esc(p.became)} &rarr;</a>` : `<span>${esc(p.became)}</span>`}<p>${esc(p.became_text || '')}</p></div></section>` : ''}
    ${p.links && p.links.length ? `<ul class="cx-links">${p.links.map(l => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} &rarr;</a></li>`).join('')}</ul>` : ''}
    <p class="cx-colo">${esc(p.role)} ${esc(p.status_note)}</p>`;
  const g = glyph(p.glyph); g.style.viewTransitionName = 'glyph-' + p.slug; el.querySelector('.cx-gl').appendChild(g);
  if (to && to.p) el.querySelector('.cx-bg').appendChild(glyph(to.p.glyph));
  const hero = el.querySelector('.cx-hero'); hero.style.viewTransitionName = 'hero-' + p.slug;
  let un = () => {};
  try { const m = await import(new URL('../' + p.slug + '/preview.js', import.meta.url)); un = m.default(hero, { mode: 'hero', base }) || un; } catch (e) { console.warn(e); }
  return () => { un(); el.remove(); style.remove(); };
}
