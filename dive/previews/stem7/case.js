// stem 7 case page: reads like a type specimen sheet. Title in the font itself, the build animation as the hero,
// the story in four numbered parts, the full character set, then the download.
const CSS = `
.cs-stem7{max-width:1040px;margin:0 auto;padding:0 0 64px;color:var(--ink)}
.cs-stem7 *{box-sizing:border-box}
.cs-stem7 .px{font-family:var(--font-pixel);line-height:1;font-weight:400;font-synthesis:none;font-kerning:normal;font-variant-ligatures:common-ligatures;-webkit-font-smoothing:none;letter-spacing:0}
.cs-stem7 .s-top{display:grid;gap:24px;padding:32px 0;border-bottom:1px solid var(--ink)}
.cs-stem7 .s-kick{display:flex;flex-wrap:wrap;gap:8px 24px;font:500 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted)}
.cs-stem7 .s-kick b{color:var(--accent);font-weight:500}
.cs-stem7 h1{margin:0;display:flex;align-items:center;gap:30px;font-size:120px;height:120px;white-space:nowrap}
.cs-stem7 h1 svg{width:75px;height:75px;flex:none;color:var(--accent)}
.cs-stem7 .s-lede{margin:0;max-width:40ch;font:var(--type-lead)}
.cs-stem7 .s-hero{margin-top:32px}
.cs-stem7 .s-parts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:48px 32px;margin-top:64px}
.cs-stem7 .s-part{display:grid;grid-template-columns:64px minmax(0,1fr);gap:0 16px;align-content:start;border-top:2px solid var(--ink);padding-top:16px}
.cs-stem7 .s-part .px{font-size:32px;height:32px;color:var(--accent)}
.cs-stem7 .s-part h2{margin:0 0 8px;font:var(--type-h3)}
.cs-stem7 .s-part p{margin:0;font:var(--type-body);max-width:60ch}
.cs-stem7 .s-tally{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-top:64px}
.cs-stem7 .s-tally>div{border-top:1px solid var(--ink);padding-top:12px;min-width:0}
.cs-stem7 .s-tally .px{font-size:48px;height:48px;white-space:nowrap}
.cs-stem7 .s-tally span{display:block;margin-top:8px;font:var(--type-small)}
.cs-stem7 .s-tally small{display:block;font:400 12px/16px var(--font-mono);color:var(--ink-muted)}
.cs-stem7 .s-set{margin-top:64px}
.cs-stem7 .s-set h2,.cs-stem7 .s-get h2{margin:0 0 16px;padding-bottom:8px;border-bottom:1px solid var(--ink);font:400 32px/32px var(--font-pixel);-webkit-font-smoothing:none}
.cs-stem7 .s-chars{font-size:32px;line-height:48px;overflow-wrap:anywhere;word-break:break-all}
.cs-stem7 .s-chars.is-b{font-weight:700}
.cs-stem7 .s-get{margin-top:64px;display:grid;gap:16px}
.cs-stem7 .s-get p{margin:0;max-width:60ch;font:var(--type-body)}
.cs-stem7 .s-links{margin:0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:8px 24px;font:13px/20px var(--font-mono)}
.cs-stem7 .s-links a{color:var(--ink);text-decoration-color:var(--accent);text-decoration-thickness:2px;text-underline-offset:4px}
.cs-stem7 .s-colo{margin-top:32px;font:italic 400 16px/24px var(--font-serif);color:var(--ink-muted);max-width:60ch}
@media(max-width:1023px){.cs-stem7 .s-tally{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:639px){
 .cs-stem7 h1{font-size:72px;height:72px;gap:18px}.cs-stem7 h1 svg{width:45px;height:45px}
 .cs-stem7 .s-parts{grid-template-columns:minmax(0,1fr)}.cs-stem7 .s-part{grid-template-columns:48px minmax(0,1fr)}
 .cs-stem7 .s-tally .px{font-size:32px;height:32px}
}
`;
const NS = 'http://www.w3.org/2000/svg';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function glyph(rows) {
  const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 5 5'); s.setAttribute('shape-rendering', 'crispEdges'); s.setAttribute('fill', 'currentColor'); s.setAttribute('aria-hidden', 'true');
  (rows || []).forEach((r, y) => [...r].forEach((c, x) => { if (c === 'X') { const e = document.createElementNS(NS, 'rect'); e.setAttribute('x', x); e.setAttribute('y', y); e.setAttribute('width', 1); e.setAttribute('height', 1); s.appendChild(e); } }));
  return s;
}
const PARTS = ['The grid', 'The test', 'The source', 'What I learned'];

export default async function renderCase(root, { project: p, base }) {
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const el = document.createElement('article'); el.className = 'cs-stem7'; root.appendChild(el);
  const acts = () => (p.actions || []).map(a => `<a class="act${a.primary ? ' act--primary' : ''}" href="${esc(a.url)}">${esc(a.label)}</a>`).join('');
  el.innerHTML = `<header class="s-top"><div class="s-kick"><span>Design system</span><span>${esc(p.when)}</span><b>v1.001 · OFL 1.1</b></div>
    <h1 class="px"><span class="s-gl"></span><span>Stem 7</span></h1>
    <p class="s-lede">${esc(p.oneliner)}</p><div class="acts">${acts()}</div></header>
    <div class="s-hero"></div>
    <div class="s-parts">${(p.body || []).map((t, i) => `<section class="s-part"><span class="px">${String(i + 1).padStart(2, '0')}</span><div><h2>${esc(PARTS[i] || '')}</h2><p>${esc(t.replace(/^What I learned:\s*(.)/, (m, c) => c.toUpperCase()))}</p></div></section>`).join('')}</div>
    <div class="s-tally">${(p.spec || []).map(s => `<div><div class="px">${esc(s.value)}</div><span>${esc(s.label)}</span><small>${esc(s.source)}</small></div>`).join('')}</div>
    <section class="s-set"><h2>Every character</h2><p class="px s-chars" data-chars aria-label="The full character set of Stem 7"></p></section>
    <section class="s-get"><h2>Get it</h2><p>${esc(p.role)}</p><div class="acts">${acts()}</div>
    <ul class="s-links">${(p.links || []).map(l => `<li><a href="${esc(l.url)}">${esc(l.label)} &rarr;</a></li>`).join('')}</ul></section>
    <p class="s-colo">${esc(p.status_note)}</p>`;
  const g = glyph(p.glyph); g.style.viewTransitionName = 'glyph-' + p.slug; el.querySelector('.s-gl').replaceWith(g);
  const hero = el.querySelector('.s-hero'); hero.style.viewTransitionName = 'hero-' + p.slug;
  try {
    const d = await fetch(base + 'public/media/stem7/glyphs.json').then(r => r.json());
    el.querySelector('[data-chars]').textContent = d.regular.filter(x => x.r.length).map(x => String.fromCodePoint(parseInt(x.u[0], 16))).join('');
  } catch (e) { /* the set is decoration; the page reads without it */ }
  let un = () => {};
  try { const m = await import(new URL('./preview.js', import.meta.url)); un = m.default(hero, { mode: 'hero', base }) || un; } catch (e) { console.warn(e); }
  return () => { un(); el.remove(); style.remove(); };
}
