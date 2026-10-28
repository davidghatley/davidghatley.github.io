import mountPreview from './preview.js';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export default function renderCase(root, { project: p, base, meta }) {
  const st = document.createElement('style');
  st.textContent = `
.cs-napkin{--a:var(--napkin-a,#2236b0);display:grid;grid-template-columns:220px minmax(0,1fr) 260px;gap:0;align-items:start;width:min(1480px,calc(100vw - 32px));position:relative;left:50%;transform:translateX(-50%);padding:0 0 64px;color:var(--ink);font-family:var(--font-sans)}
.cs-napkin *{box-sizing:border-box}
.cs-napkin .pan{position:sticky;top:16px;align-self:start;border:1px solid var(--ink);background:var(--sheet);margin-top:16px;font:500 12px/16px var(--font-mono)}
.cs-napkin .pan h2{margin:0;padding:10px 12px;border-bottom:1px solid var(--ink);font:600 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase}
.cs-napkin .lay{list-style:none;margin:0;padding:6px 0}
.cs-napkin .lay a{display:flex;gap:10px;align-items:baseline;padding:8px 12px;color:var(--ink);text-decoration:none;border-left:3px solid transparent}
.cs-napkin .lay a:hover{background:var(--paper)}
.cs-napkin .lay a.on{border-left-color:var(--a);background:var(--paper);font-weight:600}
.cs-napkin .lay .k{font:400 16px/16px var(--font-pixel);color:var(--a)}
.cs-napkin .lay .sub a{padding-left:34px;color:var(--ink-muted)}
.cs-napkin .board{margin:16px 24px 0;min-width:0;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect x='11' y='11' width='2' height='2' fill='%23888' fill-opacity='.4'/%3E%3C/svg%3E");padding:24px;display:flex;flex-direction:column;gap:56px;border:1px solid var(--rule)}
.cs-napkin .fr{scroll-margin-top:16px;min-width:0}
.cs-napkin .fh{display:flex;gap:12px;align-items:baseline;margin-bottom:8px;font:600 12px/16px var(--font-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-muted)}
.cs-napkin .fh b{font:400 32px/32px var(--font-pixel);color:var(--a)}
.cs-napkin .fb{background:var(--sheet);border:1px solid var(--ink);padding:24px}
.cs-napkin .fb.flush{padding:0}
.cs-napkin .tt{display:flex;gap:20px;align-items:center;flex-wrap:wrap}
.cs-napkin .tt svg{width:72px;height:72px;flex:none}
.cs-napkin h1{overflow-wrap:anywhere;margin:0;font:900 clamp(48px,8vw,120px)/.88 var(--font-display,var(--font-sans));letter-spacing:-.03em;}
.cs-napkin .one{font:500 24px/32px var(--font-sans);margin:16px 0 0;max-width:34ch}
.cs-napkin .pill{display:inline-block;margin-top:16px;padding:4px 10px;background:var(--a);color:var(--on);font:600 12px/16px var(--font-mono);letter-spacing:.1em;text-transform:uppercase}
.cs-napkin .note{display:grid;grid-template-columns:48px 1fr;gap:12px;padding:14px 0;border-top:1px dashed var(--rule)}
.cs-napkin .note:first-child{border-top:0}
.cs-napkin .note b{font:400 32px/32px var(--font-pixel);color:var(--a)}
.cs-napkin .note p{margin:0;font:400 18px/28px var(--font-sans);max-width:62ch}
.cs-napkin .note .t{font:600 11px/16px var(--font-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:4px;display:block}
.cs-napkin figure{margin:0}
.cs-napkin figure img{display:block;width:100%;height:auto;border-bottom:1px solid var(--ink)}
.cs-napkin figcaption{padding:12px 16px;font:400 15px/22px var(--font-sans);color:var(--ink-muted)}
.cs-napkin .spk{display:grid;gap:16px}
.cs-napkin .lk{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.cs-napkin .lk a{display:block;padding:14px 16px;border:1px solid var(--ink);background:var(--sheet);color:var(--ink);text-decoration:none;font:600 13px/18px var(--font-mono);letter-spacing:.06em;text-transform:uppercase}
.cs-napkin .lk a.pri{background:var(--a);color:var(--on)}
.cs-napkin .lk a:hover,.cs-napkin .lk a:focus-visible{outline:3px solid var(--a);outline-offset:2px}
.cs-napkin dl{margin:0;padding:6px 12px 12px}
.cs-napkin dt{margin-top:12px;font:600 10px/14px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted)}
.cs-napkin dd{margin:2px 0 0;font:400 16px/20px var(--font-pixel);}
.cs-napkin dd.t{font:400 14px/20px var(--font-sans)}
.cs-napkin dd small{display:block;margin-top:2px;font:400 11px/15px var(--font-mono);color:var(--ink-muted)}
.cs-napkin .zz{font:400 32px/32px var(--font-pixel)}
@media(max-width:1100px){.cs-napkin{grid-template-columns:minmax(0,1fr)}
 .cs-napkin .pan{position:static}
 .cs-napkin .pan.l{order:0;margin-top:8px}.cs-napkin .board{order:1;margin:16px 0 0;padding:12px}.cs-napkin .pan.r{order:2;margin-top:16px}
 .cs-napkin .lay{display:flex;overflow-x:auto;padding:0}.cs-napkin .lay li{flex:none}.cs-napkin .lay .sub{display:none}
 .cs-napkin .lay a{border-left:0;border-bottom:3px solid transparent}.cs-napkin .lay a.on{border-bottom-color:var(--a)}
 .cs-napkin .fb{padding:14px}.cs-napkin .board{gap:36px}}`;
  document.head.appendChild(st);
  const dark = () => { const t = document.documentElement.dataset.theme; return t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches); };
  const el = document.createElement('div'); el.className = 'cs-napkin';
  const paint = () => { el.style.setProperty('--napkin-a', dark() ? (meta?.accent_dark || '#8ea0ff') : (meta?.accent || '#2236b0')); el.style.setProperty('--on', dark() ? '#121417' : '#f9f9f5'); };
  paint();
  const mq = matchMedia('(prefers-color-scheme: dark)'); mq.addEventListener('change', paint);
  const mo = new MutationObserver(paint); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const glyph = (p.glyph || []).map((r, y) => [...r].map((c, x) => c === 'X' ? `<rect x="${x}" y="${y}" width="1" height="1"/>` : '').join('')).join('');
  const body = p.body || [], media = p.media || [], links = p.links || [];
  const secs = [['title', 'Title card'], ['board', 'Interface board'], ['notes', 'Annotations'], ['spikes', 'Spike frames'], ['links', 'Links']];
  const num = i => String(i + 1).padStart(2, '0');
  const heads = ['The target', 'The spikes', 'What I learned'];
  const frame = (id, i, label, inner, flush) => `<section class="fr" id="nk-${id}"><div class="fh"><b>${num(i)}</b><span>${esc(label)}</span></div><div class="fb${flush ? ' flush' : ''}">${inner}</div></section>`;
  const figs = [];
  if (p.hero) figs.push({ src: p.hero.src, alt: p.hero.alt, caption: 'Title card.' });
  media.forEach(m => figs.push(m));
  const spec = (p.spec || []).map(s => `<dt>${esc(s.label)}</dt><dd class="zz">${esc(s.value)}<small>${esc(s.source)}</small></dd>`).join('');
  const lay = secs.map(([id, n], i) => `<li><a href="#nk-${id}" data-id="nk-${id}"><span class="k">${num(i)}</span>${esc(n)}</a></li>`).join('');
  const pri = u => /github\.io\/napkin|github\.com\/davidghatley\/napkin/.test(u);
  const ordered = [...links].sort((a, b) => pri(b.url) - pri(a.url));
  el.innerHTML = `
<nav class="pan l" aria-label="Layers"><h2>Layers</h2><ul class="lay">${lay}</ul></nav>
<div class="board">
${frame('title', 0, 'Frame / Title card', `<div class="tt"><svg viewBox="0 0 5 5" fill="currentColor" style="color:var(--a);view-transition-name:glyph-${esc(p.slug)}" role="img" aria-label="napkin glyph, a folded corner">${glyph}</svg><h1>${esc(p.title)}</h1></div><p class="one">${esc(p.oneliner)}</p><span class="pill">${esc(p.status)}</span>`)}
<section class="fr" id="nk-board"><div class="fh"><b>02</b><span>Frame / Interface board</span></div><div class="fb flush" id="nk-hero" style="view-transition-name:hero-${esc(p.slug)}"></div></section>
${frame('notes', 2, 'Frame / Annotations', [['Role', p.role], ['Status', p.status_note], ...body.map((b, i) => [heads[i] || 'Note', b])].filter(n => n[1]).map((n, i) => `<div class="note"><b>${num(i)}</b><div><span class="t">${esc(n[0])}</span><p>${esc(n[1])}</p></div></div>`).join(''))}
<section class="fr" id="nk-spikes"><div class="fh"><b>04</b><span>Frame / Spike frames</span></div><div class="spk">${figs.map((m, i) => `<figure class="fb flush"><img loading="lazy" src="${base}${esc(m.src)}" alt="${esc(m.alt)}"><figcaption><span style="font:400 16px/16px var(--font-pixel);color:var(--a)">${num(i)}</span> ${esc(m.caption || '')}</figcaption></figure>`).join('')}</div></section>
${frame('links', 4, 'Frame / Links', `<ul class="lk">${ordered.map(l => `<li><a class="${pri(l.url) ? 'pri' : ''}" href="${esc(l.url)}">${esc(l.label)} &rarr;</a></li>`).join('')}</ul>`)}
</div>
<aside class="pan r" aria-label="Properties"><h2>Properties</h2><dl>
<dt>Name</dt><dd class="t">${esc(p.title)}</dd><dt>Status</dt><dd class="t">${esc(p.status)}</dd><dt>When</dt><dd class="zz">${esc(p.when)}</dd>
<dt>Role</dt><dd class="t">${esc(p.role)}</dd>${spec}</dl></aside>`;
  root.appendChild(el);
  const unmount = mountPreview(el.querySelector('#nk-hero'), { mode: 'hero', base });
  const links2 = [...el.querySelectorAll('.lay a')];
  const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) links2.forEach(a => a.classList.toggle('on', a.dataset.id === e.target.id)); }); }, { rootMargin: '-20% 0px -60% 0px' });
  el.querySelectorAll('.fr').forEach(s => io.observe(s));
  links2[0].classList.add('on');
  links2.forEach(a => a.addEventListener('click', e => { e.preventDefault(); const t = el.querySelector('#' + a.dataset.id); t.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }));
  return () => { io.disconnect(); mo.disconnect(); mq.removeEventListener('change', paint); unmount && unmount(); el.remove(); st.remove(); };
}
