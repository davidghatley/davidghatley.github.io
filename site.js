(function () {
  var G = window.SAUCE_GLYPHS || {};
  var NS = 'http://www.w3.org/2000/svg';
  var GROUPS = ['vaasf', 'kitchen', 'anime', 'tools', 'lmr'];
  var PILL = { shipped: 'ok', 'in use': 'ok', working: 'info', prototype: 'info', research: 'mute', concept: 'mute' };
  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function caseUrl(slug) { return 'case.html?p=' + encodeURIComponent(slug); }
  function glyphSvg(rows, anim) {
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 5 5'); s.setAttribute('class', 'glyph'); s.setAttribute('shape-rendering', 'crispEdges'); s.setAttribute('fill', 'currentColor'); s.setAttribute('aria-hidden', 'true');
    var n = 0;
    (rows || []).forEach(function (r, y) { for (var x = 0; x < 5; x++) if (r[x] === 'X') {
      var q = document.createElementNS(NS, 'rect'); q.setAttribute('x', x); q.setAttribute('y', y); q.setAttribute('width', 1); q.setAttribute('height', 1);
      q.style.setProperty('--i', n++); s.appendChild(q); } });
    if (anim) s.classList.add('is-armed');
    return s;
  }
  function replay(g) { g.classList.add('is-armed'); void g.getBoundingClientRect(); g.classList.remove('is-armed'); g.querySelectorAll('rect').forEach(function (r) { r.style.animation = 'none'; void r.getBoundingClientRect(); r.style.animation = ''; }); }
  var mk = document.getElementById('mk');
  if (mk && G.mark) G.mark.forEach(function (r, y) { for (var x = 0; x < 7; x++) if (r[x] === 'X') { var q = document.createElementNS(NS, 'rect'); q.setAttribute('x', x); q.setAttribute('y', y); q.setAttribute('width', 1); q.setAttribute('height', 1); mk.appendChild(q); } });

  // zoom (pinch, drag, double-tap, close button)
  var zoom = document.getElementById('zoom'), zimg = zoom.querySelector('img');
  var zs = { k: 1, x: 0, y: 0 }, pts = {}, d0 = 0, k0 = 1, drag = null, lastTap = 0, moved = false;
  function zapply() { zimg.style.transform = 'translate(' + zs.x + 'px,' + zs.y + 'px) scale(' + zs.k + ')'; }
  function zreset() { zs = { k: 1, x: 0, y: 0 }; zapply(); }
  function openZoom(src, alt, cap) { zimg.src = src; zimg.alt = alt || ''; zoom.querySelector('.zoom__cap').textContent = cap || ''; zreset(); zoom.hidden = false; document.documentElement.style.overflow = 'hidden'; }
  function closeZoom() { zoom.hidden = true; document.documentElement.style.overflow = ''; }
  document.getElementById('zoomx').addEventListener('click', function (e) { e.stopPropagation(); closeZoom(); });
  zoom.addEventListener('click', function (e) { if (e.target !== zimg && !moved) closeZoom(); });
  function dist() { var a = Object.keys(pts).map(function (k) { return pts[k]; }); return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); }
  zimg.addEventListener('pointerdown', function (e) { zimg.setPointerCapture(e.pointerId); pts[e.pointerId] = { x: e.clientX, y: e.clientY }; moved = false;
    if (Object.keys(pts).length === 2) { d0 = dist(); k0 = zs.k; } else { drag = { x: e.clientX - zs.x, y: e.clientY - zs.y }; var n = Date.now(); if (n - lastTap < 300) { zs.k > 1 ? zreset() : (zs.k = 2, zapply()); } lastTap = n; } });
  zimg.addEventListener('pointermove', function (e) { if (!pts[e.pointerId]) return; pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (Object.keys(pts).length === 2) { zs.k = Math.min(6, Math.max(1, k0 * dist() / d0)); moved = true; zapply(); }
    else if (drag && zs.k > 1) { zs.x = e.clientX - drag.x; zs.y = e.clientY - drag.y; moved = true; zapply(); } });
  function pend(e) { delete pts[e.pointerId]; if (Object.keys(pts).length < 2) drag = null; if (zs.k <= 1.01) { zs.x = zs.y = 0; zs.k = 1; zapply(); } setTimeout(function () { moved = false; }, 50); }
  zimg.addEventListener('pointerup', pend); zimg.addEventListener('pointercancel', pend);
  zimg.addEventListener('wheel', function (e) { e.preventDefault(); zs.k = Math.min(6, Math.max(1, zs.k * (e.deltaY < 0 ? 1.15 : 0.87))); zapply(); }, { passive: false });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeZoom(); });
  // back to top
  var tt = document.getElementById('totop');
  if (tt) { tt.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' }); });
    window.addEventListener('scroll', function () { tt.hidden = window.scrollY < 600; }, { passive: true }); }
  function zoomBtn(m, cap) {
    var b = el('button', 'zoomable'); b.type = 'button'; b.setAttribute('aria-label', 'Zoom: ' + (m.alt || ''));
    var i = el('img'); i.src = m.src; i.alt = m.alt || ''; i.loading = 'lazy'; b.appendChild(i);
    b.addEventListener('click', function () { openZoom(m.src, m.alt, cap); }); return b;
  }
  function media(m, cap) {
    if (/\.mp4$/i.test(m.src)) { var v = el('video'); v.src = m.src; v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; v.setAttribute('aria-label', m.alt || ''); return v; }
    return zoomBtn(m, cap);
  }
  function spec(list) {
    if (!list || !list.length) return null;
    var d = el('div', 'ss-spec');
    list.forEach(function (s) { var x = el('span', '', '<i>' + esc(s.label) + '</i> ' + esc(s.value)); if (s.source) x.title = 'Source: ' + s.source.replace(/~\/Projects\/|\/home\/[^ ]+?\/Projects\//g, ''); d.appendChild(x); });
    return d;
  }
  function pill(p) { var c = p.category || p.status; var h = '<span class="ss-pill ss-pill--info">' + esc(c) + '</span>'; if (p.status && p.status !== c) h += ' <span class="ss-pill ss-pill--mute">' + esc(p.status) + '</span>'; return h; }
  function load() {
    return Promise.all(GROUPS.map(function (g) {
      return fetch('content/' + g + '.json').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
    })).then(function (a) { return [].concat.apply([], a).filter(function (p) { return p && p.slug; }).sort(function (x, y) { return (x.order || 99) - (y.order || 99); }); });
  }
  function loadMeta(p) {
    return fetch('previews/' + p.slug + '/meta.json').then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }).then(function (m) { p.meta = m || {}; return p; });
  }
  function applyFonts(m, base) {
    (m.fonts || []).forEach(function (u) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = String(u).replace('{base}', base || './'); document.head.appendChild(l); });
  }
  function applyAccent(node, m) {
    if (m.font_display) node.style.setProperty('--font-title', m.font_display);
    node.classList.add('acc');
    if (m.accent) node.style.setProperty('--acc-l', m.accent);
    if (m.accent_dark) node.style.setProperty('--acc-d', m.accent_dark);
  }
  // mount a preview into root; resolves to a cleanup fn. Falls back to the hero image, uncropped.
  function mountPreview(p, root, mode, base) {
    return import('./previews/' + p.slug + '/preview.js').then(function (mod) {
      var c = mod.default(root, { mode: mode, base: base });
      return typeof c === 'function' ? c : function () {};
    }).catch(function () {
      root.innerHTML = '';
      if (p.hero) { var i = el('img'); i.src = p.hero.src; i.alt = p.hero.alt || ''; root.appendChild(i); }
      return function () {};
    });
  }

  function home() {
    var track = document.getElementById('work');
    var open = null, hoverT = null;
    var touch = window.matchMedia && matchMedia('(hover: none)').matches;
    function expand(r) {
      if (open && open !== r) collapse(open);
      if (r.classList.contains('is-open')) return;
      open = r; r.classList.add('is-open'); r.querySelector('.row__bar').setAttribute('aria-expanded', 'true');
      var g = r.querySelector('.glyph'); if (g) replay(g); if (!r._fonts) { r._fonts = 1; applyFonts(r._p.meta, './'); }
      var pv = r.querySelector('.row__preview'), p = r._p;
      r._token = {};
      var t = r._token;
      mountPreview(p, pv, 'row', './').then(function (c) { if (r._token === t && r.classList.contains('is-open')) r._cleanup = c; else c(); });
    }
    function collapse(r) {
      r.classList.remove('is-open'); r.querySelector('.row__bar').setAttribute('aria-expanded', 'false');
      var c = r._cleanup; r._cleanup = null; r._token = null;
      if (c) c();
      var pv = r.querySelector('.row__preview');
      setTimeout(function () { if (!r.classList.contains('is-open')) pv.innerHTML = ''; }, 300);
      if (open === r) open = null;
    }
    function go(r, e) {
      var p = r._p;
      var g = r.querySelector('.glyph'); if (g) g.style.viewTransitionName = 'glyph-' + p.slug;
      var pv = r.querySelector('.row__preview'); if (r.classList.contains('is-open')) pv.style.viewTransitionName = 'hero-' + p.slug;
    }
    load().then(function (ps) { return Promise.all(ps.map(loadMeta)); }).then(function (ps) {
      track.innerHTML = '';
      var hd = el('div', 'index-head', '<span class="px16">INDEX</span><span class="px16">' + ps.length + ' PROJECTS</span>'); track.appendChild(hd);
      ps.forEach(function (p, idx) {
        var r = el('article', 'row'); r.id = p.slug; r._p = p; applyAccent(r, p.meta);
        var bar = el('div', 'row__bar'); bar.tabIndex = 0; bar.setAttribute('role', 'button'); bar.setAttribute('aria-expanded', 'false'); bar.setAttribute('aria-controls', 'pn-' + p.slug);
        bar.appendChild(glyphSvg(p.glyph));
        bar.appendChild(el('span', 'chip'));
        bar.insertBefore(el('span', 'row__n', String(idx + 1).padStart(2, '0')), bar.firstChild);
        var h = el('h2', 'row__title', esc(p.title)); bar.appendChild(h);
        bar.appendChild(el('p', 'row__one', esc(p.oneliner)));
        bar.appendChild(el('span', 'row__pill', pill(p)));
        var ar = el('a', 'row__arrow', '&rarr;'); ar.href = caseUrl(p.slug); ar.tabIndex = -1; ar.setAttribute('aria-hidden', 'true'); bar.appendChild(ar);
        var panel = el('div', 'row__panel'); panel.id = 'pn-' + p.slug;
        var inner = el('div', 'row__inner'), pad = el('div', 'row__pad');
        pad.appendChild(el('p', 'row__one-m', esc(p.oneliner)));
        pad.appendChild(el('div', 'row__preview'));
        if (p.status_note) pad.appendChild(el('p', 'row__note', esc(p.status_note)));
        var ob = el('a', 'open-btn', 'Open case study &rarr;'); ob.href = caseUrl(p.slug); pad.appendChild(ob);
        inner.appendChild(pad); panel.appendChild(inner);
        r.appendChild(bar); r.appendChild(panel); track.appendChild(r);
        // interactions
        bar.addEventListener('click', function (e) { if (e.target.closest('a')) { go(r); return; } if (r.classList.contains('is-open')) collapse(r); else expand(r); });
        bar.addEventListener('keydown', function (e) {
          if (e.target !== bar) return;
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); r.classList.contains('is-open') ? collapse(r) : expand(r); }
        });
        ob.addEventListener('click', function () { go(r); });
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) collapse(open); });
      var q = new URLSearchParams(location.search).get('open');
      if (q) { /* test hook only */ var t = document.getElementById(q); if (t && t._p) { expand(t); t.scrollIntoView({ block: 'nearest' }); } }
      if (location.hash && !q) { var hh = document.getElementById(location.hash.slice(1)); if (hh) hh.scrollIntoView(); }
    });
  }

  function casePage() {
    var root = document.getElementById('case');
    var slug = new URLSearchParams(location.search).get('p');
    load().then(function (ps) {
      var i = ps.findIndex(function (p) { return p.slug === slug; });
      root.innerHTML = '';
      if (i < 0) { root.appendChild(el('p', '', 'No such project. <a href="index.html#work">Back to the work</a>.')); return; }
      var p = ps[i], pr = ps[i - 1], nx = ps[i + 1];
      return Promise.all([loadMeta(p), pr ? loadMeta(pr) : 0, nx ? loadMeta(nx) : 0]).then(function () {
        var bar0 = el('div', 'case-bar'); var top0 = el('a', 'back px16', '&larr; INDEX'); top0.href = 'index.html#work'; bar0.appendChild(top0);
        bar0.appendChild(el('span', 'case-bar__t', esc(p.title)));
        function ib(q, ch, lbl) { var a = el(q ? 'a' : 'span', 'ibtn px16' + (q ? '' : ' is-off'), ch); a.setAttribute('aria-label', lbl + (q ? ': ' + q.title : '')); if (q) a.href = caseUrl(q.slug); return a; }
        bar0.appendChild(ib(pr, '&lt;', 'Previous')); bar0.appendChild(ib(nx, '&gt;', 'Next'));
        root.appendChild(bar0);
        var sx = 0, sy = 0, st = 0;
        document.addEventListener('touchstart', function (e) { if (e.touches.length !== 1 || !zoom.hidden || e.target.closest('video,iframe,input')) { st = 0; return; } sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = 1; }, { passive: true });
        document.addEventListener('touchend', function (e) { if (!st) return; st = 0; var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; if (Math.abs(dx) < 80 || Math.abs(dy) > 50 || Math.abs(dx) < 2 * Math.abs(dy)) return; var q = dx < 0 ? nx : pr; if (q) location.href = caseUrl(q.slug); }, { passive: true });
        var m = el('div', 'case-body'); root.appendChild(m);
        document.title = p.title + ' · David Hatley';
        applyAccent(root, p.meta); applyFonts(p.meta, './');
                function template() {
        var top = el('div', 'case-top'); var g = glyphSvg(p.glyph); g.style.viewTransitionName = 'glyph-' + p.slug; top.appendChild(g);
        top.appendChild(el('h1', 'case-h', esc(p.title)));
        top.appendChild(el('span', '', pill(p)).firstChild);
        top.appendChild(el('span', 'px16 case-n', 'No. ' + String(i + 1).padStart(2, '0') + ' / ' + ps.length));
        m.appendChild(top);
        var hero = el('div', 'case-hero'); hero.style.viewTransitionName = 'hero-' + p.slug; m.appendChild(hero);
        mountPreview(p, hero, 'hero', './');
        var col = el('div', 'case-col');
        col.appendChild(el('p', 'oneliner', esc(p.oneliner)));
        if (p.role) col.appendChild(el('p', '', esc(p.role)));
        if (p.status_note) col.appendChild(el('p', 'ss-plate__cap', esc(p.status_note)));
        (p.body || []).forEach(function (t) { col.appendChild(el('p', '', esc(t))); });
        var s = spec(p.spec); if (s) col.appendChild(s);
        m.appendChild(col);
        var figs = el('div', 'figs');
        (p.media || []).forEach(function (m, k) {
          var f = el('figure', 'ss-plate fig');
          f.appendChild(el('div', 'ss-plate__head', '<span class="ss-label">FIG ' + (k + 1) + ' · ' + esc(p.title).toUpperCase() + '</span>'));
          f.appendChild(media(m, m.caption));
          if (m.caption) f.appendChild(el('figcaption', 'ss-plate__cap', esc(m.caption)));
          figs.appendChild(f);
        });
        m.appendChild(figs);
        var yt = (p.links || []).map(function (l) { var m = /youtube\.com\/watch\?(?:[^#]*&)?v=([\w-]{6,20})/.exec(l.url || ''); return m ? { id: m[1], l: l } : null; }).filter(Boolean);
        yt.forEach(function (y) { var f = el('figure', 'ss-plate fig fig--yt'); f.appendChild(el('div', 'ss-plate__head', '<span class="ss-label">VIDEO · ' + esc(y.l.label).toUpperCase() + '</span>')); var w = el('div', 'yt'); var fr = el('iframe'); fr.src = 'https://www.youtube-nocookie.com/embed/' + y.id; fr.loading = 'lazy'; fr.title = y.l.label || 'Video'; fr.setAttribute('allow', 'accelerometer; encrypted-media; picture-in-picture'); fr.allowFullscreen = true; fr.referrerPolicy = 'strict-origin-when-cross-origin'; w.appendChild(fr); f.appendChild(w); m.appendChild(f); });
        if (p.links && p.links.length) { var ul = el('ul', 'links'); p.links.forEach(function (l) { ul.appendChild(el('li', '', '<a href="' + esc(l.url) + '">' + esc(l.label) + ' &rarr;</a>')); }); m.appendChild(ul); }
        }
        var done = function () { template(); };
        var cu = 'previews/' + p.slug + '/case.js';
        fetch(cu, { method: 'HEAD' }).then(function (r) { if (!r.ok) throw 0; return import('./' + cu); }).then(function (mod) {
          try { var c = mod.default(m, { project: p, base: './', meta: p.meta }); if (typeof c === 'function') window.addEventListener('pagehide', c); }
          catch (e) { m.innerHTML = ''; template(); }
        }).catch(function () { m.innerHTML = ''; template(); });
        var pn = el('nav', 'pn'); pn.setAttribute('aria-label', 'More work');
        function link(q, left) {
          if (!q) return el('span');
          var a = el('a'); a.href = caseUrl(q.slug);
          var gg = glyphSvg(q.glyph); gg.style.color = q.meta.accent || ''; var t = el('span', '', esc(q.title));
          if (left) { a.appendChild(document.createTextNode('← ')); a.appendChild(gg); a.appendChild(t); } else { a.appendChild(t); a.appendChild(gg); a.appendChild(document.createTextNode(' →')); }
          a.addEventListener('click', function () { gg.style.viewTransitionName = 'glyph-' + q.slug; });
          return a;
        }
        pn.appendChild(link(pr, true)); pn.appendChild(link(nx, false));
        root.appendChild(pn);
      });
    });
  }
  if (window.PAGE === 'case') casePage(); else home();
})();
